import { type Env, bad, istDay, istNow, json } from "./shared";
import { activeResult, resultDays } from "./results";
import { bump, ensureSchema, flags } from "./staff";
import { logEvent } from "./metrics";
import { cashfreeConfigured, paymentsStatus } from "./payments";
import { caKeyFor } from "./ca";
import { PLAY_PRODUCT, playConfigured } from "./play";

/**
 * Plus (spec §7), behind the "plus" flag, which is off by default. Real payments are one-time yearly Plus on the
 * web through Cashfree (payments.ts), once its keys are set. Until then, and only then, a "purchase" is a labelled
 * test entitlement. Google Play Billing in the Android app (play.ts) is built but off, behind its own "play_billing" flag.
 *
 * The never-list is enforced here as well as in the apps: an offer is only ever returned for the Prep surface,
 * at a listed value moment, and never within 72 hours of a result, during distress, in pause mode, or after
 * 22:30. Apps report every offer they show; one shown anywhere else is counted as a forbidden impression.
 */

export const LIMITS = { free: { feedbackPerWeek: 3, mocksPerMonth: 1, cloudChotuPerDay: 15 }, plus: { feedbackPerWeek: Infinity, mocksPerMonth: Infinity, cloudChotuPerDay: 100 } };
// One price on show: a year of Plus at ₹9,999 (owner, 23 Oct). Monthly stays only for test-mode purchases and gifts; it is never shown.
export const PRICES = { monthly: { inr: 299, days: 30 }, yearly: { inr: 9999, days: 365 } } as const;
const TRIAL_DAYS = 7;
const DAY = 86400_000;

/** The only surface an offer may appear on. */
export const OFFER_SURFACES = ["prep"] as const;
/** Everywhere else, named so a slip shows up by surface in the admin metric. */
export const FORBIDDEN_SURFACES = ["adda", "pod", "commons", "chotu_talk", "close_the_day", "calm", "me", "onboarding", "chai_card"] as const;
export const MOMENTS: Record<string, { title: string; body: string }> = {
  feedback_used: { title: "That was your third free feedback this week", body: "Plus gives unlimited, deeper feedback on every answer. Your free three come back on Monday either way." },
  mock_band: { title: "Want the subject breakdown?", body: "Plus adds every mock, with the subject breakdown, your trend and an error log. Your free mock and band stay free." },
  chotu_cloud: { title: "Chotu's out of cloud turns for today", body: "It still works offline on your phone. Plus gives you 100 cloud turns a day." },
  rhythm_week4: { title: "Four weeks of rhythm", body: "A preview of the Plus plan: a personal plan that rebuilds itself each week from what you actually did." },
  notification_day: { title: "UPSC notification is out", body: "A Prelims sprint: a 100-day plan with a weekly group mentor call. Only if it helps." },
  mains_sprint: { title: "Heading to Mains?", body: "A Mains sprint: a structured plan and weekly human review. Take your time deciding." },
  compass_repeater: { title: "Talk it through with a mentor?", body: "A mentor diagnostic looks at where marks are leaking. No promises about results, just a clear look." },
};

export interface OfferContext { resultWithin72h?: boolean; distress?: boolean; paused?: boolean; localTime?: string }

