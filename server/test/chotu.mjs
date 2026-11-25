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
assert.ok(care.helplines.some((h) => h.number === "112"));
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

// --- Chotu chats: kept for every member once they've been shown the notice (owner, 24 Nov 2026; profile.ts) -------
const ME = "chat-notice-" + Math.random().toString(36).slice(2, 10) + "-x";
const chats = (turns) => fetch(BASE + "/chotu/chats", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: ME, turns, lang: "en" }) });
const notice = (extra = {}) => fetch(BASE + "/consent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: ME, version: "chats-notice-2026-11", ...extra }) });
const exported = async () => (await (await fetch(BASE + "/privacy/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ memberId: ME }) })).json());
const TURNS = [{ role: "user", content: "What is Article 200?" }, { role: "assistant", content: "Assent to state bills." }];

r = await chats(TURNS);
assert.equal(r.status, 403, "nothing is kept before the member has seen the notice");
r = await notice();
assert.equal(r.status, 200);
r = await chats([...TURNS, { role: "user", content: "I want to die" }]);
assert.equal(r.status, 200);
assert.equal((await r.json()).kept, 2, "distress is never kept as a chat");
const ex = await exported();
assert.equal(ex.chotuChats.length, 2);
assert.ok(ex.consents.some((c) => c.version === "chats-notice-2026-11" && JSON.parse(c.purposes).includes("chotu_chats_notice")));
step("chats are kept once the notice was shown, never the distress lines, and show in the member's export");

r = await notice({ withdraw: true });
assert.equal(r.status, 400, "the notice is a record of being told, not a switch");
assert.equal((await chats(TURNS)).status, 200);
step("there is no opt-out switch for the chat notice");

r = await fetch(BASE + "/chotu/profile?member=" + ME);
assert.equal(r.status, 200);
assert.deepEqual(await r.json(), { profile: "", plus: false });
step("the study profile is for Plus members only");
