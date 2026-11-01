// Username and password sign-in (src/password.ts), against a running local server:
//   npx wrangler dev --port 8790 --persist-to .wrangler-test --var EDITOR_TOKEN:<any> --var AUTH_MODE:dev
//   EDITOR_TOKEN=<same> BASE=http://127.0.0.1:8790 node test/password.mjs
// Part 1 checks the hashing and constant-time compare in plain Node. Part 2 checks sign-up, sign-in, generic errors,
// the per-username rate limit, the session token on member routes and sockets, change password, staff reset with a
// temporary password, the recovery email and "Forgot password?" (read from the dev "log" mail provider, mail.ts),
// suspension, erasure (a suspended username stays suspended, the recovery email goes) and the password_login flag.
// It flips flags (and puts them back), so use a local database.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
// These suites test matched pods, so switch them on (rooms.ts): below the sign-up threshold /pods/join refuses.
await fetch(BASE + "/admin/api/growth/threshold", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: JSON.stringify({ signupThreshold: 0 }) });
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");

// --- Part 1: hashing, without a server ---
const { hashPassword, checkPassword, sameBytes, passwordProblem, cleanUsername } = await import("../src/password-hash.ts").catch(() => ({}));
if (hashPassword) {
  const h = await hashPassword("correct horse");
  assert.match(h, /^pbkdf2-sha256\$100000\$[\w-]{22}\$[\w-]{43}$/);
  assert.notEqual(h, await hashPassword("correct horse"), "a new salt every time");
  assert.equal(await checkPassword("correct horse", h), true);
  assert.equal(await checkPassword("correct hors", h), false);
  assert.equal(await checkPassword("x", "garbage"), false);
  assert.equal(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2])), true);
  assert.equal(sameBytes(new Uint8Array([1, 2]), new Uint8Array([1, 3])), false);
  assert.equal(passwordProblem("short"), "Use at least 8 characters for your password.");
  assert.equal(passwordProblem("long enough"), null);
  assert.equal(cleanUsername("  Asha.K "), "asha.k");
  step("PBKDF2-SHA256 with a per-user salt, constant-time compare, input rules");
} else console.log("(skipped the in-Node hashing checks: this Node can't import .ts)");

