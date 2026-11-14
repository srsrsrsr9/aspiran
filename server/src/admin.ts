import { createBackup, listBackups, restoreBackup, safeBackupKey } from "./backups";
import { factWatchApi } from "./factwatch";
import { checkItem, prepareEdit, titleOf } from "./content";
import { coverage } from "./coverage";
import { autoChecks } from "./pipeline";
import { exportMember, forgetMember } from "./privacy";
import { type Env, HELPLINES, bad, istDay, json, newId } from "./shared";
import {
  AUTHOR_MODELS, DEFAULT_FLAGS, DRAFT_MODELS, FLAG_INFO, ROLES, type Role, type Staff, audit, auditDetail, can, ensureSchema, flags,
  getSetting, label, llmControls, newKey, permsOf, recordVersion, requireStaff, setSetting, sha256Hex, staffFrom,
} from "./staff";
import { COMPONENTS } from "./status";
import { languageRequests } from "./requests";
import { communityMetrics, decideMerge, runJob } from "./community";
import { activeResult, cleanResults, resultDays } from "./results";
import { accountHistory, searchAccounts, setAccountStatus } from "./auth";
import { resetPassword } from "./password";
import { growthReport } from "./metrics";
import { listLeads, listWebChats, webChat } from "./web";
import { tryFeedbackRows, tryUpdates } from "./try";
import { DEFAULT_GROWTH, podMode } from "./rooms";
import { DEFAULT_BUSINESS, DEFAULT_PRICING, business, cleanBusiness, cleanPricing, listPayments, pricing, refundPayment } from "./payments";
import { INPACK, LANG_CODES, type LangStatus, clearDistressCache, distressList, goLiveGaps, isLang, langName, languageState, languageStatus } from "./langs";

/**
 * The admin console's API (/admin/api/...). Each route names the permission it needs; the role
 * table is in staff.ts. Every change is written to the audit log.
 */

type Handler = (ctx: { req: Request; env: Env; s: Staff; body: any; url: URL; m: RegExpMatchArray }) => Promise<Response>;
const routes: { method: string; re: RegExp; perm: string; fn: Handler }[] = [];
const route = (method: string, re: RegExp, perm: string, fn: Handler) => routes.push({ method, re, perm, fn });

export async function adminApi(req: Request, env: Env, path: string): Promise<Response> {
  await ensureSchema(env);
  if (path === "me") {
    const s = await staffFrom(req, env);
    if (!s) return bad("Wrong or missing key.", 401);
    return json({ id: s.id, name: label(s), personal: !s.shared, roles: s.roles, perms: permsOf(s), langs: s.langs });
  }
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = path.match(r.re);
    if (!m) continue;
    const s = await requireStaff(req, env, r.perm);
    if (s instanceof Response) return s;
    const body = req.method === "POST" ? await req.json<any>().catch(() => ({})) : {};
    const res = await r.fn({ req, env, s, body, url: new URL(req.url), m });
    if (req.method !== "GET" && res.ok) await audit(env, s, `admin: ${req.method} ${path.replace(/\/[^/]*$/, (x) => (x.length > 40 ? "/…" : x))}`, path, auditDetail(body));
    return res;
  }
  return bad("Not found", 404);
}

const page = (url: URL, max = 200) => Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), max);
const like = (q: string) => `%${q.replace(/[%_]/g, "")}%`;
const podStub = (env: Env, pod: string) => env.POD.get(env.POD.idFromName(pod));
const podCall = (env: Env, pod: string, what: string, member?: string, body?: unknown) =>
  podStub(env, pod).fetch(`https://pod/${what}?pod=${encodeURIComponent(pod)}${member ? `&member=${encodeURIComponent(member)}` : ""}`, { method: "POST", body: body ? JSON.stringify(body) : undefined });

// --- Overview -------------------------------------------------------------------------------

route("GET", /^overview$/, "analytics", async ({ env }) => {
  const one = async (sql: string, ...b: unknown[]) => Object.values((await env.DB.prepare(sql).bind(...b).first<any>()) ?? { n: 0 })[0] as number;
  const today = istDay();
  return json({
    today,
    members: await one("SELECT COUNT(*) FROM members"),
    pods: await one("SELECT COUNT(*) FROM pods WHERE size > 0"),
    openReports: await one("SELECT COUNT(*) FROM reports WHERE kind = 'report' AND status = 'open'"),
    openChotuReports: await one("SELECT COUNT(*) FROM reports WHERE kind = 'chotu' AND status = 'open'"),
    openSafety: await one("SELECT COUNT(*) FROM reports WHERE kind = 'distress' AND status NOT IN ('resolved', 'closed', 'hidden')"),
    oldestSafety: (await env.DB.prepare("SELECT MIN(created_at) AS t FROM reports WHERE kind = 'distress' AND status NOT IN ('resolved', 'closed', 'hidden')").first<{ t: string }>())?.t ?? null,
    cardsWaiting: await one("SELECT COUNT(*) FROM candidates WHERE day = ? AND status = 'draft'", today),
    cardsApproved: await one("SELECT COUNT(*) FROM candidates WHERE day = ? AND en_editor IS NOT NULL", today),
    briefOut: !!(await env.DB.prepare("SELECT 1 FROM briefs WHERE day = ?").bind(today).first()),
    libraryDrafts: await one("SELECT COUNT(*) FROM library WHERE status = 'draft'"),
    libraryLive: await one("SELECT COUNT(*) FROM library WHERE status = 'approved'"),
    aiCallsToday: await one("SELECT COUNT(*) FROM llm_calls WHERE day = ? AND status = 'ok'", today),
    activeIncidents: await one("SELECT COUNT(*) FROM incidents WHERE resolved_at IS NULL"),
    lastBackup: (await listBackups(env))[0]?.uploaded ?? null,
  });
});

