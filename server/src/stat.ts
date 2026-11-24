import { type Env, istDay } from "./shared";
import { ensureSchema } from "./staff";
import { STUDY_EVENTS } from "./insights";

/**
 * Daily roll-up of the events table (owner said yes, 24 Nov 2026; artefacts/analytics-review-2026-11-24.md).
 *
 * Insights and Growth count over the whole events table each time they open, which costs a lot of D1 rows read. Here
 * each finished day is counted once, at 01:00 IST for yesterday, from that day's events only (index events(day)), and
 * kept as small rows in stat_daily(day, metric, key, n). Home's "How it's going" reads only these rows.
 *
 * Counts only: no member id, install id or text is kept here, so erasure needs nothing from this table.
 *
 * Per-day metrics (day = the day it happened):
 *   active, studied: members active / studying that day. feature_people:<event> and feature_times:<event>.
 *   open:<note|audio|video> and done:<…> keyed by piece: people who opened / finished it that day.
 *   practice, practice_right; node_n and node_wrong keyed by topic; review_cards, review_kept.
 *   signup; demo (browsers that opened the demo); day3; plus_view, paid (people).
 *   rolled: 1 once the day is counted.
 * Per-cohort metrics (day = the sign-up day; written once each window has fully passed):
 *   cohort (people who signed up), ret_d1 (back the next day), ret_d7 (any day 7 to 13), ret_d30 (any day 30 to 36),
 *   act:<onboarding_done|pod_joined|first_chotu_chat|ritual> (within 7 days of signing up).
 */

const DAY = 86400_000;
export const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);