// --- Part 2: against the server ---
const call = async (path, { method = "GET", body, token, headers = {} } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body, opts = {}) => call(path, { method: "POST", body, ...opts });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, headers: { authorization: "Bearer " + TOKEN } });
// Each run looks like a different IP, so the per-IP limits of earlier runs don't get in the way.
const ip = { "cf-connecting-ip": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` };

const flagsBefore = (await admin("flags")).data.flags;
// Off by default (Google only for now); this run switches it on in Admin, and puts it back at the end.
assert.equal(flagsBefore.password_login, false, "off by default (use a fresh test database)");
assert.equal((await admin("flags", { flags: { ...flagsBefore, password_login: true } })).status, 200);
const cfg = (await call("/config")).data.auth;
assert.equal(cfg.password, true, "/config tells the apps");
assert.equal(cfg.recovery, true, "recovery by email is on in dev (the log mail provider)");
step("password_login switched on in Admin and /config says so");

const name = "t_" + rid().slice(0, 10);
const hint = rid();
assert.equal((await post("/auth/password/signup", { username: "ab", password: "longenough" }, { headers: ip })).status, 400, "username too short");
assert.equal((await post("/auth/password/signup", { username: "Bad Name!", password: "longenough" }, { headers: ip })).status, 400, "bad characters");
assert.equal((await post("/auth/password/signup", { username: name, password: "short" }, { headers: ip })).status, 400, "password too short");
const up = await post("/auth/password/signup", { username: name.toUpperCase(), password: "first password", memberId: hint }, { headers: ip });
assert.equal(up.status, 200, JSON.stringify(up.data));
assert.equal(up.data.username, name, "stored lower-case");
assert.equal(up.data.provider, "password");
assert.equal(up.data.memberId, hint, "this install's member id is linked");
assert.match(up.data.token, /^upw\.[\w-]+\.[\w-]+$/);
assert.equal((await post("/auth/password/signup", { username: name, password: "another one" }, { headers: ip })).status, 409, "taken");
step("sign-up: rules, lower-case usernames, member id linked, taken names refused");

const wrongUser = await post("/auth/password/signin", { username: "nobody_" + rid().slice(0, 8), password: "first password" }, { headers: ip });
const wrongPass = await post("/auth/password/signin", { username: name, password: "wrong password" }, { headers: ip });
assert.equal(wrongUser.status, 401); assert.equal(wrongPass.status, 401);
assert.equal(wrongUser.data.error, wrongPass.data.error, "the same message either way");
const inn = await post("/auth/password/signin", { username: name, password: "first password" }, { headers: ip });
assert.equal(inn.status, 200); assert.equal(inn.data.memberId, hint); assert.equal(inn.data.mustChange, false);
step("sign-in, with one generic error for a wrong username or password");

// The token works on member routes and sockets, and the member id is the account's own.
let tok = inn.data.token;
const me = await call("/me/status", { token: tok });
assert.equal(me.data.status, "active"); assert.equal(me.data.memberId, hint);
const join = await post("/pods/join", { memberId: "someone-else-entirely-0000", stage: "pw" + rid().slice(0, 6), language: "english" }, { token: tok });
assert.equal(join.status, 200, JSON.stringify(join.data));
const podMe = await post("/pods/me", { memberId: "someone-else-entirely-0000" }, { token: tok });
assert.equal(podMe.data.podId, join.data.podId, "acts as itself, whatever id the body claims");
const ws = await new Promise((res, rej) => {
  const s = new WebSocket(`${BASE.replace("http", "ws")}/pods/${join.data.podId}/ws?member=x&name=T&auth=${encodeURIComponent(tok)}`);
  s.onmessage = (e) => { const m = JSON.parse(e.data); if (m.type === "history") { s.close(); res(true); } };
  s.onerror = rej; setTimeout(() => rej(new Error("socket timed out")), 5000);
});
assert.ok(ws);
const forged = tok.slice(0, -4) + (tok.endsWith("AAAA") ? "BBBB" : "AAAA");
assert.equal((await call("/me/status", { token: forged })).status, 401, "a changed signature is refused");
step("the session token works on member routes and sockets; a forged one doesn't");

// Change password: needs the current one; other tokens stop working.
assert.equal((await post("/auth/password/change", { current: "nope nope", next: "second password" }, { token: tok })).status, 401);
assert.equal((await post("/auth/password/change", { current: "first password", next: "short" }, { token: tok })).status, 400);
const ch = await post("/auth/password/change", { current: "first password", next: "second password" }, { token: tok });
assert.equal(ch.status, 200);
assert.equal((await call("/me/status", { token: tok })).status, 401, "the old token is signed out");
tok = ch.data.token;
assert.equal((await call("/me/status", { token: tok })).data.status, "active");
assert.equal((await post("/auth/password/signin", { username: name, password: "first password" }, { headers: ip })).status, 401);
assert.equal((await post("/auth/password/signin", { username: name, password: "second password" }, { headers: ip })).status, 200);
step("change password: needs the current one, signs other devices out");

// Rate limit: 5 wrong tries for a username, then even the right password waits.
for (let i = 0; i < 5; i++) assert.equal((await post("/auth/password/signin", { username: name, password: "wrong " + i }, { headers: ip })).status, 401);
const locked = await post("/auth/password/signin", { username: name, password: "second password" }, { headers: ip });
assert.equal(locked.status, 429); assert.equal(locked.data.code, "rate_limited");
step("5 wrong tries lock that username for 15 minutes");

// Admin: find by username, reset to a temporary password (clears the lock, signs out, must change).
const found = (await admin("accounts?q=" + name)).data;
assert.equal(found.length, 1); assert.equal(found[0].username, name); assert.equal(found[0].provider, "password");
const uid = found[0].uid;
const reset = await admin(`accounts/${uid}/reset-password`, {});
assert.equal(reset.status, 200); assert.match(reset.data.tempPassword, /^[a-z2-9]{12}$/);
assert.equal((await call("/me/status", { token: tok })).status, 401, "reset signs them out");
const temp = await post("/auth/password/signin", { username: name, password: reset.data.tempPassword }, { headers: ip });
assert.equal(temp.status, 200); assert.equal(temp.data.mustChange, true);
const fresh = await post("/auth/password/change", { current: reset.data.tempPassword, next: "third password" }, { token: temp.data.token });
assert.equal(fresh.data.mustChange, false);
tok = fresh.data.token;
assert.ok((await admin(`accounts/${uid}/history`)).data.some((x) => x.action === "reset_password"));
const googleish = (await admin("accounts?q=")).data.find((a) => a.provider !== "password");
if (googleish) assert.equal((await admin(`accounts/${googleish.uid}/reset-password`, {})).status, 404, "only for username accounts");
step("staff find by username and set a one-time temporary password");

// Recovery email: added with a 6-digit code. In dev the mail is kept, not sent, and read back here (local only).
const mailbox = async (to) => (await call("/auth/password/dev/outbox?to=" + encodeURIComponent(to))).data;
const email = `${name}@example.test`;
assert.equal((await post("/auth/password/recovery", {})).status, 401, "needs the session token");
assert.deepEqual((await post("/auth/password/recovery", {}, { token: tok })).data, { email: null, pending: null, mail: true });
assert.equal((await post("/auth/password/recovery/add", { email: "not an email" }, { token: tok, headers: ip })).status, 400);
const add = await post("/auth/password/recovery/add", { email: email.toUpperCase() }, { token: tok, headers: ip });
assert.equal(add.status, 200, JSON.stringify(add.data));
assert.equal(add.data.pending, email, "stored lower-case"); assert.equal(add.data.email, null, "not used until checked");
const code = (await mailbox(email)).text.match(/\b(\d{6})\b/)[1];
const wrongCode = String((Number(code) + 1) % 1_000_000).padStart(6, "0");
assert.equal((await post("/auth/password/recovery/verify", { code: wrongCode }, { token: tok })).data.code, "code_wrong");
const ver = await post("/auth/password/recovery/verify", { code }, { token: tok });
assert.equal(ver.data.email, email); assert.equal(ver.data.pending, null);
step("a recovery email is added only after its code is typed in");

// Forgot password: the same answer for a real account, an unknown one and an unknown email.
const f1 = await post("/auth/password/forgot", { who: name.toUpperCase() }, { headers: ip });
const f2 = await post("/auth/password/forgot", { who: "nobody_" + rid().slice(0, 8) }, { headers: ip });
const f3 = await post("/auth/password/forgot", { who: "nobody." + rid().slice(0, 8) + "@example.test" }, { headers: ip });
assert.equal(f1.status, 200); assert.deepEqual(f2, f1); assert.deepEqual(f3, f1);
const resetMail = await mailbox(email);
assert.ok(resetMail.text.includes("@" + name));
const rtok = resetMail.text.match(/#reset=([\w-]+)/)[1];
assert.ok(resetMail.text.includes("\n" + rtok + "\n"), "the same code to paste in the app");
assert.equal((await post("/auth/password/reset", { token: rtok.slice(0, -2) + "xx", next: "fifth password" }, { headers: ip })).data.code, "reset_invalid");
assert.equal((await post("/auth/password/reset", { token: rtok, next: "short" }, { headers: ip })).status, 400);
const rs = await post("/auth/password/reset", { token: rtok, next: "fifth password" }, { headers: ip });
assert.equal(rs.status, 200, JSON.stringify(rs.data)); assert.equal(rs.data.username, name); assert.equal(rs.data.mustChange, false);
assert.equal((await call("/me/status", { token: tok })).status, 401, "a reset signs other devices out");
assert.equal((await post("/auth/password/reset", { token: rtok, next: "sixth password" }, { headers: ip })).data.code, "reset_invalid", "single use");
assert.equal((await post("/auth/password/signin", { username: name, password: "third password" }, { headers: ip })).status, 401);
assert.equal((await post("/auth/password/signin", { username: name, password: "fifth password" }, { headers: ip })).status, 200);
tok = rs.data.token;
await post("/auth/password/forgot", { who: email }, { headers: ip });
const byEmail = await mailbox(email);
assert.notEqual(byEmail.text, resetMail.text, "a new link when asked by email");
assert.ok((await admin(`accounts/${uid}/history`)).data.some((x) => x.action === "reset_password" && x.reason === "Reset by recovery email"));
step("forgot password: one answer for everyone, a single-use link, other devices signed out");

// Suspend: refused everywhere; erasure keeps a suspended username suspended.
await admin(`accounts/${uid}/suspend`, { reason: "test" });
assert.equal((await post("/pods/me", { memberId: hint }, { token: tok })).status, 403);
const sIn = await post("/auth/password/signin", { username: name, password: "fifth password" }, { headers: ip });
assert.equal(sIn.data.status, "suspended");
assert.equal((await post("/privacy/delete", { memberId: hint }, { token: tok })).status, 200, "a suspended person can still erase");
assert.equal((await admin("accounts?q=" + name)).data.length, 0, "account gone");
const lastAt = (await mailbox(email)).at;
assert.equal((await post("/auth/password/forgot", { who: email }, { headers: ip })).status, 200);
assert.equal((await mailbox(email)).at, lastAt, "the recovery email went with the erasure");
assert.equal((await post("/auth/password/signin", { username: name, password: "fifth password" }, { headers: ip })).status, 401, "login gone");
const again = await post("/auth/password/signup", { username: name, password: "fourth password" }, { headers: ip });
assert.equal(again.status, 200); assert.equal(again.data.status, "suspended", "same username after erasure stays suspended");
step("suspension and erasure work as for Google accounts");

// The flag: no new sign-ups or sign-ins, but signed-in people stay signed in.
const n2 = "t_" + rid().slice(0, 10);
const keep = await post("/auth/password/signup", { username: n2, password: "keep me signed in" }, { headers: ip });
await admin("flags", { flags: { ...flagsBefore, password_login: false } });
try {
  assert.equal((await call("/config")).data.auth.password, false);
  assert.equal((await post("/auth/password/signin", { username: n2, password: "keep me signed in" }, { headers: ip })).status, 403);
  assert.equal((await post("/auth/password/signup", { username: "t_" + rid().slice(0, 10), password: "longenough" }, { headers: ip })).status, 403);
  assert.equal((await call("/me/status", { token: keep.data.token })).data.status, "active");
} finally { await admin("flags", { flags: flagsBefore }); }
step("password_login off: no new sign-ins; people already signed in stay in");

console.log("\nAll password sign-in checks passed.");
