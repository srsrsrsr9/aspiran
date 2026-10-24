import { COMMONS_ROOMS } from "./commons";
import { devTokenAllowed } from "./auth-dev";
import { type FirebaseClaims, verifyFirebaseToken } from "./firebase-token";
import { logEvent } from "./metrics";
import { forgetLogin, isPasswordToken, usernameOf, verifyPasswordToken } from "./password";
import { type Env, bad, json } from "./shared";
import { type Staff, ensureSchema, flags, label, sha256Hex } from "./staff";

/**
 * Sign-in and the access switch (auth-build.md).
 *
 * Firebase Authentication proves who someone is (Google only: the Firebase project has just that provider, and the
 * server refuses any other sign_in_provider too), or our own username and password (password.ts, provider "password",
 * behind the password_login flag) until Google sign-in works everywhere. Our own `accounts` table decides whether
 * they may use the app: status active or suspended, set from the admin console. Every member route goes through
 * `memberGate`, which needs a valid ID token AND an active account, and then puts the account's member id into the
 * request, so a client can only ever act as itself.
 *
 * The phone number or email is kept only here, for sign-in and for staff to find an account. It is never shown to
 * other members, never put into pods, and never sent to Chotu or any AI provider.
 */

const validMemberId = (v: unknown) => typeof v === "string" && /^[\w-]{16,64}$/.test(v);

export type Account = {
  uid: string; provider: string; phone: string | null; email: string | null; member_id: string | null;
  status: "active" | "suspended"; status_reason: string | null; created_at: string; last_seen_at: string | null; app_version: string | null;
};

// --- Who is calling ------------------------------------------------------------------------------------

interface Identity { uid: string; provider: string; phone: string | null; email: string | null; username?: string | null }
type IdentityResult = { ok: true; who: Identity } | { ok: false; res: Response };

const authError = (code: string, message: string, status: number, extra: Record<string, unknown> = {}) => json({ error: message, code, ...extra }, status);

export function projectId(env: Env): string | null {
  const p = (env.FIREBASE_PROJECT_ID ?? "").trim();
  return /^[a-z0-9][a-z0-9-]{3,38}[a-z0-9]$/.test(p) && p !== "your-firebase-project-id" ? p : null;
}

function bearer(req: Request, url: URL): string {
  const h = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  // Browsers can't set headers on a WebSocket, so sockets carry the token as ?auth=.
  return h || (req.headers.get("upgrade") === "websocket" ? url.searchParams.get("auth") ?? "" : "");
}

export async function identify(req: Request, env: Env, url: URL): Promise<IdentityResult> {
  const token = bearer(req, url);
  if (!token) return { ok: false, res: authError("auth_required", "Please sign in to use this.", 401) };
  if (token.startsWith("dev:")) {
    const [, uid, contact] = token.split(":");
    if (!devTokenAllowed(env.AUTH_MODE, url)) return { ok: false, res: authError("auth_invalid", "That sign-in isn't valid here.", 401) };
    if (!/^[\w-]{3,64}$/.test(uid ?? "")) return { ok: false, res: authError("auth_invalid", "Bad dev token.", 401) };
    const c = (contact ?? "").slice(0, 80);
    return { ok: true, who: { uid: "dev-" + uid, provider: "dev", phone: c.startsWith("+") ? c : null, email: c.includes("@") ? c : null } };
  }
  if (isPasswordToken(token)) {
    const v = await verifyPasswordToken(env, token);
    if (!v.ok) return { ok: false, res: authError(v.code, v.code === "auth_expired" ? "Your sign-in expired. Please sign in again." : "Please sign in again.", 401) };
    return { ok: true, who: { uid: v.login.uid, provider: "password", phone: null, email: null, username: v.login.username } };
  }
  const pid = projectId(env);
  if (!pid) return { ok: false, res: authError("auth_unconfigured", "Sign-in isn't set up on this server yet.", 503) };
  const r = await verifyFirebaseToken(token, pid);
  if (!r.ok) return { ok: false, res: authError(r.code, r.code === "auth_expired" ? "Your sign-in expired. Please sign in again." : "Please sign in again.", 401) };
  const who = fromClaims(r.claims);
  if (!ALLOWED_PROVIDERS.has(who.provider)) return { ok: false, res: authError("auth_provider", "Please sign in with Google.", 401) };
  return { ok: true, who };
}

/** Google is the only way in. Dev tokens (local only) are handled above. */
export const ALLOWED_PROVIDERS = new Set(["google.com"]);

function fromClaims(c: FirebaseClaims): Identity {
  const provider = c.firebase?.sign_in_provider ?? "unknown";
  return { uid: c.sub, provider, phone: c.phone_number ?? null, email: c.email ?? null };
}

// --- Accounts ---------------------------------------------------------------------------------------

