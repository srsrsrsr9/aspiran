import { type Env } from "./shared";
import { insightsReport } from "./insights";
import { growthReport } from "./metrics";

/**
 * Admin → Home → "How it's going": one short summary for marketing, product and content, built from the Insights and
 * Growth reports (the same events table, nothing new is collected). Counts only, never who.
 *
 * Those reports scan the events table, so this summary is worked out at most once an hour and kept (in memory, and in
 * R2 BACKUPS under _cache/admin/ so a fresh worker doesn't redo it). "Work it out again" passes ?fresh=1.
 */

const HOUR = 3600_000;
const KEY = "_cache/admin/glance.json";
let mem: { at: number; data: unknown } | null = null;

export async function glance(env: Env, fresh = false) {
  const now = Date.now();
  let cached = mem;
  if (!cached && env.BACKUPS && !fresh) {
    try { const o = await env.BACKUPS.get(KEY); if (o) cached = await o.json(); } catch { cached = null; }
  }
  if (cached && !fresh && now - cached.at < HOUR) return { ...(cached.data as object), at: new Date(cached.at).toISOString(), cached: true };
  const data = await build(env);
  mem = { at: now, data };
  if (env.BACKUPS) await env.BACKUPS.put(KEY, JSON.stringify(mem), { httpMetadata: { contentType: "application/json" } }).catch(() => {});
  return { ...data, at: new Date(now).toISOString(), cached: false };
}

async function build(env: Env) {
  const [ins, g] = await Promise.all([insightsReport(env), growthReport(env)]);
  const C = ins.cards as any;
  const step = (name: string) => C.funnel.steps.find((s: any) => s.step === name)?.n ?? null;
  // The newest signup week that has had the full time for each measure.
  const latest = (k: "d1" | "d7") => { const w = (g.retention as any[]).find((r) => r[k] != null); return w ? { week: w.week, people: w.people, pct: w[k] } : null; };
  const act = (name: string) => (g.activation.steps as any[]).find((s) => s.step === name) ?? null;
  const top3 = (x: any) => ({ most: x.most.slice(0, 3), lose: x.lose.slice(0, 3) });
  return {
    marketing: {
      funnel30: { demo: step("Started the demo"), signedUp: step("Signed up"), activeWeek1: step("Active in week 1"), plusPage: step("Saw the Plus page"), paid: step("Paid") },
      sources: (C.sources.installs as any[]).slice(0, 5),
      websiteConnected: !!ins.posthogConnected,
    },
    product: {
      activation: { started: g.activation.started, onboarded: act("onboarding_done"), pod: act("pod_joined"), chotu: act("first_chotu_chat"), ritual: act("ritual") },
      returnNextDay: latest("d1"),
      returnSecondWeek: latest("d7"),
      features: (C.used.features as any[]).slice(0, 8),
      studiedTrend: C.used.trend,
    },
    content: {
      notes: top3(C.used.notes), audio: top3(C.used.audio), videos: top3(C.used.videos),
      ratings: (g.feedback.ratings as any[]).slice(0, 6),
      mostWrong: (C.health.mostWrong as any[]).slice(0, 3),
      reviewKeptPct: C.health.review.keptPct,
    },
  };
}
