// Chotu routes against a running local server: `npm run dev` (and `npm run models` for the file checks), then
// node test/chotu.mjs. Never needs a real Groq key: without one, /chotu must answer "offline" without calling out.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const step = (name) => console.log("✓", name);
const post = (body) => fetch(BASE + "/chotu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const list = await (await fetch(BASE + "/models")).json();
assert.ok(Array.isArray(list.models));
for (const m of list.models) assert.ok(m.url.startsWith("/models/files/") && m.sha256.length === 64 && m.bytes > 0);
step(`model list (${list.models.length} file(s) present)`);

assert.equal((await fetch(BASE + "/models/files/evil.bin")).status, 404);
assert.equal((await fetch(BASE + "/models/files/..%2Fpackage.json")).status, 404);
step("only listed model files are served");

for (const m of list.models) {
  const r = await fetch(BASE + m.url, { headers: { range: `bytes=${m.bytes - 10}-` } });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get("content-range"), `bytes ${m.bytes - 10}-${m.bytes - 1}/${m.bytes}`);
  assert.equal((await r.arrayBuffer()).byteLength, 10);
}
if (list.models.length) step("model downloads resume with Range");

let r = await post({ messages: [{ role: "user", content: "I want to die" }] });
assert.equal(r.status, 200);
const care = await r.json();
assert.equal(care.care, true);
assert.ok(care.helplines.some((h) => h.number === "+91 9999 666 555"));
assert.equal(care.reply, undefined);
step("distress gets helplines, never a model reply");

r = await post({ messages: [{ role: "assistant", content: "hi" }] });
assert.equal(r.status, 400);
r = await post({});
assert.equal(r.status, 400);
step("bad requests refused");

r = await post({ mode: "chat", messages: [{ role: "user", content: "What is Article 200?" }], context: { language: "English" } });
const out = await r.json();
if (r.status === 200) { assert.ok(out.reply && out.ai === true); step("cloud Chotu answered (" + out.model + ")"); }
else { assert.ok([502, 503].includes(r.status) && out.error); step("cloud Chotu without a working key says so (" + r.status + ")"); }
