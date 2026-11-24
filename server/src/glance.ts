import { type Env, istDay } from "./shared";
import { addDays, ensureStatSchema } from "./stat";

/**
 * Admin → Home → "How it's going": one short summary for marketing, product and content.
 *
 * Read from the nightly roll-up (stat.ts, table stat_daily), never the events table, so it costs a few hundred rows
 * at most. Days are finished days (up to yesterday) unless a day was rolled by hand. Counts only, never who.
 *
 * hourly() keeps an answer for an hour (in memory, and in R2 BACKUPS under _cache/admin/ so a fresh worker doesn't
 * redo it); Insights and Growth use it too. "Work it out now" passes ?fresh=1.
 */

const HOUR = 3600_000;
const mem = new Map<string, { at: number; data: unknown }>();

export async function hourly<T extends object>(env: Env, name: string, fresh: boolean, make: () => Promise<T>): Promise<T & { at: string; cached: boolean }> {
  const key = `_cache/admin/${name}.json`;
  const now = Date.now();
  let hit = mem.get(key) ?? null;
  if (!hit && env.BACKUPS && !fresh) {
    try { const o = await env.BACKUPS.get(key); if (o) hit = await o.json(); } catch { hit = null; }
  }
  if (hit && !fresh && now - hit.at < HOUR) return { ...(hit.data as T), at: new Date(hit.at).toISOString(), cached: true };
  const data = await make();
  const keep = { at: now, data };
  mem.set(key, keep);
  if (env.BACKUPS) await env.BACKUPS.put(key, JSON.stringify(keep), { httpMetadata: { contentType: "application/json" } }).catch(() => {});
  return { ...data, at: new Date(now).toISOString(), cached: false };
}

export const glance = (env: Env, fresh = false) => hourly(env, "glance", fresh, () => build(env));

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);
type S = { day: string; metric: string; key: string; n: number };

