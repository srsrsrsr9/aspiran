import BANK from "../../android/app/src/main/assets/prelims_bank.json";
import { COMMONS_ROOMS } from "./commons";
import { ritualText } from "./desk";
import { type Env, bad, istDay, istNow, json, newId } from "./shared";
import { activeResult, resultDays } from "./results";
import { bump, ensureSchema, flags, getSetting } from "./staff";
import { logEvent } from "./metrics";
import { OPEN_ROOMS, podMode, roomCounts, roomPost, sweepPhotos } from "./rooms";
import { ANSWER_DAYS } from "./friends";

/**
 * Community-first pods (spec §3): honest states, Monday batch matching, merging forming pods, the quiet-pod
 * rule, Chotu's host schedule, the Commons, the community season, and the four matching fields.
 *
 * Chotu is a host and the pod friends (friends.ts) are labelled AI; neither is ever counted. "humans" below is always people.
 * Until the sign-up threshold, the open rooms (rooms.ts) are the pods; they get the same host schedule and friends.
 */

export const POD_CAPACITY = 8;
const DAY = 86400_000;

// --- The four matching fields: the only profile fields the server ever holds ----------------------

const STAGES = ["starting", "prelims", "mains", "interview", "repeat"];
const ATTEMPT_BANDS = ["1", "2-3", "4+"];
const TIME_BANDS = ["morning", "afternoon", "evening", "night"];
const LANGS = ["english", "hindi", "telugu", "marathi", "tamil", "bengali", "kannada", "malayalam", "gujarati", "odia", "en", "hi", "te", "mr", "ta", "bn", "kn", "ml", "gu", "or"];
const LANG_NAME: Record<string, string> = { en: "english", hi: "hindi", te: "telugu", mr: "marathi", ta: "tamil", bn: "bengali", kn: "kannada", ml: "malayalam", gu: "gujarati", or: "odia" };

export interface MatchFields { stage: string | null; attempt_band: string | null; lang: string | null; time_band: string | null }

/** Picks the four fields out of anything a client sends, and drops everything else. Unknown values become null. */
export function matchFields(body: any): MatchFields {
  const pick = (v: unknown, allowed: string[]) => {
    const s = String(v ?? "").toLowerCase().trim();
    return allowed.includes(s) ? s : null;
  };
  const lang = pick(body?.lang ?? body?.language, LANGS);
  return {
    stage: pick(body?.stage, STAGES) ?? (typeof body?.stage === "string" && /^[\w-]{1,40}$/.test(body.stage) ? body.stage.toLowerCase() : null),
    attempt_band: pick(body?.attempt_band ?? body?.attempt, ATTEMPT_BANDS),
    lang: lang ? LANG_NAME[lang] ?? lang : null,
    time_band: pick(body?.time_band, TIME_BANDS),
  };
}

/** Same stage, attempt band, language and time of day. A field nobody gave is "any". */
export const bucketOf = (f: MatchFields) => [f.stage, f.attempt_band, f.lang, f.time_band].map((v) => String(v ?? "any")).join("-").replace(/[^\w+-]/g, "");

// --- States -------------------------------------------------------------------------------------------

export type PodState = "forming" | "small" | "full" | "quiet" | "empty" | "merged";

/** Forming 1-2 people, Small 3-5, Full 6-8; Quiet when no person has posted in 5 days (and the pod is older than that). */
export function podState(p: { size: number; last_human_at?: string | null; created_at: string; merged_into?: string | null }, now = Date.now()): PodState {
  if (p.merged_into) return "merged";
  if (p.size <= 0) return "empty";
  const last = Date.parse(p.last_human_at ?? "") || 0;
  const age = now - Date.parse(p.created_at);
  if (age > 5 * DAY && now - last > 5 * DAY) return "quiet";
  return p.size <= 2 ? "forming" : p.size <= 5 ? "small" : "full";
}
/** The size-only state, for the header ("Forming · 2 of 8"); quiet is a separate note. */
export const sizeState = (size: number): "forming" | "small" | "full" => (size <= 2 ? "forming" : size <= 5 ? "small" : "full");