// --- Staff ----------------------------------------------------------------------------------

const cleanLangs = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.map(String).filter((c) => isLang(c) && !INPACK.includes(c)))] : [];
const cleanRoles = (r: unknown): Role[] => (Array.isArray(r) ? r : []).filter((x): x is Role => x in ROLES);

route("GET", /^staff$/, "staff", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT id, name, email, roles, langs, created_at, created_by, last_seen_at, disabled_at FROM staff ORDER BY disabled_at IS NOT NULL, name").all<any>();
  const languages = LANG_CODES.filter((c) => !INPACK.includes(c)).map((code) => ({ code, name: langName(code) }));
  return json({ roles: ROLES, languages, staff: results.map((r) => ({ ...r, roles: JSON.parse(r.roles), langs: JSON.parse(r.langs ?? "[]") })) });
});
route("POST", /^staff$/, "staff", async ({ env, s, body }) => {
  const name = String(body.name ?? "").trim().slice(0, 60);
  const roles = cleanRoles(body.roles);
  if (name.length < 2) return bad("Add the person's real name. It shows on everything they approve.");
  if (!roles.length) return bad("Pick at least one role.");
  const key = newKey();
  const id = newId("st_");
  const langs = cleanLangs(body.langs);
  if (roles.includes("language_editor") && !langs.length) return bad("Pick the language this language editor approves.");
  await env.DB.prepare("INSERT INTO staff (id, name, email, roles, langs, key_hash, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, name, String(body.email ?? "").slice(0, 120) || null, JSON.stringify(roles), JSON.stringify(langs), await sha256Hex(key), new Date().toISOString(), label(s)).run();
  // The key is returned this once and never stored.
  return json({ id, key });
});
route("POST", /^staff\/([\w-]+)\/(roles|rotate|disable|enable)$/, "staff", async ({ env, s, body, m }) => {
  const [, id, action] = m;
  if (id === s.id && action !== "rotate") return bad("Ask another admin to change your own account.");
  const row = await env.DB.prepare("SELECT id FROM staff WHERE id = ?").bind(id).first();
  if (!row) return bad("No such person", 404);
  if (action === "roles") {
    const roles = cleanRoles(body.roles);
    if (!roles.length) return bad("Pick at least one role, or disable the account instead.");
    const langs = cleanLangs(body.langs);
    if (roles.includes("language_editor") && !langs.length) return bad("Pick the language this language editor approves.");
    await env.DB.prepare("UPDATE staff SET roles = ?, langs = ? WHERE id = ?").bind(JSON.stringify(roles), JSON.stringify(langs), id).run();
    return json({ ok: true });
  }
  if (action === "rotate") {
    const key = newKey();
    await env.DB.prepare("UPDATE staff SET key_hash = ? WHERE id = ?").bind(await sha256Hex(key), id).run();
    return json({ key });
  }
  await env.DB.prepare("UPDATE staff SET disabled_at = ? WHERE id = ?").bind(action === "disable" ? new Date().toISOString() : null, id).run();
  return json({ ok: true });
});

// --- Audit log ------------------------------------------------------------------------------

route("GET", /^audit$/, "audit", async ({ env, url }) => {
  const q = url.searchParams.get("q") ?? "";
  const before = Number(url.searchParams.get("before")) || 1e15;
  const { results } = await env.DB.prepare(
    "SELECT * FROM audit WHERE id < ? AND (? = '' OR actor LIKE ? OR action LIKE ? OR target LIKE ?) ORDER BY id DESC LIMIT ?",
  ).bind(before, q, like(q), like(q), like(q), page(url)).all();
  return json(results);
});

// --- Members --------------------------------------------------------------------------------

route("GET", /^members$/, "members", async ({ env, url }) => {
  const q = url.searchParams.get("q") ?? "";
  const { results } = await env.DB.prepare(
    `SELECT m.member_id, m.pod_id, m.joined_at, m.suspended_until, m.suspend_reason, p.bucket, p.lead_member = m.member_id AS is_lead,
       (SELECT COUNT(*) FROM reports r WHERE r.member_id = m.member_id) AS reports,
       (SELECT MAX(at) FROM consents c WHERE c.member_id = m.member_id AND c.withdrawn_at IS NULL) AS consent_at
     FROM members m LEFT JOIN pods p ON p.id = m.pod_id
     WHERE (? = '' OR m.member_id LIKE ? OR m.pod_id LIKE ?) ORDER BY m.joined_at DESC LIMIT ?`,
  ).bind(q, like(q), like(q), page(url, 500)).all();
  return json(results);
});
route("GET", /^pods$/, "members", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT id, bucket, size, created_at, lead_member FROM pods ORDER BY created_at DESC LIMIT 500").all();
  return json(results);
});
// Pods v2: thin pods the Monday job proposes to join. Nothing moves until Ops approves; members can still stay.
route("GET", /^pod-merges$/, "members", async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT g.*, a.size AS from_size, a.bucket AS from_bucket, b.size AS to_size, b.bucket AS to_bucket,
       (SELECT COUNT(*) FROM pod_merge_optouts o WHERE o.merge_id = g.id) AS staying
     FROM pod_merges g LEFT JOIN pods a ON a.id = g.from_pod LEFT JOIN pods b ON b.id = g.to_pod ORDER BY g.created_at DESC LIMIT 100`).all();
  return json(results);
});
route("POST", /^pod-merges\/([\w-]+)\/(approve|drop)$/, "members", async ({ env, s, m }) => {
  const r = await decideMerge(env, m[1], m[2] === "approve", label(s));
  if (!r) return bad("No open proposal with that id", 404);
  await audit(env, s, `pod merge ${m[2]}`, m[1]);
  return json(r);
});
route("POST", /^members\/([\w-]+)\/(suspend|unsuspend|remove|lead|move)$/, "members", async ({ env, body, m }) => {
  const [, id, action] = m;
  const row = await env.DB.prepare("SELECT pod_id FROM members WHERE member_id = ?").bind(id).first<{ pod_id: string }>();
  if (!row) return bad("No such member", 404);
  switch (action) {
    case "suspend": {
      const days = Math.min(Math.max(Number(body.days) || 7, 1), 365);
      const until = new Date(Date.now() + days * 86400_000).toISOString();
      await env.DB.prepare("UPDATE members SET suspended_until = ?, suspend_reason = ? WHERE member_id = ?").bind(until, String(body.reason ?? "").slice(0, 200), id).run();
      await podCall(env, row.pod_id, "kick", id);
      return json({ ok: true, until });
    }
    case "unsuspend":
      await env.DB.prepare("UPDATE members SET suspended_until = NULL, suspend_reason = NULL WHERE member_id = ?").bind(id).run();
      return json({ ok: true });
    case "remove":
      await podCall(env, row.pod_id, "kick", id);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM members WHERE member_id = ?").bind(id),
        env.DB.prepare("UPDATE pods SET size = MAX(size - 1, 0) WHERE id = ?").bind(row.pod_id),
      ]);
      return json({ ok: true });
    case "lead":
      await podCall(env, row.pod_id, "lead", undefined, { memberId: id, name: String(body.name ?? "Pod lead").slice(0, 40) });
      await env.DB.prepare("UPDATE pods SET lead_member = ? WHERE id = ?").bind(id, row.pod_id).run();
      return json({ ok: true });
    case "move": {
      const to = String(body.podId ?? "");
      if (!(await env.DB.prepare("SELECT 1 FROM pods WHERE id = ?").bind(to).first())) return bad("No such pod", 404);
      await podCall(env, row.pod_id, "kick", id);
      await env.DB.batch([
        env.DB.prepare("UPDATE members SET pod_id = ? WHERE member_id = ?").bind(to, id),
        env.DB.prepare("UPDATE pods SET size = MAX(size - 1, 0) WHERE id = ?").bind(row.pod_id),
        env.DB.prepare("UPDATE pods SET size = size + 1 WHERE id = ?").bind(to),
      ]);
      return json({ ok: true });
    }
  }
  return bad("Unknown action");
});

// --- Accounts: who may use the app (auth.ts). Suspending switches access off on every device and closes live sockets.

route("GET", /^accounts$/, "members", async ({ env, url }) => json(await searchAccounts(env, (url.searchParams.get("q") ?? "").trim().slice(0, 80), page(url, 500))));
route("GET", /^accounts\/([\w-]+)\/history$/, "members", async ({ env, m }) => json(await accountHistory(env, m[1])));
route("POST", /^accounts\/([\w-]+)\/reset-password$/, "members", async ({ env, s, m }) => resetPassword(env, m[1], s));
route("POST", /^accounts\/([\w-]+)\/(suspend|restore)$/, "members", async ({ env, s, body, m }) =>
  setAccountStatus(env, m[1], m[2] as "suspend" | "restore", String(body.reason ?? ""), s));

// --- Moderation and the safety queue --------------------------------------------------------

route("GET", /^reports$/, "moderate", async ({ env, url }) => {
  const k = url.searchParams.get("kind"), kind = k === "distress" || k === "chotu" ? k : "report";
  const open = url.searchParams.get("status") !== "all";
  const { results } = await env.DB.prepare(
    `SELECT * FROM reports WHERE kind = ? ${open ? "AND status NOT IN ('resolved', 'closed', 'hidden')" : ""} ORDER BY created_at ${open ? "ASC" : "DESC"} LIMIT ?`,
  ).bind(kind, page(url)).all<any>();
  return json({ helplines: HELPLINES, reports: results.map((r) => ({ ...r, notes: JSON.parse(r.notes ?? "[]") })) });
});
route("POST", /^reports\/(\d+)$/, "moderate", async ({ env, s, body, m }) => {
  const id = Number(m[1]);
  const row = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first<any>();
  if (!row) return bad("No such report", 404);
  const action = String(body.action ?? "");
  if (row.kind === "distress" && !can(s, "safety")) return bad("Only a moderator can handle the safety queue.", 403);
  const notes = JSON.parse(row.notes ?? "[]");
  const note = String(body.note ?? "").trim().slice(0, 500);
  // Report statuses: open → hidden | closed. Safety: open → reached_out → escalated → resolved.
  const next: Record<string, string> = { hide: "hidden", close: "closed", reopen: "open", reached_out: "reached_out", escalated: "escalated", resolved: "resolved", note: row.status };
  if (!(action in next)) return bad("action must be one of " + Object.keys(next).join(", "));
  if (action === "escalated" && !note) return bad("Say who it was escalated to (for example, a named counsellor or emergency services).");
  if (action === "hide") await podCall(env, row.pod_id, "hide", undefined, { id: row.message_id });
  if (note || action !== "note") notes.push({ at: new Date().toISOString(), by: label(s), action, note });
  await env.DB.prepare("UPDATE reports SET status = ?, notes = ?, handled_by = ?, updated_at = ? WHERE id = ?")
    .bind(next[action], JSON.stringify(notes), label(s), new Date().toISOString(), id).run();
  return json({ ok: true, status: next[action] });
});
route("POST", /^reports\/(\d+)\/care$/, "safety", async ({ env, s, body, m }) => {
  const row = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(Number(m[1])).first<any>();
  if (!row?.member_id) return bad("This alert has no member to write to (older alerts, or the member was erased).", 404);
  const text = String(body.text ?? "").trim() || `Hi, this is the Aspiran care team. We saw your message and we're here. If things feel heavy, please talk to someone you trust today. In an emergency, call 112.`;
  const r = await podCall(env, row.pod_id, "care", row.member_id, { text, from: "Aspiran care team" }).then((x) => x.json<{ delivered: boolean }>());
  const notes = JSON.parse(row.notes ?? "[]");
  notes.push({ at: new Date().toISOString(), by: label(s), action: "care note", note: r.delivered ? "Sent; they're online" : "Sent; they'll see it next time they open their pod" });
  await env.DB.prepare("UPDATE reports SET status = CASE WHEN status = 'open' THEN 'reached_out' ELSE status END, notes = ?, handled_by = ?, updated_at = ? WHERE id = ?")
    .bind(JSON.stringify(notes), label(s), new Date().toISOString(), row.id).run();
  return json({ ok: true, delivered: r.delivered });
});