/** The phone, email or username, hashed: kept after an erasure only for suspended accounts, so deleting and signing up again can't undo a suspension. */
const identHash = (who: { phone: string | null; email: string | null; username?: string | null }) => {
  const id = who.phone ?? who.email?.toLowerCase() ?? (who.username ? "user:" + who.username : null);
  return id ? sha256Hex("ident:" + id) : Promise.resolve(null);
};

const getAccount = (env: Env, uid: string) => env.DB.prepare("SELECT * FROM accounts WHERE uid = ?").bind(uid).first<Account>();

/**
 * Finds or creates the account for this identity, and links a member id: the account's own if it has one (a new
 * phone signing in gets its pod back), else the installation's existing anonymous id (nobody loses their pod, stamps
 * or profile), else a new one. An id already linked to another account is never taken over.
 */
export async function upsertAccount(env: Env, who: Identity, opts: { memberHint?: unknown; appVersion?: unknown } = {}): Promise<Account> {
  await ensureSchema(env);
  const now = new Date().toISOString();
  const appVersion = typeof opts.appVersion === "string" ? opts.appVersion.slice(0, 40) : null;
  let acct = await getAccount(env, who.uid);
  let isNew = false;
  if (!acct) {
    // An erased account that staff had suspended stays suspended under the same phone or email.
    const hash = await identHash(who);
    const tomb = hash ? await env.DB.prepare("SELECT reason FROM account_tombstones WHERE ident_hash = ?").bind(hash).first<{ reason: string | null }>() : null;
    await env.DB.prepare(
      `INSERT INTO accounts (uid, provider, phone, email, member_id, status, status_reason, created_at, last_seen_at, app_version)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?) ON CONFLICT(uid) DO NOTHING`,
    ).bind(who.uid, who.provider, who.phone, who.email, tomb ? "suspended" : "active", tomb ? tomb.reason : null, now, now, appVersion).run();
    if (tomb) await writeAudit(env, who.uid, "suspend", "Signed up again after an erasure while suspended", null);
    acct = (await getAccount(env, who.uid))!;
    isNew = true;
  } else if (who.phone !== acct.phone || who.email !== acct.email || (appVersion && appVersion !== acct.app_version)) {
    // Firebase is the source of truth for the phone or email (they can change, e.g. a linked Google account).
    await env.DB.prepare("UPDATE accounts SET phone = ?, email = ?, provider = ?, app_version = COALESCE(?, app_version) WHERE uid = ?")
      .bind(who.phone, who.email, who.provider, appVersion, who.uid).run();
    acct = { ...acct, phone: who.phone, email: who.email, provider: who.provider, app_version: appVersion ?? acct.app_version };
  }
  if (!acct.member_id) acct.member_id = await linkMember(env, who.uid, opts.memberHint);
  if (isNew) await logEvent(env, "signup", { memberId: acct.member_id }, { provider: who.provider === "google.com" ? "google" : who.provider });
  return acct;
}

async function linkMember(env: Env, uid: string, hint: unknown): Promise<string> {
  const candidates: string[] = [];
  if (validMemberId(hint)) candidates.push(hint as string);
  candidates.push(crypto.randomUUID().replace(/-/g, ""));
  for (const id of candidates) {
    const taken = await env.DB.prepare("SELECT uid FROM accounts WHERE member_id = ?").bind(id).first<{ uid: string }>();
    if (taken && taken.uid !== uid) continue;
    const r = await env.DB.prepare("UPDATE accounts SET member_id = ? WHERE uid = ? AND member_id IS NULL").bind(id, uid).run().catch(() => null);
    if (r?.meta.changes) return id;
    const now = await getAccount(env, uid);
    if (now?.member_id) return now.member_id; // linked by a request racing this one
  }
  throw new Error("couldn't link a member id");
}

async function touch(env: Env, a: Account) {
  // At most every 10 minutes: "last seen" is for staff, not tracking.
  if (a.last_seen_at && Date.now() - Date.parse(a.last_seen_at) < 10 * 60_000) return;
  await env.DB.prepare("UPDATE accounts SET last_seen_at = ? WHERE uid = ?").bind(new Date().toISOString(), a.uid).run();
}

/** The staff reason is never sent to the member. */
const suspendedBody = (env: Env) => ({
  error: "Your access has been switched off.", code: "account_suspended", status: "suspended", support: env.SUPPORT_CONTACT || null,
});

/**
 * What the apps need to start sign-in, sent in /config. The Firebase web config is public by design (it identifies
 * the project; it grants nothing). mode: "dev" (local AUTH_MODE=dev), "firebase", or "unconfigured".
 */