/** The next Monday on or after the given IST day, when the batch match runs. */
export function nextMonday(fromDay = istDay()): string {
  const d = new Date(fromDay + "T00:00:00Z");
  const add = (8 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

interface PodRow { id: string; bucket: string; size: number; created_at: string; lead_member: string | null; state: string | null; opens_on: string | null; last_human_at: string | null; quiet_asked_at: string | null; merged_into: string | null; closest?: number | null }

export function podSummary(p: PodRow, now = Date.now()) {
  const state = podState(p, now);
  return {
    podId: p.id, state, sizeState: sizeState(p.size), humans: p.size, capacity: POD_CAPACITY,
    // A forming pod shows the Monday its batch match runs; honest copy, never a promise of how many will come.
    opensOn: p.size <= 2 ? (p.opens_on && p.opens_on > istDay(new Date(now)) ? p.opens_on : nextMonday(istDay(new Date(now)))) : null,
    hasLead: !!p.lead_member,
    // Day 1: in the closest pod (same stage and language) because their exact group had nobody yet.
    closest: !!p.closest,
  };
}

const podStub = (env: Env, id: string) => env.POD.get(env.POD.idFromName(id));
export const podPost = (env: Env, id: string, what: string, body?: unknown) =>
  podStub(env, id).fetch(`https://pod/${what}?pod=${encodeURIComponent(id)}`, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

// --- Joining, leaving, moving -------------------------------------------------------------------------

/**
 * The closest active pod with room for someone whose exact bucket has none: same stage and language (a field nobody
 * gave matches only others who didn't give it either), then most alike in study time and attempts, then the biggest.
 * Quiet pods are skipped. Day 1 of the teaching plan: nobody starts alone in an empty pod.
 */
async function closestPod(env: Env, f: MatchFields, avoid: string, now = Date.now()): Promise<{ id: string } | null> {
  const active = new Date(now - 5 * DAY).toISOString();
  return env.DB.prepare(
    `SELECT p.id FROM pods p JOIN members m ON m.pod_id = p.id
     WHERE p.merged_into IS NULL AND p.size < ? AND p.id != ? AND (p.last_human_at > ? OR p.created_at > ?)
       AND m.stage IS ? AND m.lang IS ?
     GROUP BY p.id ORDER BY SUM(m.time_band IS ?) DESC, SUM(m.attempt_band IS ?) DESC, p.size DESC, p.created_at LIMIT 1`,
  ).bind(POD_CAPACITY, avoid, active, active, f.stage, f.lang, f.time_band, f.attempt_band).first<{ id: string }>();
}

/** Puts a member in an open pod of their bucket, else the closest active pod, else starts a forming one. */
export async function joinPod(env: Env, memberId: string, f: MatchFields, avoid?: string): Promise<{ podId: string; closest: boolean }> {
  const bucket = bucketOf(f);
  let pod = await env.DB.prepare(
    "SELECT id FROM pods WHERE bucket = ? AND size < ? AND merged_into IS NULL AND id != ? ORDER BY size DESC, created_at LIMIT 1",
  ).bind(bucket, POD_CAPACITY, avoid ?? "").first<{ id: string }>();
  const now = new Date().toISOString();
  const near = pod ? null : await closestPod(env, f, avoid ?? "");
  if (near) pod = near;
  if (!pod) {
    pod = { id: newId("pod_") };
    await env.DB.prepare("INSERT INTO pods (id, bucket, size, created_at, state, opens_on) VALUES (?, ?, 0, ?, 'forming', ?)")
      .bind(pod.id, bucket, now, nextMonday()).run();
  }
  await env.DB.batch([
    env.DB.prepare("INSERT INTO members (member_id, pod_id, joined_at, stage, attempt_band, lang, time_band, closest) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(memberId, pod.id, now, f.stage, f.attempt_band, f.lang, f.time_band, near ? 1 : null),
    env.DB.prepare("UPDATE pods SET size = size + 1 WHERE id = ?").bind(pod.id),
  ]);
  await setSizeState(env, pod.id);
  if (near) await podPost(env, pod.id, "system", { text: "Someone new joined today. A quick hello helps." }).catch(() => {});
  return { podId: pod.id, closest: !!near };
}

/**
 * Monday's batch match, after the merge: anyone who joined the closest pod is asked privately whether to move once
 * their exact group has a pod of 3 or more with room. Asked once; nobody moves unless they choose to.
 */
export async function offerExactPods(env: Env) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT member_id, pod_id, stage, attempt_band, lang, time_band FROM members WHERE closest = 1").all<any>();
  let offered = 0;
  for (const m of results) {
    const exact = await env.DB.prepare("SELECT id FROM pods WHERE bucket = ? AND size >= 3 AND size < ? AND merged_into IS NULL AND id != ? LIMIT 1")
      .bind(bucketOf(m), POD_CAPACITY, m.pod_id).first<{ id: string }>();
    if (!exact) continue;
    await podPost(env, m.pod_id, "stay-or-move", { member: m.member_id, text: "A pod for your exact stage, attempts and study time has formed. You can move there, or stay here with the people you know now. Nobody moves unless they choose to." }).catch(() => {});
    await env.DB.prepare("UPDATE members SET closest = 0 WHERE member_id = ?").bind(m.member_id).run();
    offered++;
  }
  return offered;
}

async function setSizeState(env: Env, podId: string) {
  await env.DB.prepare("UPDATE pods SET state = CASE WHEN size <= 0 THEN 'empty' WHEN size <= 2 THEN 'forming' WHEN size <= 5 THEN 'small' ELSE 'full' END WHERE id = ? AND merged_into IS NULL").bind(podId).run();
}

export async function leavePod(env: Env, memberId: string) {
  const row = await env.DB.prepare("SELECT pod_id FROM members WHERE member_id = ?").bind(memberId).first<{ pod_id: string }>();
  if (!row) return;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM members WHERE member_id = ?").bind(memberId),
    env.DB.prepare("UPDATE pods SET size = MAX(size - 1, 0), lead_member = CASE WHEN lead_member = ? THEN NULL ELSE lead_member END WHERE id = ?").bind(memberId, row.pod_id),
  ]);
  await setSizeState(env, row.pod_id);
}

/** Moves members of `from` into `to` (same bucket), and tells both pods. Used by the merge and the Monday match. */
async function mergeInto(env: Env, from: PodRow, to: PodRow, note = "Your forming pod joined another one with the same stage and language, so you have more company. Open Pod to continue there. Your old messages stay here.") {
  await env.DB.batch([
    env.DB.prepare("UPDATE members SET pod_id = ? WHERE pod_id = ?").bind(to.id, from.id),
    env.DB.prepare("UPDATE pods SET size = size + ? WHERE id = ?").bind(from.size, to.id),
    env.DB.prepare("UPDATE pods SET size = 0, state = 'merged', merged_into = ? WHERE id = ?").bind(to.id, from.id),
  ]);
  await setSizeState(env, to.id);
  await podPost(env, from.id, "moved", { to: to.id, text: note }).catch(() => {});
  await podPost(env, to.id, "system", { text: `${from.size === 1 ? "One person" : `${from.size} people`} from another pod with the same stage and language joined today. A quick hello helps.` }).catch(() => {});
  await bump(env, "pod_merges");
}

/**
 * Merges forming pods (1-2 people) in the same bucket. Daily with minAgeDays = 7 (spec: after 7 days),
 * and on Monday's batch match with minAgeDays = 0, when forming pods may also join a small pod with room.
 * Nobody in a small or full pod is ever moved; only forming pods are, and they were told when they joined.
 */
export async function mergeForming(env: Env, { minAgeDays, intoSmall, now = Date.now() }: { minAgeDays: number; intoSmall: boolean; now?: number }) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM pods WHERE merged_into IS NULL AND size > 0 AND size < ? ORDER BY bucket, size DESC, created_at").bind(POD_CAPACITY).all<PodRow>();
  const byBucket = new Map<string, PodRow[]>();
  for (const p of results) byBucket.set(p.bucket, [...(byBucket.get(p.bucket) ?? []), p]);
  let merged = 0;
  for (const pods of byBucket.values()) {
    const old = (p: PodRow) => now - Date.parse(p.created_at) >= minAgeDays * DAY;
    const forming = pods.filter((p) => p.size <= 2);
    if (!forming.some(old)) continue;
    // Targets: small pods with room first (Monday only), then the biggest forming pods.
    const targets = [...(intoSmall ? pods.filter((p) => p.size >= 3) : []), ...forming];
    const moved = new Set<string>();
    for (const from of forming.slice().reverse()) {
      if (moved.has(from.id) || !old(from)) continue;
      const to = targets.find((t) => t.id !== from.id && !moved.has(t.id) && t.size + from.size <= POD_CAPACITY && (t.size > from.size || (t.size === from.size && t.created_at < from.created_at)));
      if (!to) continue;
      await mergeInto(env, from, to);
      to.size += from.size;
      moved.add(from.id);
      merged++;
    }
  }
  return merged;
}

