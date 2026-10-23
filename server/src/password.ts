import { type Account, upsertAccount } from "./auth";
import { b64u, checkPassword, cleanUsername, hashPassword, passwordProblem, unb64u } from "./password-hash";
import { type Env, bad, json } from "./shared";
import { type Staff, ensureSchema, flags, label, sha256Hex } from "./staff";

/**
 * Username and password sign-in: an alternative to Google, kept on our own server (no Firebase needed).
 *
 * - Usernames are 3-30 characters of a-z, 0-9, _ and . (stored lower-case). No email, so there is no self-service
 *   reset: staff set a one-time temporary password from the admin console, and the app asks for a new one.
 * - Passwords are hashed with PBKDF2-SHA256 (WebCrypto), 100,000 iterations (the most Workers allows) and a
 *   per-user salt, and compared in constant time.
 * - Sign-in attempts are limited per username and per IP (the IP is kept only as a hash, for 15 minutes' counting).
 *   Errors are generic: a wrong username and a wrong password look the same.
 * - On success the server issues its own signed session token ("upw.<payload>.<sig>", HMAC-SHA256, 30 days).
 *   identify() in auth.ts accepts it next to Firebase ID tokens; the account's provider is "password". Changing or
 *   resetting the password bumps an epoch in the token, which signs out every other device.
 * - The `password_login` flag switches sign-up and sign-in off. Tokens already issued keep working, so nobody is
 *   locked out of their pod.
 */

const TOKEN_DAYS = 30;
const USERNAME = /^[a-z0-9_.]{3,30}$/;
const enc = new TextEncoder();
// Hashed once per isolate, so an unknown username costs the same time as a wrong password.
let dummyHash: Promise<string> | null = null;

export type PasswordLogin = { username: string; uid: string; pw_hash: string; epoch: number; must_change: number; created_at: string; updated_at: string };

// --- Session tokens -----------------------------------------------------------------------------------------

let signingKey: Promise<CryptoKey> | null = null;
/** A random 32-byte key made on first use and kept in D1 (never sent anywhere), or SESSION_SECRET if set. */
function sessionKey(env: Env): Promise<CryptoKey> {
  signingKey ??= (async () => {
    let raw: Uint8Array;
    if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 32) raw = enc.encode(env.SESSION_SECRET);
    else {
      await ensureSchema(env);
      await env.DB.prepare("INSERT INTO server_keys (name, value, created_at) VALUES ('session', ?, ?) ON CONFLICT(name) DO NOTHING")
        .bind(b64u(crypto.getRandomValues(new Uint8Array(32))), new Date().toISOString()).run();
      const row = await env.DB.prepare("SELECT value FROM server_keys WHERE name = 'session'").first<{ value: string }>();
      raw = unb64u(row!.value)!;
    }
    return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  })().catch((e) => { signingKey = null; throw e; });
  return signingKey;
}

export async function issueToken(env: Env, login: Pick<PasswordLogin, "uid" | "epoch">): Promise<{ token: string; expiresAt: string }> {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_DAYS * 86400;
  const body = b64u(enc.encode(JSON.stringify({ u: login.uid, e: login.epoch, x: exp })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(env), enc.encode("upw." + body)));
  return { token: `upw.${body}.${b64u(sig)}`, expiresAt: new Date(exp * 1000).toISOString() };
}

export const isPasswordToken = (t: string) => t.startsWith("upw.");

/** Checks the signature, the expiry and the epoch (a changed or reset password signs older tokens out). */
export async function verifyPasswordToken(env: Env, token: string): Promise<{ ok: true; login: PasswordLogin } | { ok: false; code: string }> {
  const [, body, sig] = token.split(".");
  const b = unb64u(body ?? ""), s = unb64u(sig ?? "");
  if (!b || !s || token.split(".").length !== 3) return { ok: false, code: "auth_invalid" };
  if (!(await crypto.subtle.verify("HMAC", await sessionKey(env), s, enc.encode("upw." + body)))) return { ok: false, code: "auth_invalid" };
  let p: { u?: string; e?: number; x?: number };
  try { p = JSON.parse(new TextDecoder().decode(b)); } catch { return { ok: false, code: "auth_invalid" }; }
  if (typeof p.u !== "string" || typeof p.e !== "number" || typeof p.x !== "number") return { ok: false, code: "auth_invalid" };
  if (p.x * 1000 < Date.now()) return { ok: false, code: "auth_expired" };
  await ensureSchema(env);
  const login = await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(p.u).first<PasswordLogin>();
  if (!login || login.epoch !== p.e) return { ok: false, code: "auth_revoked" };
  return { ok: true, login };
}