export function publicAuthConfig(env: Env, url: URL, required: boolean, password = false) {
  const pid = projectId(env);
  const firebase = pid && env.FIREBASE_WEB_API_KEY
    ? { apiKey: env.FIREBASE_WEB_API_KEY, authDomain: env.FIREBASE_AUTH_DOMAIN || `${pid}.firebaseapp.com`, projectId: pid, ...(env.FIREBASE_WEB_APP_ID ? { appId: env.FIREBASE_WEB_APP_ID } : {}) }
    : null;
  return {
    mode: devTokenAllowed(env.AUTH_MODE, url) ? "dev" : firebase ? "firebase" : "unconfigured",
    // password: username and password sign-in is on (password.ts), shown next to "Continue with Google".
    required, firebase, password, support: env.SUPPORT_CONTACT || null, checkHours: 6, graceHours: 72,
  };
}

// --- Routes: /auth/session and /me/status ------------------------------------------------------------

export async function authRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path === "/auth/session" && req.method === "POST") {
    const id = await identify(req, env, url);
    if (!id.ok) return id.res;
    const body = await req.json<any>().catch(() => ({}));
    const a = await upsertAccount(env, id.who, { memberHint: body.memberId, appVersion: body.appVersion });
    await touch(env, a);
    return json({
      uid: a.uid, memberId: a.member_id, provider: a.provider, status: a.status, checked_at: new Date().toISOString(),
      ...(a.status === "suspended" ? { support: env.SUPPORT_CONTACT || null } : {}),
    });
  }
  if (path === "/me/status" && req.method === "GET") {
    const id = await identify(req, env, url);
    if (!id.ok) return id.res;
    await ensureSchema(env);
    const a = await getAccount(env, id.who.uid);
    if (!a) return json({ status: "none", checked_at: new Date().toISOString() });
    await touch(env, a);
    return json({ status: a.status, memberId: a.member_id, checked_at: new Date().toISOString(),
      ...(a.status === "suspended" ? { support: env.SUPPORT_CONTACT || null } : {}) });
  }
  return null;
}

// --- The gate on every member route ------------------------------------------------------------------

/** Member routes. Everything else (welcome, Free Shelf content, briefs, library, status, counts) stays open. */
export function isMemberRoute(path: string): boolean {
  return /^\/pods\/(join|leave|me|choose)$/.test(path) || /^\/pods\/[\w-]+\/ws$/.test(path)
    || path === "/members/profile" || /^\/commons\/[\w-]+\/ws$/.test(path) || path === "/season/add" || path === "/mocks/band"
    || path === "/plus" || path.startsWith("/plus/") || path === "/chotu" || path === "/chotu/report"
    || path === "/consent" || /^\/privacy\/(export|delete)$/.test(path)
    || /^\/rooms\/(list|join|leave|photo)$/.test(path) || /^\/rooms\/[\w-]+\/ws$/.test(path) || /^\/rooms\/photo\/\w+$/.test(path)
    || path === "/answers/evaluate";
}
/** A suspended person can still get or erase their data (DPDP). */
const OPEN_WHEN_SUSPENDED = /^\/privacy\/(export|delete)$/;
/** Bodies that are anonymous by design: no member id is added if the client didn't send one. */
const ANON_BODY = new Set(["/chotu", "/chotu/report", "/season/add", "/mocks/band"]);

/**
 * Returns a Response to send back (401/403) or the request to carry on with, rewritten so its memberId (body) and
 * member (query) are the signed-in account's. With the `sign_in_required` flag off (rollout only), a request with no
 * token passes through unchanged as before; any token that is sent is still checked, and suspended accounts are
 * still refused.
 */
export async function memberGate(req: Request, env: Env, path: string, url: URL): Promise<Request | Response> {
  if (!bearer(req, url) && !(await flags(env)).sign_in_required) return req;
  const id = await identify(req, env, url);
  if (!id.ok) return id.res;
  const isWs = req.headers.get("upgrade") === "websocket";
  let body: any = null;
  if (req.method === "POST" && !isWs) {
    const text = await req.text();
    try { body = text ? JSON.parse(text) : {}; } catch { body = null; }
    if (body !== null && (typeof body !== "object" || Array.isArray(body))) body = null;
    if (body === null) return bad("Expected a JSON object");
  }
  const a = await upsertAccount(env, id.who, { memberHint: body?.memberId ?? url.searchParams.get("member") });
  if (a.status !== "active" && !OPEN_WHEN_SUSPENDED.test(path)) return json(suspendedBody(env), 403);
  await touch(env, a);

  const out = new URL(url.toString());
  out.searchParams.delete("auth");
  if (out.searchParams.has("member") || isWs) out.searchParams.set("member", a.member_id!);
  const headers = new Headers(req.headers);
  headers.delete("authorization");
  if (body) {
    if ("memberId" in body || !ANON_BODY.has(path)) body.memberId = a.member_id;
    headers.delete("content-length");
    return new Request(out.toString(), { method: req.method, headers, body: JSON.stringify(body) });
  }
  const next = new Request(out.toString(), req);
  next.headers.delete("authorization");
  return next;
}