// --- Privacy (DPDP) -------------------------------------------------------------------------

route("GET", /^privacy$/, "privacy", async ({ env }) => {
  const requests = (await env.DB.prepare("SELECT id, kind, via, status, at, done_by, substr(member_hash, 1, 12) AS member FROM privacy_requests ORDER BY id DESC LIMIT 200").all()).results;
  const consents = (await env.DB.prepare("SELECT version, COUNT(*) AS n, SUM(withdrawn_at IS NOT NULL) AS withdrawn FROM consents GROUP BY version ORDER BY version DESC").all()).results;
  return json({ requests, consents });
});
route("POST", /^privacy\/(export|delete)$/, "privacy", async ({ env, s, body, m }) => {
  const id = String(body.memberId ?? "");
  if (!/^[\w-]{16,64}$/.test(id)) return bad("Paste the member id from their app (My Path → Your data).");
  if (m[1] === "export") return json(await exportMember(env, id, "staff", label(s)));
  if (body.confirm !== "DELETE") return bad('Type DELETE to confirm. This can\'t be undone.');
  return json(await forgetMember(env, id, "staff", label(s)));
});

// --- Content: everything in one list, with version history and restore ----------------------

route("GET", /^content$/, "content", async ({ env, url }) => {
  const q = url.searchParams.get("q") ?? "";
  const cards = (await env.DB.prepare(
    `SELECT 'card' AS type, id, day, title, status, en_editor, hi_editor, json_extract(card_json, '$.headline') AS headline,
       (SELECT COUNT(*) FROM content_versions v WHERE v.item_type = 'card' AND v.item_id = candidates.id) AS versions
     FROM candidates WHERE (? = '' OR title LIKE ? OR card_json LIKE ?) ORDER BY day DESC, created_at DESC LIMIT 150`,
  ).bind(q, like(q), like(q)).all()).results;
  const library = (await env.DB.prepare(
    `SELECT 'library' AS type, id, kind, title, status, en_editor, hi_editor, updated_at,
       (SELECT COUNT(*) FROM content_versions v WHERE v.item_type = 'library' AND v.item_id = library.id) AS versions
     FROM library WHERE (? = '' OR title LIKE ? OR id LIKE ?) ORDER BY updated_at DESC LIMIT 300`,
  ).bind(q, like(q), like(q)).all()).results;
  const deleted = (await env.DB.prepare(
    `SELECT item_id AS id, MAX(at) AS at, actor FROM content_versions WHERE item_type = 'library' AND action = 'delete'
       AND item_id NOT IN (SELECT id FROM library) GROUP BY item_id ORDER BY at DESC LIMIT 50`,
  ).all()).results;
  return json({ cards, library, deleted });
});
// --- Fact watch (factwatch.ts): the daily check of facts that change over time ------------------
route("GET", /^factwatch$/, "content", async ({ env }) => (await factWatchApi(env, "factwatch", "GET"))!);
route("POST", /^factwatch\/run$/, "content", async ({ env, body }) => (await factWatchApi(env, "factwatch/run", "POST", body))!);
route("GET", /^coverage$/, "content", async ({ env }) => json(await coverage(env)));
route("GET", /^versions\/(card|library)\/(.+)$/, "content", async ({ env, m }) => {
  const { results } = await env.DB.prepare("SELECT id, action, actor, at, length(json) AS size FROM content_versions WHERE item_type = ? AND item_id = ? ORDER BY id DESC")
    .bind(m[1], decodeURIComponent(m[2])).all();
  return json(results);
});
route("GET", /^version\/(\d+)$/, "content", async ({ env, m }) => {
  const row = await env.DB.prepare("SELECT * FROM content_versions WHERE id = ?").bind(Number(m[1])).first<any>();
  return row ? json({ ...row, data: JSON.parse(row.json), json: undefined }) : bad("No such version", 404);
});
route("POST", /^version\/(\d+)\/restore$/, "content", async ({ env, s, m }) => {
  const v = await env.DB.prepare("SELECT * FROM content_versions WHERE id = ?").bind(Number(m[1])).first<any>();
  if (!v) return bad("No such version", 404);
  const data = JSON.parse(v.json);
  const now = new Date().toISOString();
  // A restore is an edit: it comes back as a draft and needs approving again.
  if (v.item_type === "card") {
    const row = await env.DB.prepare("SELECT source_text FROM candidates WHERE id = ?").bind(v.item_id).first<{ source_text: string }>();
    if (!row) return bad("That card no longer exists.", 404);
    const card = { ...data, checkedBy: null, checkedOn: null };
    const flags = autoChecks(card, row.source_text);
    await env.DB.prepare("UPDATE candidates SET card_json = ?, flags = ?, status = 'draft', en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL WHERE id = ?")
      .bind(JSON.stringify(card), JSON.stringify(flags), v.item_id).run();
  } else {
    const kind = v.item_id.split(":")[0];
    const fixed = await prepareEdit(env, kind, data);
    const flags = [`Restored from version ${v.id} (${v.at.slice(0, 10)})`, ...checkItem(kind, fixed)];
    await env.DB.prepare(
      `INSERT INTO library (id, kind, title, json, flags, status, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?)
       ON CONFLICT(id) DO UPDATE SET json = excluded.json, title = excluded.title, flags = excluded.flags, status = 'draft',
       en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL, updated_at = excluded.updated_at`,
    ).bind(v.item_id, kind, titleOf(kind, fixed), JSON.stringify(fixed), JSON.stringify(flags), now).run();
  }
  await recordVersion(env, v.item_type, v.item_id, v.json, `restore version ${v.id}`, label(s));
  return json({ ok: true });
});

