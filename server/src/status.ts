import { type Env, istDay, istNow } from "./shared";
import { ensureSchema, flags, llmControls } from "./staff";

/**
 * The public status page: live checks for each part of the service, incidents an admin posts,
 * and 30 days of history. Nothing private: no member counts, error text or internal names.
 */

export const COMPONENTS = {
  app: "Apps and website",
  brief: "Daily Chai brief",
  pods: "Pods and chat",
  practice: "Practice and mock papers",
  drafting: "News drafting",
} as const;
type State = "operational" | "degraded" | "outage" | "maintenance";
const RANK: Record<State, number> = { operational: 0, maintenance: 1, degraded: 2, outage: 3 };
const IMPACT_STATE: Record<string, State> = { minor: "degraded", major: "outage", maintenance: "maintenance" };

export async function statusData(env: Env) {
  const comps: Record<string, { name: string; state: State; note: string }> = {};
  for (const [k, name] of Object.entries(COMPONENTS)) comps[k] = { name, state: "operational", note: "" };

  const t0 = Date.now();
  let dbOk = true;
  try { await env.DB.prepare("SELECT 1").first(); await ensureSchema(env); } catch { dbOk = false; }
  const dbMs = Date.now() - t0;
  if (!dbOk) {
    for (const c of Object.values(comps)) { c.state = "outage"; c.note = "Can't reach the database"; }
  } else {
    if (dbMs > 1500) { comps.app.state = "degraded"; comps.app.note = "Slower than usual"; }
    const f = await flags(env);
    const brief = await env.DB.prepare("SELECT published_at FROM briefs WHERE day = ?").bind(istDay()).first<{ published_at: string }>();
    if (brief) comps.brief.note = "Today's brief is out";
    else if (istNow().getUTCHours() >= 8) { comps.brief.state = "degraded"; comps.brief.note = "Today's brief is late"; }
    else comps.brief.note = "Today's brief comes out at 7:00 IST";
    if (!f.pod_chat) { comps.pods.state = "maintenance"; comps.pods.note = "Chat is paused for now"; }
    else if (!f.pod_join) comps.pods.note = "Joining new pods is paused";
    if (!f.practice && !f.mocks) { comps.practice.state = "maintenance"; comps.practice.note = "Paused for now"; }
    const llm = await llmControls(env);
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const r = await env.DB.prepare("SELECT SUM(status = 'ok') AS ok, SUM(status = 'error') AS err FROM llm_calls WHERE at >= ? AND purpose = 'draft'").bind(since).first<{ ok: number; err: number }>();
    if (!llm.enabled || !llm.purposes.draft) { comps.drafting.state = "maintenance"; comps.drafting.note = "Paused; editors write cards by hand"; }
    else if ((r?.err ?? 0) > 2 && (r?.err ?? 0) > (r?.ok ?? 0)) { comps.drafting.state = "degraded"; comps.drafting.note = "Drafts are failing; editors write cards by hand"; }
    else if (!env.AI) comps.drafting.note = "Editors write cards by hand";
  }

  let incidents: any[] = [];
  if (dbOk) {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    incidents = (await env.DB.prepare("SELECT * FROM incidents WHERE resolved_at IS NULL OR resolved_at >= ? ORDER BY started_at DESC").bind(since).all<any>()).results
      .map((i) => ({ id: i.id, title: i.title, component: i.component, impact: i.impact, status: i.status, startedAt: i.started_at, resolvedAt: i.resolved_at, updates: JSON.parse(i.updates) }));
    for (const i of incidents.filter((i) => !i.resolvedAt)) {
      const c = comps[i.component] ?? comps.app;
      const s = IMPACT_STATE[i.impact] ?? "degraded";
      if (RANK[s] > RANK[c.state]) { c.state = s; c.note = i.title; }
    }
  }

  // 30 days, oldest first: the worst incident that touched each day.
  const days: { day: string; state: State }[] = [];
  for (let d = 29; d >= 0; d--) {
    const start = new Date(Date.now() - d * 86400_000);
    const day = istDay(start);
    let state: State = "operational";
    for (const i of incidents) {
      const from = istDay(new Date(i.startedAt));
      const to = i.resolvedAt ? istDay(new Date(i.resolvedAt)) : istDay();
      if (day >= from && day <= to) {
        const s = IMPACT_STATE[i.impact] ?? "degraded";
        if (RANK[s] > RANK[state]) state = s;
      }
    }
    days.push({ day, state });
  }

  const worst = Object.values(comps).reduce<State>((w, c) => (RANK[c.state] > RANK[w] ? c.state : w), "operational");
  const overall = { operational: "Everything is working", maintenance: "Some parts are paused", degraded: "Some parts are having trouble", outage: "Something is down" }[worst];
  return { overall, state: worst, checkedAt: new Date().toISOString(), components: comps, incidents, days };
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " IST";

export function statusHtml(s: Awaited<ReturnType<typeof statusData>>): string {
  const active = s.incidents.filter((i) => !i.resolvedAt);
  const past = s.incidents.filter((i) => i.resolvedAt);
  const incident = (i: any) => `<article class="inc ${esc(i.impact)}"><h3>${esc(i.title)}</h3>
    <p class="muted">${esc((COMPONENTS as any)[i.component] ?? i.component)} · started ${esc(when(i.startedAt))}${i.resolvedAt ? ` · resolved ${esc(when(i.resolvedAt))}` : ""}</p>
    ${[...i.updates].reverse().map((u: any) => `<p><b>${esc(u.status)}</b> <span class="muted">${esc(when(u.at))}</span><br>${esc(u.message)}</p>`).join("")}</article>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>UPSC Pods status</title><meta http-equiv="refresh" content="60">
<style>
:root{--bg:#FFF8F3;--card:#fff;--ink:#221A14;--muted:#6B5D52;--line:#E8DDD3;--ok:#2E7D32;--deg:#B26A00;--out:#C62828;--mnt:#3F6CB3}
@media (prefers-color-scheme:dark){:root{--bg:#1A1410;--card:#251D17;--ink:#F0E6DD;--muted:#B8A99C;--line:#3A2F27;--ok:#7BC47F;--deg:#F0B35A;--out:#F28B82;--mnt:#8AB4F8}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px}h1{font-size:20px;margin:0 0 16px}h2{font-size:16px;margin:28px 0 8px}h3{font-size:15px;margin:0 0 4px}
.banner{border-radius:12px;padding:16px;color:#fff;font-weight:600;font-size:17px}.banner.operational{background:var(--ok)}.banner.degraded{background:var(--deg)}.banner.outage{background:var(--out)}.banner.maintenance{background:var(--mnt)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;margin-top:16px}
.comp{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--line)}.comp:first-child{border-top:0}
.st{font-size:14px;white-space:nowrap}.st.operational{color:var(--ok)}.st.degraded{color:var(--deg)}.st.outage{color:var(--out)}.st.maintenance{color:var(--mnt)}
.muted{color:var(--muted);font-size:13px;margin:0}
.bars{display:flex;gap:3px;padding:16px}.bars span{flex:1;height:32px;border-radius:3px;background:var(--ok)}.bars .degraded{background:var(--deg)}.bars .outage{background:var(--out)}.bars .maintenance{background:var(--mnt)}
.inc{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--deg);border-radius:8px;padding:12px 16px;margin-top:8px}.inc.major{border-left-color:var(--out)}.inc.maintenance{border-left-color:var(--mnt)}
.inc p{margin:6px 0}
</style></head><body><main>
<h1>UPSC Pods status</h1>
<div class="banner ${s.state}" role="status">${esc(s.overall)}</div>
${active.length ? `<h2>Happening now</h2>${active.map(incident).join("")}` : ""}
<div class="card">${Object.values(s.components).map((c) => `<div class="comp"><div><div>${esc(c.name)}</div>${c.note ? `<p class="muted">${esc(c.note)}</p>` : ""}</div>
  <div class="st ${c.state}">${{ operational: "Working", degraded: "Having trouble", outage: "Down", maintenance: "Paused" }[c.state]}</div></div>`).join("")}</div>
<h2>Last 30 days</h2>
<div class="card"><div class="bars" aria-label="One bar per day, oldest first">${s.days.map((d) => `<span class="${d.state}" title="${esc(d.day)}: ${d.state}"></span>`).join("")}</div></div>
${past.length ? `<h2>Past incidents</h2>${past.map(incident).join("")}` : `<p class="muted" style="margin-top:12px">No incidents in the last 30 days.</p>`}
<p class="muted" style="margin-top:24px">Checked ${esc(when(s.checkedAt))}. This page refreshes every minute. Machine-readable: <a href="/status.json">/status.json</a></p>
</main></body></html>`;
}