// --- Admin: find, suspend, restore ------------------------------------------------------------------

async function writeAudit(env: Env, uid: string, action: string, reason: string | null, s: Staff | null) {
  await env.DB.prepare("INSERT INTO account_audit (at, uid, action, reason, actor_id, actor) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(new Date().toISOString(), uid, action, reason, s?.id ?? "system", s ? label(s) : "System").run();
}

export async function searchAccounts(env: Env, q: string, limit = 100) {
  await ensureSchema(env);
  // Usernames can have _ in them: escape LIKE's wildcards rather than dropping them.
  const like = `%${q.replace(/[!%_]/g, (c) => "!" + c)}%`;
  const { results } = await env.DB.prepare(
    `SELECT a.uid, a.provider, a.phone, a.email, p.username, a.member_id, a.status, a.status_reason, a.created_at, a.last_seen_at, a.app_version, m.pod_id
     FROM accounts a LEFT JOIN members m ON m.member_id = a.member_id LEFT JOIN password_logins p ON p.uid = a.uid
     WHERE (? = '' OR a.uid LIKE ? ESCAPE '!' OR a.phone LIKE ? ESCAPE '!' OR a.email LIKE ? ESCAPE '!' OR a.member_id LIKE ? ESCAPE '!' OR p.username LIKE ? ESCAPE '!') ORDER BY COALESCE(a.last_seen_at, a.created_at) DESC LIMIT ?`,
  ).bind(q, like, like, like, like, like, limit).all();
  return results;
}

export async function accountHistory(env: Env, uid: string) {
  await ensureSchema(env);
  return (await env.DB.prepare("SELECT at, action, reason, actor FROM account_audit WHERE uid = ? ORDER BY id DESC LIMIT 50").bind(uid).all()).results;
}

/** Suspend or restore. Suspending closes their live pod and Commons sockets straight away. */
export async function setAccountStatus(env: Env, uid: string, action: "suspend" | "restore", reason: string, s: Staff) {
  await ensureSchema(env);
  const a = await getAccount(env, uid);
  if (!a) return bad("No such account", 404);
  if (!reason.trim()) return bad("A reason is required");
  const status = action === "suspend" ? "suspended" : "active";
  await env.DB.prepare("UPDATE accounts SET status = ?, status_reason = ? WHERE uid = ?").bind(status, action === "suspend" ? reason.slice(0, 300) : null, uid).run();
  await writeAudit(env, uid, action, reason.slice(0, 300), s);
  let closed = 0;
  if (action === "suspend" && a.member_id) closed = await closeSockets(env, a.member_id);
  return json({ ok: true, status, socketsClosed: closed });
}

export async function closeSockets(env: Env, memberId: string): Promise<number> {
  let n = 0;
  const m = await env.DB.prepare("SELECT pod_id FROM members WHERE member_id = ?").bind(memberId).first<{ pod_id: string }>();
  if (m) {
    const r = await env.POD.get(env.POD.idFromName(m.pod_id)).fetch(`https://pod/kick?pod=${encodeURIComponent(m.pod_id)}&member=${encodeURIComponent(memberId)}&why=suspended`, { method: "POST" }).catch(() => null);
    if (r?.ok) n++;
  }
  if (env.COMMONS) {
    for (const room of COMMONS_ROOMS) {
      const r = await env.COMMONS.get(env.COMMONS.idFromName(room.id)).fetch(`https://commons/kick?member=${encodeURIComponent(memberId)}`, { method: "POST" }).catch(() => null);
      if (r?.ok) n += (await r.json<{ closed: number }>().catch(() => ({ closed: 0 }))).closed;
    }
  }
  return n;
}

/** Erasure ("Delete my data"): the account goes too. A suspended account leaves only a hash of its phone or email. */
export async function forgetAccount(env: Env, memberId: string) {
  await ensureSchema(env);
  const a = await env.DB.prepare("SELECT * FROM accounts WHERE member_id = ?").bind(memberId).first<Account>();
  if (!a) return;
  const username = await usernameOf(env, a.uid);
  if (a.status === "suspended") {
    const hash = await identHash({ ...a, username });
    if (hash) await env.DB.prepare("INSERT INTO account_tombstones (ident_hash, reason, at) VALUES (?, ?, ?) ON CONFLICT(ident_hash) DO UPDATE SET reason = excluded.reason, at = excluded.at")
      .bind(hash, a.status_reason, new Date().toISOString()).run();
  }
  await env.DB.prepare("DELETE FROM accounts WHERE uid = ?").bind(a.uid).run();
  if (username) await forgetLogin(env, a.uid); // the username is free again (a suspended one stays suspended, above)
  await writeAudit(env, a.uid, "erased", "Member deleted their data", null);
}
