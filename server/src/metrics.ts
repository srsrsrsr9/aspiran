import { type Env, bad, istDay, json } from "./shared";
import { ensureSchema } from "./staff";

/**
 * Growth metrics: our own events table, on our own server. No third-party trackers, no SDKs.
 *
 * What is kept: an event name, a member id and/or a random install id, the day, and a few whitelisted props that
 * are numbers or short codes (a source, an invite code, a ritual kind, minutes). Never free text: no mood, journal,
 * chat or answer text, and no names. Feedback is a tap (1 to 3) or a choice from a fixed list.
 *
 * Erasure ("Delete my data") anonymises a member's events: the counts stay, the link to them goes (privacy.ts).
 */

const DAY = 86400_000;
const validId = (v: unknown) => typeof v === "string" && /^[\w-]{16,64}$/.test(v);
const code = (v: unknown, max = 40) => (typeof v === "string" && new RegExp(`^[\\w.:-]{1,${max}}$`).test(v) ? v : null);
const count = (v: unknown, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : null; };

/** A whole number from min to max, or null (ratings and check-in choices are refused, not clamped). */
const choice = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };

/** Ritual kinds a client may report. */
export const RITUALS = ["close_day", "answer_hour", "quiz", "wins", "goal", "commons", "focus"] as const;
/** Moments that get the one-tap rating, and the two day-7 questions with their fixed choices. */
export const RATING_MOMENTS = ["pod_joined", "close_day", "chotu_chat", "quiz", "roadmap", "chai"] as const;
export const CHECKIN = {
  q1: { text: "How useful has UPSC Pods been in your first week?", choices: ["Very useful", "Somewhat", "Not yet"] },
  q2: { text: "What would help you most next?", choices: ["A livelier pod", "More practice questions", "A study plan", "Better Chotu answers", "Something else"] },
} as const;

/**
 * Events and their allowed props. Anything else in `props` is dropped. Some events are only ever written by the
 * server (signup, pod_joined, first_chotu_chat, checkout_started, paid, refunded) and are refused from clients.
 */
const CLIENT_EVENTS: Record<string, (p: any) => Record<string, unknown> | null> = {
  first_open: (p) => ({ source: code(p.source), invite: code(p.invite, 24), referrer: referrer(p.referrer) }),
  app_open: () => ({}),
  onboarding_done: () => ({}),
  ritual: (p) => ((RITUALS as readonly string[]).includes(p.kind) ? { kind: p.kind } : null),
  chai_read: (p) => ({ cards: count(p.cards, 20) ?? 1 }),
  prep_minutes: (p) => { const m = count(p.minutes, 600); return m ? { minutes: m } : null; },
  offer_shown: (p) => ({ moment: code(p.moment, 30) }),
  roadmap_built: () => ({}),
  // The app says a Chotu chat happened (no text); only the first one per member is kept, as first_chotu_chat.
  chotu_chat: () => ({}),
};
const SERVER_EVENTS = new Set(["signup", "pod_joined", "first_chotu_chat", "checkout_started", "paid", "refunded"]);

/**
 * The Play install referrer arrives as a URL-encoded query string (utm_source=...&utm_campaign=...). Only the utm
 * source, medium and campaign are kept, as short codes; anything else in it is dropped.
 */
export function referrer(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  let q: URLSearchParams;
  try { q = new URLSearchParams(decodeURIComponent(raw.slice(0, 500))); } catch { return null; }
  const parts = ["utm_source", "utm_medium", "utm_campaign"].map((k) => code(q.get(k), 40)).map((v) => v ?? "");
  return parts.some(Boolean) ? parts.join("/") : null;
}

/** Writes one event. Server code calls this directly; counting never breaks a request. */
export async function logEvent(env: Env, name: string, who: { memberId?: string | null; installId?: string | null }, props: Record<string, unknown> = {}) {
  try {
    await ensureSchema(env);
    const now = new Date();
    const clean = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== null && v !== undefined));
    await env.DB.prepare("INSERT INTO events (member_id, install_id, name, props, day, at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(validId(who.memberId) ? who.memberId : null, validId(who.installId) ? who.installId : null, name, Object.keys(clean).length ? JSON.stringify(clean) : null, istDay(now), now.toISOString()).run();
  } catch { /* metrics never break a request */ }
}