async function build(env: Env) {
  await ensureStatSchema(env);
  const today = istDay();
  const since30 = addDays(today, -30), since90 = addDays(today, -90);
  const all = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).all<T>()).results ?? [];
  // Per-day rows for 30 days, cohort rows for 90 (by metric, through the (metric, day) index).
  const rows = await all<S>("SELECT day, metric, key, n FROM stat_daily WHERE day >= ? AND metric NOT IN ('cohort', 'ret_d1', 'ret_d7', 'ret_d30') AND metric NOT LIKE 'act:%'", since30);
  const coh = await all<S>("SELECT day, metric, key, n FROM stat_daily WHERE day >= ? AND (metric IN ('cohort', 'ret_d1', 'ret_d7', 'ret_d30') OR metric LIKE 'act:%')", since90);
  const sum = (metric: string, key?: string) => rows.filter((r) => r.metric === metric && (key === undefined || r.key === key)).reduce((s, r) => s + r.n, 0);
  const byKey = (metric: string) => { const m = new Map<string, number>(); for (const r of rows) if (r.metric === metric) m.set(r.key, (m.get(r.key) ?? 0) + r.n); return m; };
  const daysCounted = new Set(rows.filter((r) => r.metric === "rolled").map((r) => r.day)).size;

  // Marketing sources: installs by the link that brought them (90 days), as Insights counts them.
  const sources = await all<{ source: string; installs: number; signups: number; paid: number }>(
    `SELECT COALESCE(i.source, CASE WHEN i.invite_code IS NOT NULL THEN 'invite' ELSE 'direct' END) AS source, COUNT(*) AS installs,
       SUM(i.member_id IS NOT NULL) AS signups,
       SUM(CASE WHEN i.member_id IS NOT NULL AND EXISTS (SELECT 1 FROM events p WHERE p.member_id = i.member_id AND p.name = 'paid') THEN 1 ELSE 0 END) AS paid
     FROM installs i WHERE i.first_open_at >= ? GROUP BY 1 ORDER BY installs DESC LIMIT 5`, since90);

  // Cohorts: for each measure, the sign-up days that have it, newest 7 of them for return, all 30 days for week 1.
  const cohDays = (metric: string) => coh.filter((r) => r.metric === metric).map((r) => r.day).sort().reverse();
  const size = (day: string) => coh.find((r) => r.day === day && r.metric === "cohort")?.n ?? 0;
  const val = (day: string, metric: string) => coh.find((r) => r.day === day && r.metric === metric)?.n ?? 0;
  const ret = (metric: string) => {
    const days = cohDays(metric).slice(0, 7);
    const people = days.reduce((s, d) => s + size(d), 0);
    return days.length && people ? { week: days[days.length - 1], people, pct: pct(days.reduce((s, d) => s + val(d, metric), 0), people) } : null;
  };
  const actDays = cohDays("act:pod_joined").filter((d) => d >= since30);
  const started = actDays.reduce((s, d) => s + size(d), 0);
  const act = (step: string) => { const n = actDays.reduce((s, d) => s + val(d, "act:" + step), 0); return { step, n, pct: pct(n, started) }; };

  const people = byKey("feature_people"), times = byKey("feature_times");
  const busiest = (name: string) => Math.max(0, ...rows.filter((r) => r.metric === "feature_people" && r.key === name).map((r) => r.n));
  const features = [...times.entries()].map(([name, n]) => ({ name, n, people: people.get(name) ?? 0, busiestDay: busiest(name) }))
    .sort((a, b) => b.people - a.people || b.n - a.n).slice(0, 8);
  const days30 = Array.from({ length: 30 }, (_, i) => addDays(today, -30 + i));
  const studied = days30.map((d) => rows.find((r) => r.day === d && r.metric === "studied")?.n ?? 0);

  const pieces = (kind: string) => {
    const open = byKey("open:" + kind), done = byKey("done:" + kind);
    const list = [...open.entries()].map(([piece, opened]) => ({ piece, opened, finished: done.get(piece) ?? 0, finishedPct: pct(Math.min(done.get(piece) ?? 0, opened), opened) }));
    return { most: [...list].sort((a, b) => b.opened - a.opened).slice(0, 3), lose: list.filter((r) => r.opened >= 5).sort((a, b) => (a.finishedPct ?? 0) - (b.finishedPct ?? 0)).slice(0, 3) };
  };
  const nodeN = byKey("node_n"), nodeWrong = byKey("node_wrong");
  const mostWrong = [...nodeN.entries()].filter(([, n]) => n >= 10).map(([node, n]) => ({ node, n, wrongPct: pct(nodeWrong.get(node) ?? 0, n) }))
    .sort((a, b) => (b.wrongPct ?? 0) - (a.wrongPct ?? 0)).slice(0, 3);
  // One-tap ratings: the feedback table is small and indexed by moment.
  const ratings = await all<{ moment: string; n: number; r1: number; r2: number; r3: number }>(
    `SELECT moment, COUNT(*) AS n, SUM(rating = 1) AS r1, SUM(rating = 2) AS r2, SUM(rating = 3) AS r3
     FROM feedback WHERE moment NOT LIKE 'day7_%' AND day >= ? GROUP BY moment ORDER BY n DESC LIMIT 6`, since90);

  return {
    daysCounted,
    marketing: {
      funnel30: { demo: sum("demo"), signedUp: sum("signup"), plusPage: sum("plus_view"), paid: sum("paid") },
      signupsByDay: days30.map((d) => rows.find((r) => r.day === d && r.metric === "signup")?.n ?? 0),
      sources: sources.map((r) => ({ ...r, signupPct: pct(r.signups, r.installs) })),
    },
    product: {
      activation: { started, onboarded: act("onboarding_done"), pod: act("pod_joined"), chotu: act("first_chotu_chat"), ritual: act("ritual") },
      returnNextDay: ret("ret_d1"),
      returnSecondWeek: ret("ret_d7"),
      features,
      studiedTrend: { what: "Members who studied a day", values: studied },
    },
    content: {
      notes: pieces("note"), audio: pieces("audio"), videos: pieces("video"),
      ratings, mostWrong,
      reviewKeptPct: pct(sum("review_kept"), sum("review_cards")),
      practice: { answers: sum("practice"), rightPct: pct(sum("practice_right"), sum("practice")) },
    },
  };
}
