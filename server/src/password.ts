import { type Account, upsertAccount } from "./auth";
import { devTokenAllowed } from "./auth-dev";
import { lastMail, mailOn, sendMail } from "./mail";
import { b64u, checkPassword, cleanUsername, hashPassword, passwordProblem, unb64u } from "./password-hash";
import { type Env, bad, json } from "./shared";
import { type Staff, ensureSchema, flags, label, sha256Hex } from "./staff";

/**
 * Username and password sign-in: an alternative to Google, kept on our own server (no Firebase needed).
 *
 * - Usernames are 3-30 characters of a-z, 0-9, _ and . (stored lower-case). Staff can set a one-time temporary
 *   password from the admin console, and the app asks for a new one.
 * - A member can add a recovery email (optional, checked with a 6-digit code). Then "Forgot password?" mails a
 *   single-use reset link that works for 30 minutes (mail.ts). The code and the link are kept only as hashes. Asking
 *   for a reset always gets the same answer, so it can't be used to find out who has an account or an email.
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
const LIMITS = { user: 5, ip: 30, signup: 10, forgot: 10, forgotUser: 3, mailUser: 5, mailIp: 20, code: 5 } as const;

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

/** The signed-in password account, from the session token in the Authorization header. */
async function signedInLogin(req: Request, env: Env): Promise<PasswordLogin | null> {
  const t = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const v = isPasswordToken(t) ? await verifyPasswordToken(env, t) : null;
  return v?.ok ? v.login : null;
}
const signInAgain = () => json({ error: "Please sign in again.", code: "auth_required" }, 401);