// --- LLM usage and controls -----------------------------------------------------------------

route("GET", /^llm$/, "llm:view", async ({ env, url }) => {
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 90);
  const since = istDay(new Date(Date.now() - (days - 1) * 86400_000));
  const daily = (await env.DB.prepare(
    `SELECT day, SUM(status = 'ok') AS ok, SUM(status = 'error') AS errors, SUM(status = 'blocked') AS blocked, SUM(status = 'unavailable') AS unavailable,
       COALESCE(SUM(tokens_in), 0) AS tokens_in, COALESCE(SUM(tokens_out), 0) AS tokens_out, CAST(AVG(CASE WHEN status = 'ok' THEN ms END) AS INTEGER) AS avg_ms
     FROM llm_calls WHERE day >= ? GROUP BY day ORDER BY day`,
  ).bind(since).all()).results;
  const byPurpose = (await env.DB.prepare(
    `SELECT purpose, model, COUNT(*) AS calls, SUM(status = 'ok') AS ok, SUM(status = 'error') AS errors, SUM(status = 'blocked') AS blocked,
       COALESCE(SUM(tokens_in), 0) AS tokens_in, COALESCE(SUM(tokens_out), 0) AS tokens_out, CAST(AVG(CASE WHEN status = 'ok' THEN ms END) AS INTEGER) AS avg_ms
     FROM llm_calls WHERE day >= ? GROUP BY purpose, model ORDER BY calls DESC`,
  ).bind(since).all()).results;
  const recent = (await env.DB.prepare("SELECT at, purpose, model, status, error FROM llm_calls WHERE status != 'ok' ORDER BY id DESC LIMIT 20").all()).results;
  const today = await env.DB.prepare("SELECT COUNT(*) AS calls, COALESCE(SUM(tokens_in + tokens_out), 0) AS tokens FROM llm_calls WHERE day = ? AND status = 'ok'").bind(istDay()).first();
  return json({ days, daily, byPurpose, recent, today, controls: await llmControls(env), models: DRAFT_MODELS, authorModels: AUTHOR_MODELS,
    connected: !!env.AI, claudeKey: !!env.ANTHROPIC_API_KEY, groqKey: !!env.GROQ_API_KEY });
});
route("POST", /^llm\/controls$/, "llm:control", async ({ env, s, body }) => {
  const c = await llmControls(env);
  const num = (v: unknown, lo: number, hi: number, d: number) => (Number.isFinite(Number(v)) ? Math.min(Math.max(Number(v), lo), hi) : d);
  const next = {
    enabled: body.enabled ?? c.enabled,
    purposes: { draft: body.purposes?.draft ?? c.purposes.draft, guard: body.purposes?.guard ?? c.purposes.guard, embed: body.purposes?.embed ?? c.purposes.embed,
      author: body.purposes?.author ?? c.purposes.author, chotu: body.purposes?.chotu ?? c.purposes.chotu, evaluate: body.purposes?.evaluate ?? c.purposes.evaluate, watch: body.purposes?.watch ?? c.purposes.watch ?? true },
    draftModel: DRAFT_MODELS.includes(body.draftModel) ? body.draftModel : c.draftModel,
    authorModel: AUTHOR_MODELS.includes(body.authorModel) ? body.authorModel : c.authorModel,
    dailyCallCap: num(body.dailyCallCap, 0, 100_000, c.dailyCallCap),
    dailyTokenCap: num(body.dailyTokenCap, 0, 50_000_000, c.dailyTokenCap),
    maxTokens: num(body.maxTokens, 200, 8000, c.maxTokens),
    temperature: num(body.temperature, 0, 1, c.temperature),
  };
  for (const k of ["enabled"] as const) next[k] = !!next[k];
  for (const k of ["draft", "guard", "embed", "author", "chotu", "evaluate", "watch"] as const) next.purposes[k] = !!next.purposes[k];
  await setSetting(env, "llm", next, label(s));
  return json(next);
});