/** Recomputes every pod's state, and once a pod has been quiet for 14 days, asks each member privately to stay or move. */
export async function refreshStates(env: Env, now = Date.now()) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM pods WHERE merged_into IS NULL AND size > 0").all<PodRow>();
  let asked = 0;
  for (const p of results) {
    const state = podState(p, now);
    await env.DB.prepare("UPDATE pods SET state = ? WHERE id = ?").bind(state, p.id).run();
    const last = Date.parse(p.last_human_at ?? p.created_at) || 0;
    if (state === "quiet" && now - last >= 14 * DAY && (!p.quiet_asked_at || Date.parse(p.quiet_asked_at) < last)) {
      await podPost(env, p.id, "stay-or-move", {}).catch(() => {});
      await env.DB.prepare("UPDATE pods SET quiet_asked_at = ? WHERE id = ?").bind(new Date(now).toISOString(), p.id).run();
      asked++;
    }
  }
  return { pods: results.length, asked };
}

// --- Pods v2: thin pods join up (teaching plan §8) ----------------------------------------------------------
// Monday: a pod where fewer than 3 people posted in the week is paired with another thin pod of the same stage and
// language (same bucket first), and the pair is proposed to Ops. Nothing happens until Ops approves. Then both pods are
// told, the merge waits 3 days, and any member can choose to stay where they are. Daily: approved merges whose day has
// come move everyone who didn't opt out. Nobody is ever told which pod was "quieter".

interface MergeRow { id: string; from_pod: string; to_pod: string; status: string; reason: string | null; created_at: string; decided_at: string | null; merge_on: string | null }
const sameStageLang = (a: string, b: string) => { const x = a.split("-"), y = b.split("-"); return x[0] === y[0] && x[2] === y[2]; };

export async function proposeMerges(env: Env, now = Date.now()) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM pods WHERE merged_into IS NULL AND size >= 3 AND created_at < ? ORDER BY bucket, size")
    .bind(new Date(now - 14 * DAY).toISOString()).all<PodRow>();
  const open = new Set((await env.DB.prepare("SELECT from_pod, to_pod FROM pod_merges WHERE status IN ('proposed', 'approved')").all<{ from_pod: string; to_pod: string }>())
    .results.flatMap((r) => [r.from_pod, r.to_pod]));
  const thin: (PodRow & { posters: number })[] = [];
  for (const p of results) {
    if (open.has(p.id)) continue;
    const r = await podPost(env, p.id, "stats", { days: 7 }).then((x) => x.json<{ posters14d: number }>()).catch(() => null);
    if (r && r.posters14d < 3) thin.push({ ...p, posters: r.posters14d });
  }
  let proposed = 0;
  const used = new Set<string>();
  for (const from of thin) {
    if (used.has(from.id)) continue;
    const fits = (t: PodRow) => t.id !== from.id && !used.has(t.id) && t.size + from.size <= POD_CAPACITY;
    // The bigger pod is the one people move into, so fewer people move.
    const to = thin.find((t) => fits(t) && t.bucket === from.bucket) ?? thin.find((t) => fits(t) && sameStageLang(t.bucket, from.bucket));
    if (!to) continue;
    const [a, b] = to.size >= from.size ? [from, to] : [to, from];
    await env.DB.prepare("INSERT INTO pod_merges (id, from_pod, to_pod, status, reason, created_at) VALUES (?, ?, ?, 'proposed', ?, ?)")
      .bind(newId("mg"), a.id, b.id, `${a.posters} and ${b.posters} people posted last week; ${a.size} + ${b.size} members${a.bucket === b.bucket ? ", same bucket" : ", same stage and language"}`, new Date(now).toISOString()).run();
    used.add(a.id); used.add(b.id);
    proposed++;
  }
  return { thin: thin.length, proposed };
}

const MERGE_NOTE = (on: string) => `Your pod and another pod with the same stage and language have both been quiet this week, so on ${on} they'll become one pod with more people around. Your old messages stay where they are. If you'd rather stay as you are, choose "Keep me here" in Pod.`;

