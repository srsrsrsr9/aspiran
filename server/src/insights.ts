import { type Env, istDay } from "./shared";
import { ensureSchema } from "./staff";
import { growthReport } from "./metrics";
import { ensureInstSchema } from "./institutes";

/**
 * Admin → Insights: the owner's reports (artefacts/analytics-scope-2026-11-20.md, part 2).
 *
 * Two sources. Our own database (the events table, installs, institutes) knows members, pods, centres and payments.
 * PostHog knows the website, screens, devices and errors. Cards 2, 3 and 7 and the website part of card 1 ask
 * PostHog's query API (HogQL) with a personal key, POSTHOG_PERSONAL_KEY, which only the owner adds. Without it those
 * parts say { connected: false } and everything else still works.
 *
 * PostHog answers are kept for an hour (R2 BACKUPS under _cache/insights/, never served; in memory if there's no
 * bucket), so the page is fast and stays well inside PostHog's query limits.
 *
 * Organisation reports never come from here and never touch PostHog: see inst-reports.ts.
 */

const DAY = 86400_000;
const HOUR = 3600_000;
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);
const PROJECT = (env: Env) => (/^\d{1,10}$/.test(env.POSTHOG_PROJECT_ID ?? "") ? env.POSTHOG_PROJECT_ID! : "729724");
const REPLAY = (env: Env) => `https://us.posthog.com/project/${PROJECT(env)}/replay`;

/** The studying events (part 1). Counted in "What gets used". */
export const STUDY_EVENTS = ["note_open", "note_done", "audio_play", "audio_done", "video_play", "video_done", "practice_answer", "practice_piece",
  "mock_start", "mock_done", "pyq_open", "answer_submit", "answer_rewrite", "answer_evaluated", "review_done", "flashcard_session", "chai_read",
  "pod_session", "pod_message", "prep_minutes", "roadmap_built", "search", "share"] as const;

// --- PostHog, read-only, cached an hour -------------------------------------------------------------------------

type Ph = { connected: false } | { connected: true; rows: unknown[][]; columns: string[]; at: string; error?: string };
const memCache = new Map<string, { at: number; rows: unknown[][]; columns: string[] }>();

