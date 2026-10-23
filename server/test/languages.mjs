// "Request your language" against a running local server: validation, one count per device per language,
// withdrawing, the "I'd help translate" tick, and the admin counts.
//   EDITOR_TOKEN=... node test/languages.mjs        (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, auth = false } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const ask = (body) => call("/languages/request", { method: "POST", body });
const counts = async () => {
  const r = await call("/admin/api/language-requests", { auth: true });
  assert.equal(r.status, 200);
  return Object.fromEntries(r.data.languages.map((l) => [l.code, l]));
};
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");

// /config tells the apps which languages can be requested, Gujarati and Odia among them.
const cfg = (await call("/config")).data;
const codes = cfg.requestable.map((l) => l.code);
for (const c of ["hinglish", "te", "ta", "bn", "mr", "kn", "ml", "gu", "or"]) assert.ok(codes.includes(c), `${c} can be requested`);
assert.ok(!codes.includes("en") && !codes.includes("hi"), "English and Hindi are already in the app");
step("/config lists the 9 requestable languages, including Gujarati and Odia");

assert.equal((await ask({ device: "short", lang: "te" })).status, 400, "device id must look random");
assert.equal((await ask({ device: rid(), lang: "xx" })).status, 400, "unknown language");
assert.equal((await ask({ device: rid(), lang: "en" })).status, 400, "English is not requestable");
assert.equal((await call("/admin/api/language-requests")).status, 401, "admin counts need a key");
step("bad requests are refused; the counts need an admin key");

const before = await counts();
const d1 = rid(), d2 = rid();
assert.deepEqual((await ask({ device: d1, lang: "gu" })).data, { ok: true, lang: "gu", requested: true });
await ask({ device: d1, lang: "gu" });
await ask({ device: d1, lang: "gu", helper: true });
await ask({ device: d2, lang: "gu" });
await ask({ device: d2, lang: "or", helper: true });
let after = await counts();
assert.equal(after.gu.requests - before.gu.requests, 2, "the same device tapping again doesn't count twice");
assert.equal(after.gu.helpers - before.gu.helpers, 1, "a later tick of 'I'd help' updates that device's row");
assert.equal(after.or.requests - before.or.requests, 1);
assert.equal(after.or.helpers - before.or.helpers, 1);
assert.equal(after.gu.lastWeek - before.gu.lastWeek, 2);
assert.equal(after.gu.native, "ગુજરાતી");
step("one count per device per language; helpers counted");

assert.deepEqual((await ask({ device: d2, lang: "gu", on: false })).data, { ok: true, lang: "gu", requested: false });
after = await counts();
assert.equal(after.gu.requests - before.gu.requests, 1, "withdrawing removes that device's request");
step("a device can withdraw its request");

const r = await call("/admin/api/language-requests", { auth: true });
assert.ok(!JSON.stringify(r.data).includes(d1), "raw device ids are never stored or shown");
const sorted = r.data.languages.map((l) => l.requests);
assert.deepEqual(sorted, [...sorted].sort((a, b) => b - a), "most requested first");
step("admin view: counts only, most requested first, no device ids");

console.log("\nLanguage requests: all checks passed.");