/** Ops approves (merge in 3 days, both pods told) or drops a proposal. */
export async function decideMerge(env: Env, id: string, approve: boolean, by: string, now = Date.now()) {
  await ensureSchema(env);
  const m = await env.DB.prepare("SELECT * FROM pod_merges WHERE id = ? AND status = 'proposed'").bind(id).first<MergeRow>();
  if (!m) return null;
  const on = istDay(new Date(now + 3 * DAY));
  await env.DB.prepare("UPDATE pod_merges SET status = ?, decided_at = ?, decided_by = ?, merge_on = ? WHERE id = ?")
    .bind(approve ? "approved" : "dropped", new Date(now).toISOString(), by, approve ? on : null, id).run();
  if (approve) for (const pod of [m.from_pod, m.to_pod]) await podPost(env, pod, "system", { text: MERGE_NOTE(on) }).catch(() => {});
  return { id, status: approve ? "approved" : "dropped", mergeOn: approve ? on : null };
}

/** A member's open merge, for Pod: the day it happens and whether they chose to stay. */
export async function mergeFor(env: Env, memberId: string, podId: string) {
  const m = await env.DB.prepare("SELECT * FROM pod_merges WHERE status = 'approved' AND (from_pod = ? OR to_pod = ?)").bind(podId, podId).first<MergeRow>().catch(() => null);
  if (!m) return null;
  const out = await env.DB.prepare("SELECT 1 FROM pod_merge_optouts WHERE merge_id = ? AND member_id = ?").bind(m.id, memberId).first();
  return { id: m.id, on: m.merge_on, stay: !!out };
}

/** Daily: merges whose day has come. Members of the smaller pod who chose to stay are left where they are. */
export async function runMerges(env: Env, now = Date.now()) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM pod_merges WHERE status = 'approved' AND merge_on <= ?").bind(istDay(new Date(now))).all<MergeRow>();
  let done = 0;
  for (const m of results) {
    const to = await env.DB.prepare("SELECT * FROM pods WHERE id = ? AND merged_into IS NULL").bind(m.to_pod).first<PodRow>();
    const from = await env.DB.prepare("SELECT * FROM pods WHERE id = ? AND merged_into IS NULL").bind(m.from_pod).first<PodRow>();
    const stay = new Set((await env.DB.prepare("SELECT member_id FROM pod_merge_optouts WHERE merge_id = ?").bind(m.id).all<{ member_id: string }>()).results.map((r) => r.member_id));
    if (to && from) {
      const movers = (await env.DB.prepare("SELECT member_id FROM members WHERE pod_id = ?").bind(from.id).all<{ member_id: string }>()).results
        .map((r) => r.member_id).filter((id) => !stay.has(id)).slice(0, Math.max(POD_CAPACITY - to.size, 0));
      if (movers.length === from.size) await mergeInto(env, from, to, "Your pod joined another one with the same stage and language, so there are more people around. Open Pod to continue there. Your old messages stay here.");
      else if (movers.length) {
        for (const id of movers) await env.DB.prepare("UPDATE members SET pod_id = ? WHERE member_id = ?").bind(to.id, id).run();
        await env.DB.batch([
          env.DB.prepare("UPDATE pods SET size = MAX(size - ?, 0) WHERE id = ?").bind(movers.length, from.id),
          env.DB.prepare("UPDATE pods SET size = size + ? WHERE id = ?").bind(movers.length, to.id),
        ]);
        await setSizeState(env, from.id); await setSizeState(env, to.id);
        await podPost(env, from.id, "system", { text: `Some of the pod moved to the joined pod today; the rest of you chose to stay here. Both are fine.` }).catch(() => {});
        await podPost(env, to.id, "system", { text: `${movers.length === 1 ? "One person" : `${movers.length} people`} joined today from another pod. A quick hello helps.` }).catch(() => {});
        for (const id of movers) await podPost(env, from.id, "moved-one", { member: id, to: to.id }).catch(() => {});
      }
    }
    await env.DB.prepare("UPDATE pod_merges SET status = 'done', done_at = ? WHERE id = ?").bind(new Date(now).toISOString(), m.id).run();
    done++;
  }
  return done;
}

// --- Chotu as host (spec §3 and Chotu v2) --------------------------------------------------------------

export type HostSlot = "goal" | "answer_hour" | "quiz" | "wins";
/** IST weekday (0 = Sunday) and time of each ritual. */
export const HOST_SCHEDULE: { slot: HostSlot; day: number; at: string }[] = [
  { slot: "goal", day: 1, at: "08:00" },
  ...ANSWER_DAYS.map((day) => ({ slot: "answer_hour" as HostSlot, day, at: "19:00" })),
  { slot: "quiz", day: 5, at: "20:00" },
  { slot: "wins", day: 0, at: "18:00" },
];

/** Five MCQs from this week's Chai (never a tragic card), topped up from the starter bank. */
export async function quizQuestions(env: Env, now = Date.now()) {
  const since = istDay(new Date(now - 7 * DAY));
  const { results } = await env.DB.prepare("SELECT json FROM briefs WHERE day >= ? ORDER BY day DESC").bind(since).all<{ json: string }>();
  const qs: { topic: string; question: string; options: string[]; answerIndex: number; explanation?: string }[] = [];
  for (const r of results) for (const it of JSON.parse(r.json).items ?? []) {
    const m = it.examCorner?.mcq;
    if (m && it.tone !== "tragic" && qs.length < 5) qs.push({ topic: it.topic ?? "Chai", ...m });
  }
  const bank = ((BANK as any).questions ?? []) as any[];
  const seed = Number(istDay(new Date(now)).replace(/-/g, ""));
  for (let i = 0; qs.length < 5 && i < bank.length; i++) {
    const q = bank[(seed + i * 7) % bank.length];
    if (q?.en && !qs.some((x) => x.question === q.en.question)) qs.push({ topic: q.topic ?? "Prelims", ...q.en });
  }
  return qs.slice(0, 5);
}