/** Once per member: the first time something happens (first Chotu chat). */
export async function logFirst(env: Env, name: string, memberId: string, props: Record<string, unknown> = {}) {
  if (!validId(memberId)) return;
  try {
    await ensureSchema(env);
    if (await env.DB.prepare("SELECT 1 FROM events WHERE member_id = ? AND name = ? LIMIT 1").bind(memberId, name).first()) return;
    await logEvent(env, name, { memberId }, props);
  } catch { /* never breaks a request */ }
}

/** POST /events, /feedback, GET /checkin. Open routes: first_open happens before anyone signs in. */
export async function metricsRoute(req: Request, env: Env, path: string, { memberTrusted = true } = {}): Promise<Response | null> {
  if (path === "/checkin" && req.method === "GET") return json({ ...CHECKIN, moments: RATING_MOMENTS });
  if (path !== "/events" && path !== "/feedback") return null;
  if (req.method !== "POST") return bad("POST only", 405);
  const body = await req.json<any>().catch(() => null);
  if (!body || typeof body !== "object") return bad("Expected a JSON object");
  const memberId = memberTrusted && validId(body.memberId) ? body.memberId : null;
  const installId = validId(body.installId) ? body.installId : null;
  if (!memberId && !installId) return bad("installId or memberId is required");
  await ensureSchema(env);

  if (path === "/feedback") {
    const now = new Date();
    if (body.kind === "checkin") {
      const a1 = choice(body.q1, 0, CHECKIN.q1.choices.length - 1), a2 = choice(body.q2, 0, CHECKIN.q2.choices.length - 1);
      if (a1 === null || a2 === null) return bad("q1 and q2 must be choice numbers");
      await env.DB.prepare("INSERT INTO feedback (member_id, install_id, moment, rating, day, at) VALUES (?, ?, 'day7_q1', ?, ?, ?), (?, ?, 'day7_q2', ?, ?, ?)")
        .bind(memberId, installId, a1, istDay(now), now.toISOString(), memberId, installId, a2, istDay(now), now.toISOString()).run();
      return json({ ok: true });
    }
    const moment = String(body.moment ?? "");
    const rating = choice(body.rating, 1, 3);
    if (!(RATING_MOMENTS as readonly string[]).includes(moment) || !rating) return bad("moment and rating (1 to 3) are required");
    await env.DB.prepare("INSERT INTO feedback (member_id, install_id, moment, rating, day, at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(memberId, installId, moment, rating, istDay(now), now.toISOString()).run();
    return json({ ok: true });
  }

  const list = Array.isArray(body.events) ? body.events.slice(0, 20) : [{ name: body.name, props: body.props }];
  let kept = 0;
  for (const e of list) {
    const name = String(e?.name ?? "");
    if (SERVER_EVENTS.has(name)) continue;
    const pick = CLIENT_EVENTS[name];
    const props = pick ? pick(e.props ?? {}) : null;
    if (!props) continue;
    if (name === "chotu_chat") { if (memberId) { await logFirst(env, "first_chotu_chat", memberId); kept++; } continue; }
    if (name === "first_open") {
      // One row per install. A second first_open (reinstall with the same id) changes nothing.
      const platform = ["android", "web"].includes(body.platform) ? body.platform : "unknown";
      if (!installId) continue;
      const r = await env.DB.prepare("INSERT INTO installs (install_id, platform, source, invite_code, referrer, first_open_at, member_id) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(install_id) DO NOTHING")
        .bind(installId, platform, props.source ?? (props.referrer ? String(props.referrer).split("/")[0] || null : null), props.invite, props.referrer, new Date().toISOString(), memberId).run();
      if (!r.meta.changes) continue;
    }
    // Retention counts one open a day per person.
    if (name === "app_open" && memberId && await env.DB.prepare("SELECT 1 FROM events WHERE member_id = ? AND name = 'app_open' AND day = ?").bind(memberId, istDay()).first()) continue;
    await logEvent(env, name, { memberId, installId }, { ...props, ...(name === "first_open" ? { platform: body.platform } : {}) });
    kept++;
  }
  // The install's member id, once known, so installs can be followed to sign-ups.
  if (memberId && installId) await env.DB.prepare("UPDATE installs SET member_id = ? WHERE install_id = ? AND member_id IS NULL").bind(memberId, installId).run();
  return json({ ok: true, kept });
}

/** Erasure: keep the counts, drop the link to the person. */
export function anonymiseStatements(env: Env, memberId: string) {
  return [
    env.DB.prepare("UPDATE events SET member_id = NULL, install_id = NULL WHERE member_id = ?").bind(memberId),
    env.DB.prepare("UPDATE feedback SET member_id = NULL, install_id = NULL WHERE member_id = ?").bind(memberId),
    env.DB.prepare("UPDATE installs SET member_id = NULL WHERE member_id = ?").bind(memberId),
  ];
}

// --- The Growth page (admin) -------------------------------------------------------------------------------

/** The pod test (plan §2): share of pod members still active in their 4th week. Below 30% stop; above 50% strong. */
export const POD_TEST = { stopBelow: 30, strongAbove: 50, minSample: 30 };

const weekOf = (day: string) => { const d = new Date(day + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

export async function growthReport(env: Env, now = Date.now()) {
  await ensureSchema(env);
  const today = istDay(new Date(now));
  const since90 = addDays(today, -90), since30 = addDays(today, -30);
  const all = async <T = any>(sql: string, ...b: unknown[]) => (await env.DB.prepare(sql).bind(...b).all<T>()).results;

  // Installs by source (last 90 days), and how many of them signed up.
  const bySource = await all<{ source: string; platform: string; installs: number; signups: number }>(
    `SELECT COALESCE(source, CASE WHEN invite_code IS NOT NULL THEN 'invite' ELSE 'direct' END) AS source, platform, COUNT(*) AS installs, SUM(member_id IS NOT NULL) AS signups
     FROM installs WHERE first_open_at >= ? GROUP BY 1, 2 ORDER BY installs DESC LIMIT 50`, since90);
  const invites = await all<{ invite: string; installs: number }>(
    "SELECT invite_code AS invite, COUNT(*) AS installs FROM installs WHERE invite_code IS NOT NULL AND first_open_at >= ? GROUP BY 1 ORDER BY 2 DESC LIMIT 20", since90);

  // Each person's start: their signup (or onboarding, for installs from before sign-in), and every day they were active.
  const starts = await all<{ member_id: string; day: string }>(
    "SELECT member_id, MIN(day) AS day FROM events WHERE member_id IS NOT NULL AND name IN ('signup', 'onboarding_done') AND day >= ? GROUP BY member_id", since90);
  const firsts = await all<{ member_id: string; name: string; day: string }>(
    "SELECT member_id, name, MIN(day) AS day FROM events WHERE member_id IS NOT NULL AND name IN ('onboarding_done', 'pod_joined', 'first_chotu_chat', 'ritual', 'paid') AND day >= ? GROUP BY member_id, name", since90);
  const active = await all<{ member_id: string; day: string }>(
    "SELECT DISTINCT member_id, day FROM events WHERE member_id IS NOT NULL AND day >= ?", since90);
  const activeDays = new Map<string, Set<string>>();
  for (const r of active) (activeDays.get(r.member_id) ?? activeDays.set(r.member_id, new Set()).get(r.member_id)!).add(r.day);
  const firstOf = new Map<string, Record<string, string>>();
  for (const r of firsts) (firstOf.get(r.member_id) ?? firstOf.set(r.member_id, {}).get(r.member_id)!)[r.name] = r.day;

  // Activation: of people who started in the last 30 days, how many reached each step within 7 days.
  const recent = starts.filter((s) => s.day >= since30);
  const within7 = (s: { member_id: string; day: string }, name: string) => { const d = firstOf.get(s.member_id)?.[name]; return !!d && d <= addDays(s.day, 7); };
  const steps = ["onboarding_done", "pod_joined", "first_chotu_chat", "ritual"];
  const activation = { started: recent.length, steps: steps.map((name) => { const n = recent.filter((s) => within7(s, name)).length; return { step: name, n, pct: pct(n, recent.length) }; }) };

  // Return by signup week: D1 = active the next day; D7 = active on day 7 to 13; D30 = active on day 30 to 36.
  // A cohort's number is shown only once every member in it has had the full window.
  const back = (s: { member_id: string; day: string }, from: number, to: number) => { const days = activeDays.get(s.member_id); if (!days) return false; for (let i = from; i <= to; i++) if (days.has(addDays(s.day, i))) return true; return false; };
  const cohorts = new Map<string, { member_id: string; day: string }[]>();
  for (const s of starts) (cohorts.get(weekOf(s.day)) ?? cohorts.set(weekOf(s.day), []).get(weekOf(s.day))!).push(s);
  const retention = [...cohorts.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).map(([week, people]) => {
    const ready = (to: number) => addDays(week, 6 + to) < today;
    const rate = (from: number, to: number) => (ready(to) ? pct(people.filter((p) => back(p, from, to)).length, people.length) : null);
    return { week, people: people.length, d1: rate(1, 1), d7: rate(7, 13), d30: rate(30, 36) };
  });

  // Feedback: one-tap ratings by moment (1 not really, 2 okay, 3 helpful), and the day-7 check-in answers.
  const ratings = await all<{ moment: string; n: number; avg: number; r1: number; r2: number; r3: number }>(
    `SELECT moment, COUNT(*) AS n, ROUND(AVG(rating), 2) AS avg, SUM(rating = 1) AS r1, SUM(rating = 2) AS r2, SUM(rating = 3) AS r3
     FROM feedback WHERE moment NOT LIKE 'day7_%' AND day >= ? GROUP BY moment ORDER BY n DESC`, since90);
  const checkinRows = await all<{ moment: string; rating: number; n: number }>(
    "SELECT moment, rating, COUNT(*) AS n FROM feedback WHERE moment LIKE 'day7_%' AND day >= ? GROUP BY moment, rating", since90);
  const checkin = (["q1", "q2"] as const).map((q) => ({
    question: CHECKIN[q].text,
    answers: CHECKIN[q].choices.map((choice, i) => ({ choice, n: checkinRows.find((r) => r.moment === `day7_${q}` && r.rating === i)?.n ?? 0 })),
  }));

  // Paid funnel (last 30 days): offers shown, checkouts started, paid, refunded.
  const funnelRows = await all<{ name: string; n: number; people: number }>(
    "SELECT name, COUNT(*) AS n, COUNT(DISTINCT member_id) AS people FROM events WHERE name IN ('offer_shown', 'checkout_started', 'paid', 'refunded') AND day >= ? GROUP BY name", since30);
  const f = (name: string) => funnelRows.find((r) => r.name === name) ?? { n: 0, people: 0 };
  const paidFunnel = {
    window: `since ${since30}`,
    offerShown: f("offer_shown").n, checkoutStarted: f("checkout_started").n, paid: f("paid").n, refunded: f("refunded").n,
    checkoutPerOfferPct: pct(f("checkout_started").n, f("offer_shown").n), paidPerCheckoutPct: pct(f("paid").n, f("checkout_started").n),
  };

  // The pod test: members who joined a pod 28 to 90 days ago, active at all in days 21 to 27 after joining.
  const joins = await all<{ member_id: string; day: string }>(
    "SELECT member_id, MIN(day) AS day FROM events WHERE member_id IS NOT NULL AND name = 'pod_joined' AND day >= ? AND day <= ? GROUP BY member_id", since90, addDays(today, -28));
  const week4 = joins.filter((j) => back(j, 21, 27)).length;
  const week4Pct = pct(week4, joins.length);
  const verdict = joins.length < POD_TEST.minSample ? "too_few" : week4Pct! < POD_TEST.stopBelow ? "stop" : week4Pct! > POD_TEST.strongAbove ? "strong" : "keep_testing";

  return {
    today, installsBySource: bySource, invites, activation, retention, feedback: { ratings, checkin }, paidFunnel,
    podTest: { joined: joins.length, activeWeek4: week4, pct: week4Pct, verdict, thresholds: POD_TEST },
    note: "Counted on our own server only. No third-party trackers. No mood, journal or chat text is ever logged.",
  };
}