// --- Languages: which are on, and what each needs before members see it ---------------------

route("GET", /^languages$/, "staff", async ({ env }) => json({ languages: await languageState(env) }));
// Which languages members asked for next (counts only), so the founder can decide what to build.
route("GET", /^language-requests$/, "staff", async ({ env }) => json(await languageRequests(env)));
route("POST", /^languages\/([a-z]{2})$/, "staff", async ({ env, s, body, m }) => {
  const code = m[1];
  if (!isLang(code) || INPACK.includes(code)) return bad("English and Hindi are always on.");
  const want = body.status as LangStatus;
  if (!["off", "pilot", "live"].includes(want)) return bad("status must be off, pilot or live");
  if (want === "live") {
    const gaps = await goLiveGaps(env, code);
    if (gaps.length) return bad(`${langName(code)} can't go live yet: ${gaps.join("; ")}.`);
  }
  const status = await languageStatus(env);
  status[code] = want;
  await setSetting(env, "languages", status, label(s));
  await audit(env, s, "language status", code, { status: want });
  return json({ ok: true });
});
route("POST", /^languages\/([a-z]{2})\/distress$/, "staff", async ({ env, s, body, m }) => {
  const code = m[1];
  if (!isLang(code) || INPACK.includes(code)) return bad("The English and Hindi lists are built in.");
  const phrases = (Array.isArray(body.phrases) ? body.phrases : String(body.phrases ?? "").split(/\r?\n/))
    .map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 200);
  const old = await distressList(env, code);
  const changed = JSON.stringify(phrases) !== JSON.stringify(old.phrases);
  // Marking reviewed needs a name; changing the list clears an earlier review.
  const reviewer = body.reviewed ? String(body.reviewedBy ?? s.name ?? "").trim().slice(0, 60) : "";
  if (body.reviewed && !reviewer) return bad("Type the reviewer's name (a native speaker, ideally with a mental-health professional).");
  const next = {
    phrases,
    reviewedBy: body.reviewed ? reviewer : changed ? null : old.reviewedBy,
    reviewedOn: body.reviewed ? istDay() : changed ? null : old.reviewedOn,
    note: old.note,
  };
  if (next.reviewedBy) delete next.note;
  await setSetting(env, `distress:${code}`, next, label(s));
  clearDistressCache();
  // A language that loses its reviewed list goes back to pilot.
  const status = await languageStatus(env);
  if (status[code] === "live" && (await goLiveGaps(env, code)).length) { status[code] = "pilot"; await setSetting(env, "languages", status, label(s)); }
  await audit(env, s, "distress list", code, { phrases: phrases.length, reviewed: !!next.reviewedBy });
  return json(next);
});