async function slotText(env: Env, slot: HostSlot | "chai", humans: number): Promise<string | null> {
  switch (slot) {
    case "goal": return `New week. Suggested pod goal: ${Math.max(20, humans * 10)} Prelims questions together by Sunday. One shared bar for the whole pod. The lead can change it.`;
    case "answer_hour": {
      const day = istDay();
      const row = await env.DB.prepare("SELECT json FROM briefs WHERE day = ?").bind(day).first<{ json: string }>();
      const prompt = row ? (JSON.parse(row.json).items ?? []).find((i: any) => i.examCorner?.mainsPrompt)?.examCorner.mainsPrompt : null;
      return `Answer hour, 19:00 to 20:00. ${prompt ? `Today's question: ${prompt}` : "Today's Mains question is in Prep → Practice."} Write 150 words, then share your intro here if you'd like another pair of eyes.`;
    }
    case "quiz": return "Pod Quiz Night 🎯 5 questions from this week's Chai. One shared pod score, compared only with the pod's own last week.";
    case "wins": return "Wins of the week. If you like, share one thing that went okay this week. Small counts, and sharing is optional.";
    case "chai": return ritualText(env, "chai");
  }
}

/**
 * Runs the host schedule for a moment in time (the half-hourly cron passes now). Each pod's Durable Object
 * applies the rules: at most 2 Chotu posts a day, none from 23:30 to 07:00, rituals a person claimed are
 * left to them, and Chotu never comments on any one member.
 */
export async function hostTick(env: Env, at = new Date()) {
  await ensureSchema(env);
  const f = await flags(env);
  if (!f.pod_chat) return { pods: 0, posted: 0 };
  const ist = istNow(at);
  const hm = ist.toISOString().slice(11, 16);
  // Result-day mode: no wins posts for 72 hours.
  const resultOn = !!activeResult(await resultDays(env), at.getTime());
  const due = HOST_SCHEDULE.filter((s) => s.day === ist.getUTCDay() && s.at === hm && !(resultOn && s.slot === "wins"));
  const { results } = await env.DB.prepare("SELECT * FROM pods WHERE merged_into IS NULL AND size > 0").all<PodRow>();
  let posted = 0, friendPosts = 0;
  // Pod friends (friends.ts): on with the flag, silent in a result week. The pod decides what's due.
  const friendsOn = !!f.pod_friends && !resultOn;
  const friendQuiz = friendsOn ? await quizQuestions(env, at.getTime()) : [];
  for (const p of results) {
    const state = podState(p, at.getTime());
    const jobs: any[] = [{ slot: "check" }];
    for (const s of due) {
      const job: any = { slot: s.slot, text: await slotText(env, s.slot, p.size) };
      if (s.slot === "quiz") job.quiz = await quizQuestions(env, at.getTime());
      if (s.slot === "goal") job.goal = { text: `${Math.max(20, p.size * 10)} Prelims questions together`, target: Math.max(20, p.size * 10), unit: "questions" };
      jobs.unshift(job);
    }
    for (const job of jobs) {
      const res = await podPost(env, p.id, "host", { ...job, at: at.toISOString(), state, humans: p.size }).catch(() => null);
      if (res?.ok && (await res.json<{ posted: boolean }>()).posted) posted++;
    }
    const fr = await podPost(env, p.id, "friends", { at: at.toISOString(), humans: p.size, on: friendsOn, quiz: friendQuiz }).catch(() => null);
    if (fr?.ok) friendPosts += (await fr.json<{ posted: number }>()).posted || 0;
  }
  // Open rooms: the same rituals (no shared goal bar, a room is too big for one), never "quiet". The friends get
  // humans: 0 so they stay at their fullest level: a room is public and should never feel empty to a newcomer.
  const counts = await roomCounts(env);
  for (const r of OPEN_ROOMS) {
    const humans = counts.get(r.id) ?? 0;
    const jobs: any[] = [{ slot: "check" }];
    for (const s of due) {
      if (s.slot === "goal") continue;
      const job: any = { slot: s.slot, text: s.slot === "quiz" ? ROOM_QUIZ_TEXT : await slotText(env, s.slot, humans) };
      if (s.slot === "quiz") job.quiz = await quizQuestions(env, at.getTime());
      jobs.unshift(job);
    }
    for (const job of jobs) {
      const res = await roomPost(env, r.id, "host", { ...job, at: at.toISOString(), state: "full", humans }).catch(() => null);
      if (res?.ok && (await res.json<{ posted: boolean }>()).posted) posted++;
    }
    const fr = await roomPost(env, r.id, "friends", { at: at.toISOString(), humans: 0, on: friendsOn, quiz: friendQuiz }).catch(() => null);
    if (fr?.ok) friendPosts += (await fr.json<{ posted: number }>()).posted || 0;
  }
  if (posted) await bump(env, "host_posts", posted);
  if (friendPosts) await bump(env, "friend_posts", friendPosts);
  return { pods: results.length, rooms: OPEN_ROOMS.length, posted, friendPosts };
}

const ROOM_QUIZ_TEXT = "Room Quiz Night 🎯 5 questions from this week's Chai, the same in every room. Answered together, one shared score for this room only. No ranks, of people or rooms.";

/**
 * Each open room's pinned question for the day (07:00, the "pins" job): the answer-writing room gets today's Mains
 * prompt, every other room a Prelims MCQ from this week's Chai or the starter bank, a different one per room where
 * there are enough. The Hindi-medium room gets the Hindi text where an editor checked it.
 */