export async function passwordRoute(req: Request, env: Env, path: string, ctx?: ExecutionContext): Promise<Response | null> {
  // Local dev only: the last message the "log" mail provider kept, for test/password.mjs.
  if (path === "/auth/password/dev/outbox" && req.method === "GET") {
    const url = new URL(req.url);
    if (!devTokenAllowed(env.AUTH_MODE, url)) return null;
    return json(lastMail(url.searchParams.get("to")));
  }
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
    const me = await signedInLogin(req, env);
    if (!me) return signInAgain();
    if (await throttled(env, "u:" + me.username, LIMITS.user)) return tooMany();
    if (!(await checkPassword(String(body.current ?? ""), me.pw_hash))) {
      await addFail(env, "u:" + me.username);
      return json({ error: "Your current password isn't right.", code: "auth_wrong" }, 401);
    }
    const p = passwordProblem(body.next);
    if (p) return bad(p);
    await env.DB.prepare("UPDATE password_logins SET pw_hash = ?, epoch = epoch + 1, must_change = 0, updated_at = ? WHERE uid = ?")
      .bind(await hashPassword(body.next), new Date().toISOString(), me.uid).run();
    await clearFails(env, "u:" + me.username);
    await dropResets(env, me.uid);
    const login = (await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(me.uid).first<PasswordLogin>())!;
    const a = await upsertAccount(env, identity(login));
    return json(await session(env, login, a));
  }

  // The recovery email, for the signed-in account only.
  if (op === "recovery" || op.startsWith("recovery/")) {
    const me = await signedInLogin(req, env);
    if (!me) return signInAgain();
    if (op === "recovery") return json({ ...recoveryView(await recoveryOf(env, me.uid)), mail: mailOn(env) });
    if (op === "recovery/remove") {
      await env.DB.prepare("DELETE FROM recovery_emails WHERE uid = ?").bind(me.uid).run();
      await dropResets(env, me.uid);
      return json({ ...recoveryView(null), mail: mailOn(env) });
    }
    if (op === "recovery/add") {
      if (!mailOn(env)) return json({ error: "Email isn't set up on this server yet.", code: "mail_off" }, 503);
      const email = cleanEmail(body.email);
      if (!EMAIL.test(email) || email.length > 200) return bad("That doesn't look like an email address.");
      const ip = await clientIp(req);
      if (await throttled(env, "ev:" + me.uid, LIMITS.mailUser) || await throttled(env, "ev:" + ip, LIMITS.mailIp)) return tooMany();
      await addFail(env, "ev:" + me.uid); // counts codes sent, not failures
      await addFail(env, "ev:" + ip);
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO recovery_emails (uid, pending_email, code_hash, code_expires, code_tries, updated_at) VALUES (?, ?, ?, ?, 0, ?)
        ON CONFLICT(uid) DO UPDATE SET pending_email = excluded.pending_email, code_hash = excluded.code_hash, code_expires = excluded.code_expires,
        code_tries = 0, updated_at = excluded.updated_at`).bind(me.uid, email, await codeHash(me.uid, code), Date.now() + CODE_MIN * 60_000, now).run();
      const ok = await sendMail(env, { to: email, subject: "Your UPSC Pods code", text:
        `Hello @${me.username},\n\nYour code to add this email to your UPSC Pods account is: ${code}\n\nIt works for ${CODE_MIN} minutes. ` +
        `If you didn't ask for it, you can ignore this email.\n` });
      if (!ok) return json({ error: "Couldn't send the email. Please try again later.", code: "mail_failed" }, 503);
      return json({ ...recoveryView(await recoveryOf(env, me.uid)), mail: true });
    }
    if (op === "recovery/verify") {
      const r = await recoveryOf(env, me.uid);
      if (!r?.code_hash || !r.code_expires || r.code_expires < Date.now()) return json({ error: "That code has expired. Please ask for a new one.", code: "code_expired" }, 400);
      if (r.code_tries >= LIMITS.code) return tooMany();
      if (await codeHash(me.uid, String(body.code ?? "").trim()) !== r.code_hash) {
        await env.DB.prepare("UPDATE recovery_emails SET code_tries = code_tries + 1 WHERE uid = ?").bind(me.uid).run();
        return json({ error: "That code isn't right.", code: "code_wrong" }, 400);
      }
      const now = new Date().toISOString();
      await env.DB.prepare(`UPDATE recovery_emails SET email = pending_email, pending_email = NULL, code_hash = NULL, code_expires = NULL, code_tries = 0,
        verified_at = ?, updated_at = ? WHERE uid = ?`).bind(now, now, me.uid).run();
      return json({ ...recoveryView(await recoveryOf(env, me.uid)), mail: mailOn(env) });
    }
    return null;
  }

  // Forgot password: by username or recovery email. Always the same answer.
  if (op === "forgot") {
    if (!(await flags(env)).password_login) return json({ error: "Username sign-in is switched off right now. Please continue with Google.", code: "password_login_off" }, 403);
    const ip = await clientIp(req);
    if (await throttled(env, "rr:" + ip, LIMITS.forgot)) return tooMany();
    await addFail(env, "rr:" + ip); // counts requests per IP
    await env.DB.prepare("DELETE FROM password_resets WHERE expires_at < ?").bind(Date.now()).run();
    const who = typeof body.who === "string" ? body.who.trim().toLowerCase().slice(0, 200) : "";
    const sql = "SELECT p.uid, p.username, r.email FROM recovery_emails r JOIN password_logins p ON p.uid = r.uid WHERE r.email IS NOT NULL AND ";
    const { results } = who.includes("@")
      ? await env.DB.prepare(sql + "r.email = ? LIMIT 5").bind(who).all<{ uid: string; username: string; email: string }>()
      : USERNAME.test(who) ? await env.DB.prepare(sql + "p.username = ?").bind(who).all<{ uid: string; username: string; email: string }>() : { results: [] };
    const base = (env.PUBLIC_BASE_URL || new URL(req.url).origin).replace(/\/+$/, "");
    for (const l of results) {
      if (await throttled(env, "rr:u:" + l.uid, LIMITS.forgotUser)) continue;
      await addFail(env, "rr:u:" + l.uid);
      const token = b64u(crypto.getRandomValues(new Uint8Array(32)));
      await env.DB.prepare("INSERT INTO password_resets (token_hash, uid, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .bind(await sha256Hex("reset:" + token), l.uid, Date.now() + RESET_MIN * 60_000, new Date().toISOString()).run();
      // Sent after the answer, so a known address doesn't take longer to answer than an unknown one.
      const mail = sendMail(env, { to: l.email, subject: "Reset your UPSC Pods password", text:
        `Hello @${l.username},\n\nSomeone asked to reset the password for @${l.username} on UPSC Pods. If it was you, open this link within ` +
        `${RESET_MIN} minutes to choose a new one:\n${base}/app/#reset=${token}\n\nOr in the app, tap "Forgot password?", then "I have a code", ` +
        `and paste this code:\n${token}\n\nThe link works once. If it wasn't you, you can ignore this email: your password stays the same.\n` });
      if (ctx) ctx.waitUntil(mail); else await mail;
    }
    return json({ ok: true, message: `If that account has a recovery email, we've sent a reset link to it. It works for ${RESET_MIN} minutes.` });
  }

  // Set a new password with the code from the email. Signs every other device out, and signs this one in.
  if (op === "reset") {
    if (!(await flags(env)).password_login) return json({ error: "Username sign-in is switched off right now. Please continue with Google.", code: "password_login_off" }, 403);
    const ip = await clientIp(req);
    if (await throttled(env, "rp:" + ip, LIMITS.ip)) return tooMany();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const row = /^[\w-]{40,50}$/.test(token)
      ? await env.DB.prepare("SELECT uid, expires_at FROM password_resets WHERE token_hash = ?").bind(await sha256Hex("reset:" + token)).first<{ uid: string; expires_at: number }>()
      : null;
    if (!row || row.expires_at < Date.now()) {
      await addFail(env, "rp:" + ip);
      return json({ error: "That reset code has expired or was already used. Please ask for a new one.", code: "reset_invalid" }, 400);
    }
    const p = passwordProblem(body.next);
    if (p) return bad(p);
    await dropResets(env, row.uid); // single use: this one and any others
    const upd = await env.DB.prepare("UPDATE password_logins SET pw_hash = ?, epoch = epoch + 1, must_change = 0, updated_at = ? WHERE uid = ?")
      .bind(await hashPassword(body.next), new Date().toISOString(), row.uid).run();
    const login = upd.meta.changes ? await env.DB.prepare("SELECT * FROM password_logins WHERE uid = ?").bind(row.uid).first<PasswordLogin>() : null;
    if (!login) return json({ error: "That reset code has expired or was already used. Please ask for a new one.", code: "reset_invalid" }, 400);
    await clearFails(env, "u:" + login.username);
    await env.DB.prepare("INSERT INTO account_audit (at, uid, action, reason, actor_id, actor) VALUES (?, ?, 'reset_password', ?, 'member', 'Member')")
      .bind(new Date().toISOString(), login.uid, "Reset by recovery email").run();
    const a = await upsertAccount(env, identity(login), { appVersion: body.appVersion });
    return json(await session(env, login, a));
  }
  return null;
}