// --- Analytics: daily totals only -----------------------------------------------------------

route("GET", /^analytics$/, "analytics", async ({ env, url }) => {
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 7), 180);
  const since = istDay(new Date(Date.now() - (days - 1) * 86400_000));
  const counts = (await env.DB.prepare("SELECT day, metric, n FROM daily_counts WHERE day >= ? ORDER BY day").bind(since).all()).results;
  const published = (await env.DB.prepare("SELECT day, json_array_length(json, '$.items') AS cards FROM briefs WHERE day >= ? ORDER BY day").bind(since).all()).results;
  const approvals = (await env.DB.prepare(
    `SELECT actor, SUM(action LIKE 'approve en%') AS english, SUM(action LIKE 'approve hi%') AS hindi, COUNT(*) AS changes
     FROM content_versions WHERE at >= ? GROUP BY actor ORDER BY changes DESC`,
  ).bind(since).all()).results;
  const pods = await env.DB.prepare("SELECT COUNT(*) AS pods, COALESCE(AVG(size), 0) AS avg_size, COALESCE(SUM(size), 0) AS members FROM pods WHERE size > 0").first();
  const safety = await env.DB.prepare(
    `SELECT COUNT(*) AS alerts, CAST(AVG((julianday(COALESCE(updated_at, 'now')) - julianday(created_at)) * 24 * 60) AS INTEGER) AS avg_minutes_to_first_action
     FROM reports WHERE kind = 'distress' AND created_at >= ?`,
  ).bind(since).first();
  return json({ days, since, counts, published, approvals, pods, safety });
});

// --- Community-first metrics, and running a scheduled job by hand ---------------------------

