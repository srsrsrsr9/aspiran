// Sign-in and the access switch (auth-build.md), against a running local server started with AUTH_MODE=dev:
//   npx wrangler dev --port 8790 --persist-to .wrangler-test --var EDITOR_TOKEN:<any> --var AUTH_MODE:dev
//   EDITOR_TOKEN=<same> BASE=http://127.0.0.1:8790 node test/auth.mjs
// Part 1 checks Firebase ID-token verification with a key pair made here (no network, no Firebase project).
// Part 2 checks the gate, first sign-in linking, suspension on every member route, the open Free Shelf, and the admin console.
// It flips the sign_in_required flag (and puts it back), so use a local database.
import assert from "node:assert/strict";
import { verifyFirebaseToken } from "../src/firebase-token.ts";
import { devTokenAllowed } from "../src/auth-dev.ts";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
// These suites test matched pods, so switch them on (rooms.ts): below the sign-up threshold /pods/join refuses.
await fetch(BASE + "/admin/api/growth/threshold", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: JSON.stringify({ signupThreshold: 0 }) });
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");

// --- Part 1: token verification -------------------------------------------------------------------------

const PROJECT = "upsc-pods-test";
const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const other = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };
let jwksCalls = 0;
const jwks = async () => { jwksCalls++; return [jwk]; };
const now = Math.floor(Date.now() / 1000);
const claims = (over = {}) => ({ iss: `https://securetoken.google.com/${PROJECT}`, aud: PROJECT, sub: "uid123", iat: now - 10, exp: now + 3600, auth_time: now - 10, phone_number: "+919800000001", firebase: { sign_in_provider: "phone" }, ...over });
async function sign(payload, { kid = "k1", alg = "RS256", key = pair.privateKey } = {}) {
  const head = enc({ alg, kid, typ: "JWT" }), body = enc(payload);
  const sig = Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${body}`))).toString("base64url");
  return `${head}.${body}.${sig}`;
}
const verify = (t) => verifyFirebaseToken(t, PROJECT, { jwks });

let r = await verify(await sign(claims()));
assert.equal(r.ok, true);
assert.equal(r.claims.sub, "uid123");
assert.equal(r.claims.phone_number, "+919800000001");
step("a valid token verifies (RS256, aud, iss, exp, auth_time)");

r = await verify(await sign(claims({ exp: now - 120 })));
assert.deepEqual([r.ok, r.code], [false, "auth_expired"]);
step("an expired token is refused as auth_expired");

for (const [name, t] of [
  ["wrong audience", await sign(claims({ aud: "someone-else" }))],
  ["wrong issuer", await sign(claims({ iss: "https://securetoken.google.com/someone-else" }))],
  ["no subject", await sign(claims({ sub: "" }))],
  ["auth_time in the future", await sign(claims({ auth_time: now + 600 }))],
  ["issued in the future", await sign(claims({ iat: now + 600 }))],
  ["signed by another key", await sign(claims(), { key: other.privateKey })],
  ["unknown key id", await sign(claims(), { kid: "nope" })],
  ["alg none", `${enc({ alg: "none", kid: "k1" })}.${enc(claims())}.`],
  ["HS256", (await sign(claims(), { alg: "HS256" }))],
  ["tampered payload", (await sign(claims())).replace(/^([^.]+)\.[^.]+/, (_, h) => `${h}.${enc(claims({ sub: "admin" }))}`)],
  ["not a JWT", "abc"],
]) {
  r = await verify(t);
  assert.equal(r.ok, false, name);
  assert.equal(r.code, "auth_invalid", name);
}
step("wrong aud/iss/sub, future auth_time or iat, foreign key, unknown kid, alg none/HS256, tampering and junk are refused");

// --- Part 2: the server -----------------------------------------------------------------------------------

const call = async (path, { method = "GET", body, token, headers = {} } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body = {}, token) => call(path, { method: "POST", body, token });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, token: TOKEN });
const setFlag = async (name, on) => { const f = (await admin("flags")).data.flags; f[name] = on; assert.equal((await admin("flags", { flags: f })).status, 200); };

await setFlag("sign_in_required", true);

// No token, a junk token, and a real-looking token this server can't accept.
r = await post("/pods/join", { memberId: rid(), stage: "auth" });
assert.equal(r.status, 401);
assert.equal(r.data.code, "auth_required");
r = await post("/pods/join", { memberId: rid() }, "junk.junk.junk");
assert.ok([401, 503].includes(r.status) && ["auth_invalid", "auth_unconfigured"].includes(r.data.code), JSON.stringify(r));
r = await post("/pods/join", { memberId: rid() }, await sign(claims()));
assert.ok([401, 503].includes(r.status), "a token for another project (or with no project set) is refused");
r = await post("/pods/join", { memberId: rid() }, "dev:bad uid!");
assert.equal(r.status, 401);
step("member routes refuse no token, junk, foreign tokens and malformed dev tokens");

// Dev tokens: only with AUTH_MODE=dev, over http, addressed to this machine (wrangler dev ignores a Host header, so the rule is checked directly).
for (const u of ["http://127.0.0.1:8787/x", "http://localhost:8787/x", "http://10.0.2.2:8787/x", "http://[::1]:8787/x"]) assert.equal(devTokenAllowed("dev", new URL(u)), true, u);
for (const [mode, u] of [["dev", "https://upsc-pods-production.chotu-aec.workers.dev/x"], ["dev", "http://upsc-pods.example.com/x"], ["dev", "https://127.0.0.1/x"],
  ["dev", "http://192.168.1.5:8787/x"], [undefined, "http://127.0.0.1:8787/x"], ["prod", "http://localhost/x"]]) assert.equal(devTokenAllowed(mode, new URL(u)), false, `${mode} ${u}`);
step("dev tokens only with AUTH_MODE=dev, plain http and a local host; never on the deployed https address");

// Legacy install: joins a pod, gives consent and a profile field before sign-in existed (rollout flag off).
await setFlag("sign_in_required", false);
const legacy = rid();
const bucket = { stage: "auth" + rid().slice(0, 8), language: "english" };
const legacyPod = (await post("/pods/join", { memberId: legacy, ...bucket })).data.podId;
assert.ok(legacyPod);
assert.equal((await post("/consent", { memberId: legacy, purposes: ["pods"] })).status, 200);
step("with sign_in_required off (rollout), an old app without sign-in still works");
await setFlag("sign_in_required", true);
assert.equal((await post("/pods/me", { memberId: legacy })).status, 401);
step("with it on, the same old app is asked to sign in");

// First sign-in links the existing anonymous id: same pod, nothing lost.
const phone = "+91980" + String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
const alice = `dev:alice${rid().slice(0, 8)}:${phone}`;
r = await post("/auth/session", { memberId: legacy, appVersion: "0.2.0" }, alice);
assert.equal(r.status, 200);
assert.equal(r.data.status, "active");
assert.equal(r.data.memberId, legacy);
assert.equal((await post("/pods/me", {}, alice)).data.podId, legacyPod);
step("first sign-in links the install's existing member id, and the pod is still theirs");

// Signing in on a new phone (a different local id) gets the account's own id back.
r = await post("/auth/session", { memberId: rid() }, alice);
assert.equal(r.data.memberId, legacy);
step("a second device signing in to the same account gets the same member id");

// Nobody can take over someone else's member id, by linking or by sending it in a body.
const bob = `dev:bob${rid().slice(0, 8)}:bob${rid().slice(0, 6)}@example.com`;
r = await post("/auth/session", { memberId: legacy }, bob);
assert.equal(r.status, 200);
assert.notEqual(r.data.memberId, legacy);
const bobMember = r.data.memberId;
assert.equal((await post("/pods/me", { memberId: legacy }, bob)).data.podId, null, "bob's request runs as bob, not as the id in the body");
assert.equal((await call(`/plus/status?member=${legacy}`, { token: bob })).status, 200);
step("an id linked to another account is never taken over, and a body or query member id can't impersonate");

r = await call("/me/status", { token: alice });
assert.deepEqual([r.status, r.data.status], [200, "active"]);
assert.ok(r.data.checked_at);
r = await call("/me/status", { token: "dev:never-signed-in" + rid().slice(0, 6) });
assert.equal(r.data.status, "none");
step("/me/status says active, or none before the first session");

// Free Shelf and the public welcome stay open with no account.
for (const p of ["/config", "/library", "/practice/questions", "/commons", "/season", "/status.json", "/app/", "/app/welcome.js", "/models"]) {
  const s = (await call(p)).status;
  assert.ok(![401, 403].includes(s), `${p} answered ${s}`);
}
assert.ok(![401, 403].includes((await call("/brief/latest")).status));
assert.equal((await post("/languages/request", { device: rid(), lang: "te" })).status, 200);
step("Free Shelf content, the welcome, status and language requests need no account");

// Admin: find by phone, email and uid; suspend.
assert.equal((await call("/admin/api/accounts")).status, 401);
let found = (await admin("accounts?q=" + encodeURIComponent(phone))).data;
assert.equal(found.length, 1);
const aliceUid = found[0].uid;
assert.equal(found[0].member_id, legacy);
assert.equal(found[0].pod_id, legacyPod);
assert.equal(found[0].app_version, "0.2.0");
assert.ok(found[0].last_seen_at);
assert.equal((await admin("accounts?q=" + encodeURIComponent(bob.split(":")[2]))).data[0].member_id, bobMember);
assert.equal((await admin("accounts?q=" + aliceUid)).data.length, 1);
step("admin finds accounts by phone, email or uid, with member, pod, app version and last seen");

// Live sockets: a pod connection and a Commons seat, both closed by the suspension.
const ws = (path) => new Promise((res, rej) => {
  const s = new WebSocket(`${BASE.replace("http", "ws")}${path}`);
  const got = [];
  s.onmessage = (e) => got.push(JSON.parse(e.data));
  s.onopen = () => res({ s, got, closed: new Promise((c) => { s.onclose = (e) => c(e.code); }) });
  s.onerror = rej;
});
const podSock = await ws(`/pods/${legacyPod}/ws?name=Alice&auth=${encodeURIComponent(alice)}`);
const room = (await call("/commons")).data.rooms[0].id;
const commonsSock = await ws(`/commons/${room}/ws?auth=${encodeURIComponent(alice)}`);
await assert.rejects(ws(`/pods/${legacyPod}/ws?name=Bob&auth=${encodeURIComponent(bob)}`), "bob isn't in alice's pod");
step("sockets need a sign-in and run as the account's member");

assert.equal((await admin(`accounts/${aliceUid}/suspend`, { reason: "" })).status, 400);
r = await admin(`accounts/${aliceUid}/suspend`, { reason: "Test: harassment reports" });
assert.equal(r.status, 200);
assert.equal(r.data.status, "suspended");
// The server sends its close frame (4403); local workerd may leave the TCP connection half-open, so CLOSING counts.
const closedByServer = async (sock) => { for (let i = 0; i < 50 && sock.s.readyState < 2; i++) await new Promise((x) => setTimeout(x, 100)); return sock.s.readyState >= 2; };
assert.ok(await closedByServer(podSock), "pod socket closed");
assert.ok(await closedByServer(commonsSock), "commons socket closed");
assert.equal(r.data.socketsClosed, 2);
assert.ok(podSock.got.some((m) => m.code === "account_suspended"));
assert.ok(commonsSock.got.some((m) => m.code === "account_suspended"));
step("suspending needs a reason, and closes their live pod and Commons connections at once");

// Every member route now refuses with account_suspended.
const routes = [
  ["POST", "/pods/join"], ["POST", "/pods/me"], ["POST", "/pods/leave"], ["POST", "/pods/choose", { choice: "stay" }],
  ["POST", "/members/profile", { stage: "prelims" }], ["POST", "/season/add", { n: 1 }], ["POST", "/mocks/band", { mockId: "m1", pct: 50 }],
  ["GET", "/plus/status"], ["POST", "/plus/use", { kind: "mock" }], ["POST", "/plus/trial"], ["POST", "/chotu", { messages: [{ role: "user", content: "hi" }] }],
  ["POST", "/chotu/report", { messageId: "msg-12345678", reason: "x" }], ["POST", "/consent", { purposes: ["pods"] }],
  ["GET", `/pods/${legacyPod}/ws`], ["GET", `/commons/${room}/ws`],
];
for (const [method, path, body] of routes) {
  r = await call(path, { method, body, token: alice });
  assert.equal(r.status, 403, `${method} ${path} answered ${r.status}`);
  assert.equal(r.data.code, "account_suspended", path);
  assert.equal(r.data.reason, undefined, "the staff reason never goes to the member");
}
r = await call("/me/status", { token: alice });
assert.equal(r.data.status, "suspended");
assert.equal(r.data.reason, undefined);
r = await post("/auth/session", {}, alice);
assert.equal(r.data.status, "suspended");
assert.equal((await post("/privacy/export", {}, alice)).status, 200, "a suspended member can still download their data");
assert.equal((await post("/pods/me", {}, bob)).status, 200, "other members are unaffected");
step(`a suspended account is refused on all ${routes.length} member routes (403 account_suspended), status says so, export still works`);

r = await admin(`accounts/${aliceUid}/restore`, { reason: "Test: appeal accepted" });
assert.equal(r.data.status, "active");
assert.equal((await post("/pods/me", {}, alice)).data.podId, legacyPod);
const hist = (await admin(`accounts/${aliceUid}/history`)).data;
assert.deepEqual(hist.slice(0, 2).map((x) => x.action), ["restore", "suspend"]);
assert.equal(hist[1].reason, "Test: harassment reports");
assert.ok(hist[0].actor);
const general = (await admin("audit?q=accounts")).data;
assert.ok(general.some((x) => x.target.includes(aliceUid)));
step("restoring brings access back; both changes are in the account history (and the main audit log) with reason and who");

// Erasure while suspended: a fresh sign-up with the same phone stays suspended.
const carol = rid().slice(0, 8), carolPhone = "+91981" + String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
r = await post("/auth/session", {}, `dev:carol${carol}:${carolPhone}`);
const carolUid = (await admin("accounts?q=" + encodeURIComponent(carolPhone))).data[0].uid;
await admin(`accounts/${carolUid}/suspend`, { reason: "Test: spam" });
assert.equal((await post("/privacy/delete", {}, `dev:carol${carol}:${carolPhone}`)).status, 200);
assert.equal((await admin("accounts?q=" + encodeURIComponent(carolPhone))).data.length, 0, "the account and its phone number are gone");
r = await post("/auth/session", {}, `dev:carol2${carol}:${carolPhone}`);
assert.equal(r.data.status, "suspended");
step("deleting your data while suspended removes the account, and signing up again with that phone stays suspended");

// Erasure while active: the account goes; signing in again starts fresh and active.
const dave = `dev:dave${rid().slice(0, 8)}:+91982${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`;
const daveMember = (await post("/auth/session", {}, dave)).data.memberId;
assert.equal((await post("/privacy/delete", {}, dave)).status, 200);
r = await post("/auth/session", {}, dave);
assert.equal(r.data.status, "active");
assert.notEqual(r.data.memberId, daveMember);
step("deleting your data while active removes the account; signing in again starts a fresh member");

console.log("\nauth: all checks passed");
process.exit(0);
