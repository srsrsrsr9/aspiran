import { identify, upsertAccount } from "./auth";
import { callGroq } from "./ai";
import { FEELINGS, RANKS, has, quietHours } from "./jeetu";
import { extraDistress } from "./langs";
import { type Env, HELPLINES, bad, distress, istDay, json, newId } from "./shared";
import { audit, bump, flags, requireStaff } from "./staff";
import { NODES } from "../public/app/syllabus.js";

/**
 * Aspiran for coaching centres (artefacts/coaching-centres-plan-2026-11-14.md). Behind the `institutes` flag, off by
 * default: with it off every /inst route answers 404 and nothing changes for anyone.
 *
 * An institute is a tenant. People join with an invite code and get one role in it: owner, admin, teacher or student.
 * Every route below starts from the caller's own signed-in account (a sign-in is always needed here, whatever the
 * sign_in_required flag says) and their one active membership, and every query is scoped to that institute_id.
 * Anything with another institute's id answers "not found", never "forbidden", so ids can't be probed.
 *
 * What an institute sees about a student: the name they chose for it, their batch, joined and last active, days
 * active and focus minutes since joining, their answers to the institute's question sets, their doubts, their
 * institute chat messages and their ticks on the institute's plan. Never pods, rooms, Chotu or Jeetu chats, the
 * journal, their own Aspiran practice, Plus, email or phone, or anything from before they joined.
 *
 * Distress in a chat message or a doubt: not posted; the writer gets the care box, and a "distress" report goes to
 * Aspiran's own moderators (the reports table, as in pods). The institute is never sent the text.
 *
 * Routes (JSON; all need a sign-in token):
 *   Everyone:  GET /inst/me · POST /inst/join {code, displayName, consent, adult} · POST /inst/leave
 *              GET /inst/logo/<instituteId> (public: a logo isn't secret)
 *   Students and staff in the institute:
 *              GET /inst/feed?batch=&after= · POST /inst/chat {text, batchId?, announce?} · POST /inst/chat/report {id, reason}
 *              GET /inst/doubts?status= · POST /inst/doubts {text, nodeId?, refId?, photo?} · GET /inst/doubts/<id>
 *              POST /inst/doubts/<id>/reply {text} · POST /inst/doubts/<id>/status {status} · GET /inst/doubts/<id>/photo
 *              GET /inst/plan · POST /inst/plan/done {itemId, done} · GET /inst/content · GET /inst/content/<id>
 *              POST /inst/attempts {contentId, answers} · GET /inst/progress (your own numbers only)
 *   Teachers and up: /inst/admin/... (overview, batches, codes, roster, members, branding, logo, messages, content,
 *              plans, analytics, analytics.csv). Each checks the role it needs.
 *   Aspiran staff (admin key): GET/POST /admin/api/institutes, POST /admin/api/institutes/<id>/status.
 */

// --- Roles ---------------------------------------------------------------------------------------------------

export type Role = "owner" | "admin" | "teacher" | "student";
const RANK: Record<Role, number> = { student: 1, teacher: 2, admin: 3, owner: 4 };
const atLeast = (r: Role, need: Role) => RANK[r] >= RANK[need];

interface Institute { id: string; name: string; city: string | null; brand_color: string | null; logo_key: string | null; ai_first_answer: number; status: string; created_at: string }
interface Membership { institute_id: string; member_id: string; role: Role; display_name: string; batch_id: string | null; status: string; joined_at: string; last_active_at: string | null }
interface Ctx { me: string; m: Membership; inst: Institute }

const NODE_IDS = new Set(NODES.map((n) => n.id));
const paperOfNode = (id: string | null) => (id ? NODES.find((n) => n.id === id)?.paper.short ?? null : null);
const nodeName = (id: string | null) => (id ? NODES.find((n) => n.id === id)?.name ?? id : null);
const HEX = /^#[0-9a-fA-F]{6}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const now = () => new Date().toISOString();
const notFound = (what = "That") => bad(`${what} isn't here.`, 404);

// --- Schema: the same SQL as migrations/0014_institutes.sql, so a fresh local server works too --------------