route("GET", /^community$/, "analytics", async ({ env }) => json(await communityMetrics(env)));
// Growth: installs by source, activation, return by signup week, feedback, the paid funnel and the pod test (metrics.ts).
route("GET", /^growth$/, "analytics", async ({ env }) => json(await growthReport(env)));
// "Try one topic" (try.ts): what visitors answered as they went, and contacts they chose to leave. ?format=csv to download.
route("GET", /^try\/feedback$/, "analytics", async ({ env, url }) => {
  const { rows, contacts } = await tryFeedbackRows(env, page(url, 10000));
  if (url.searchParams.get("format") !== "csv") return json({ rows, contacts });
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["at", "session_id", "path_id", "question", "answer", "text", "lang", "contact"].join(",")]
    .concat(rows.map((r: any) => [r.at, r.session_id, r.path_id, r.question, r.answer, r.text, r.lang, r.contact].map(cell).join(",")));
  return new Response(lines.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aspiran-try-feedback-${istDay()}.csv"` } });
});
// "You asked, we did" (try.ts): short public lines, each about something visitors asked for and we did. Announcers write them.
route("GET", /^try\/updates$/, "analytics", async ({ env, url }) => json({ updates: await tryUpdates(env, url.searchParams.get("path") || "path-pol-federalism", true) }));
route("POST", /^try\/updates$/, "announce", async ({ env, s, body }) => {
  const en = String(body?.en ?? "").trim().slice(0, 240), hi = String(body?.hi ?? "").trim().slice(0, 240);
  const on = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.doneOn ?? "")) ? body.doneOn : istDay();
  if (en.length < 10) return bad("Write the line in English (at least a few words).");
  await env.DB.prepare("INSERT INTO try_updates (path_id, text_en, text_hi, done_on, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(String(body?.pathId || "path-pol-federalism").slice(0, 64), en, hi || null, on, s.name ?? s.id, new Date().toISOString()).run();
  return json({ ok: true });
});
route("POST", /^try\/updates\/(\d+)\/(hide|show)$/, "announce", async ({ env, m }) => {
  await env.DB.prepare("UPDATE try_updates SET hidden = ? WHERE id = ?").bind(m[2] === "hide" ? 1 : 0, Number(m[1])).run();
  return json({ ok: true });
});
// Website visitors who talked to Chotu (web.ts). ?contact=1 for only those who left a number or email; ?format=csv to download.
route("GET", /^web\/leads$/, "analytics", async ({ env, url }) => {
  const rows = await listLeads(env, page(url, 5000), url.searchParams.get("contact") === "1");
  if (url.searchParams.get("format") !== "csv") return json({ leads: rows });
  const keys = ["name", "attempt", "medium", "stage", "optional", "city", "year", "hours", "worry", "sleep", "recall", "calibration", "pluck", "chai", "path"];
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["first_seen", "last_seen", "contact", "contact_kind", "lang", "consent_at", "source", ...keys].join(",")]
    .concat(rows.map((r) => [r.first_seen, r.last_seen, r.contact, r.contact_kind, r.lang, r.consent_at, r.source, ...keys.map((k) => r.details[k])].map(cell).join(",")));
  return new Response(lines.join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="aspiran-web-leads-${istDay()}.csv"` } });
});
// The website's Chotu chats (web.ts): one row per visitor, then one visitor's whole chat. Opening a chat is logged.
route("GET", /^web\/chats$/, "analytics", async ({ env, url }) => json({ chats: await listWebChats(env, page(url, 500)) }));
route("GET", /^web\/chats\/([\w-]{12,64})$/, "analytics", async ({ env, s, m }) => {
  await audit(env, s, "read website chat", m[1]);
  return json({ visitor: m[1], messages: await webChat(env, m[1]) });
});
// Payments (payments.ts): the list, refunds, the price and the founding seats, and the business details on receipts.
route("GET", /^payments$/, "flags", async ({ env, url }) => json({ ...(await listPayments(env, (url.searchParams.get("q") ?? "").slice(0, 60), page(url))), pricing: await pricing(env), business: await business(env), defaults: { pricing: DEFAULT_PRICING, business: DEFAULT_BUSINESS } }));
route("POST", /^payments\/(upsc_[0-9a-f]{24})\/refund$/, "flags", async ({ env, s, body, m }) => {
  if (String(body.confirm ?? "") !== m[1]) return bad("Type the order id to confirm the refund.");
  return refundPayment(env, m[1], body.amountInr == null || body.amountInr === "" ? null : Number(body.amountInr), String(body.note ?? "").trim(), label(s));
});
route("POST", /^pricing$/, "flags", async ({ env, s, body }) => {
  const p = cleanPricing(body.pricing);
  if (!p) return bad("Prices must be whole rupees and seats a whole number.");
  await setSetting(env, "pricing", p, label(s));
  if (body.business) await setSetting(env, "business", cleanBusiness(body.business), label(s));
  return json({ pricing: p, business: await business(env) });
});
/** Runs a scheduled job now (or as if at `at`, for checking the host schedule). Admin only. */
route("POST", /^jobs\/run$/, "flags", async ({ env, body }) => {
  const at = body.at ? new Date(body.at) : new Date();
  if (Number.isNaN(at.getTime())) return bad("at must be a date");
  if (!["match", "merge", "states", "host", "chai", "pins", "photos"].includes(body.job)) return bad("job must be match, merge, states, host, chai, pins or photos");
  return json(await runJob(env, body.job, at));
});

/** Result days: 72 hours of result-day mode in every app from the start of each day (IST). */
route("GET", /^results$/, "flags", async ({ env }) => { const results = await resultDays(env); return json({ results, now: activeResult(results) }); });
route("POST", /^results$/, "flags", async ({ env, s, body }) => {
  const results = cleanResults(body.results);
  if (!results) return bad("results must be a list of up to 20 { day: YYYY-MM-DD, label }");
  await setSetting(env, "results", results, label(s));
  return json({ results, now: activeResult(results) });
});

/** Open pods until this many sign-ups, then matched pods switch on (rooms.ts). */
route("GET", /^growth\/threshold$/, "flags", async ({ env }) => json(await podMode(env)));
route("POST", /^growth\/threshold$/, "flags", async ({ env, s, body }) => {
  const t = Math.round(Number(body.signupThreshold));
  if (!(t >= 0 && t <= 10_000_000)) return bad("signupThreshold must be a number of sign-ups (0 switches matched pods on now)");
  await setSetting(env, "growth", { ...(await getSetting(env, "growth", DEFAULT_GROWTH)), signupThreshold: t }, label(s));
  return json(await podMode(env));
});

// --- Feature flags --------------------------------------------------------------------------

route("GET", /^flags$/, "flags", async ({ env }) => json({ info: FLAG_INFO, flags: await flags(env) }));
route("POST", /^flags$/, "flags", async ({ env, s, body }) => {
  const before = await flags(env);
  const next = { ...before };
  for (const k of Object.keys(DEFAULT_FLAGS) as (keyof typeof DEFAULT_FLAGS)[]) if (typeof body.flags?.[k] === "boolean") next[k] = body.flags[k];
  await setSetting(env, "flags", next, label(s));
  // Switching chat off disconnects everyone now, not just new connections.
  if (before.pod_chat && !next.pod_chat) {
    const { results } = await env.DB.prepare("SELECT id FROM pods WHERE size > 0").all<{ id: string }>();
    for (const p of results) await podCall(env, p.id, "close-all").catch(() => {});
  }
  return json(next);
});

// --- Announcements --------------------------------------------------------------------------

route("GET", /^announcements$/, "announce", async ({ env }) => json((await env.DB.prepare("SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100").all()).results));
route("POST", /^announcements$/, "announce", async ({ env, s, body }) => {
  const title = String(body.title ?? "").trim().slice(0, 80);
  const text = String(body.body ?? "").trim().slice(0, 500);
  if (!title || !text) return bad("Add a title and a message.");
  const link = String(body.link ?? "").trim();
  if (link && !/^(https:\/\/|\/|#)/.test(link)) return bad("Links must start with https://, / or #");
  const id = newId("an_");
  const starts = body.startsAt ? new Date(body.startsAt).toISOString() : new Date().toISOString();
  const ends = body.endsAt ? new Date(body.endsAt).toISOString() : null;
  const level = ["info", "important"].includes(body.level) ? body.level : "info";
  await env.DB.prepare("INSERT INTO announcements (id, title, body, link, level, starts_at, ends_at, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, title, text, link || null, level, starts, ends, label(s), new Date().toISOString()).run();
  let pods = 0;
  if (body.sendToPods) {
    // The in-app message every member sees, Android and web alike.
    const { results } = await env.DB.prepare("SELECT id FROM pods WHERE size > 0").all<{ id: string }>();
    for (const p of results) {
      await podStub(env, p.id).fetch(`https://pod/ritual?pod=${encodeURIComponent(p.id)}`, { method: "POST", body: JSON.stringify({ text: `📣 ${title}: ${text}` }) });
      pods++;
    }
    await env.DB.prepare("UPDATE announcements SET sent_to_pods_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
  }
  return json({ id, pods });
});
route("POST", /^announcements\/([\w-]+)\/withdraw$/, "announce", async ({ env, m }) => {
  await env.DB.prepare("UPDATE announcements SET withdrawn_at = ? WHERE id = ?").bind(new Date().toISOString(), m[1]).run();
  return json({ ok: true });
});