export const STAT_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS stat_daily (day TEXT NOT NULL, metric TEXT NOT NULL, key TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL,
    PRIMARY KEY (day, metric, key))`,
  `CREATE INDEX IF NOT EXISTS stat_daily_metric ON stat_daily(metric, day)`,
  // Lets a single day's events be read without touching the rest of the table.
  `CREATE INDEX IF NOT EXISTS events_day ON events(day)`,
];
let ready = false;
export async function ensureStatSchema(env: Env) {
  if (ready) return;
  await ensureSchema(env);
  await env.DB.batch(STAT_SCHEMA.map((s) => env.DB.prepare(s)));
  ready = true;
}

const PIECES: Record<string, [string, string, string]> = { note: ["note_open", "note_done", "node"], audio: ["audio_play", "audio_done", "node"], video: ["video_play", "video_done", "id"] };
const ACT_STEPS = ["onboarding_done", "pod_joined", "first_chotu_chat", "ritual"];
const STUDY = new Set<string>(STUDY_EVENTS);

type Row = { name: string; member_id: string | null; install_id: string | null; props: string | null };

/** Counts one day from its events and replaces that day's per-day rows. Safe to run again. */
export async function rollDay(env: Env, day: string) {
  await ensureStatSchema(env);
  const rows = (await env.DB.prepare("SELECT name, member_id, install_id, props FROM events WHERE day = ?").bind(day).all<Row>()).results ?? [];
  const out = new Map<string, number>(); // "metric\tkey" -> n
  const add = (metric: string, key = "", n = 1) => out.set(metric + "\t" + key, (out.get(metric + "\t" + key) ?? 0) + n);
  const sets = new Map<string, Set<string>>();
  const person = (metric: string, key: string, who: string | null) => { if (!who) return; const k = metric + "\t" + key; (sets.get(k) ?? sets.set(k, new Set()).get(k)!).add(who); };
  for (const r of rows) {
    const who = r.member_id || r.install_id;
    let p: any = {};
    if (r.props) { try { p = JSON.parse(r.props); } catch { p = {}; } }
    if (r.member_id) person("active", "", r.member_id);
    if (STUDY.has(r.name)) {
      add("feature_times", r.name);
      person("feature_people", r.name, who);
      if (r.member_id) person("studied", "", r.member_id);
    }
    for (const [kind, [open, done, key]] of Object.entries(PIECES)) {
      if ((r.name === open || r.name === done) && typeof p[key] === "string") person((r.name === open ? "open:" : "done:") + kind, p[key], who);
    }
    if (r.name === "practice_answer") {
      add("practice"); if (p.right === 1) add("practice_right");
      if (typeof p.node === "string") { add("node_n", p.node); if (p.right === 0) add("node_wrong", p.node); }
    }
    if (r.name === "review_done") { add("review_cards", "", Number(p.cards) || 0); add("review_kept", "", Number(p.kept) || 0); }
    if (r.name === "signup") person("signup", "", r.member_id);
    if (r.name === "try_open") person("demo", "", r.install_id);
    if (r.name === "try_day3_done") person("day3", "", r.install_id);
    if (r.name === "plus_view") person("plus_view", "", r.member_id);
    if (r.name === "paid") person("paid", "", r.member_id);
  }
  for (const [k, s] of sets) out.set(k, s.size);
  out.set("rolled\t", 1);
  const stmts = [env.DB.prepare("DELETE FROM stat_daily WHERE day = ? AND metric NOT IN ('cohort', 'ret_d1', 'ret_d7', 'ret_d30') AND metric NOT LIKE 'act:%'").bind(day)];
  for (const [k, n] of out) { const [metric, key] = k.split("\t"); stmts.push(env.DB.prepare("INSERT INTO stat_daily (day, metric, key, n) VALUES (?, ?, ?, ?)").bind(day, metric, key, n)); }
  for (let i = 0; i < stmts.length; i += 100) await env.DB.batch(stmts.slice(i, i + 100));
  return { day, events: rows.length, rows: out.size };
}

/**
 * Return and week-1 steps for the people who signed up on `s`, for each window that has fully passed by `last` (the
 * latest finished day). One small indexed query per person (events by member).
 */
export async function rollCohort(env: Env, s: string, last: string) {
  await ensureStatSchema(env);
  if (addDays(s, 1) > last) return { day: s, skipped: true };
  const ids = ((await env.DB.prepare("SELECT DISTINCT member_id FROM events WHERE name = 'signup' AND day = ? AND member_id IS NOT NULL").bind(s).all<{ member_id: string }>()).results ?? []).map((r) => r.member_id);
  const end = [addDays(s, 36), last].sort()[0];
  const done = { d1: addDays(s, 1) <= last, act: addDays(s, 7) <= last, d7: addDays(s, 13) <= last, d30: addDays(s, 36) <= last };
  const n: Record<string, number> = { cohort: ids.length, ret_d1: 0, ret_d7: 0, ret_d30: 0, ...Object.fromEntries(ACT_STEPS.map((x) => ["act:" + x, 0])) };
  for (const id of ids) {
    const ev = (await env.DB.prepare("SELECT DISTINCT name, day FROM events WHERE member_id = ? AND day >= ? AND day <= ?").bind(id, s, end).all<{ name: string; day: string }>()).results ?? [];
    const on = (from: number, to: number) => ev.some((e) => e.day >= addDays(s, from) && e.day <= addDays(s, to));
    if (on(1, 1)) n.ret_d1++;
    if (on(7, 13)) n.ret_d7++;
    if (on(30, 36)) n.ret_d30++;
    for (const step of ACT_STEPS) if (ev.some((e) => e.name === step && e.day <= addDays(s, 7))) n["act:" + step]++;
  }
  const keep = (m: string) => m === "cohort" || (m === "ret_d1" && done.d1) || (m === "ret_d7" && done.d7) || (m === "ret_d30" && done.d30) || (m.startsWith("act:") && done.act);
  const stmts = [env.DB.prepare("DELETE FROM stat_daily WHERE day = ? AND (metric IN ('cohort', 'ret_d1', 'ret_d7', 'ret_d30') OR metric LIKE 'act:%')").bind(s)];
  for (const [m, v] of Object.entries(n)) if (keep(m)) stmts.push(env.DB.prepare("INSERT INTO stat_daily (day, metric, key, n) VALUES (?, ?, '', ?)").bind(s, m, v));
  await env.DB.batch(stmts);
  return { day: s, people: ids.length };
}

/**
 * The nightly run (01:00 IST): yesterday, then any of the last 40 days not yet counted (at most 10 a night, so the
 * first nights fill in the past), then the sign-up days whose windows just closed.
 */
export async function statNightly(env: Env, at = new Date()) {
  await ensureStatSchema(env);
  const last = addDays(istDay(at), -1);
  const have = new Set(((await env.DB.prepare("SELECT day FROM stat_daily WHERE metric = 'rolled' AND day >= ?").bind(addDays(last, -40)).all<{ day: string }>()).results ?? []).map((r) => r.day));
  const todo = [last, ...Array.from({ length: 40 }, (_, i) => addDays(last, -1 - i)).filter((d) => !have.has(d))].slice(0, 10);
  const rolled = [];
  for (const d of todo) rolled.push(await rollDay(env, d));
  // Cohorts: the days just rolled (for a fresh start) and those whose 1-, 7-, 13- and 36-day windows closed last night.
  const cohorts = new Set([...todo.slice(1), ...[1, 7, 13, 36].map((k) => addDays(last, -k))]);
  for (const s of cohorts) await rollCohort(env, s, last);
  return { rolled: rolled.length, cohorts: cohorts.size, last };
}