export async function pinRooms(env: Env, at = new Date()) {
  const day = istDay(at);
  const { results } = await env.DB.prepare("SELECT day, json FROM briefs WHERE day >= ? ORDER BY day DESC").bind(istDay(new Date(at.getTime() - 7 * DAY))).all<{ day: string; json: string }>();
  const pool: { topic: string; en: any; hi: any }[] = [];
  let mains: string | null = null;
  for (const r of results) for (const it of JSON.parse(r.json).items ?? []) {
    if (it.tone === "tragic") continue;
    if (it.examCorner?.mcq) pool.push({ topic: it.topic ?? "Chai", en: it.examCorner.mcq, hi: it.hi?.mcq ?? null });
    if (!mains && r.day === day && it.examCorner?.mainsPrompt) mains = it.examCorner.mainsPrompt;
  }
  for (const q of ((BANK as any).questions ?? []) as any[]) if (q?.en && !pool.some((p) => p.en.question === q.en.question)) pool.push({ topic: q.topic ?? "Prelims", en: q.en, hi: q.hi ?? null });
  let pinned = 0;
  for (const [i, r] of OPEN_ROOMS.entries()) {
    let pin: any;
    if (r.id === "room-mains-writing" && mains) pin = { day, kind: "mains", topic: "Mains", question: mains };
    else if (pool.length) {
      const seed = Number(day.replace(/-/g, ""));
      const p = pool[(seed + i) % pool.length];
      const q = r.id === "room-hindi-medium" && p.hi ? p.hi : p.en;
      pin = { day, kind: "mcq", topic: p.topic, question: q.question, options: q.options, answerIndex: q.answerIndex, explanation: q.explanation ?? "" };
    } else continue;
    const res = await roomPost(env, r.id, "pin", pin).catch(() => null);
    if (res?.ok && (await res.json<{ pinned: boolean }>()).pinned) pinned++;
  }
  return { rooms: OPEN_ROOMS.length, pinned };
}

/** The 07:00 Chai post goes through the same host gate as everything else Chotu says in a pod. */
export async function postChai(env: Env, at = new Date()) {
  const text = await slotText(env, "chai", 0);
  if (!text) return 0;
  const { results } = await env.DB.prepare("SELECT id, size FROM pods WHERE merged_into IS NULL AND size > 0").all<{ id: string; size: number }>();
  let n = 0;
  for (const p of results) {
    const res = await podPost(env, p.id, "host", { slot: "chai", text, at: at.toISOString(), humans: p.size }).catch(() => null);
    if (res?.ok && (await res.json<{ posted: boolean }>()).posted) n++;
  }
  for (const r of OPEN_ROOMS) {
    const res = await roomPost(env, r.id, "host", { slot: "chai", text, at: at.toISOString(), humans: 0 }).catch(() => null);
    if (res?.ok && (await res.json<{ posted: boolean }>()).posted) n++;
  }
  return n;
}

// --- The Commons ------------------------------------------------------------------------------------------

export async function commonsSummary(env: Env) {
  if (!env.COMMONS) return { rooms: [], total: 0, label: "The Commons isn't open on this server yet." };
  const rooms = await Promise.all(COMMONS_ROOMS.map(async (r) => {
    const res = await env.COMMONS!.get(env.COMMONS!.idFromName(r.id)).fetch("https://commons/count").catch(() => null);
    const count = res?.ok ? ((await res.json<{ count: number }>()).count ?? 0) : 0;
    return { ...r, count };
  }));
  const total = rooms.reduce((n, r) => n + r.count, 0);
  // Real numbers only. Under 10 we don't show a number at all.
  const label = total >= 10 ? `${total.toLocaleString("en-IN")} aspirants studying now · ${rooms.length} rooms open` : total > 0 ? "A few people are studying now" : `${rooms.length} quiet rooms open. Be the first in today`;
  return { rooms: rooms.map((r) => ({ ...r, count: total >= 10 ? r.count : null })), total: total >= 10 ? total : null, label };
}

// --- The community season: one shared counter, no ranks ---------------------------------------------------

export const DEFAULT_SEASON = { title: "Prelims 2027 season", goal: 1_000_000, unit: "questions", endsOn: "2027-05-24", startsOn: "2026-10-01" };

export async function season(env: Env) {
  const s = await getSetting(env, "season", DEFAULT_SEASON);
  const row = await env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM daily_counts WHERE metric = 'season_questions' AND day >= ?").bind(s.startsOn).first<{ n: number }>();
  return { ...s, done: row?.n ?? 0 };
}

// --- Mock score band ---------------------------------------------------------------------------------------

export const BAND_MIN = 30;
const BANDS: [number, number][] = [[0, 10], [10, 25], [25, 40], [40, 60], [60, 80], [80, 100]];
/** Where pct sits among everyone who shared this paper, as a band of "percent from the top". */
export async function mockBand(env: Env, mockId: string, pct: number) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN pct > ? THEN 1 ELSE 0 END) AS above FROM mock_scores WHERE mock_id = ?").bind(pct, mockId).first<{ n: number; above: number }>();
  const n = r?.n ?? 0;
  if (n < BAND_MIN) return { band: null, n, note: `Not enough people yet. A band shows once ${BAND_MIN} people have shared this paper.` };
  const fromTop = ((r?.above ?? 0) / n) * 100;
  const [lo, hi] = BANDS.find(([, b]) => fromTop < b) ?? BANDS[BANDS.length - 1];
  const band = lo === 0 ? `In the top ${hi}% of ${n} people who shared this paper` : `${lo} to ${hi}% from the top, of ${n} people who shared this paper`;
  return { band, lo, hi, n };
}