// --- Incidents (shown on /status) -----------------------------------------------------------

const STATUSES = ["Investigating", "Identified", "Monitoring", "Resolved", "Scheduled"];
route("GET", /^incidents$/, "incidents", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT * FROM incidents ORDER BY started_at DESC LIMIT 100").all<any>();
  return json({ components: COMPONENTS, statuses: STATUSES, incidents: results.map((r) => ({ ...r, updates: JSON.parse(r.updates) })) });
});
route("POST", /^incidents$/, "incidents", async ({ env, s, body }) => {
  const title = String(body.title ?? "").trim().slice(0, 120);
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!title || !message) return bad("Add a title and a first update. Both are public.");
  const component = body.component in COMPONENTS ? body.component : "app";
  const impact = ["minor", "major", "maintenance"].includes(body.impact) ? body.impact : "minor";
  const status = STATUSES.includes(body.status) ? body.status : impact === "maintenance" ? "Scheduled" : "Investigating";
  const id = newId("inc_");
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO incidents (id, title, component, impact, status, updates, started_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, title, component, impact, status, JSON.stringify([{ at: now, status, message }]), now, label(s)).run();
  return json({ id });
});
route("POST", /^incidents\/([\w-]+)$/, "incidents", async ({ env, body, m }) => {
  const row = await env.DB.prepare("SELECT updates FROM incidents WHERE id = ?").bind(m[1]).first<{ updates: string }>();
  if (!row) return bad("No such incident", 404);
  const status = STATUSES.includes(body.status) ? body.status : "Monitoring";
  const message = String(body.message ?? "").trim().slice(0, 1000);
  if (!message) return bad("Add an update. It's public.");
  const now = new Date().toISOString();
  const updates = [...JSON.parse(row.updates), { at: now, status, message }];
  await env.DB.prepare("UPDATE incidents SET status = ?, updates = ?, resolved_at = ? WHERE id = ?").bind(status, JSON.stringify(updates), status === "Resolved" ? now : null, m[1]).run();
  return json({ ok: true });
});

// --- Backups --------------------------------------------------------------------------------

route("GET", /^backups$/, "backups", async ({ env }) => json({ bound: !!env.BACKUPS, backups: await listBackups(env) }));
route("POST", /^backups$/, "backups", async ({ env }) => {
  try { return json(await createBackup(env, "manual")); } catch (e) { return bad(String(e).replace(/^Error: /, ""), 503); }
});
route("GET", /^backups\/file$/, "backups", async ({ env, url }) => {
  const key = url.searchParams.get("key") ?? "";
  if (!env.BACKUPS || !safeBackupKey(key)) return bad("Bad backup name");
  const obj = await env.BACKUPS.get(key);
  if (!obj) return bad("No such backup", 404);
  return new Response(obj.body, { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="${key.split("/").pop()}"` } });
});
route("POST", /^backups\/restore$/, "backups", async ({ env, body }) => {
  const key = String(body.key ?? "");
  if (!safeBackupKey(key)) return bad("Bad backup name");
  if (body.confirm !== "RESTORE") return bad("Type RESTORE to confirm. Content and community data will be replaced by the backup.");
  try { return json(await restoreBackup(env, key)); } catch (e) { return bad(String(e).replace(/^Error: /, ""), 400); }
});