// --- Recovery email -------------------------------------------------------------------------------------------

const CODE_MIN = 30;
const RESET_MIN = 30;
const EMAIL = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/;
const cleanEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const codeHash = (uid: string, code: string) => sha256Hex(`code:${uid}:${code}`);

type Recovery = { uid: string; email: string | null; pending_email: string | null; code_hash: string | null; code_expires: number | null; code_tries: number };
const recoveryOf = (env: Env, uid: string) => env.DB.prepare("SELECT * FROM recovery_emails WHERE uid = ?").bind(uid).first<Recovery>();
/** What the account screen shows. Only ever the signed-in person's own address. */
const recoveryView = (r: Recovery | null) => ({
  email: r?.email ?? null, pending: r?.pending_email && r.code_expires && r.code_expires > Date.now() ? r.pending_email : null,
});
const dropResets = (env: Env, uid: string) => env.DB.prepare("DELETE FROM password_resets WHERE uid = ?").bind(uid).run();

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
  await dropResets(env, uid);
  await env.DB.prepare("INSERT INTO account_audit (at, uid, action, reason, actor_id, actor) VALUES (?, ?, 'reset_password', ?, ?, ?)")
    .bind(new Date().toISOString(), uid, "Temporary password set", s.id, label(s)).run();
  return json({ ok: true, username: login.username, tempPassword: temp });
}

export const usernameOf = async (env: Env, uid: string) =>
  (await env.DB.prepare("SELECT username FROM password_logins WHERE uid = ?").bind(uid).first<{ username: string }>())?.username ?? null;

/** Erasure: the login, the recovery email and any reset links. */
export const forgetLogin = (env: Env, uid: string) => env.DB.batch(["password_logins", "recovery_emails", "password_resets"]
  .map((t) => env.DB.prepare(`DELETE FROM ${t} WHERE uid = ?`).bind(uid)));