// --- Rate limits ----------------------------------------------------------------------------------------------

const WINDOW = 15 * 60_000;
/** [failures allowed in the window, then locked for the rest of it] */
const LIMITS = { user: 5, ip: 30, signup: 10 } as const;

async function clientIp(req: Request) {
  return sha256Hex("ip:" + (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "local"));
}

async function throttled(env: Env, key: string, limit: number): Promise<boolean> {
  const row = await env.DB.prepare("SELECT fails, window_start FROM login_throttle WHERE k = ?").bind(key).first<{ fails: number; window_start: number }>();
  return !!row && Date.now() - row.window_start < WINDOW && row.fails >= limit;
}
async function addFail(env: Env, key: string) {
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO login_throttle (k, fails, window_start) VALUES (?, 1, ?)
    ON CONFLICT(k) DO UPDATE SET fails = CASE WHEN ? - window_start >= ? THEN 1 ELSE fails + 1 END,
    window_start = CASE WHEN ? - window_start >= ? THEN ? ELSE window_start END`).bind(key, now, now, WINDOW, now, WINDOW, now).run();
}
const clearFails = (env: Env, key: string) => env.DB.prepare("DELETE FROM login_throttle WHERE k = ?").bind(key).run();

const tooMany = () => json({ error: "Too many tries. Please wait 15 minutes and try again.", code: "rate_limited" }, 429);
const wrong = () => json({ error: "Wrong username or password.", code: "auth_wrong" }, 401);

// --- Routes ---------------------------------------------------------------------------------------------------

/** What sign-in returns to the apps: the session token plus the account, like /auth/session. */
async function session(env: Env, login: PasswordLogin, a: Account) {
  const t = await issueToken(env, login);
  return {
    token: t.token, expiresAt: t.expiresAt, username: login.username, mustChange: !!login.must_change,
    uid: a.uid, memberId: a.member_id, provider: "password", status: a.status, checked_at: new Date().toISOString(),
    ...(a.status === "suspended" ? { support: env.SUPPORT_CONTACT || null } : {}),
  };
}

const identity = (login: Pick<PasswordLogin, "uid" | "username">) => ({ uid: login.uid, provider: "password", phone: null, email: null, username: login.username });

export async function passwordRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (!path.startsWith("/auth/password/") || req.method !== "POST") return null;
  await ensureSchema(env);
  const body = await req.json<any>().catch(() => ({}));
  const op = path.slice("/auth/password/".length);

  if (op === "signout") return json({ ok: true }); // tokens live on the device; the app forgets it

  if (op === "signup" || op === "signin") {
    if (!(await flags(env)).password_login) return json({ error: "Username sign-in is switched off right now. Please continue with Google.", code: "password_login_off" }, 403);
    const username = cleanUsername(body.username);
    const password = body.password;
    const ip = await clientIp(req);

    if (op === "signup") {
      if (!USERNAME.test(username)) return bad("Usernames are 3 to 30 characters: small letters, numbers, _ and .");
      const p = passwordProblem(password);
      if (p) return bad(p);
      if (await throttled(env, "su:" + ip, LIMITS.signup)) return tooMany();
      await addFail(env, "su:" + ip); // counts sign-ups per IP, successful or not
      const uid = "pw-" + crypto.randomUUID().replace(/-/g, "");
      const now = new Date().toISOString();
      const ins = await env.DB.prepare(`INSERT INTO password_logins (username, uid, pw_hash, epoch, must_change, created_at, updated_at)
        VALUES (?, ?, ?, 1, 0, ?, ?) ON CONFLICT(username) DO NOTHING`).bind(username, uid, await hashPassword(password), now, now).run();
      if (!ins.meta.changes) return json({ error: "That username is taken. Please try another.", code: "username_taken" }, 409);
      const login = (await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(uid).first<PasswordLogin>())!;
      const a = await upsertAccount(env, identity(login), { memberHint: body.memberId, appVersion: body.appVersion });
      return json(await session(env, login, a));
    }

    // Sign in. Bad input gets the same answer as a wrong password.
    if (typeof password !== "string" || password.length > 200) return wrong();
    if (await throttled(env, "ip:" + ip, LIMITS.ip) || (USERNAME.test(username) && await throttled(env, "u:" + username, LIMITS.user))) return tooMany();
    const login = USERNAME.test(username) ? await env.DB.prepare("SELECT * FROM password_logins WHERE username = ?").bind(username).first<PasswordLogin>() : null;
    dummyHash ??= hashPassword("not-a-real-password");
    const ok = await checkPassword(password, login?.pw_hash ?? await dummyHash) && !!login;
    if (!ok) {
      await addFail(env, "ip:" + ip);
      if (USERNAME.test(username)) await addFail(env, "u:" + username);
      return wrong();
    }
    await clearFails(env, "u:" + username);
    const a = await upsertAccount(env, identity(login!), { memberHint: body.memberId, appVersion: body.appVersion });
    return json(await session(env, login!, a));
  }

  if (op === "change") {
    const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    const v = isPasswordToken(t) ? await verifyPasswordToken(env, t) : null;
    if (!v?.ok) return json({ error: "Please sign in again.", code: "auth_required" }, 401);
    if (await throttled(env, "u:" + v.login.username, LIMITS.user)) return tooMany();
    if (!(await checkPassword(String(body.current ?? ""), v.login.pw_hash))) {
      await addFail(env, "u:" + v.login.username);
      return json({ error: "Your current password isn't right.", code: "auth_wrong" }, 401);
    }
    const p = passwordProblem(body.next);
    if (p) return bad(p);
    await env.DB.prepare("UPDATE password_logins SET pw_hash = ?, epoch = epoch + 1, must_change = 0, updated_at = ? WHERE uid = ?")
      .bind(await hashPassword(body.next), new Date().toISOString(), v.login.uid).run();
    await clearFails(env, "u:" + v.login.username);
    const login = (await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(v.login.uid).first<PasswordLogin>())!;
    const a = await upsertAccount(env, identity(login));
    return json(await session(env, login, a));
  }
  return null;
}

// --- Admin and erasure ----------------------------------------------------------------------------------------

/** A one-time temporary password, shown to staff once. Signs the account out everywhere; the app asks for a new one. */
export async function resetPassword(env: Env, uid: string, s: Staff) {
  await ensureSchema(env);
  const login = await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(uid).first<PasswordLogin>();
  if (!login) return bad("This account doesn't use a username and password", 404);
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const temp = Array.from(crypto.getRandomValues(new Uint8Array(12)), (n) => alphabet[n % alphabet.length]).join("");
  await env.DB.prepare("UPDATE password_logins SET pw_hash = ?, epoch = epoch + 1, must_change = 1, updated_at = ? WHERE uid = ?")
    .bind(await hashPassword(temp), new Date().toISOString(), uid).run();
  await clearFails(env, "u:" + login.username);
  await env.DB.prepare("INSERT INTO account_audit (at, uid, action, reason, actor_id, actor) VALUES (?, ?, 'reset_password', ?, ?, ?)")
    .bind(new Date().toISOString(), uid, "Temporary password set", s.id, label(s)).run();
  return json({ ok: true, username: login.username, tempPassword: temp });
}

export const usernameOf = async (env: Env, uid: string) =>
  (await env.DB.prepare("SELECT username FROM password_logins WHERE uid = ?").bind(uid).first<{ username: string }>())?.username ?? null;

export const forgetLogin = (env: Env, uid: string) => env.DB.prepare("DELETE FROM password_logins WHERE uid = ?").bind(uid).run();