/** Why an offer can't show, or null when it may. Pure, so the apps and tests can check the same rules. */
export function offerBlocked(surface: string, moment: string, ctx: OfferContext, now = new Date()): string | null {
  if (!(OFFER_SURFACES as readonly string[]).includes(surface)) return "surface";
  if (!MOMENTS[moment]) return "moment";
  if (ctx.resultWithin72h) return "result";
  if (ctx.distress) return "distress";
  if (ctx.paused) return "paused";
  const hm = /^\d{2}:\d{2}$/.test(ctx.localTime ?? "") ? ctx.localTime! : istNow(now).toISOString().slice(11, 16);
  if (hm >= "22:30" || hm < "06:00") return "late";
  return null;
}

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));
const weekStart = (day = istDay()) => { const d = new Date(day + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };

interface Ent { member_id: string; plan: string; source: string; starts_at: string; ends_at: string; cancelled_at: string | null; trial_used: number }

async function entitlement(env: Env, memberId: string): Promise<{ plan: string; source: string; endsAt: string; cancelled: boolean; trial: boolean } | null> {
  const e = await env.DB.prepare("SELECT * FROM entitlements WHERE member_id = ?").bind(memberId).first<Ent>();
  if (e && e.ends_at > new Date().toISOString()) return { plan: e.plan, source: e.source, endsAt: e.ends_at, cancelled: !!e.cancelled_at, trial: e.source === "trial" };
  // Active pod leads get Plus free (a pod with 3 or more people).
  const lead = await env.DB.prepare("SELECT id FROM pods WHERE lead_member = ? AND size >= 3 AND merged_into IS NULL").bind(memberId).first();
  if (lead) return { plan: "plus", source: "pod-lead", endsAt: "", cancelled: false, trial: false };
  return null;
}

async function used(env: Env, memberId: string) {
  const day = istDay();
  const sum = async (kind: string, from: string) => (await env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM usage WHERE member_id = ? AND kind = ? AND day >= ?").bind(memberId, kind, from).first<{ n: number }>())?.n ?? 0;
  return { feedbackThisWeek: await sum("feedback", weekStart(day)), mocksThisMonth: await sum("mock", day.slice(0, 8) + "01"), chotuToday: await sum("chotu", day) };
}

const limitFor = (kind: string, isPlus: boolean) => {
  const l = isPlus ? LIMITS.plus : LIMITS.free;
  return kind === "feedback" ? l.feedbackPerWeek : kind === "mock" ? l.mocksPerMonth : l.cloudChotuPerDay;
};

/** Counts one use if it's within the member's allowance. Without the plus flag nothing is limited or counted. */
export async function useAllowance(env: Env, memberId: string, kind: "feedback" | "mock" | "chotu"): Promise<{ ok: boolean; left: number | null; limit: number | null }> {
  if (!(await flags(env)).plus) return { ok: true, left: null, limit: null };
  await ensureSchema(env);
  const ent = await entitlement(env, memberId);
  if (ent?.source === "staff") return { ok: true, left: null, limit: null }; // Plus given by the owner: no caps at all
  const isPlus = !!ent;
  const u = await used(env, memberId);
  const n = kind === "feedback" ? u.feedbackThisWeek : kind === "mock" ? u.mocksThisMonth : u.chotuToday;
  const limit = limitFor(kind, isPlus);
  if (n >= limit) return { ok: false, left: 0, limit };
  await env.DB.prepare("INSERT INTO usage (member_id, day, kind, n) VALUES (?, ?, ?, 1) ON CONFLICT(member_id, day, kind) DO UPDATE SET n = n + 1").bind(memberId, istDay(), kind).run();
  return { ok: true, left: Number.isFinite(limit) ? limit - n - 1 : null, limit: Number.isFinite(limit) ? limit : null };
}

/**
 * Answer Studio's feedback allowance (answers.ts), enforced even with the plus flag off: free members get
 * LIMITS.free.feedbackPerWeek while total sign-ups are under the threshold, Plus is unlimited. Above the threshold
 * the free allowance is the same until pricing says otherwise. checkFeedback only looks; recordFeedback counts one
 * use, called once the feedback has actually been given.
 */
export async function checkFeedback(env: Env, memberId: string): Promise<{ ok: boolean; left: number | null; limit: number | null; plus: boolean }> {
  await ensureSchema(env);
  const isPlus = !!(await entitlement(env, memberId));
  if (isPlus) return { ok: true, left: null, limit: null, plus: true };
  const n = (await used(env, memberId)).feedbackThisWeek;
  const limit = LIMITS.free.feedbackPerWeek;
  return { ok: n < limit, left: Math.max(0, limit - n), limit, plus: false };
}
export async function recordFeedback(env: Env, memberId: string) {
  await env.DB.prepare("INSERT INTO usage (member_id, day, kind, n) VALUES (?, ?, 'feedback', 1) ON CONFLICT(member_id, day, kind) DO UPDATE SET n = n + 1").bind(memberId, istDay()).run();
}

export async function grant(env: Env, memberId: string, plan: string, source: string, days: number, trialUsed?: boolean, test = true) {
  const now = new Date();
  const cur = await env.DB.prepare("SELECT * FROM entitlements WHERE member_id = ?").bind(memberId).first<Ent>();
  const from = cur && cur.ends_at > now.toISOString() && cur.source !== "trial" ? new Date(cur.ends_at) : now;
  const ends = new Date(from.getTime() + days * DAY).toISOString();
  await env.DB.prepare(`INSERT INTO entitlements (member_id, plan, source, starts_at, ends_at, trial_used, test) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(member_id) DO UPDATE SET plan = excluded.plan, source = excluded.source, ends_at = excluded.ends_at, cancelled_at = NULL,
    trial_used = MAX(entitlements.trial_used, excluded.trial_used), test = excluded.test`).bind(memberId, plan, source, now.toISOString(), ends, trialUsed || cur?.trial_used ? 1 : 0, test ? 1 : 0).run();
  return ends;
}

export async function plusRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (!path.startsWith("/plus")) return null;
  await ensureSchema(env);
  const f = await flags(env);
  const enabled = f.plus;
  const body = req.method === "POST" ? await req.json<any>().catch(() => ({})) : {};
  const memberId = String(body.memberId ?? url.searchParams.get("member") ?? "");

  // Impressions are counted even with the flag off: an offer shown while Plus is off is a slip too.
  if (path === "/plus/impression" && req.method === "POST") {
    const surface = String(body.surface ?? "").slice(0, 30), moment = String(body.moment ?? "").slice(0, 30);
    if ((OFFER_SURFACES as readonly string[]).includes(surface) && enabled) {
      await bump(env, "offer_shown"); await bump(env, "offer_shown:" + moment);
      if (!body.action && MOMENTS[moment]) await logEvent(env, "offer_shown", { memberId: validId(memberId) ? memberId : null }, { moment });
    } else {
      await bump(env, "offer_forbidden_shown"); await bump(env, "offer_forbidden_shown:" + (surface || "unknown"));
    }
    if (["accepted", "not_now"].includes(body.action)) await bump(env, "offer_" + body.action);
    return json({ ok: true });
  }

  if (path === "/plus/status") {
    const ent = validId(memberId) ? await entitlement(env, memberId) : null;
    const row = validId(memberId) ? await env.DB.prepare("SELECT trial_used FROM entitlements WHERE member_id = ?").bind(memberId).first<{ trial_used: number }>() : null;
    const member = validId(memberId) ? await env.DB.prepare("SELECT joined_at FROM members WHERE member_id = ?").bind(memberId).first<{ joined_at: string }>() : null;
    const trialUnlocked = !!member && Date.now() - Date.parse(member.joined_at) >= 7 * DAY;
    return json({
      enabled, testMode: !cashfreeConfigured(env), payments: await paymentsStatus(env), prices: { yearly: PRICES.yearly }, limits: LIMITS.free, plusLimits: { cloudChotuPerDay: LIMITS.plus.cloudChotuPerDay },
      plan: ent, used: validId(memberId) && enabled ? await used(env, memberId) : null,
      trial: { days: TRIAL_DAYS, used: !!row?.trial_used, unlocked: trialUnlocked, why: trialUnlocked ? null : "The 7-day trial unlocks after your first full week in a pod." },
      refundWindowDays: 7, cancel: "Me → Plus → Cancel. Two taps, no questions.",
      // The Android app shows the Play purchase only when on and ready (and only in a build made with PLAY_BILLING).
      play: { on: enabled && f.play_billing, ready: playConfigured(env), productId: PLAY_PRODUCT },
    });
  }
  // The signed query that plays a week's Plus scenes (ca.ts). Any plan counts, flag or not, as for /plus/status.
  if (path === "/plus/ca-key") {
    const week = String(url.searchParams.get("week") ?? body.week ?? "");
    if (!validId(memberId) || !/^\d{4}-\d{2}$/.test(week)) return bad("member and week are required");
    if (!(await entitlement(env, memberId))) return bad("This scene is in Plus", 403);
    return json(await caKeyFor(env, week));
  }
  if (!enabled) return bad("Plus isn't switched on yet.", 404);

  if (path === "/plus/use" && req.method === "POST") {
    if (!validId(memberId) || !["feedback", "mock", "chotu"].includes(body.kind)) return bad("memberId and kind are required");
    return json(await useAllowance(env, memberId, body.kind));
  }
  if (path === "/plus/offer" && req.method === "POST") {
    const surface = String(body.surface ?? ""), moment = String(body.moment ?? "");
    const ctx = { ...(body.context ?? {}) };
    if (activeResult(await resultDays(env))) ctx.resultWithin72h = true;
    const why = offerBlocked(surface, moment, ctx);
    if (why === "surface") await bump(env, "offer_blocked_surface");
    if (why) return json({ offer: null, reason: why });
    if (validId(memberId) && (await entitlement(env, memberId))) return json({ offer: null, reason: "has_plus" });
    return json({ offer: { moment, ...MOMENTS[moment], cta: "See Plus", notNow: "Not now", testMode: true } });
  }
  if (!validId(memberId) && path !== "/plus/scholarships" && !path.startsWith("/plus/gift/")) return bad("memberId is required");

  if (path === "/plus/trial" && req.method === "POST") {
    const row = await env.DB.prepare("SELECT trial_used FROM entitlements WHERE member_id = ?").bind(memberId).first<{ trial_used: number }>();
    if (row?.trial_used) return bad("The trial has been used on this account.", 409);
    const member = await env.DB.prepare("SELECT joined_at FROM members WHERE member_id = ?").bind(memberId).first<{ joined_at: string }>();
    if (!member || Date.now() - Date.parse(member.joined_at) < 7 * DAY) return bad("The 7-day trial unlocks after your first full week in a pod.", 403);
    const endsAt = await grant(env, memberId, "plus", "trial", TRIAL_DAYS, true);
    await bump(env, "trial_started");
    return json({ ok: true, endsAt, testMode: true });
  }
  // TEST MODE: no money moves. Refuses anything not explicitly marked as a test.
  if (path === "/plus/purchase" && req.method === "POST") {
    if (cashfreeConfigured(env)) return bad("Pay with Cashfree: Me → Plus.", 400);
    if (body.testMode !== true) return bad("Real payments aren't set up. Purchases work in test mode only.", 400);
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    const had = await env.DB.prepare("SELECT source FROM entitlements WHERE member_id = ?").bind(memberId).first<{ source: string }>();
    const endsAt = await grant(env, memberId, plan, "test-purchase", PRICES[plan].days);
    await bump(env, "plus_purchases");
    if (had?.source === "trial") await bump(env, "plus_paid_after_trial");
    return json({ ok: true, plan, endsAt, testMode: true, invoice: { id: "TEST-" + Date.now().toString(36).toUpperCase(), amountInr: PRICES[plan].inr, note: "Test mode: no money was charged." } });
  }
  if (path === "/plus/cancel" && req.method === "POST") {
    await env.DB.prepare("UPDATE entitlements SET cancelled_at = ? WHERE member_id = ?").bind(new Date().toISOString(), memberId).run();
    return json({ ok: true, note: "Plus stays on until the end of the period you have. No renewal after that." });
  }
  if (path === "/plus/gift" && req.method === "POST") {
    const plan = body.plan === "yearly" ? "yearly" : "monthly";
    if (cashfreeConfigured(env) || body.testMode !== true) return bad("Gifts work in test mode only for now.", 400);
    const code = [...crypto.getRandomValues(new Uint8Array(6))].map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
    await env.DB.prepare("INSERT INTO gifts (code, plan, created_at) VALUES (?, ?, ?)").bind(code, plan, new Date().toISOString()).run();
    await bump(env, "gift_purchases");
    return json({ code, plan, link: `/app/#gift/${code}`, testMode: true });
  }
  const gift = path.match(/^\/plus\/gift\/([A-Z0-9]{6})(\/redeem)?$/);
  if (gift) {
    const g = await env.DB.prepare("SELECT * FROM gifts WHERE code = ?").bind(gift[1]).first<any>();
    if (!g) return bad("That gift link isn't valid.", 404);
    if (!gift[2]) return json({ valid: !g.redeemed_by, plan: g.plan, testMode: true });
    if (req.method !== "POST" || !validId(memberId)) return bad("memberId is required");
    if (g.redeemed_by) return bad("This gift has already been used.", 409);
    await env.DB.prepare("UPDATE gifts SET redeemed_by = ?, redeemed_at = ? WHERE code = ?").bind(memberId, new Date().toISOString(), gift[1]).run();
    const endsAt = await grant(env, memberId, g.plan, "gift", PRICES[g.plan as "monthly" | "yearly"].days);
    return json({ ok: true, endsAt });
  }
  // One free Plus seat per 10 paid, chosen by pod leads. The count is public.
  if (path === "/plus/scholarships") {
    const paid = (await env.DB.prepare("SELECT COUNT(*) AS n FROM entitlements WHERE source IN ('test-purchase', 'gift', 'cashfree', 'play') AND ends_at > ?").bind(new Date().toISOString()).first<{ n: number }>())?.n ?? 0;
    const awarded = (await env.DB.prepare("SELECT COUNT(*) AS n FROM scholarships").first<{ n: number }>())?.n ?? 0;
    const seats = Math.floor(paid / 10);
    if (req.method === "POST") {
      const nominee = String(body.nominee ?? "");
      const pod = await env.DB.prepare("SELECT id FROM pods WHERE lead_member = ?").bind(memberId).first<{ id: string }>();
      if (!pod) return bad("Only a pod lead can choose a scholarship member.", 403);
      if (!(await env.DB.prepare("SELECT 1 FROM members WHERE member_id = ? AND pod_id = ?").bind(nominee, pod.id).first())) return bad("They need to be in your pod.", 400);
      if (awarded >= seats) return bad("No scholarship seats are free right now.", 409);
      await env.DB.prepare("INSERT INTO scholarships (id, pod_id, nominated_by, member_id, at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), pod.id, memberId, nominee, new Date().toISOString()).run();
      await grant(env, nominee, "plus", "scholarship", 90);
      return json({ ok: true });
    }
    return json({ paid, seats, awarded, open: Math.max(0, seats - awarded), note: "1 free Plus seat for every 10 paid, chosen by pod leads." });
  }
  return bad("Not found", 404);
}