export const INST_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS institutes (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, brand_color TEXT, logo_key TEXT,
    ai_first_answer INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, created_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS inst_members (institute_id TEXT NOT NULL, member_id TEXT NOT NULL, role TEXT NOT NULL, display_name TEXT NOT NULL,
    batch_id TEXT, status TEXT NOT NULL DEFAULT 'active', joined_at TEXT NOT NULL, consent_at TEXT, left_at TEXT, last_active_at TEXT,
    PRIMARY KEY (institute_id, member_id))`,
  `CREATE INDEX IF NOT EXISTS inst_members_member ON inst_members(member_id, status)`,
  `CREATE TABLE IF NOT EXISTS inst_batches (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, name TEXT NOT NULL, exam_year INTEGER,
    created_at TEXT NOT NULL, archived_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS inst_batches_inst ON inst_batches(institute_id)`,
  `CREATE TABLE IF NOT EXISTS inst_codes (code TEXT PRIMARY KEY, institute_id TEXT NOT NULL, role TEXT NOT NULL, batch_id TEXT, created_by TEXT,
    created_at TEXT NOT NULL, expires_at TEXT, max_uses INTEGER NOT NULL DEFAULT 1, uses INTEGER NOT NULL DEFAULT 0, revoked_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS inst_codes_inst ON inst_codes(institute_id)`,
  `CREATE TABLE IF NOT EXISTS inst_messages (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, name TEXT NOT NULL,
    role TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, at TEXT NOT NULL, hidden_at TEXT, hidden_by TEXT, reported_at TEXT, report_reason TEXT)`,
  `CREATE INDEX IF NOT EXISTS inst_messages_batch ON inst_messages(institute_id, batch_id, at)`,
  `CREATE TABLE IF NOT EXISTS inst_doubts (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, name TEXT NOT NULL,
    node_id TEXT, ref_id TEXT, text TEXT NOT NULL, photo_key TEXT, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS inst_doubts_inst ON inst_doubts(institute_id, status, updated_at)`,
  `CREATE TABLE IF NOT EXISTS inst_doubt_replies (id TEXT PRIMARY KEY, doubt_id TEXT NOT NULL, institute_id TEXT NOT NULL, member_id TEXT,
    name TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS inst_doubt_replies_doubt ON inst_doubt_replies(doubt_id, at)`,
  `CREATE TABLE IF NOT EXISTS inst_plans (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, title TEXT NOT NULL,
    starts_on TEXT NOT NULL, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS inst_plans_inst ON inst_plans(institute_id)`,
  `CREATE TABLE IF NOT EXISTS inst_plan_items (id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, institute_id TEXT NOT NULL, day TEXT NOT NULL,
    kind TEXT NOT NULL, node_id TEXT, content_id TEXT, title TEXT NOT NULL, note TEXT, sort INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS inst_plan_items_plan ON inst_plan_items(plan_id, day)`,
  `CREATE TABLE IF NOT EXISTS inst_plan_done (item_id TEXT NOT NULL, member_id TEXT NOT NULL, institute_id TEXT NOT NULL, done_at TEXT NOT NULL,
    PRIMARY KEY (item_id, member_id))`,
  `CREATE TABLE IF NOT EXISTS inst_content (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, kind TEXT NOT NULL, title TEXT NOT NULL,
    paper TEXT, node_id TEXT, json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS inst_content_inst ON inst_content(institute_id, status)`,
  `CREATE TABLE IF NOT EXISTS inst_attempts (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, content_id TEXT NOT NULL, member_id TEXT NOT NULL,
    node_id TEXT, kind TEXT NOT NULL, right_n INTEGER NOT NULL, total INTEGER NOT NULL, answers TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS inst_attempts_member ON inst_attempts(institute_id, member_id, at)`,
];
let ready: Promise<void> | null = null;
export function ensureInstSchema(env: Env): Promise<void> {
  ready ??= env.DB.batch(INST_SCHEMA.map((s) => env.DB.prepare(s))).then(() => {}).catch((e) => { ready = null; throw e; });
  return ready;
}

// --- Who is calling ----------------------------------------------------------------------------------------

/** The signed-in account's member id, or a 401/403 Response. Always needs a token here. */
async function signedIn(req: Request, env: Env, url: URL): Promise<string | Response> {
  const id = await identify(req, env, url);
  if (!id.ok) return id.res;
  const a = await upsertAccount(env, id.who, {});
  if (a.status !== "active") return json({ error: "Your access has been switched off.", code: "account_suspended" }, 403);
  return a.member_id!;
}

const activeMembership = (env: Env, me: string) => env.DB.prepare("SELECT * FROM inst_members WHERE member_id = ? AND status = 'active' LIMIT 1").bind(me).first<Membership>();
const getInstitute = (env: Env, id: string) => env.DB.prepare("SELECT * FROM institutes WHERE id = ?").bind(id).first<Institute>();

/** The caller's institute and role, or a Response: not in one (404), paused (403), or the role is too low (403). */
async function context(env: Env, me: string, need: Role = "student"): Promise<Ctx | Response> {
  const m = await activeMembership(env, me);
  if (!m) return bad("You're not in a coaching centre on Aspiran.", 404);
  const inst = await getInstitute(env, m.institute_id);
  if (!inst) return bad("You're not in a coaching centre on Aspiran.", 404);
  if (inst.status !== "active") return bad(`${inst.name} is paused on Aspiran for now.`, 403);
  if (!atLeast(m.role, need)) return bad("Your role in this institute can't do that.", 403);
  // "Last active" for teachers: at most every 10 minutes.
  if (!m.last_active_at || Date.now() - Date.parse(m.last_active_at) > 10 * 60_000) {
    await env.DB.prepare("UPDATE inst_members SET last_active_at = ? WHERE institute_id = ? AND member_id = ?").bind(now(), m.institute_id, me).run();
  }
  return { me, m, inst };
}

const batchOf = (env: Env, inst: string, id: unknown) =>
  typeof id === "string" && id ? env.DB.prepare("SELECT * FROM inst_batches WHERE id = ? AND institute_id = ?").bind(id, inst).first<{ id: string; name: string; archived_at: string | null }>() : Promise.resolve(null);

export const branding = (inst: Institute) => ({
  id: inst.id, name: inst.name, city: inst.city, color: inst.brand_color, logo: inst.logo_key ? `/inst/logo/${inst.id}` : null, aiFirstAnswer: !!inst.ai_first_answer,
});

// --- Invite codes ------------------------------------------------------------------------------------------

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
function newCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return [...b].map((x) => ALPHABET[x % ALPHABET.length]).join("");
}
const cleanCode = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const showCode = (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`;

async function makeCode(env: Env, inst: string, role: Role, batchId: string | null, by: string, maxUses: number, days: number) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const r = await env.DB.prepare("INSERT OR IGNORE INTO inst_codes (code, institute_id, role, batch_id, created_by, created_at, expires_at, max_uses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(code, inst, role, batchId, by, now(), new Date(Date.now() + days * 86400_000).toISOString(), maxUses).run();
    if (r.meta.changes) return code;
  }
  throw new Error("couldn't make a code");
}

// --- Safety ------------------------------------------------------------------------------------------------

/** Distress: a report for Aspiran's moderators and the care box for the writer. True when it tripped. */
async function guardian(env: Env, inst: Institute, me: string, name: string, text: string, ref: string): Promise<boolean> {
  if (!distress(text, await extraDistress(env).catch(() => []))) return false;
  await env.DB.prepare("INSERT INTO reports (kind, pod_id, message_id, author, member_id, text, reason, created_at) VALUES ('distress', ?, ?, ?, ?, ?, 'guardian', ?)")
    .bind("inst:" + inst.id, ref, name, me, text, now()).run().catch(() => {});
  await bump(env, "distress");
  return true;
}
const careReply = () => json({ held: true, care: { helplines: HELPLINES, message: "This wasn't posted. You matter more than any exam. Aspiran's care team has been told and will reach out. If you're in danger right now, call 112." } });

/** Ten messages a minute per person, across chat, doubts and replies. */
async function tooFast(env: Env, inst: string, me: string): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const r = await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM inst_messages WHERE institute_id = ?1 AND member_id = ?2 AND at > ?3)
    + (SELECT COUNT(*) FROM inst_doubt_replies WHERE institute_id = ?1 AND member_id = ?2 AND at > ?3)
    + (SELECT COUNT(*) FROM inst_doubts WHERE institute_id = ?1 AND member_id = ?2 AND created_at > ?3) AS n`).bind(inst, me, since).first<{ n: number }>();
  return (r?.n ?? 0) >= 10;
}

// --- Content checks (the content-pack quiz shape, upsc-pods/quiz-pack@1) -----------------------------------

type Q = { question: string; options: string[]; answerIndex: number; explanation: string };
function cleanQ(raw: any): Q | null {
  if (!raw || typeof raw !== "object") return null;
  const options = Array.isArray(raw.options) ? raw.options.map((o: unknown) => str(o, 400)) : [];
  const q = { question: str(raw.question, 2000), options, answerIndex: Number(raw.answerIndex), explanation: str(raw.explanation, 3000) };
  if (!q.question || options.length < 2 || options.length > 6 || options.some((o: string) => !o) || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= options.length) return null;
  return q;
}
/** The stored JSON for a note or a question set, or an error in plain words. */
function cleanContent(kind: string, body: any): { data: any; title?: string } | { error: string } {
  if (kind === "note") {
    const en = str(body?.en?.body ?? body?.body, 20000);
    if (!en) return { error: "A note needs some text." };
    const hi = str(body?.hi?.body, 20000);
    return { data: { en: { body: en }, ...(hi ? { hi: { body: hi } } : {}) } };
  }
  // A pasted content-pack quiz: { schema: "upsc-pods/quiz-pack@1", questions: [...] }.
  const src = body?.pack && typeof body.pack === "object" ? body.pack : body;
  if (body?.pack && src.schema !== "upsc-pods/quiz-pack@1") return { error: "Only upsc-pods/quiz-pack@1 quizzes can be imported." };
  const raw = Array.isArray(src?.questions) ? src.questions : [];
  if (!raw.length || raw.length > 100) return { error: "A question set needs 1 to 100 questions." };
  const questions = [];
  for (let i = 0; i < raw.length; i++) {
    const en = cleanQ(raw[i]?.en ?? raw[i]);
    if (!en) return { error: `Question ${i + 1}: needs a question, 2 to 6 options and an answer that is one of them.` };
    const hi = raw[i]?.hi ? cleanQ(raw[i].hi) : null;
    if (raw[i]?.hi && !hi) return { error: `Question ${i + 1} (Hindi): needs a question, options and an answer.` };
    if (hi && hi.answerIndex !== en.answerIndex) return { error: `Question ${i + 1}: English and Hindi answers differ.` };
    questions.push({ en, ...(hi ? { hi } : {}) });
  }
  const title = typeof src?.title === "string" ? src.title : typeof src?.title?.en === "string" ? src.title.en : undefined;
  return { data: { questions }, title };
}
/** What a student sees of a question set: no answers until they answer. */
const forStudent = (kind: string, data: any) => kind === "note" ? data : {
  questions: data.questions.map((q: any) => ({ en: { question: q.en.question, options: q.en.options }, ...(q.hi ? { hi: { question: q.hi.question, options: q.hi.options } } : {}) })),
};

// --- Erasure and leaving -----------------------------------------------------------------------------------

/** Leaving or removal: their answers and ticks go; doubts and messages stay for the batch with the name taken off. */
async function detach(env: Env, inst: string, member: string, status: "left" | "removed") {
  await env.DB.batch([
    env.DB.prepare("UPDATE inst_members SET status = ?, left_at = ? WHERE institute_id = ? AND member_id = ?").bind(status, now(), inst, member),
    env.DB.prepare("DELETE FROM inst_attempts WHERE institute_id = ? AND member_id = ?").bind(inst, member),
    env.DB.prepare("DELETE FROM inst_plan_done WHERE institute_id = ? AND member_id = ?").bind(inst, member),
    env.DB.prepare("UPDATE inst_doubts SET member_id = NULL, name = 'A former student' WHERE institute_id = ? AND member_id = ?").bind(inst, member),
    env.DB.prepare("UPDATE inst_doubt_replies SET member_id = NULL, name = 'A former student' WHERE institute_id = ? AND member_id = ? AND role = 'student'").bind(inst, member),
    env.DB.prepare("UPDATE inst_messages SET member_id = NULL, name = 'A former student' WHERE institute_id = ? AND member_id = ? AND role = 'student'").bind(inst, member),
    env.DB.prepare("DELETE FROM inst_plans WHERE institute_id = ? AND member_id = ?").bind(inst, member),
  ]);
}

/** "Delete my data" (privacy.ts): everything institute-side that is theirs, in every institute. */
export async function forgetInstituteMember(env: Env, member: string) {
  await ensureInstSchema(env);
  const photos = (await env.DB.prepare("SELECT photo_key FROM inst_doubts WHERE member_id = ? AND photo_key IS NOT NULL").bind(member).all<{ photo_key: string }>()).results;
  for (const p of photos) await env.MEDIA?.delete(p.photo_key).catch(() => {});
  await env.DB.batch([
    env.DB.prepare("DELETE FROM inst_attempts WHERE member_id = ?").bind(member),
    env.DB.prepare("DELETE FROM inst_plan_done WHERE member_id = ?").bind(member),
    env.DB.prepare("DELETE FROM inst_plan_items WHERE plan_id IN (SELECT id FROM inst_plans WHERE member_id = ?)").bind(member),
    env.DB.prepare("DELETE FROM inst_plans WHERE member_id = ?").bind(member),
    env.DB.prepare("DELETE FROM inst_doubt_replies WHERE doubt_id IN (SELECT id FROM inst_doubts WHERE member_id = ?)").bind(member),
    env.DB.prepare("DELETE FROM inst_doubts WHERE member_id = ?").bind(member),
    env.DB.prepare("UPDATE inst_doubt_replies SET member_id = NULL, name = 'A former member' WHERE member_id = ?").bind(member),
    env.DB.prepare("DELETE FROM inst_messages WHERE member_id = ?").bind(member),
    env.DB.prepare("DELETE FROM inst_members WHERE member_id = ?").bind(member),
  ]);
}

// --- The router ----------------------------------------------------------------------------------------------

export async function instituteRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path.startsWith("/admin/api/institutes")) return staffRoute(req, env, path);
  if (!path.startsWith("/inst/")) return null;
  if (!(await flags(env)).institutes) return bad("Not found", 404);
  await ensureInstSchema(env);

  // The logo is public by id (it's on the student's screen and isn't secret).
  const logo = path.match(/^\/inst\/logo\/([\w-]{6,40})$/);
  if (logo && req.method === "GET") {
    const inst = await getInstitute(env, logo[1]);
    if (!inst?.logo_key || !env.MEDIA) return notFound("That logo");
    const obj = await env.MEDIA.get(inst.logo_key);
    if (!obj) return notFound("That logo");
    return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "image/png", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
  }

  const me = await signedIn(req, env, url);
  if (me instanceof Response) return me;
  const body: any = req.method === "POST" ? await req.json().catch(() => null) : null;
  if (req.method === "POST" && (!body || typeof body !== "object" || Array.isArray(body))) return bad("Expected a JSON object");

  if (path === "/inst/me" && req.method === "GET") {
    const m = await activeMembership(env, me);
    const inst = m ? await getInstitute(env, m.institute_id) : null;
    if (!m || !inst) return json({ institute: null });
    const batch = m.batch_id ? await batchOf(env, inst.id, m.batch_id) : null;
    return json({ institute: branding(inst), paused: inst.status !== "active", role: m.role, displayName: m.display_name, batch: batch ? { id: batch.id, name: batch.name } : null, joinedAt: m.joined_at });
  }
  if (path === "/inst/join" && req.method === "POST") return join(env, me, body);
  if (path === "/inst/leave" && req.method === "POST") {
    const m = await activeMembership(env, me);
    if (!m) return bad("You're not in a coaching centre on Aspiran.", 404);
    if (m.role === "owner") return bad("The owner can't leave. Ask Aspiran to hand the institute to someone else first.", 409);
    await detach(env, m.institute_id, me, "left");
    return json({ ok: true });
  }

  if (path.startsWith("/inst/admin/")) {
    const c = await context(env, me, "teacher");
    if (c instanceof Response) return c;
    return adminRoute(req, env, path.slice("/inst/admin/".length), url, body, c);
  }
  const c = await context(env, me, "student");
  if (c instanceof Response) return c;
  return memberRoute(req, env, path, url, body, c);
}

async function join(env: Env, me: string, body: any): Promise<Response> {
  const code = cleanCode(body.code);
  const name = str(body.displayName, 40);
  if (code.length !== 8) return bad("That code doesn't look right. It has 8 letters and numbers, like KXR7-M2PD.");
  if (name.length < 2) return bad("Pick the name your institute will see (at least 2 letters).");
  if (body.consent !== true) return bad("Please read and tick what your institute will and won't see.");
  if (body.adult !== true) return bad("Coaching centres on Aspiran are for people aged 18 and over for now.");
  const row = await env.DB.prepare("SELECT * FROM inst_codes WHERE code = ?").bind(code).first<{ code: string; institute_id: string; role: Role; batch_id: string | null; expires_at: string | null; max_uses: number; uses: number; revoked_at: string | null }>();
  const dead = !row || row.revoked_at || (row.expires_at && row.expires_at < now()) || row.uses >= row.max_uses;
  if (dead) return bad("That code isn't working. It may have been used up, cancelled or expired. Ask your institute for a new one.", 404);
  const inst = await getInstitute(env, row.institute_id);
  if (!inst || inst.status !== "active") return bad("That institute isn't taking new people on Aspiran right now.", 403);
  const current = await activeMembership(env, me);
  if (current?.institute_id === inst.id) return bad(`You're already in ${inst.name}.`, 409);
  if (current) return bad("You're already in another coaching centre. Leave it first (Me → Coaching centre).", 409);
  if (row.role === "owner" && (await env.DB.prepare("SELECT 1 FROM inst_members WHERE institute_id = ? AND role = 'owner' AND status = 'active'").bind(inst.id).first())) {
    return bad("This institute already has an owner.", 409);
  }
  if (row.role === "student") {
    const b = await batchOf(env, inst.id, row.batch_id);
    if (!b || b.archived_at) return bad("That batch has closed. Ask your institute for a new code.", 404);
  }
  // Take one use, atomically, so a code for 1 can't be used twice at once.
  const took = await env.DB.prepare("UPDATE inst_codes SET uses = uses + 1 WHERE code = ? AND uses < max_uses AND revoked_at IS NULL").bind(code).run();
  if (!took.meta.changes) return bad("That code has just been used up. Ask your institute for a new one.", 404);
  const t = now();
  await env.DB.prepare(`INSERT INTO inst_members (institute_id, member_id, role, display_name, batch_id, status, joined_at, consent_at, left_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NULL, ?) ON CONFLICT(institute_id, member_id) DO UPDATE SET role = excluded.role, display_name = excluded.display_name,
    batch_id = excluded.batch_id, status = 'active', joined_at = excluded.joined_at, consent_at = excluded.consent_at, left_at = NULL, last_active_at = excluded.last_active_at`)
    .bind(inst.id, me, row.role, name, row.role === "student" ? row.batch_id : null, t, t, t).run();
  await bump(env, "inst_joins");
  return json({ ok: true, institute: branding(inst), role: row.role });
}

// --- Students and staff: chat, doubts, plan, content -----------------------------------------------------------

async function memberRoute(req: Request, env: Env, path: string, url: URL, body: any, c: Ctx): Promise<Response> {
  const { me, m, inst } = c;
  const staff = atLeast(m.role, "teacher");

  // Chat and announcements. Students see their own batch; staff pick one.
  if (path === "/inst/feed" && req.method === "GET") {
    const batchId = staff ? url.searchParams.get("batch") : m.batch_id;
    const batch = await batchOf(env, inst.id, batchId);
    if (!batch) return staff ? bad("Pick a batch.") : json({ batch: null, announcements: [], messages: [] });
    const after = url.searchParams.get("after") ?? "";
    const hidden = staff ? "" : "AND hidden_at IS NULL";
    const announcements = (await env.DB.prepare(`SELECT id, batch_id, name, role, text, at FROM inst_messages WHERE institute_id = ? AND kind = 'announcement' AND (batch_id = ? OR batch_id IS NULL) ${hidden} ORDER BY at DESC LIMIT 10`)
      .bind(inst.id, batch.id).all()).results;
    const messages = (await env.DB.prepare(`SELECT id, member_id, name, role, text, at, hidden_at, reported_at FROM inst_messages WHERE institute_id = ? AND batch_id = ? AND kind = 'chat' AND at > ? ${hidden} ORDER BY at DESC LIMIT 100`)
      .bind(inst.id, batch.id, after).all<any>()).results.reverse()
      .map((r) => ({ id: r.id, name: r.name, role: r.role, text: r.text, at: r.at, mine: r.member_id === me, ...(staff ? { hidden: !!r.hidden_at, reported: !!r.reported_at } : {}) }));
    return json({ batch: { id: batch.id, name: batch.name }, announcements, messages });
  }
  if (path === "/inst/chat" && req.method === "POST") {
    const text = str(body.text, 1000);
    if (!text) return bad("Write something first.");
    const announce = body.announce === true;
    if (announce && !staff) return bad("Only teachers post announcements.", 403);
    let batchId: string | null = staff ? (body.batchId ? String(body.batchId) : null) : m.batch_id;
    if (batchId) {
      const b = await batchOf(env, inst.id, batchId);
      if (!b) return notFound("That batch");
      if (b.archived_at && !staff) return bad("This batch has closed.", 403);
    } else if (!announce) return bad("Pick a batch.");
    if (await tooFast(env, inst.id, me)) return bad("That's a lot of messages. Give it a minute.", 429);
    const id = newId("im");
    if (await guardian(env, inst, me, m.display_name, text, id)) return careReply();
    await env.DB.prepare("INSERT INTO inst_messages (id, institute_id, batch_id, member_id, name, role, kind, text, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, inst.id, batchId, me, m.display_name, m.role === "student" ? "student" : "teacher", announce ? "announcement" : "chat", text, now()).run();
    return json({ ok: true, id });
  }
  if (path === "/inst/chat/report" && req.method === "POST") {
    const msg = await env.DB.prepare("SELECT id, batch_id FROM inst_messages WHERE id = ? AND institute_id = ?").bind(String(body.id ?? ""), inst.id).first<{ id: string; batch_id: string | null }>();
    if (!msg || (!staff && msg.batch_id && msg.batch_id !== m.batch_id)) return notFound("That message");
    await env.DB.prepare("UPDATE inst_messages SET reported_at = ?, report_reason = ? WHERE id = ?").bind(now(), str(body.reason, 300) || "Reported", msg.id).run();
    return json({ ok: true });
  }

  // Doubts.
  if (path === "/inst/doubts" && req.method === "GET") {
    const status = url.searchParams.get("status");
    const where = ["institute_id = ?"], args: unknown[] = [inst.id];
    if (!staff) { where.push("member_id = ?"); args.push(me); }
    if (status && ["open", "answered", "resolved"].includes(status)) { where.push("status = ?"); args.push(status); }
    const batch = staff ? url.searchParams.get("batch") : null;
    if (batch) { where.push("batch_id = ?"); args.push(batch); }
    const rows = (await env.DB.prepare(`SELECT id, batch_id, member_id, name, node_id, ref_id, text, photo_key, status, created_at, updated_at FROM inst_doubts WHERE ${where.join(" AND ")} ORDER BY updated_at DESC LIMIT 200`)
      .bind(...args).all<any>()).results;
    return json({ doubts: rows.map((r) => doubtOut(r, me)) });
  }
  if (path === "/inst/doubts" && req.method === "POST") {
    const text = str(body.text, 2000);
    if (text.length < 5) return bad("Write your doubt in a sentence or two.");
    const node = body.nodeId ? String(body.nodeId) : null;
    if (node && !NODE_IDS.has(node)) return bad("That topic isn't in the syllabus list.");
    let ref: string | null = null;
    if (body.refId) {
      const [cid] = String(body.refId).split("#");
      if (!(await env.DB.prepare("SELECT 1 FROM inst_content WHERE id = ? AND institute_id = ?").bind(cid, inst.id).first())) return notFound("That question");
      ref = String(body.refId).slice(0, 80);
    }
    if (await tooFast(env, inst.id, me)) return bad("That's a lot at once. Give it a minute.", 429);
    const id = newId("id");
    if (await guardian(env, inst, me, m.display_name, text, id)) return careReply();
    let photoKey: string | null = null;
    if (body.photo) {
      if (!env.MEDIA) return bad("Photos aren't set up on this server.", 503);
      if (body.photo.mime !== "image/jpeg" || typeof body.photo.data !== "string") return bad("Only JPEG photos.");
      let bytes: Uint8Array;
      try { bytes = Uint8Array.from(atob(body.photo.data), (ch) => ch.charCodeAt(0)); } catch { return bad("The photo didn't come through. Try again."); }
      if (bytes.length > 1_500_000) return bad("That photo is too big. Under 1.5 MB, please.", 413);
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bad("Only JPEG photos.");
      photoKey = `inst-doubts/${inst.id}/${id}.jpg`;
      await env.MEDIA.put(photoKey, bytes, { httpMetadata: { contentType: "image/jpeg" } });
    }
    const t = now();
    await env.DB.prepare("INSERT INTO inst_doubts (id, institute_id, batch_id, member_id, name, node_id, ref_id, text, photo_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)")
      .bind(id, inst.id, m.batch_id, me, m.display_name, node, ref, text, photoKey, t, t).run();
    let ai: string | null = null;
    if (inst.ai_first_answer) ai = await aiFirstAnswer(env, inst, id, text, node);
    return json({ ok: true, id, aiAnswered: !!ai });
  }
  const dm = path.match(/^\/inst\/doubts\/([\w-]{4,40})(\/reply|\/status|\/photo)?$/);
  if (dm) {
    const d = await env.DB.prepare("SELECT * FROM inst_doubts WHERE id = ? AND institute_id = ?").bind(dm[1], inst.id).first<any>();
    if (!d || (!staff && d.member_id !== me)) return notFound("That doubt");
    if (!dm[2] && req.method === "GET") {
      const replies = (await env.DB.prepare("SELECT id, member_id, name, role, text, at FROM inst_doubt_replies WHERE doubt_id = ? AND institute_id = ? ORDER BY at").bind(d.id, inst.id).all<any>()).results
        .map((r) => ({ id: r.id, name: r.name, role: r.role, text: r.text, at: r.at, mine: r.member_id === me }));
      return json({ doubt: doubtOut(d, me), replies });
    }
    if (dm[2] === "/photo" && req.method === "GET") {
      const obj = d.photo_key && env.MEDIA ? await env.MEDIA.get(d.photo_key) : null;
      if (!obj) return notFound("That photo");
      return new Response(obj.body, { headers: { "content-type": "image/jpeg", "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
    }
    if (dm[2] === "/reply" && req.method === "POST") {
      const text = str(body.text, 3000);
      if (!text) return bad("Write a reply first.");
      if (await tooFast(env, inst.id, me)) return bad("That's a lot at once. Give it a minute.", 429);
      const id = newId("ir");
      if (await guardian(env, inst, me, m.display_name, text, id)) return careReply();
      const t = now();
      // A teacher's reply makes it answered; the student writing back opens it again.
      await env.DB.batch([
        env.DB.prepare("INSERT INTO inst_doubt_replies (id, doubt_id, institute_id, member_id, name, role, text, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(id, d.id, inst.id, me, m.display_name, staff ? "teacher" : "student", text, t),
        env.DB.prepare("UPDATE inst_doubts SET status = ?, updated_at = ? WHERE id = ?").bind(staff ? "answered" : "open", t, d.id),
      ]);
      return json({ ok: true, id, status: staff ? "answered" : "open" });
    }
    if (dm[2] === "/status" && req.method === "POST") {
      const status = String(body.status);
      if (!["open", "resolved"].includes(status)) return bad("status is open or resolved");
      await env.DB.prepare("UPDATE inst_doubts SET status = ?, updated_at = ? WHERE id = ?").bind(status, now(), d.id).run();
      return json({ ok: true, status });
    }
  }

  // The study plan: plans for my batch and for me, with my ticks.
  if (path === "/inst/plan" && req.method === "GET") {
    const plans = (await env.DB.prepare("SELECT id, batch_id, member_id, title, starts_on, updated_at FROM inst_plans WHERE institute_id = ? AND ((batch_id IS NOT NULL AND batch_id = ?) OR member_id = ?) ORDER BY starts_on DESC")
      .bind(inst.id, m.batch_id ?? "", me).all<any>()).results;
    const out = [];
    for (const p of plans) {
      const items = (await env.DB.prepare("SELECT i.id, i.day, i.kind, i.node_id, i.content_id, i.title, i.note, d.done_at FROM inst_plan_items i LEFT JOIN inst_plan_done d ON d.item_id = i.id AND d.member_id = ? WHERE i.plan_id = ? ORDER BY i.day, i.sort")
        .bind(me, p.id).all<any>()).results;
      out.push({ id: p.id, title: p.title, startsOn: p.starts_on, forYou: !!p.member_id, items: items.map((i) => ({ id: i.id, day: i.day, kind: i.kind, nodeId: i.node_id, topic: nodeName(i.node_id), contentId: i.content_id, title: i.title, note: i.note, done: !!i.done_at })) });
    }
    return json({ plans: out, today: istDay() });
  }
  if (path === "/inst/plan/done" && req.method === "POST") {
    const item = await env.DB.prepare("SELECT i.id FROM inst_plan_items i JOIN inst_plans p ON p.id = i.plan_id WHERE i.id = ? AND i.institute_id = ? AND ((p.batch_id IS NOT NULL AND p.batch_id = ?) OR p.member_id = ?)")
      .bind(String(body.itemId ?? ""), inst.id, m.batch_id ?? "", me).first<{ id: string }>();
    if (!item) return notFound("That plan item");
    if (body.done === false) await env.DB.prepare("DELETE FROM inst_plan_done WHERE item_id = ? AND member_id = ?").bind(item.id, me).run();
    else await env.DB.prepare("INSERT OR IGNORE INTO inst_plan_done (item_id, member_id, institute_id, done_at) VALUES (?, ?, ?, ?)").bind(item.id, me, inst.id, now()).run();
    return json({ ok: true });
  }

  // The institute's own content: published, for my batch or everyone.
  const visible = "institute_id = ? AND status = 'published' AND (batch_id IS NULL OR batch_id = ?)";
  if (path === "/inst/content" && req.method === "GET") {
    const rows = (await env.DB.prepare(`SELECT id, kind, title, paper, node_id, updated_at, json FROM inst_content WHERE ${visible} ORDER BY updated_at DESC LIMIT 300`)
      .bind(inst.id, staff ? (url.searchParams.get("batch") ?? m.batch_id ?? "") : m.batch_id ?? "").all<any>()).results;
    const done = new Map((await env.DB.prepare("SELECT content_id, MAX(at) AS at, COUNT(*) AS n FROM inst_attempts WHERE institute_id = ? AND member_id = ? GROUP BY content_id").bind(inst.id, me).all<any>()).results.map((r) => [r.content_id, r]));
    return json({ items: rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, paper: r.paper, nodeId: r.node_id, topic: nodeName(r.node_id), updatedAt: r.updated_at,
      questions: r.kind === "note" ? null : JSON.parse(r.json).questions.length, attempts: done.get(r.id)?.n ?? 0 })) });
  }
  const cm = path.match(/^\/inst\/content\/([\w-]{4,40})$/);
  if (cm && req.method === "GET") {
    const r = await env.DB.prepare(`SELECT * FROM inst_content WHERE id = ? AND ${visible}`).bind(cm[1], inst.id, m.batch_id ?? "").first<any>();
    if (!r) return notFound("That piece");
    const taken = r.kind === "test" ? await env.DB.prepare("SELECT right_n, total, answers FROM inst_attempts WHERE content_id = ? AND member_id = ? ORDER BY at LIMIT 1").bind(r.id, me).first<any>() : null;
    return json({ id: r.id, kind: r.kind, title: r.title, paper: r.paper, nodeId: r.node_id, topic: nodeName(r.node_id), data: forStudent(r.kind, JSON.parse(r.json)),
      ...(taken ? { taken: { right: taken.right_n, total: taken.total, review: review(JSON.parse(r.json), JSON.parse(taken.answers)) } } : {}) });
  }
  if (path === "/inst/attempts" && req.method === "POST") {
    const r = await env.DB.prepare(`SELECT * FROM inst_content WHERE id = ? AND ${visible}`).bind(String(body.contentId ?? ""), inst.id, m.batch_id ?? "").first<any>();
    if (!r || r.kind === "note") return notFound("That question set");
    if (r.kind === "test" && (await env.DB.prepare("SELECT 1 FROM inst_attempts WHERE content_id = ? AND member_id = ?").bind(r.id, me).first())) return bad("You've already taken this test. Your answers are below it.", 409);
    const data = JSON.parse(r.json);
    const given: unknown[] = Array.isArray(body.answers) ? body.answers : [];
    const answers = data.questions.map((q: any, i: number) => {
      const ch = Number.isInteger(given[i]) ? (given[i] as number) : null;
      return { q: i, chosen: ch, right: ch === q.en.answerIndex };
    });
    const answered = answers.filter((a: any) => a.chosen !== null);
    if (!answered.length) return bad("Answer at least one question.");
    const right = answered.filter((a: any) => a.right).length;
    await env.DB.prepare("INSERT INTO inst_attempts (id, institute_id, content_id, member_id, node_id, kind, right_n, total, answers, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(newId("ia"), inst.id, r.id, me, r.node_id, r.kind, right, answered.length, JSON.stringify(answers), now()).run();
    return json({ right, total: answered.length, review: review(data, answers) });
  }
  if (path === "/inst/progress" && req.method === "GET") {
    const s = (await studentStats(env, inst.id, [{ member_id: me, display_name: m.display_name, batch_id: m.batch_id, joined_at: m.joined_at, last_active_at: m.last_active_at }]))[0];
    return json({ you: s });
  }
  return bad("Not found", 404);
}

const doubtOut = (r: any, me: string) => ({
  id: r.id, batchId: r.batch_id, name: r.name, nodeId: r.node_id, topic: nodeName(r.node_id), refId: r.ref_id, text: r.text, photo: !!r.photo_key,
  status: r.status, createdAt: r.created_at, updatedAt: r.updated_at, mine: r.member_id === me,
});
const review = (data: any, answers: any[]) => data.questions.map((q: any, i: number) => ({
  q: i, chosen: answers[i]?.chosen ?? null, right: !!answers[i]?.right, answerIndex: q.en.answerIndex, explanation: q.en.explanation, ...(q.hi ? { hiExplanation: q.hi.explanation } : {}),
}));

/** The optional AI first answer, labelled AI. Never at night, never on feelings, ranks or results. */
async function aiFirstAnswer(env: Env, inst: Institute, doubtId: string, text: string, node: string | null): Promise<string | null> {
  if (quietHours() || has(text, RANKS) || has(text, FEELINGS)) return null;
  try {
    const r = await callGroq(env, "chotu", [
      { role: "system", content: "You give a first answer to a UPSC aspirant's study doubt, for their coaching institute's teachers to check. Answer only the academic question, in under 180 words, plainly, in the language of the question. If you are not sure of a fact, say so. Never talk about feelings, ranks, marks, results or the student's chances. Don't greet or sign off." },
      { role: "user", content: (node ? `Topic: ${nodeName(node)}\n` : "") + text },
    ]);
    const answer = r.text.trim().slice(0, 3000);
    if (!answer) return null;
    await env.DB.prepare("INSERT INTO inst_doubt_replies (id, doubt_id, institute_id, member_id, name, role, text, at) VALUES (?, ?, ?, NULL, 'Aspiran', 'ai', ?, ?)")
      .bind(newId("ir"), doubtId, inst.id, answer, now()).run();
    return answer;
  } catch { return null; } // no key, switched off or down: the teacher answers
}

// --- Analytics: from what is actually stored, since each student joined -----------------------------------------

interface StudentRow { member_id: string; display_name: string; batch_id: string | null; joined_at: string; last_active_at: string | null }
export interface StudentStats {
  memberId: string; name: string; batchId: string | null; joinedAt: string; lastActive: string | null; daysActive14: number; focusMinutes: number;
  sets: number; answered: number; right: number; accuracy: number | null; weakTopics: { nodeId: string; topic: string; answered: number; pct: number }[];
  topics: Record<string, { answered: number; right: number }>; tests: { contentId: string; right: number; total: number; pct: number }[];
  doubtsRaised: number; doubtsResolved: number; planDone: number; planDue: number; quiet: boolean;
  /** IST days (last 14) with anything at all from them. Used by the dashboard's chart; not sent with analytics. */
  activeDays: string[];
}

async function studentStats(env: Env, inst: string, students: StudentRow[]): Promise<StudentStats[]> {
  if (!students.length) return [];
  const ids = students.map((s) => s.member_id);
  const q = ids.map(() => "?").join(",");
  const since14 = istDay(new Date(Date.now() - 13 * 86400_000));
  const rows = async <T>(sql: string, ...args: unknown[]) => (await env.DB.prepare(sql).bind(...args).all<T>()).results;
  const seen = await rows<any>(`SELECT member_id, last_seen_at FROM accounts WHERE member_id IN (${q})`, ...ids);
  const events = await rows<any>(`SELECT member_id, name, props, day, at FROM events WHERE member_id IN (${q}) AND (day >= ? OR name = 'prep_minutes')`, ...ids, since14);
  const attempts = await rows<any>(`SELECT member_id, content_id, node_id, kind, right_n, total, at FROM inst_attempts WHERE institute_id = ? AND member_id IN (${q}) ORDER BY at`, inst, ...ids);
  const messages = await rows<any>(`SELECT member_id, at FROM inst_messages WHERE institute_id = ? AND member_id IN (${q}) AND at >= ?`, inst, ...ids, since14);
  const doubts = await rows<any>(`SELECT member_id, status, created_at FROM inst_doubts WHERE institute_id = ? AND member_id IN (${q})`, inst, ...ids);
  const done = await rows<any>(`SELECT member_id, COUNT(*) AS n FROM inst_plan_done WHERE institute_id = ? AND member_id IN (${q}) GROUP BY member_id`, inst, ...ids);
  const today = istDay();
  const due = await rows<any>(`SELECT p.batch_id, p.member_id, COUNT(*) AS n FROM inst_plan_items i JOIN inst_plans p ON p.id = i.plan_id WHERE i.institute_id = ? AND i.day <= ? GROUP BY p.batch_id, p.member_id`, inst, today);
  const quietBefore = new Date(Date.now() - 7 * 86400_000).toISOString();

  return students.map((s) => {
    const mine = <T extends { member_id: string }>(list: T[]) => list.filter((r) => r.member_id === s.member_id);
    const joined = s.joined_at;
    const ev = mine(events).filter((e) => e.at >= joined);
    const at = mine(attempts);
    const days = new Set<string>([...ev.filter((e) => e.day >= since14).map((e) => e.day), ...at.filter((a) => a.at.slice(0, 10) >= since14).map((a) => istDay(new Date(a.at))), ...mine(messages).map((x) => istDay(new Date(x.at)))]);
    const focusMinutes = ev.filter((e) => e.name === "prep_minutes").reduce((n, e) => n + (Number(JSON.parse(e.props ?? "{}").minutes) || 0), 0);
    const topics: Record<string, { answered: number; right: number }> = {};
    for (const a of at) if (a.node_id) { const t = (topics[a.node_id] ??= { answered: 0, right: 0 }); t.answered += a.total; t.right += a.right_n; }
    const answered = at.reduce((n, a) => n + a.total, 0), right = at.reduce((n, a) => n + a.right_n, 0);
    const firstTest = new Map<string, any>();
    for (const a of at) if (a.kind === "test" && !firstTest.has(a.content_id)) firstTest.set(a.content_id, a);
    const lastSeen = [mine(seen)[0]?.last_seen_at, s.last_active_at, at.at(-1)?.at, mine(messages).at(-1)?.at, ev.at(-1)?.at].filter(Boolean).sort().at(-1) ?? null;
    const dueN = due.filter((d) => (d.batch_id && d.batch_id === s.batch_id) || d.member_id === s.member_id).reduce((n, d) => n + d.n, 0);
    return {
      memberId: s.member_id, name: s.display_name, batchId: s.batch_id, joinedAt: joined, lastActive: lastSeen, daysActive14: days.size, focusMinutes,
      sets: new Set(at.map((a) => a.content_id)).size, answered, right, accuracy: answered ? Math.round((right / answered) * 100) : null,
      weakTopics: Object.entries(topics).filter(([, t]) => t.answered >= 5 && t.right / t.answered < 0.6)
        .map(([id, t]) => ({ nodeId: id, topic: nodeName(id)!, answered: t.answered, pct: Math.round((t.right / t.answered) * 100) })).sort((a, b) => a.pct - b.pct),
      topics, tests: [...firstTest.values()].map((a) => ({ contentId: a.content_id, right: a.right_n, total: a.total, pct: Math.round((a.right_n / a.total) * 100) })),
      doubtsRaised: mine(doubts).length, doubtsResolved: mine(doubts).filter((d) => d.status === "resolved").length,
      planDone: mine(done)[0]?.n ?? 0, planDue: dueN, quiet: !lastSeen || lastSeen < quietBefore, activeDays: [...days].sort(),
    };
  });
}

async function analytics(env: Env, inst: string, batch: string | null) {
  const students = (await env.DB.prepare(`SELECT member_id, display_name, batch_id, joined_at, last_active_at FROM inst_members WHERE institute_id = ? AND role = 'student' AND status = 'active' ${batch ? "AND batch_id = ?" : ""} ORDER BY display_name`)
    .bind(...(batch ? [inst, batch] : [inst])).all<StudentRow>()).results;
  const stats = await studentStats(env, inst, students);
  // The batch's coverage by paper and topic, and its weak topics.
  const topics: Record<string, { answered: number; right: number; students: number }> = {};
  for (const s of stats) for (const [id, t] of Object.entries(s.topics)) { const x = (topics[id] ??= { answered: 0, right: 0, students: 0 }); x.answered += t.answered; x.right += t.right; x.students++; }
  const coverage = Object.entries(topics).map(([id, t]) => ({ nodeId: id, topic: nodeName(id), paper: paperOfNode(id), students: t.students, answered: t.answered, pct: Math.round((t.right / t.answered) * 100) }))
    .sort((a, b) => String(a.paper).localeCompare(String(b.paper)) || a.nodeId.localeCompare(b.nodeId));
  const byPaper: Record<string, { topics: number; answered: number; right: number }> = {};
  for (const [id, t] of Object.entries(topics)) { const p = (byPaper[paperOfNode(id) ?? "Other"] ??= { topics: 0, answered: 0, right: 0 }); p.topics++; p.answered += t.answered; p.right += t.right; }
  const content = (await env.DB.prepare("SELECT id, title, kind FROM inst_content WHERE institute_id = ? AND kind = 'test'").bind(inst).all<any>()).results;
  const tests = content.map((c) => {
    const scores = stats.flatMap((s) => s.tests.filter((t) => t.contentId === c.id).map((t) => t.pct)).sort((a, b) => a - b);
    return { contentId: c.id, title: c.title, took: scores.length, median: scores.length ? scores[Math.floor((scores.length - 1) / 2)] : null, low: scores[0] ?? null, high: scores.at(-1) ?? null };
  }).filter((t) => t.took);
  const doubts = await env.DB.prepare(`SELECT COUNT(*) AS raised, SUM(status = 'resolved') AS resolved, SUM(status = 'open') AS open FROM inst_doubts WHERE institute_id = ? ${batch ? "AND batch_id = ?" : ""}`)
    .bind(...(batch ? [inst, batch] : [inst])).first<any>();
  return {
    students: stats.map(({ topics: _t, activeDays: _d, ...s }) => s), coverage,
    papers: Object.entries(byPaper).map(([paper, p]) => ({ paper, topics: p.topics, answered: p.answered, pct: Math.round((p.right / p.answered) * 100) })),
    weakTopics: coverage.filter((t) => t.answered >= 5 && t.pct < 60), tests,
    doubts: { raised: doubts?.raised ?? 0, resolved: doubts?.resolved ?? 0, open: doubts?.open ?? 0 },
    quiet: stats.filter((s) => s.quiet).map((s) => ({ memberId: s.memberId, name: s.name, lastActive: s.lastActive })),
    active: stats.filter((s) => s.daysActive14 > 0).length,
  };
}

/** CSV cells: quoted, and a leading = + - @ is defused so a spreadsheet never runs it as a formula. */
const cell = (v: unknown) => { let s = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };

// --- Teachers and admins ----------------------------------------------------------------------------------------

async function adminRoute(req: Request, env: Env, sub: string, url: URL, body: any, c: Ctx): Promise<Response> {
  const { me, m, inst } = c;
  const isAdmin = atLeast(m.role, "admin");
  const needAdmin = () => (isAdmin ? null : bad("Only the institute's admins can do that.", 403));
  const GET = req.method === "GET", POST = req.method === "POST";

  if (sub === "overview" && GET) {
    const count = async (sql: string, ...a: unknown[]) => (await env.DB.prepare(sql).bind(...a).first<{ n: number }>())?.n ?? 0;
    const batches = (await env.DB.prepare("SELECT b.id, b.name, b.exam_year, b.archived_at, (SELECT COUNT(*) FROM inst_members m WHERE m.batch_id = b.id AND m.status = 'active' AND m.role = 'student') AS students FROM inst_batches b WHERE b.institute_id = ? ORDER BY b.archived_at IS NOT NULL, b.created_at").bind(inst.id).all()).results;
    return json({
      institute: branding(inst), role: m.role, you: m.display_name, batches,
      counts: {
        students: await count("SELECT COUNT(*) n FROM inst_members WHERE institute_id = ? AND role = 'student' AND status = 'active'", inst.id),
        staff: await count("SELECT COUNT(*) n FROM inst_members WHERE institute_id = ? AND role != 'student' AND status = 'active'", inst.id),
        openDoubts: await count("SELECT COUNT(*) n FROM inst_doubts WHERE institute_id = ? AND status = 'open'", inst.id),
        reported: await count("SELECT COUNT(*) n FROM inst_messages WHERE institute_id = ? AND reported_at IS NOT NULL AND hidden_at IS NULL", inst.id),
      },
    });
  }

  // The console's home: activity by day, each batch at a glance, doubts waiting longest, and what happened lately.
  if (sub === "dashboard" && GET) {
    const all = async <T = any>(sql: string, ...a: unknown[]) => (await env.DB.prepare(sql).bind(...a).all<T>()).results;
    const students = await all<StudentRow>("SELECT member_id, display_name, batch_id, joined_at, last_active_at FROM inst_members WHERE institute_id = ? AND role = 'student' AND status = 'active'", inst.id);
    const stats = await studentStats(env, inst.id, students);
    const days = Array.from({ length: 14 }, (_, i) => istDay(new Date(Date.now() - (13 - i) * 86400_000)));
    const daily = days.map((d) => ({ day: d, active: stats.filter((s) => s.activeDays.includes(d)).length }));
    const open = await all<{ batch_id: string | null; n: number }>("SELECT batch_id, COUNT(*) AS n FROM inst_doubts WHERE institute_id = ? AND status = 'open' GROUP BY batch_id", inst.id);
    const batches = (await all<any>("SELECT id, name, exam_year, archived_at FROM inst_batches WHERE institute_id = ? AND archived_at IS NULL ORDER BY created_at", inst.id)).map((b) => {
      const mine = stats.filter((s) => s.batchId === b.id);
      return { id: b.id, name: b.name, examYear: b.exam_year, students: mine.length, active14: mine.filter((s) => s.daysActive14 > 0).length,
        quiet: mine.filter((s) => s.quiet).length, openDoubts: open.find((o) => o.batch_id === b.id)?.n ?? 0 };
    });
    const waiting = (await all<any>(`SELECT d.id, d.batch_id, d.name, d.text, d.node_id, d.created_at, d.photo_key IS NOT NULL AS photo,
      (SELECT COUNT(*) FROM inst_doubt_replies r WHERE r.doubt_id = d.id AND r.role = 'ai') AS helper
      FROM inst_doubts d WHERE d.institute_id = ? AND d.status = 'open' ORDER BY d.created_at LIMIT 6`, inst.id))
      .map((d) => ({ id: d.id, batchId: d.batch_id, name: d.name, text: String(d.text).slice(0, 200), topic: nodeName(d.node_id), at: d.created_at, photo: !!d.photo, helperAnswered: d.helper > 0 }));
    // Lately: who joined, doubts asked, announcements and answers, newest first. Names only, as the institute already sees them.
    const recent = [
      ...(await all<any>("SELECT display_name AS name, role, batch_id, joined_at AS at FROM inst_members WHERE institute_id = ? AND status = 'active' ORDER BY joined_at DESC LIMIT 8", inst.id)).map((r) => ({ kind: "joined", name: r.name, role: r.role, batchId: r.batch_id, at: r.at })),
      ...(await all<any>("SELECT name, batch_id, text, created_at AS at FROM inst_doubts WHERE institute_id = ? ORDER BY created_at DESC LIMIT 8", inst.id)).map((r) => ({ kind: "doubt", name: r.name, batchId: r.batch_id, text: String(r.text).slice(0, 120), at: r.at })),
      ...(await all<any>("SELECT name, batch_id, text, at FROM inst_messages WHERE institute_id = ? AND kind = 'announcement' AND hidden_at IS NULL ORDER BY at DESC LIMIT 5", inst.id)).map((r) => ({ kind: "announcement", name: r.name, batchId: r.batch_id, text: String(r.text).slice(0, 120), at: r.at })),
      ...(await all<any>("SELECT name, at FROM inst_doubt_replies WHERE institute_id = ? AND role = 'teacher' ORDER BY at DESC LIMIT 8", inst.id)).map((r) => ({ kind: "answered", name: r.name, at: r.at })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 12);
    const has = async (sql: string) => !!(await env.DB.prepare(sql).bind(inst.id).first());
    return json({
      daily, batches, waiting, recent,
      totals: { students: stats.length, active14: stats.filter((s) => s.daysActive14 > 0).length, quiet: stats.filter((s) => s.quiet).length,
        openDoubts: open.reduce((n, o) => n + o.n, 0), oldestOpen: waiting[0]?.at ?? null },
      // Getting started: what a new institute still has to do.
      checklist: {
        batch: batches.length > 0, students: stats.length > 0,
        teacher: await has("SELECT 1 FROM inst_members WHERE institute_id = ? AND role IN ('teacher', 'admin') AND status = 'active'"),
        branding: !!(inst.brand_color || inst.logo_key),
        announcement: await has("SELECT 1 FROM inst_messages WHERE institute_id = ? AND kind = 'announcement'"),
        content: await has("SELECT 1 FROM inst_content WHERE institute_id = ? AND status = 'published'"),
        plan: await has("SELECT 1 FROM inst_plans WHERE institute_id = ?"),
      },
    });
  }

  // Batches (admins).
  if (sub === "batches" && POST) {
    const no = needAdmin(); if (no) return no;
    const name = str(body.name, 60);
    if (name.length < 2) return bad("Give the batch a name.");
    const year = body.examYear ? Number(body.examYear) : null;
    if (year !== null && !(Number.isInteger(year) && year >= 2025 && year <= 2040)) return bad("Exam year looks wrong.");
    const id = newId("b");
    await env.DB.prepare("INSERT INTO inst_batches (id, institute_id, name, exam_year, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, inst.id, name, year, now()).run();
    return json({ ok: true, id });
  }
  const bm = sub.match(/^batches\/([\w-]{4,40})$/);
  if (bm && POST) {
    const no = needAdmin(); if (no) return no;
    const b = await batchOf(env, inst.id, bm[1]);
    if (!b) return notFound("That batch");
    if (body.name) await env.DB.prepare("UPDATE inst_batches SET name = ? WHERE id = ?").bind(str(body.name, 60), b.id).run();
    if (typeof body.archived === "boolean") await env.DB.prepare("UPDATE inst_batches SET archived_at = ? WHERE id = ?").bind(body.archived ? now() : null, b.id).run();
    return json({ ok: true });
  }

  // Invite codes. Students: teachers and up (a batch is needed). Teachers: admins. Admins: the owner only.
  if (sub === "codes" && GET) {
    const rows = (await env.DB.prepare("SELECT code, role, batch_id, created_at, expires_at, max_uses, uses, revoked_at FROM inst_codes WHERE institute_id = ? AND role != 'owner' ORDER BY created_at DESC LIMIT 200").bind(inst.id).all<any>()).results;
    return json({ codes: rows.map((r) => ({ ...r, code: showCode(r.code), live: !r.revoked_at && r.uses < r.max_uses && (!r.expires_at || r.expires_at > now()) })) });
  }
  if (sub === "codes" && POST) {
    const role = String(body.role ?? "student") as Role;
    if (!["student", "teacher", "admin"].includes(role)) return bad("role is student, teacher or admin");
    if (role === "teacher" && !isAdmin) return bad("Only admins can invite teachers.", 403);
    if (role === "admin" && m.role !== "owner") return bad("Only the owner can invite admins.", 403);
    let batchId: string | null = null;
    if (role === "student") {
      const b = await batchOf(env, inst.id, body.batchId);
      if (!b || b.archived_at) return bad("Pick an open batch for this code.");
      batchId = b.id;
    }
    const maxUses = Math.min(Math.max(Number(body.maxUses) || (role === "student" ? 100 : 1), 1), 1000);
    const days = Math.min(Math.max(Number(body.days) || 30, 1), 365);
    const code = await makeCode(env, inst.id, role, batchId, me, maxUses, days);
    return json({ ok: true, code: showCode(code), role, batchId, maxUses, days });
  }
  const rv = sub.match(/^codes\/([A-Z0-9-]{8,9})\/revoke$/);
  if (rv && POST) {
    const row = await env.DB.prepare("SELECT role FROM inst_codes WHERE code = ? AND institute_id = ?").bind(cleanCode(rv[1]), inst.id).first<{ role: Role }>();
    if (!row || row.role === "owner") return notFound("That code");
    if (row.role !== "student" && !isAdmin) return bad("Only admins can cancel staff codes.", 403);
    await env.DB.prepare("UPDATE inst_codes SET revoked_at = ? WHERE code = ?").bind(now(), cleanCode(rv[1])).run();
    return json({ ok: true });
  }

  // The roster: everyone, with batch, joined and last active. Never an email or phone.
  if (sub === "roster" && GET) {
    const rows = (await env.DB.prepare(`SELECT i.member_id, i.role, i.display_name, i.batch_id, i.status, i.joined_at, i.left_at,
      MAX(COALESCE(i.last_active_at, ''), COALESCE(a.last_seen_at, '')) AS last_active FROM inst_members i LEFT JOIN accounts a ON a.member_id = i.member_id
      WHERE i.institute_id = ? ORDER BY i.status = 'active' DESC, i.role = 'student', i.display_name`).bind(inst.id).all<any>()).results;
    return json({ people: rows.map((r) => ({ memberId: r.member_id, role: r.role, name: r.display_name, batchId: r.batch_id, status: r.status, joinedAt: r.joined_at, leftAt: r.left_at, lastActive: r.last_active || null })) });
  }
  const mm = sub.match(/^members\/([\w-]{16,64})$/);
  if (mm && POST) {
    const no = needAdmin(); if (no) return no;
    if (mm[1] === me) return bad("You can't change your own place here. Ask another admin or the owner.", 403);
    const t = await env.DB.prepare("SELECT * FROM inst_members WHERE institute_id = ? AND member_id = ? AND status = 'active'").bind(inst.id, mm[1]).first<Membership>();
    if (!t) return notFound("That person");
    if (t.role === "owner") return bad("Nobody in the institute can change the owner.", 403);
    if (t.role === "admin" && m.role !== "owner") return bad("Only the owner can change an admin.", 403);
    if (body.remove === true) { await detach(env, inst.id, t.member_id, "removed"); return json({ ok: true, removed: true }); }
    const role = body.role !== undefined ? (String(body.role) as Role) : t.role;
    if (!["student", "teacher", "admin"].includes(role)) return bad("role is student, teacher or admin");
    if (role === "admin" && t.role !== "admin" && m.role !== "owner") return bad("Only the owner can make someone an admin.", 403);
    let batchId = t.batch_id;
    if (body.batchId !== undefined) {
      if (role !== "student") return bad("Only students are in a batch.");
      const b = await batchOf(env, inst.id, body.batchId);
      if (!b || b.archived_at) return bad("Pick an open batch.");
      batchId = b.id;
    }
    if (role === "student" && !batchId) return bad("Pick a batch for them as a student.");
    await env.DB.prepare("UPDATE inst_members SET role = ?, batch_id = ? WHERE institute_id = ? AND member_id = ?").bind(role, role === "student" ? batchId : null, inst.id, t.member_id).run();
    return json({ ok: true, role, batchId: role === "student" ? batchId : null });
  }

  // Branding (admins).
  if (sub === "branding" && POST) {
    const no = needAdmin(); if (no) return no;
    const name = body.name !== undefined ? str(body.name, 60) : inst.name;
    if (name.length < 2) return bad("The name needs at least 2 letters.");
    const color = body.color === undefined ? inst.brand_color : body.color === null || body.color === "" ? null : String(body.color);
    if (color && !HEX.test(color)) return bad("Colour is a hex value like #1F5FAD.");
    const city = body.city !== undefined ? str(body.city, 60) || null : inst.city;
    const ai = body.aiFirstAnswer === undefined ? inst.ai_first_answer : body.aiFirstAnswer ? 1 : 0;
    await env.DB.prepare("UPDATE institutes SET name = ?, brand_color = ?, city = ?, ai_first_answer = ? WHERE id = ?").bind(name, color, city, ai, inst.id).run();
    return json({ ok: true, institute: branding({ ...inst, name, brand_color: color, city, ai_first_answer: ai }) });
  }
  if (sub === "logo" && POST) {
    const no = needAdmin(); if (no) return no;
    if (!env.MEDIA) return bad("Logos aren't set up on this server.", 503);
    const mime = String(body.mime ?? "");
    if (!["image/png", "image/jpeg"].includes(mime) || typeof body.data !== "string") return bad("A PNG or JPEG logo, please.");
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(body.data), (ch) => ch.charCodeAt(0)); } catch { return bad("The logo didn't come through. Try again."); }
    if (bytes.length > 200_000) return bad("That logo is too big. Under 200 KB, please.", 413);
    const png = bytes[0] === 0x89 && bytes[1] === 0x50, jpg = bytes[0] === 0xff && bytes[1] === 0xd8;
    if ((mime === "image/png" && !png) || (mime === "image/jpeg" && !jpg)) return bad("That file isn't a PNG or JPEG.");
    const key = `inst-logos/${inst.id}.${png ? "png" : "jpg"}`;
    if (inst.logo_key && inst.logo_key !== key) await env.MEDIA.delete(inst.logo_key).catch(() => {});
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
    await env.DB.prepare("UPDATE institutes SET logo_key = ? WHERE id = ?").bind(key, inst.id).run();
    return json({ ok: true, logo: `/inst/logo/${inst.id}` });
  }

  // Chat moderation: hide or show a message; the reported list.
  if (sub === "reported" && GET) {
    const rows = (await env.DB.prepare("SELECT id, batch_id, name, text, at, report_reason, reported_at, hidden_at FROM inst_messages WHERE institute_id = ? AND reported_at IS NOT NULL ORDER BY reported_at DESC LIMIT 100").bind(inst.id).all()).results;
    return json({ messages: rows });
  }
  const hm = sub.match(/^messages\/([\w-]{4,40})\/hide$/);
  if (hm && POST) {
    const msg = await env.DB.prepare("SELECT id FROM inst_messages WHERE id = ? AND institute_id = ?").bind(hm[1], inst.id).first();
    if (!msg) return notFound("That message");
    await env.DB.prepare("UPDATE inst_messages SET hidden_at = ?, hidden_by = ? WHERE id = ?").bind(body.hidden === false ? null : now(), body.hidden === false ? null : me, hm[1]).run();
    return json({ ok: true });
  }

  // Content: notes and question sets, draft or published (teachers and up).
  if (sub === "content" && GET) {
    const rows = (await env.DB.prepare("SELECT id, batch_id, kind, title, paper, node_id, json, status, updated_at FROM inst_content WHERE institute_id = ? ORDER BY updated_at DESC LIMIT 500").bind(inst.id).all<any>()).results;
    return json({ items: rows.map((r) => ({ id: r.id, batchId: r.batch_id, kind: r.kind, title: r.title, paper: r.paper, nodeId: r.node_id, topic: nodeName(r.node_id), status: r.status, updatedAt: r.updated_at, data: JSON.parse(r.json) })) });
  }
  const ce = sub.match(/^content(?:\/([\w-]{4,40}))?$/);
  if (ce && POST) {
    const existing = ce[1] ? await env.DB.prepare("SELECT * FROM inst_content WHERE id = ? AND institute_id = ?").bind(ce[1], inst.id).first<any>() : null;
    if (ce[1] && !existing) return notFound("That piece");
    if (existing && body.delete === true) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM inst_content WHERE id = ?").bind(existing.id),
        env.DB.prepare("DELETE FROM inst_attempts WHERE content_id = ? AND institute_id = ?").bind(existing.id, inst.id),
      ]);
      return json({ ok: true, deleted: true });
    }
    const kind = existing?.kind ?? String(body.kind ?? "");
    if (!["note", "practice", "test"].includes(kind)) return bad("kind is note, practice or test");
    let data = existing ? JSON.parse(existing.json) : null, packTitle: string | undefined;
    if (body.data !== undefined || body.pack !== undefined || !existing) {
      const cleaned = cleanContent(kind, body.pack ? { pack: body.pack } : body.data);
      if ("error" in cleaned) return bad(cleaned.error);
      data = cleaned.data; packTitle = cleaned.title;
    }
    const title = str(body.title, 160) || existing?.title || packTitle || "";
    if (!title) return bad("Give it a title.");
    const node = body.nodeId !== undefined ? (body.nodeId ? String(body.nodeId) : null) : existing?.node_id ?? null;
    if (node && !NODE_IDS.has(node)) return bad("That topic isn't in the syllabus list.");
    let batch = body.batchId !== undefined ? (body.batchId ? String(body.batchId) : null) : existing?.batch_id ?? null;
    if (batch && !(await batchOf(env, inst.id, batch))) return notFound("That batch");
    const status = body.status !== undefined ? String(body.status) : existing?.status ?? "draft";
    if (!["draft", "published"].includes(status)) return bad("status is draft or published");
    const id = existing?.id ?? newId("ic"), t = now();
    await env.DB.prepare(`INSERT INTO inst_content (id, institute_id, batch_id, kind, title, paper, node_id, json, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET batch_id = excluded.batch_id, title = excluded.title, paper = excluded.paper, node_id = excluded.node_id, json = excluded.json, status = excluded.status, updated_at = excluded.updated_at`)
      .bind(id, inst.id, batch, kind, title, paperOfNode(node), node, JSON.stringify(data), status, me, t, t).run();
    return json({ ok: true, id, status });
  }

  // Study plans for a batch or one student (teachers and up).
  if (sub === "plans" && GET) {
    const plans = (await env.DB.prepare("SELECT id, batch_id, member_id, title, starts_on, updated_at FROM inst_plans WHERE institute_id = ? ORDER BY updated_at DESC").bind(inst.id).all<any>()).results;
    const items = plans.length ? (await env.DB.prepare(`SELECT i.*, (SELECT COUNT(*) FROM inst_plan_done d WHERE d.item_id = i.id) AS done FROM inst_plan_items i WHERE i.institute_id = ? ORDER BY i.day, i.sort`).bind(inst.id).all<any>()).results : [];
    return json({ plans: plans.map((p) => ({ id: p.id, batchId: p.batch_id, memberId: p.member_id, title: p.title, startsOn: p.starts_on, updatedAt: p.updated_at,
      items: items.filter((i) => i.plan_id === p.id).map((i) => ({ id: i.id, day: i.day, kind: i.kind, nodeId: i.node_id, topic: nodeName(i.node_id), contentId: i.content_id, title: i.title, note: i.note, done: i.done })) })) });
  }
  const pm = sub.match(/^plans(?:\/([\w-]{4,40}))?$/);
  if (pm && POST) {
    const existing = pm[1] ? await env.DB.prepare("SELECT * FROM inst_plans WHERE id = ? AND institute_id = ?").bind(pm[1], inst.id).first<any>() : null;
    if (pm[1] && !existing) return notFound("That plan");
    if (existing && body.delete === true) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM inst_plan_done WHERE item_id IN (SELECT id FROM inst_plan_items WHERE plan_id = ?)").bind(existing.id),
        env.DB.prepare("DELETE FROM inst_plan_items WHERE plan_id = ?").bind(existing.id),
        env.DB.prepare("DELETE FROM inst_plans WHERE id = ?").bind(existing.id),
      ]);
      return json({ ok: true, deleted: true });
    }
    const title = str(body.title, 120) || existing?.title;
    if (!title) return bad("Give the plan a title.");
    const startsOn = body.startsOn ?? existing?.starts_on ?? istDay();
    if (!DAY_RE.test(startsOn)) return bad("Start date is YYYY-MM-DD.");
    let batchId = existing?.batch_id ?? null, memberId = existing?.member_id ?? null;
    if (!existing) {
      if (body.batchId) { const b = await batchOf(env, inst.id, body.batchId); if (!b) return notFound("That batch"); batchId = b.id; }
      else if (body.memberId) {
        const s = await env.DB.prepare("SELECT member_id FROM inst_members WHERE institute_id = ? AND member_id = ? AND role = 'student' AND status = 'active'").bind(inst.id, String(body.memberId)).first<{ member_id: string }>();
        if (!s) return notFound("That student"); memberId = s.member_id;
      } else return bad("A plan is for a batch or one student.");
    }
    const id = existing?.id ?? newId("p"), t = now();
    const stmts = [env.DB.prepare(`INSERT INTO inst_plans (id, institute_id, batch_id, member_id, title, starts_on, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = excluded.title, starts_on = excluded.starts_on, updated_at = excluded.updated_at`).bind(id, inst.id, batchId, memberId, title, startsOn, me, t, t)];
    if (Array.isArray(body.items)) {
      if (body.items.length > 300) return bad("At most 300 items in a plan.");
      const ids = new Set((await env.DB.prepare("SELECT id FROM inst_content WHERE institute_id = ?").bind(inst.id).all<{ id: string }>()).results.map((r) => r.id));
      const keep = new Set<string>();
      const rows = [];
      for (const [n, raw] of body.items.entries()) {
        const kind = String(raw?.kind ?? "");
        if (!["topic", "practice", "test", "note", "task"].includes(kind)) return bad(`Item ${n + 1}: kind is topic, practice, test, note or task.`);
        if (!DAY_RE.test(String(raw.day ?? ""))) return bad(`Item ${n + 1}: day is YYYY-MM-DD.`);
        const node = raw.nodeId ? String(raw.nodeId) : null;
        if (node && !NODE_IDS.has(node)) return bad(`Item ${n + 1}: that topic isn't in the syllabus list.`);
        if (kind === "topic" && !node) return bad(`Item ${n + 1}: pick a topic.`);
        const content = raw.contentId ? String(raw.contentId) : null;
        if (content && !ids.has(content)) return bad(`Item ${n + 1}: that piece isn't this institute's.`);
        if (["practice", "test", "note"].includes(kind) && !content) return bad(`Item ${n + 1}: pick one of your notes or question sets.`);
        const title = str(raw.title, 160) || (node ? nodeName(node)! : "");
        if (!title) return bad(`Item ${n + 1}: give it a title.`);
        // Items keep their id when edited, so a student's tick stays with them.
        const itemId = typeof raw.id === "string" && /^[\w-]{4,40}$/.test(raw.id) ? raw.id : newId("pi");
        keep.add(itemId);
        rows.push(env.DB.prepare(`INSERT INTO inst_plan_items (id, plan_id, institute_id, day, kind, node_id, content_id, title, note, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET day = excluded.day, kind = excluded.kind, node_id = excluded.node_id, content_id = excluded.content_id, title = excluded.title, note = excluded.note, sort = excluded.sort
          WHERE inst_plan_items.plan_id = excluded.plan_id`).bind(itemId, id, inst.id, raw.day, kind, node, content, title, str(raw.note, 400) || null, n));
      }
      const old = (await env.DB.prepare("SELECT id FROM inst_plan_items WHERE plan_id = ?").bind(id).all<{ id: string }>()).results.filter((r) => !keep.has(r.id));
      for (const o of old) stmts.push(env.DB.prepare("DELETE FROM inst_plan_done WHERE item_id = ?").bind(o.id), env.DB.prepare("DELETE FROM inst_plan_items WHERE id = ?").bind(o.id));
      stmts.push(...rows);
    }
    await env.DB.batch(stmts);
    return json({ ok: true, id });
  }

  // Analytics, and the same as CSV.
  if ((sub === "analytics" || sub === "analytics.csv") && GET) {
    const batch = url.searchParams.get("batch") || null;
    if (batch && !(await batchOf(env, inst.id, batch))) return notFound("That batch");
    const a = await analytics(env, inst.id, batch);
    if (sub === "analytics") return json(a);
    const batches = new Map((await env.DB.prepare("SELECT id, name FROM inst_batches WHERE institute_id = ?").bind(inst.id).all<{ id: string; name: string }>()).results.map((b) => [b.id, b.name]));
    const head = ["Student", "Batch", "Joined", "Last active", "Days active (last 14)", "Focus minutes", "Question sets", "Questions answered", "Accuracy %", "Weak topics", "Tests (first try %)", "Doubts raised", "Doubts resolved", "Plan items done", "Plan items due", "Gone quiet"];
    const lines = [head.map(cell).join(",")];
    for (const s of a.students) lines.push([s.name, batches.get(s.batchId ?? "") ?? "", s.joinedAt.slice(0, 10), s.lastActive?.slice(0, 10) ?? "never", s.daysActive14, s.focusMinutes, s.sets, s.answered, s.accuracy ?? "",
      s.weakTopics.map((w) => `${w.topic} (${w.pct}%)`).join("; "), s.tests.map((t) => t.pct).join("; "), s.doubtsRaised, s.doubtsResolved, s.planDone, s.planDue, s.quiet ? "yes" : "no"].map(cell).join(","));
    return new Response(lines.join("\r\n") + "\r\n", { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${inst.id}-${batch ?? "all"}-${istDay()}.csv"`, "cache-control": "no-store" } });
  }
  return bad("Not found", 404);
}

// --- Aspiran staff: create and pause institutes ------------------------------------------------------------------

async function staffRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  const s = await requireStaff(req, env, "staff");
  if (s instanceof Response) return s;
  await ensureInstSchema(env);
  if (path === "/admin/api/institutes" && req.method === "GET") {
    const rows = (await env.DB.prepare(`SELECT i.id, i.name, i.city, i.status, i.created_at,
      (SELECT COUNT(*) FROM inst_members m WHERE m.institute_id = i.id AND m.status = 'active' AND m.role = 'student') AS students,
      (SELECT COUNT(*) FROM inst_members m WHERE m.institute_id = i.id AND m.status = 'active' AND m.role != 'student') AS staff,
      (SELECT COUNT(*) FROM inst_members m WHERE m.institute_id = i.id AND m.status = 'active' AND m.role = 'owner') AS owners
      FROM institutes i ORDER BY i.created_at DESC`).all()).results;
    return json({ institutes: rows, flagOn: !!(await flags(env)).institutes });
  }
  if (path === "/admin/api/institutes" && req.method === "POST") {
    const b = await req.json<any>().catch(() => ({}));
    const name = str(b.name, 60);
    if (name.length < 2) return bad("The institute needs a name.");
    const id = newId("inst");
    await env.DB.prepare("INSERT INTO institutes (id, name, city, created_at, created_by) VALUES (?, ?, ?, ?, ?)").bind(id, name, str(b.city, 60) || null, now(), s.id).run();
    const code = await makeCode(env, id, "owner", null, "aspiran:" + s.id, 1, 30);
    await audit(env, s, "institute.create", id, { name });
    return json({ ok: true, id, ownerCode: showCode(code) });
  }
  const sm = path.match(/^\/admin\/api\/institutes\/([\w-]{6,40})\/(status|owner-code)$/);
  if (sm && req.method === "POST") {
    const inst = await getInstitute(env, sm[1]);
    if (!inst) return bad("No such institute", 404);
    if (sm[2] === "owner-code") {
      const code = await makeCode(env, inst.id, "owner", null, "aspiran:" + s.id, 1, 30);
      await audit(env, s, "institute.owner_code", inst.id);
      return json({ ok: true, ownerCode: showCode(code) });
    }
    const b = await req.json<any>().catch(() => ({}));
    const status = String(b.status);
    if (!["active", "paused"].includes(status)) return bad("status is active or paused");
    await env.DB.prepare("UPDATE institutes SET status = ? WHERE id = ?").bind(status, inst.id).run();
    await audit(env, s, "institute.status", inst.id, { status });
    return json({ ok: true, status });
  }
  return bad("Not found", 404);
}