/** One HogQL query, from the hour's cache if there is one. Never throws. */
export async function hogql(env: Env, name: string, query: string, now = Date.now()): Promise<Ph> {
  if (!env.POSTHOG_PERSONAL_KEY) return { connected: false };
  const key = `_cache/insights/${name}.json`;
  let cached: { at: number; rows: unknown[][]; columns: string[] } | null = memCache.get(key) ?? null;
  if (!cached && env.BACKUPS) {
    try { const o = await env.BACKUPS.get(key); if (o) cached = await o.json(); } catch { cached = null; }
  }
  if (cached && now - cached.at < HOUR) return { connected: true, rows: cached.rows, columns: cached.columns, at: new Date(cached.at).toISOString() };
  const base = env.AUTH_MODE === "dev" && env.POSTHOG_API_BASE ? env.POSTHOG_API_BASE : "https://us.i.posthog.com";
  try {
    const r = await fetch(`${base}/api/projects/${PROJECT(env)}/query/`, {
      method: "POST", headers: { authorization: `Bearer ${env.POSTHOG_PERSONAL_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query }, name: `aspiran-insights-${name}` }),
    });
    if (!r.ok) throw new Error(`PostHog answered ${r.status}`);
    const j = await r.json<any>();
    const fresh = { at: now, rows: Array.isArray(j.results) ? j.results : [], columns: Array.isArray(j.columns) ? j.columns : [] };
    memCache.set(key, fresh);
    if (env.BACKUPS) await env.BACKUPS.put(key, JSON.stringify(fresh), { httpMetadata: { contentType: "application/json" } }).catch(() => {});
    return { connected: true, rows: fresh.rows, columns: fresh.columns, at: new Date(now).toISOString() };
  } catch (e) {
    // Down or refused: last known answer if there is one, saying so.
    const msg = e instanceof Error ? e.message : "PostHog didn't answer";
    if (cached) return { connected: true, rows: cached.rows, columns: cached.columns, at: new Date(cached.at).toISOString(), error: `${msg}; showing the last answer` };
    return { connected: true, rows: [], columns: [], at: new Date(now).toISOString(), error: msg };
  }
}
const phMeta = (p: Ph) => (p.connected ? { connected: true, at: p.at, ...(p.error ? { error: p.error } : {}) } : { connected: false });

// The website is everything PostHog sees that isn't the app (/app/) or a public topic page counted as app traffic.
const SITE = "event = '$pageview' AND properties.$current_url NOT LIKE '%/app/%'";

// --- The report ---------------------------------------------------------------------------------------------------

export async function insightsReport(env: Env, now = Date.now()) {
  await ensureSchema(env);
  await ensureInstSchema(env);
  const today = istDay(new Date(now));
  const weekAgo = addDays(today, -7), since30 = addDays(today, -29), since90 = addDays(today, -89);
  const nowWeekAgo = new Date(now - 7 * DAY).toISOString();
  const all = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).all<T>()).results;
  const one = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).first<T>())!;
  const days30 = Array.from({ length: 30 }, (_, i) => addDays(since30, i));
  const series = (rows: { day: string; n: number }[]) => { const m = new Map(rows.map((r) => [r.day, Number(r.n) || 0])); return days30.map((d) => m.get(d) ?? 0); };
  const phSeries = (p: Ph) => (p.connected ? series(p.rows.map((r) => ({ day: String(r[0]).slice(0, 10), n: Number(r[1]) }))) : null);

  // 1. Today, against the same day last week up to the same time.
  const sameTime = async (sql: string) => {
    const a = await one<{ n: number }>(sql + " AND day = ?", today);
    const b = await one<{ n: number }>(sql + " AND day = ? AND at <= ?", weekAgo, nowWeekAgo);
    return { today: a?.n ?? 0, lastWeek: b?.n ?? 0 };
  };
  const [demo, signups, active, checkouts, payments] = await Promise.all([
    sameTime("SELECT COUNT(DISTINCT install_id) AS n FROM events WHERE name = 'try_open'"),
    sameTime("SELECT COUNT(*) AS n FROM events WHERE name = 'signup'"),
    sameTime("SELECT COUNT(DISTINCT member_id) AS n FROM events WHERE member_id IS NOT NULL"),
    sameTime("SELECT COUNT(*) AS n FROM events WHERE name = 'checkout_started'"),
    sameTime("SELECT COUNT(*) AS n FROM events WHERE name = 'paid'"),
  ]);
  const visitorsToday = await hogql(env, "visitors-today",
    `SELECT countIf(toDate(timestamp, 'Asia/Kolkata') = toDate(now(), 'Asia/Kolkata')) AS today,
            countIf(toDate(timestamp, 'Asia/Kolkata') = toDate(now(), 'Asia/Kolkata') - 7 AND timestamp <= now() - INTERVAL 7 DAY) AS last_week
     FROM (SELECT person_id, min(timestamp) AS timestamp FROM events WHERE ${SITE} AND timestamp >= now() - INTERVAL 8 DAY GROUP BY person_id, toDate(timestamp, 'Asia/Kolkata'))`, now);
  const visitorsDaily = await hogql(env, "visitors-daily",
    `SELECT toDate(timestamp, 'Asia/Kolkata') AS day, count(DISTINCT person_id) FROM events WHERE ${SITE} AND timestamp >= now() - INTERVAL 30 DAY GROUP BY day ORDER BY day`, now);
  const activeDaily = await all<{ day: string; n: number }>("SELECT day, COUNT(DISTINCT member_id) AS n FROM events WHERE member_id IS NOT NULL AND day >= ? GROUP BY day", since30);
  const todayCard = {
    title: "Today",
    says: "Today so far, next to the same day last week up to the same time.",
    rows: [
      { what: "Website visitors", ...(visitorsToday.connected && visitorsToday.rows[0] ? { today: Number(visitorsToday.rows[0][0]) || 0, lastWeek: Number(visitorsToday.rows[0][1]) || 0 } : { today: null, lastWeek: null }), source: "posthog" },
      { what: "Demo starts", ...demo, source: "db" },
      { what: "Sign-ups", ...signups, source: "db" },
      { what: "Active members", ...active, source: "db" },
      { what: "Plus checkouts", ...checkouts, source: "db" },
      { what: "Payments", ...payments, source: "db" },
    ],
    trend: { what: "Active members a day", values: series(activeDaily) },
    posthog: { ...phMeta(visitorsToday), trend: phSeries(visitorsDaily) },
  };

  // 2. The funnel, last 30 days: website → demo → day-3 recall → sign-up → active in week 1 → Plus page → paid.
  const siteVisitors = await hogql(env, "site-visitors-30", `SELECT count(DISTINCT person_id) FROM events WHERE ${SITE} AND timestamp >= now() - INTERVAL 30 DAY`, now);
  const f = await one<Record<string, number>>(
    `SELECT COUNT(DISTINCT CASE WHEN name = 'try_open' THEN install_id END) AS demo,
       COUNT(DISTINCT CASE WHEN name = 'try_day3_done' THEN install_id END) AS day3,
       COUNT(DISTINCT CASE WHEN name = 'signup' THEN member_id END) AS signup,
       COUNT(DISTINCT CASE WHEN name = 'plus_view' THEN member_id END) AS plusView,
       COUNT(DISTINCT CASE WHEN name = 'paid' THEN member_id END) AS paid
     FROM events WHERE day >= ?`, since30);
  // Active in week 1: signed up in the window and active on another day within 7 days of signing up.
  const week1 = await one<{ n: number }>(
    `SELECT COUNT(DISTINCT s.member_id) AS n FROM events s JOIN events e ON e.member_id = s.member_id
     WHERE s.name = 'signup' AND s.day >= ? AND e.day > s.day AND e.day <= date(s.day, '+7 day')`, since30);
  const steps: [string, number | null, string][] = [
    ["Website visitors", siteVisitors.connected ? Number(siteVisitors.rows[0]?.[0]) || 0 : null, "posthog"],
    ["Started the demo", f?.demo ?? 0, "db"], ["Did the day-3 recall", f?.day3 ?? 0, "db"], ["Signed up", f?.signup ?? 0, "db"],
    ["Active in week 1", week1?.n ?? 0, "db"], ["Saw the Plus page", f?.plusView ?? 0, "db"], ["Paid", f?.paid ?? 0, "db"],
  ];
  const funnel = {
    title: "Funnel",
    says: "Last 30 days. Each step is people, not visits; the drop is against the step before it. The demo and sign-up don't have to follow each other, so a later step can be bigger.",
    steps: steps.map(([step, n, source], i) => {
      const prev = i ? steps[i - 1][1] : null;
      return { step, n, source, keptPct: n != null && prev ? pct(n, prev) : null };
    }),
    posthog: phMeta(siteVisitors),
  };

  // 3. Where people come from: installs by source with the sign-ups and payments each brought; the website's campaigns.
  const sources = await all<{ source: string; installs: number; signups: number; paid: number }>(
    `SELECT COALESCE(i.source, CASE WHEN i.invite_code IS NOT NULL THEN 'invite' ELSE 'direct' END) AS source, COUNT(*) AS installs,
       SUM(i.member_id IS NOT NULL) AS signups,
       SUM(CASE WHEN i.member_id IS NOT NULL AND EXISTS (SELECT 1 FROM events p WHERE p.member_id = i.member_id AND p.name = 'paid') THEN 1 ELSE 0 END) AS paid
     FROM installs i WHERE i.first_open_at >= ? GROUP BY 1 ORDER BY installs DESC LIMIT 30`, since90);
  const campaigns = await hogql(env, "campaigns-30",
    `SELECT coalesce(properties.utm_source, '(none)') AS source, coalesce(properties.utm_campaign, '') AS campaign, count(DISTINCT person_id) AS visitors
     FROM events WHERE ${SITE} AND timestamp >= now() - INTERVAL 30 DAY GROUP BY source, campaign ORDER BY visitors DESC LIMIT 25`, now);
  const instJoins = await all<{ name: string; n: number }>(
    "SELECT i.name, COUNT(*) AS n FROM inst_members m JOIN institutes i ON i.id = m.institute_id WHERE m.role = 'student' AND m.joined_at >= ? GROUP BY i.id ORDER BY n DESC LIMIT 20", since90 + "T00:00:00Z");
  const sourcesCard = {
    title: "Where people come from",
    says: "Last 90 days of installs by the link that brought them (Telegram, YouTube, posts, the books' QR codes, invites), with how many signed up and paid. The website's campaigns come from PostHog.",
    installs: sources.map((r) => ({ ...r, signupPct: pct(r.signups, r.installs) })),
    centreInvites: instJoins,
    campaigns: campaigns.connected ? campaigns.rows.map((r) => ({ source: r[0], campaign: r[1] || null, visitors: Number(r[2]) || 0 })) : null,
    posthog: phMeta(campaigns),
  };

  // 4. Return by signup week (moved here from Growth; same numbers).
  const growth = await growthReport(env, now);
  const returnCard = {
    title: "Return",
    says: "Of the people who started in a week, how many came back the next day, in their second week and a month on. A week shows a number only once everyone in it has had the full time.",
    weeks: growth.retention.slice(0, 12),
  };

  // 5. What gets used: features, and the pieces people start and finish.
  const usage = await all<{ name: string; n: number; people: number }>(
    `SELECT name, COUNT(*) AS n, COUNT(DISTINCT COALESCE(member_id, install_id)) AS people FROM events WHERE day >= ? AND name IN (${STUDY_EVENTS.map(() => "?").join(",")}) GROUP BY name ORDER BY people DESC`,
    since30, ...STUDY_EVENTS);
  const pieces = async (open: string, done: string, key: string) => {
    const rows = await all<{ piece: string; opened: number; finished: number }>(
      `SELECT json_extract(props, '$.${key}') AS piece, COUNT(DISTINCT CASE WHEN name = ? THEN COALESCE(member_id, install_id) END) AS opened,
         COUNT(DISTINCT CASE WHEN name = ? THEN COALESCE(member_id, install_id) END) AS finished
       FROM events WHERE day >= ? AND name IN (?, ?) AND json_extract(props, '$.${key}') IS NOT NULL GROUP BY 1`, open, done, since30, open, done);
    const list = rows.map((r) => ({ ...r, finishedPct: pct(Math.min(r.finished, r.opened), r.opened) }));
    return {
      most: [...list].sort((a, b) => b.opened - a.opened).slice(0, 10),
      // Pieces that lose people: opened by at least 5, finished by the fewest.
      lose: list.filter((r) => r.opened >= 5).sort((a, b) => (a.finishedPct ?? 0) - (b.finishedPct ?? 0)).slice(0, 5),
    };
  };
  const studyDaily = await all<{ day: string; n: number }>(
    `SELECT day, COUNT(DISTINCT member_id) AS n FROM events WHERE member_id IS NOT NULL AND day >= ? AND name IN (${STUDY_EVENTS.map(() => "?").join(",")}) GROUP BY day`, since30, ...STUDY_EVENTS);
  const usedCard = {
    title: "What gets used",
    says: "Last 30 days: each feature by the number of people who used it, and the notes, audio and videos people open and finish. The bottom lists show which piece loses people.",
    features: usage,
    notes: await pieces("note_open", "note_done", "node"),
    audio: await pieces("audio_play", "audio_done", "node"),
    videos: await pieces("video_play", "video_done", "id"),
    trend: { what: "Members who studied a day", values: series(studyDaily) },
  };

  // 6. Learning health.
  const answers = await one<{ n: number; people: number; right: number }>(
    "SELECT COUNT(*) AS n, COUNT(DISTINCT COALESCE(member_id, install_id)) AS people, SUM(CAST(json_extract(props, '$.right') AS INTEGER)) AS right FROM events WHERE name = 'practice_answer' AND day >= ?", since30);
  const activeMembers = await one<{ n: number }>("SELECT COUNT(DISTINCT member_id) AS n FROM events WHERE member_id IS NOT NULL AND day >= ?", since30);
  const reviews = await one<{ cards: number; kept: number; sessions: number }>(
    "SELECT SUM(CAST(json_extract(props, '$.cards') AS INTEGER)) AS cards, SUM(CAST(json_extract(props, '$.kept') AS INTEGER)) AS kept, COUNT(*) AS sessions FROM events WHERE name = 'review_done' AND day >= ?", since30);
  const writing = await all<{ name: string; n: number }>(
    "SELECT name, COUNT(*) AS n FROM events WHERE name IN ('answer_submit', 'answer_rewrite', 'answer_evaluated') AND day >= ? GROUP BY name", since30);
  const wrong = await all<{ node: string; n: number; wrong: number; people: number }>(
    `SELECT json_extract(props, '$.node') AS node, COUNT(*) AS n, SUM(CAST(json_extract(props, '$.right') AS INTEGER) = 0) AS wrong, COUNT(DISTINCT COALESCE(member_id, install_id)) AS people
     FROM events WHERE name = 'practice_answer' AND day >= ? AND json_extract(props, '$.node') IS NOT NULL GROUP BY 1 HAVING n >= 10 ORDER BY 1.0 * wrong / n DESC LIMIT 10`, since30);
  const answersDaily = await all<{ day: string; n: number }>("SELECT day, COUNT(*) AS n FROM events WHERE name = 'practice_answer' AND day >= ? GROUP BY day", since30);
  const w = (n: string) => writing.find((r) => r.name === n)?.n ?? 0;
  const healthCard = {
    title: "Learning health",
    says: "Last 30 days. Questions answered for each active member, how much of each day's review comes back right (each item returns days after it was learnt), Mains answers written and rewritten, and the topics most often wrong.",
    answersPerActive: activeMembers?.n ? Math.round(((answers?.n ?? 0) / activeMembers.n) * 10) / 10 : null,
    answers: answers?.n ?? 0, rightPct: pct(answers?.right ?? 0, answers?.n ?? 0),
    review: { sessions: reviews?.sessions ?? 0, cards: reviews?.cards ?? 0, keptPct: pct(reviews?.kept ?? 0, reviews?.cards ?? 0) },
    writing: { written: w("answer_submit"), rewritten: w("answer_rewrite"), secondOpinions: w("answer_evaluated") },
    mostWrong: wrong.map((r) => ({ ...r, wrongPct: pct(r.wrong, r.n) })),
    trend: { what: "Questions answered a day", values: series(answersDaily) },
  };

  // 7. Where it breaks (PostHog): errors by screen, last 7 days, with a masked replay of one.
  const errors = await hogql(env, "errors-7",
    `SELECT coalesce(properties.screen, replaceRegexpAll(properties.$current_url, '^https?://[^/]+', '')) AS screen, coalesce(properties.platform, 'web') AS platform,
       count() AS n, count(DISTINCT person_id) AS people, any(properties.$session_id) AS session
     FROM events WHERE event = '$exception' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY screen, platform ORDER BY n DESC LIMIT 15`, now);
  const errorsDaily = await hogql(env, "errors-daily",
    `SELECT toDate(timestamp, 'Asia/Kolkata') AS day, count() FROM events WHERE event = '$exception' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY day ORDER BY day`, now);
  const breaksCard = {
    title: "Where it breaks",
    says: "Errors and crashes by screen over the last 7 days, from PostHog. A replay shows taps and screens with every word hidden.",
    errors: errors.connected ? errors.rows.map((r) => ({ screen: String(r[0] ?? "") || "(unknown)", platform: r[1], n: Number(r[2]) || 0, people: Number(r[3]) || 0,
      replay: typeof r[4] === "string" && /^[\w-]{8,80}$/.test(r[4]) ? `${REPLAY(env)}/${r[4]}` : null })) : null,
    replays: REPLAY(env),
    posthog: { ...phMeta(errors), trend: phSeries(errorsDaily) },
  };

  // 8. Organisations: each centre's students, how many were active each week, answers checked, Plus share.
  const insts = await all<{ id: string; name: string; status: string }>("SELECT id, name, status FROM institutes ORDER BY created_at");
  const orgRows = [];
  for (const i of insts) {
    const ids = (await all<{ member_id: string }>("SELECT member_id FROM inst_members WHERE institute_id = ? AND role = 'student' AND status = 'active'", i.id)).map((r) => r.member_id);
    const q = ids.map(() => "?").join(",") || "NULL";
    const weekly = ids.length ? await all<{ wk: number; n: number }>(
      `SELECT CAST((julianday(?) - julianday(day)) / 7 AS INTEGER) AS wk, COUNT(DISTINCT member_id) AS n FROM events WHERE member_id IN (${q}) AND day > ? GROUP BY wk`, today, ...ids, addDays(today, -28)) : [];
    const checked = await one<{ n: number }>("SELECT COUNT(*) AS n FROM inst_doubts WHERE institute_id = ? AND status IN ('answered', 'resolved') AND updated_at >= ?", i.id, since30 + "T00:00:00Z");
    const setAnswers = await one<{ n: number }>("SELECT COALESCE(SUM(total), 0) AS n FROM inst_attempts WHERE institute_id = ? AND at >= ?", i.id, since30 + "T00:00:00Z");
    const plus = ids.length ? await one<{ n: number }>(`SELECT COUNT(*) AS n FROM entitlements WHERE member_id IN (${q}) AND ends_at > ? AND cancelled_at IS NULL AND test = 0`, ...ids, new Date(now).toISOString()) : { n: 0 };
    orgRows.push({
      id: i.id, name: i.name, status: i.status, students: ids.length,
      activeByWeek: [0, 1, 2, 3].map((k) => weekly.find((x) => x.wk === k)?.n ?? 0),
      doubtsAnswered30: checked?.n ?? 0, setAnswers30: setAnswers?.n ?? 0,
      plus: plus?.n ?? 0, plusPct: pct(plus?.n ?? 0, ids.length),
    });
  }
  const orgCard = {
    title: "Organisations",
    says: "Each coaching centre: students now in it, how many used Aspiran in each of the last four weeks (this week first), doubts its teachers answered and question-set answers in 30 days, and how many of its students are on Plus.",
    centres: orgRows,
  };

  return {
    today, posthogConnected: !!env.POSTHOG_PERSONAL_KEY,
    cards: { today: todayCard, funnel, sources: sourcesCard, return: returnCard, used: usedCard, health: healthCard, breaks: breaksCard, organisations: orgCard },
    note: "Our own database for members, pods, centres and payments; PostHog for the website, screens and errors, fetched at most once an hour. No text anyone wrote is in either.",
  };
}
