import { type Env, json } from "./shared";
import { flags } from "./staff";

/**
 * What a coaching centre has switched on, and the Plus its students get (decisions-2026-11-24.md, centres 4, 9, 12).
 * Kept apart from institutes.ts so plus.ts and the pod routes can ask "is this member in a centre?" without pulling in
 * the whole institutes module.
 *
 * Feature switches, stored as JSON in institutes.features. A key left out takes its default. The quick first answer
 * also lives in the older ai_first_answer column, which stays the source for it.
 *   chat        the batch chat and announcements             default on
 *   doubts      doubts to teachers                            default on
 *   firstAnswer the quick first answer on a doubt             default off
 *   plans       study plans from the centre                   default on
 *   content     the centre's own notes and question sets      default on
 *   pods        Aspiran pods and open rooms for its students  default off
 *
 * Plus for students (role 'student', active membership, centre active, `institutes` flag on), while either:
 *   - the free 30-day pilot runs (pilot_ends_at; a centre made before the column existed counts 30 days from created_at), or
 *   - the centre is paid up (paid_until in the future), at ₹1,200 a student a year, 25 students at least.
 * Seats are recorded for Aspiran staff to see; they don't cut anyone off.
 */

export const FEATURES = ["chat", "doubts", "firstAnswer", "plans", "content", "pods"] as const;
export type Feature = (typeof FEATURES)[number];
export type Features = Record<Feature, boolean>;
export const FEATURE_DEFAULTS: Features = { chat: true, doubts: true, firstAnswer: false, plans: true, content: true, pods: false };
export const PILOT_DAYS = 30;
export const PRICE_PER_STUDENT_YEAR = 1200;
export const MIN_STUDENTS = 25;
const DAY = 86400_000;

/** The switches from a stored row: defaults, then whatever JSON was saved, with firstAnswer from its own column. */
export function featuresOf(row: { features?: string | null; ai_first_answer?: number | null }): Features {
  let saved: Record<string, unknown> = {};
  try { saved = row.features ? JSON.parse(row.features) : {}; } catch { saved = {}; }
  const out = { ...FEATURE_DEFAULTS };
  for (const k of FEATURES) if (typeof saved[k] === "boolean") out[k] = saved[k] as boolean;
  out.firstAnswer = !!row.ai_first_answer;
  return out;
}

/** Only the known keys with boolean values; anything else is dropped. */
export function cleanFeatures(body: unknown): Partial<Features> {
  const out: Partial<Features> = {};
  if (body && typeof body === "object") for (const k of FEATURES) if (typeof (body as any)[k] === "boolean") out[k] = (body as any)[k];
  return out;
}

export interface CentrePlan { plan: "pilot" | "paid" | "ended"; pilotEndsAt: string; paidUntil: string | null; seats: number | null; plusUntil: string | null }

/** The centre's plan and how long its students have Plus (null when they don't). */
export function planOf(row: { pilot_ends_at?: string | null; paid_until?: string | null; seats?: number | null; created_at: string }, now = Date.now()): CentrePlan {
  const pilotEndsAt = row.pilot_ends_at || new Date(Date.parse(row.created_at) + PILOT_DAYS * DAY).toISOString();
  const paidUntil = row.paid_until || null;
  const nowIso = new Date(now).toISOString();
  const paid = !!paidUntil && paidUntil > nowIso;
  const pilot = pilotEndsAt > nowIso;
  const plusUntil = paid ? [paidUntil!, pilotEndsAt].sort().at(-1)! : pilot ? pilotEndsAt : null;
  return { plan: paid ? "paid" : pilot ? "pilot" : "ended", pilotEndsAt, paidUntil, seats: row.seats ?? null, plusUntil };
}

interface Row { institute_id: string; role: string; status: string; features: string | null; ai_first_answer: number; pilot_ends_at: string | null; paid_until: string | null; seats: number | null; created_at: string }

/** This member's active centre membership with the centre's switches and plan, or null (also when the flag is off). */
export async function centreOf(env: Env, memberId: string): Promise<{ instituteId: string; role: string; features: Features; plan: CentrePlan } | null> {
  if (!/^[\w-]{16,64}$/.test(memberId)) return null;
  try {
    if (!(await flags(env)).institutes) return null;
    const r = await env.DB.prepare(`SELECT m.institute_id, m.role, i.status, i.features, i.ai_first_answer, i.pilot_ends_at, i.paid_until, i.seats, i.created_at
      FROM inst_members m JOIN institutes i ON i.id = m.institute_id WHERE m.member_id = ? AND m.status = 'active' LIMIT 1`).bind(memberId).first<Row>();
    if (!r || r.status !== "active") return null;
    return { instituteId: r.institute_id, role: r.role, features: featuresOf(r), plan: planOf(r) };
  } catch { return null; } // no institutes tables yet, or an older database without the new columns
}

/** Plus from the centre, shaped like plus.ts's entitlement, or null. Students only. */
export async function centrePlus(env: Env, memberId: string): Promise<{ plan: string; source: string; endsAt: string; cancelled: boolean; trial: boolean } | null> {
  const c = await centreOf(env, memberId);
  if (!c || c.role !== "student" || !c.plan.plusUntil) return null;
  return { plan: "centre", source: "centre", endsAt: c.plan.plusUntil, cancelled: false, trial: false };
}

/**
 * Pods and open rooms for a centre's students, when the centre has pods off: joining answers 403. Called from the
 * router before the pod and room routes; reads a clone of the request, so the route still gets the body.
 */
export async function podsGate(req: Request, env: Env, path: string): Promise<Response | null> {
  if (req.method !== "POST" || !["/pods/join", "/pods/choose", "/rooms/join"].includes(path)) return null;
  let body: any = null;
  try { body = await req.clone().json(); } catch { return null; }
  const memberId = String(body?.memberId ?? "");
  const c = await centreOf(env, memberId);
  if (!c || c.role !== "student" || c.features.pods) return null;
  if (path === "/pods/choose" && body?.choice !== "move") return null;
  return json({ error: "Your coaching centre has pods switched off. Your batch chat is in Me → Coaching centre.", code: "centre_pods_off" }, 403);
}