// --- Routes ---------------------------------------------------------------------------------------------

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));

/** Pods, the Commons, the season and the matching fields. Returns null for other paths. */
export async function communityRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path === "/pods/join" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const memberId = String(body.memberId ?? "");
    if (!validId(memberId)) return bad("memberId must be a random id of 16 to 64 characters");
    await ensureSchema(env);
    const existing = await env.DB.prepare("SELECT p.*, m.closest FROM members m JOIN pods p ON p.id = m.pod_id WHERE m.member_id = ?").bind(memberId).first<PodRow>();
    if (existing) return json({ ...podSummary(existing), merge: await mergeFor(env, body.memberId, existing.id) });
    if (!(await flags(env)).pod_join) return bad("Joining pods is paused for now. Try again later.", 503);
    // Open mode (rooms.ts): below the sign-up threshold nobody new is matched; the apps show the open rooms instead.
    const mode = await podMode(env);
    if (mode.mode === "open") return json({ ...mode, podId: null, error: "Pods are open rooms for now. Pick one or more from the room list." }, 409);
    const { podId, closest } = await joinPod(env, memberId, matchFields(body));
    await bump(env, closest ? "pod_joins_closest" : "pod_joins");
    await logEvent(env, "pod_joined", { memberId });
    const row = await env.DB.prepare("SELECT * FROM pods WHERE id = ?").bind(podId).first<PodRow>();
    return json(podSummary({ ...row!, closest: closest ? 1 : 0 }));
  }
  if (path === "/pods/leave" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    if (validId(body.memberId)) await leavePod(env, body.memberId);
    return json({ ok: true });
  }
  if (path === "/pods/me" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    if (!validId(body.memberId)) return bad("memberId is required");
    await ensureSchema(env);
    const p = await env.DB.prepare("SELECT p.*, m.closest FROM members m JOIN pods p ON p.id = m.pod_id WHERE m.member_id = ?").bind(body.memberId).first<PodRow>();
    return p ? json({ ...podSummary(p), merge: await mergeFor(env, body.memberId, p.id) }) : json({ podId: null });
  }
  // Pods v2: before an approved merge, any member can keep their place ("Keep me here"), or change their mind.
  if (path === "/pods/merge-stay" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    if (!validId(body.memberId) || typeof body.mergeId !== "string") return bad("memberId and mergeId are required");
    await ensureSchema(env);
    const m = await env.DB.prepare("SELECT 1 FROM pod_merges g JOIN members m ON m.pod_id IN (g.from_pod, g.to_pod) WHERE g.id = ? AND g.status = 'approved' AND m.member_id = ?").bind(body.mergeId, body.memberId).first();
    if (!m) return bad("No merge for your pod", 404);
    if (body.stay === false) await env.DB.prepare("DELETE FROM pod_merge_optouts WHERE merge_id = ? AND member_id = ?").bind(body.mergeId, body.memberId).run();
    else await env.DB.prepare("INSERT OR IGNORE INTO pod_merge_optouts (merge_id, member_id) VALUES (?, ?)").bind(body.mergeId, body.memberId).run();
    return json({ ok: true, stay: body.stay !== false });
  }
  // The private stay-or-move choice for a quiet pod. Nobody is moved without asking.
  if (path === "/pods/choose" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    if (!validId(body.memberId) || !["stay", "move"].includes(body.choice)) return bad("memberId and choice (stay or move) are required");
    const m = await env.DB.prepare("SELECT * FROM members WHERE member_id = ?").bind(body.memberId).first<any>();
    if (!m) return bad("Not in a pod", 404);
    if (body.choice === "stay") return json({ podId: m.pod_id, stayed: true });
    await leavePod(env, body.memberId);
    const { podId, closest } = await joinPod(env, body.memberId, { stage: m.stage, attempt_band: m.attempt_band, lang: m.lang, time_band: m.time_band }, m.pod_id);
    await bump(env, "pod_moves");
    const row = await env.DB.prepare("SELECT * FROM pods WHERE id = ?").bind(podId).first<PodRow>();
    return json(podSummary({ ...row!, closest: closest ? 1 : 0 }));
  }
  // Only the four matching fields are accepted; anything else in the body is ignored and never stored.
  if (path === "/members/profile" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    if (!validId(body.memberId)) return bad("memberId is required");
    await ensureSchema(env);
    const f = matchFields(body);
    // Deleting a field in Me → Profile clears the server's copy too.
    const clear = (Array.isArray(body.clear) ? body.clear : []).filter((k: string) => ["stage", "attempt_band", "lang", "time_band"].includes(k));
    for (const k of clear) await env.DB.prepare(`UPDATE members SET ${k} = NULL WHERE member_id = ?`).bind(body.memberId).run();
    const r = await env.DB.prepare("UPDATE members SET stage = COALESCE(?, stage), attempt_band = COALESCE(?, attempt_band), lang = COALESCE(?, lang), time_band = COALESCE(?, time_band) WHERE member_id = ?")
      .bind(f.stage, f.attempt_band, f.lang, f.time_band, body.memberId).run();
    return json({ ok: true, stored: r.meta.changes ? Object.fromEntries(Object.entries(f).filter(([, v]) => v)) : {} });
  }
  if (path === "/commons") return json(await commonsSummary(env));
  const cws = path.match(/^\/commons\/([\w-]+)\/ws$/);
  if (cws) {
    if (!COMMONS_ROOMS.some((r) => r.id === cws[1])) return bad("No such room", 404);
    if (!env.COMMONS) return bad("The Commons isn't open on this server yet.", 503);
    return env.COMMONS.get(env.COMMONS.idFromName(cws[1])).fetch(new Request(url.toString(), req));
  }
  if (path === "/season") return json(await season(env));
  if (path === "/season/add" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const n = Math.min(Math.max(Math.round(Number(body.n) || 0), 0), 50);
    if (n) await bump(env, "season_questions", n);
    return json({ ok: true, added: n });
  }
  // Opt-in mock score band. Stored without a member id; answers with a band, never a rank, and only
  // once enough people have shared that the band means something. Off during result week.
  if (path === "/mocks/band" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const mockId = String(body.mockId ?? ""), pct = Math.round(Number(body.pct));
    if (!/^[\w#:.-]{1,80}$/.test(mockId) || mockId === "quick" || !(pct >= 0 && pct <= 100)) return bad("mockId and pct (0 to 100) are required. Quick mocks have no band.");
    await ensureSchema(env);
    if (activeResult(await resultDays(env))) return json({ band: null, reason: "result", note: "Bands are off during result week." });
    await env.DB.prepare("INSERT INTO mock_scores (mock_id, pct, day) VALUES (?, ?, ?)").bind(mockId, pct, istDay()).run();
    return json(await mockBand(env, mockId, pct));
  }
  return null;
}

// --- Jobs: one half-hourly cron runs whatever is due (IST) -------------------------------------------------

export async function runJob(env: Env, job: string, at = new Date()) {
  switch (job) {
    case "match": return { merged: await mergeForming(env, { minAgeDays: 0, intoSmall: true, now: at.getTime() }), offered: await offerExactPods(env), thin: await proposeMerges(env, at.getTime()) };
    case "merge": return { merged: await mergeForming(env, { minAgeDays: 7, intoSmall: false, now: at.getTime() }), joined: await runMerges(env, at.getTime()) };
    case "states": return refreshStates(env, at.getTime());
    case "host": return hostTick(env, at);
    case "chai": return { pods: await postChai(env, at) };
    case "pins": return pinRooms(env, at);
    case "photos": return sweepPhotos(env, { now: at.getTime() });
    default: throw new Error("Unknown job");
  }
}

// --- Admin metrics (spec §7) -------------------------------------------------------------------------------

export async function communityMetrics(env: Env) {
  await ensureSchema(env);
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const one = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).first<T>())!;
  // New members (joined 7 to 37 days ago) whose pod now has 3 or more people. Approximates "by day 7".
  const newMembers = await one<{ total: number; with3: number }>(
    "SELECT COUNT(*) AS total, COALESCE(SUM(p.size >= 3), 0) AS with3 FROM members m JOIN pods p ON p.id = m.pod_id WHERE m.joined_at <= ? AND m.joined_at > ?",
    iso(now - 7 * DAY), iso(now - 37 * DAY));
  const { results: pods } = await env.DB.prepare("SELECT * FROM pods WHERE merged_into IS NULL AND size > 0 ORDER BY created_at DESC LIMIT 200").all<PodRow>();
  const perPod = [];
  for (const p of pods) {
    const res = await podPost(env, p.id, "stats", {}).catch(() => null);
    const s = res?.ok ? await res.json<{ posters14d: number }>() : { posters14d: 0 };
    perPod.push({ podId: p.id, state: podState(p, now), humans: p.size, posters14d: s.posters14d, lurkerToPoster: p.size ? Math.round((s.posters14d / p.size) * 100) : 0 });
  }
  const states: Record<string, number> = {};
  for (const p of perPod) states[p.state] = (states[p.state] ?? 0) + 1;
  const { results: profile } = await env.DB.prepare(
    `SELECT COALESCE(stage, 'unknown') AS stage, COUNT(*) AS members,
       ROUND(AVG((stage IS NOT NULL) + (attempt_band IS NOT NULL) + (lang IS NOT NULL) + (time_band IS NOT NULL)) * 25) AS completeness_pct
     FROM members GROUP BY COALESCE(stage, 'unknown')`).all();
  const since = istDay(new Date(now - 29 * DAY));
  const { results: counts } = await env.DB.prepare("SELECT metric, SUM(n) AS n FROM daily_counts WHERE day >= ? AND (metric LIKE 'offer%' OR metric LIKE 'plus_%' OR metric LIKE 'trial%' OR metric LIKE 'gift%') GROUP BY metric").bind(since).all<{ metric: string; n: number }>();
  const c = Object.fromEntries(counts.map((r) => [r.metric, r.n]));
  const purchases = (c.plus_purchases ?? 0) + (c.gift_purchases ?? 0);
  const forbidden = Object.entries(c).filter(([k]) => k.startsWith("offer_forbidden_shown")).reduce((n, [k, v]) => (k === "offer_forbidden_shown" ? n + v : n), 0);
  return {
    window: `last 30 days (since ${since})`,
    newMembersInPodWith3: { total: newMembers.total, with3: newMembers.with3, pct: newMembers.total ? Math.round((newMembers.with3 / newMembers.total) * 100) : null },
    podStates: states,
    lurkerToPoster: perPod,
    profileCompletenessByStage: profile,
    plus: {
      valueMomentReach: c.offer_shown ?? 0,
      trialStarts: c.trial_started ?? 0,
      trialToPaidPct: c.trial_started ? Math.round(((c.plus_paid_after_trial ?? 0) / c.trial_started) * 100) : null,
      purchases, giftSharePct: purchases ? Math.round(((c.gift_purchases ?? 0) / purchases) * 100) : null,
    },
    // Must be 0. Any offer a client reports showing outside Prep is counted here, by surface.
    forbiddenOfferImpressions: { total: forbidden, bySurface: Object.fromEntries(Object.entries(c).filter(([k]) => k.startsWith("offer_forbidden_shown:")).map(([k, v]) => [k.split(":")[1], v])), alert: forbidden > 0 },
  };
}
