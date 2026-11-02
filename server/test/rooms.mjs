// Open rooms (src/rooms.ts) and Answer Studio's evaluate route (src/answers.ts) against a running local server
// started with AUTH_MODE=dev:
//   EDITOR_TOKEN=... BASE=http://127.0.0.1:8790 node --import ./test/dev-auth.mjs test/rooms.mjs
// It changes the sign-up threshold and the "evaluate" AI switch (and puts both back), so use a local database.
// No model is called: the evaluate checks run with that switch off.
import assert from "node:assert/strict";
import { readFeedback } from "../src/rubric.ts";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
const call = async (path, { method = "GET", body, auth = false } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const post = (path, body = {}) => call(path, { method: "POST", body });
const admin = (path, body) => call("/admin/api/" + path, { method: body ? "POST" : "GET", body, auth: true });
const step = (name) => console.log("✓", name);
const rid = () => crypto.randomUUID().replace(/-/g, "");
function connect(roomId, member, name) {
  const ws = new WebSocket(`${BASE.replace("http", "ws")}/rooms/${roomId}/ws?member=${member}&name=${name}`);
  const events = [], waiters = [];
  ws.onmessage = (e) => { events.push(JSON.parse(e.data)); waiters.splice(0).forEach((w) => w()); };
  const next = async (pred, ms = 5000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const hit = events.find(pred);
      if (hit) { events.splice(events.indexOf(hit), 1); return hit; }
      await new Promise((r) => { waiters.push(r); setTimeout(r, 200); });
    }
    throw new Error("timed out waiting for event");
  };
  return new Promise((res, rej) => { ws.onopen = () => res({ ws, next, events, send: (o) => ws.send(JSON.stringify(o)) }); ws.onerror = rej; });
}

// --- The rubric reader: lenient about the wrapping, strict about the fields ---------------------------------
const fb = readFeedback('Sure! ```json\n{"wordCount": 140, "areas": {"directive": {"band": "Below", "note": "Described, did not examine.", "fix": "Weigh both sides."}, "structure": {"band": "at", "note": "n", "fix": "f"}, "content": {"band": "above"}, "examples": {"band": "sideways", "note": "x", "fix": "y"}, "conclusion": {"note": "ok", "fix": "Look ahead."}}, "skeleton": {"intro": "i", "body": ["a", "b"], "conclusion": "c"}, "summary": "Good start."}\n```', null);
assert.equal(fb.areas.directive.band, "below");
assert.equal(fb.areas.examples.band, "at", "an odd band reads as at");
assert.equal(fb.wordCount, 140);
assert.deepEqual(fb.skeleton.body, ["a", "b"]);
assert.equal(readFeedback('{"wordCount": 3, "areas": {}}', null), null, "no notes or fixes at all is unusable");
assert.equal(readFeedback("not json", null), null);
assert.equal(readFeedback('{"wordCount": 999, "areas": {"structure": {"note": "n"}}}', 120).wordCount, 120, "a typed answer's count is ours");
step("rubric feedback is read leniently and every band is one of below, at, above");

const before = (await admin("growth/threshold")).data;
try {
  // --- Open mode: rooms instead of matching ---------------------------------------------------------------
  assert.equal((await admin("growth/threshold", { signupThreshold: before.signups + 1000 })).data.mode, "open");
  const cfg = (await call("/config")).data;
  assert.equal(cfg.pods.mode, "open", "/config tells the apps which mode pods are in");
  const m1 = rid(), m2 = rid();
  const refused = await post("/pods/join", { memberId: m1, stage: "rooms" });
  assert.equal(refused.status, 409);
  assert.equal(refused.data.podId, null);
  assert.equal(refused.data.mode, "open");
  step("below the sign-up threshold /pods/join points new members to the rooms");

  let list = (await post("/rooms/list", { memberId: m1, start: false })).data;
  assert.ok(list.rooms.length >= 17);
  for (const id of ["room-hindi-medium", "room-telugu", "room-repeaters", "room-working", "room-prelims-2027", "room-mains-writing", "room-opt-psir", "room-opt-anthropology", "room-east-ne", "room-west-central"]) {
    assert.ok(list.rooms.some((r) => r.id === id), id);
  }
  assert.ok(list.rooms.every((r) => !r.joined && r.unread === 0));
  step("the room list has language, attempt, goal, optional and region rooms");

  // --- Day 1: starter rooms, once -------------------------------------------------------------------------
  const n1 = rid();
  const st = (await post("/rooms/list", { memberId: n1, stage: "mains", attempt_band: "2-3", lang: "hi", nickname: "never stored" })).data;
  assert.deepEqual([...st.started].sort(), ["room-hindi-medium", "room-mains-writing", "room-repeaters"]);
  assert.deepEqual(st.rooms.filter((r) => r.joined).map((r) => r.id).sort(), [...st.started].sort());
  for (const id of st.started) await post("/rooms/leave", { memberId: n1, roomId: id });
  const again = (await post("/rooms/list", { memberId: n1, stage: "mains", lang: "hi" })).data;
  assert.deepEqual(again.started, [], "starter rooms happen once; leaving them all is respected");
  assert.ok(again.rooms.every((r) => !r.joined));
  const plain = (await post("/rooms/list", { memberId: rid() })).data;
  assert.deepEqual([...plain.started].sort(), ["room-english-medium", "room-first-attempt", "room-prelims-2027"], "no fields: English, first attempt, Prelims");
  step("on day 1 a new member is put in their language, attempt and goal rooms, once");

  assert.equal((await post("/rooms/join", { memberId: m1, roomId: "room-nope" })).status, 400, "only listed rooms");
  const before1 = list.rooms.find((r) => r.id === "room-mains-writing").members;
  await post("/rooms/join", { memberId: m1, roomId: "room-mains-writing" });
  await post("/rooms/join", { memberId: m1, roomId: "room-mains-writing" });
  await post("/rooms/join", { memberId: m1, roomId: "room-telugu" });
  await post("/rooms/join", { memberId: m2, roomId: "room-mains-writing" });
  list = (await post("/rooms/list", { memberId: m1 })).data;
  const mains = list.rooms.find((r) => r.id === "room-mains-writing");
  assert.equal(mains.members, before1 + 2, "joining twice counts once");
  assert.ok(mains.joined && list.rooms.find((r) => r.id === "room-telugu").joined, "a member can be in several rooms");
  step("joining is one tap, several rooms at once, counted once");

  // --- Chat, unread and activity --------------------------------------------------------------------------
  const outsider = rid();
  assert.equal((await call(`/rooms/room-mains-writing/ws?member=${outsider}&name=X`)).status, 403, "join before opening a room");
  const a = await connect("room-mains-writing", m1, "Asha");
  await a.next((e) => e.type === "history");
  const seen = Date.now();
  const b = await connect("room-mains-writing", m2, "Bilal");
  await b.next((e) => e.type === "history");
  b.send({ type: "say", text: "Posted my GS2 answer, two reviews please" });
  await a.next((e) => e.type === "msg" && e.message.memberId === m2);
  list = (await post("/rooms/list", { memberId: m1, seen: { "room-mains-writing": seen } })).data;
  const act = list.rooms.find((r) => r.id === "room-mains-writing");
  assert.equal(act.unread, 1, "one new message from someone else");
  assert.equal(act.lastName, "Bilal");
  assert.match(act.lastText, /GS2 answer/);
  assert.ok(act.online >= 1);
  assert.equal((await post("/rooms/list", { memberId: m2, seen: { "room-mains-writing": seen } })).data.rooms.find((r) => r.id === "room-mains-writing").unread, 0, "your own posts aren't unread");
  assert.equal((await post("/rooms/list", { memberId: rid() })).data.rooms.find((r) => r.id === "room-mains-writing").unread, 0, "no unread in a room you're not in");
  a.ws.close(); b.ws.close();
  step("room chat works, with unread counts and the latest line on the list");

  await post("/rooms/leave", { memberId: m1, roomId: "room-telugu" });
  assert.ok(!(await post("/rooms/list", { memberId: m1 })).data.rooms.find((r) => r.id === "room-telugu").joined);
  step("leaving a room");

  // --- Host and AI friends run in rooms too ----------------------------------------------------------------
  const host = await admin("jobs/run", { job: "host" });
  assert.ok(host.data.rooms >= 17, "the host tick covers the rooms");
  step("the host schedule and AI friends cover the rooms");

  // --- Room Quiz Night: every room plays the same questions, and the board ranks rooms, never people --------
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const friday = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - ((ist.getUTCDay() + 6) % 7) + 4, 14, 30));
  await admin("jobs/run", { job: "host", at: friday.toISOString() });
  await post("/rooms/join", { memberId: m1, roomId: "room-repeaters" });
  await post("/rooms/join", { memberId: m2, roomId: "room-repeaters" });
  const q1 = await connect("room-repeaters", m1, "Asha");
  const h1 = await q1.next((e) => e.type === "history");
  assert.ok(h1.quiz?.questions.length === 5, "the room has this week's quiz");
  assert.ok(h1.quiz.questions.every((q) => q.answerIndex === undefined), "answers aren't sent before you answer");
  const q2 = await connect("room-repeaters", m2, "Bilal");
  await q2.next((e) => e.type === "history");
  for (const [c, choice] of [[q1, 0], [q2, 1]]) for (let q = 0; q < 5; q++) { c.send({ type: "quiz_answer", q, choice }); await c.next((e) => e.type === "quiz_result" && e.q === q); }
  const board = await call("/rooms/leaderboard");
  assert.equal(board.status, 200);
  const mine = board.data.rooms.find((r) => r.id === "room-repeaters");
  assert.ok(mine, "a room with 10 answers this week is on the board");
  assert.ok(mine.answered >= 10 && mine.players >= 2 && mine.pct >= 0 && mine.pct <= 100);
  assert.deepEqual(board.data.rooms.map((r) => r.rank), board.data.rooms.map((_, i) => i + 1));
  assert.ok(board.data.rooms.every((r, i, a) => i === 0 || a[i - 1].pct >= r.pct), "ranked by the room's shared score");
  assert.ok(!JSON.stringify(board.data).includes(m1) && !/memberId|"name":"Asha"/.test(JSON.stringify(board.data)), "no person on the board");
  assert.ok(board.data.waiting.every((r) => r.answered < board.data.minAnswers), "rooms under the minimum wait");
  step("Room Quiz Night: one shared score per room, ranked on the room board, people never");

  // --- The pinned question of the day ------------------------------------------------------------------------
  const pins = await admin("jobs/run", { job: "pins" });
  assert.equal(pins.data.rooms, 17);
  q1.ws.close(); q2.ws.close();
  const p1 = await connect("room-repeaters", m1, "Asha");
  const ph = (await p1.next((e) => e.type === "history")).pinned;
  assert.ok(ph && ph.question && ph.kind === "mcq" && ph.options.length >= 2, "the room has a pinned MCQ today");
  if (ph.mine === null) assert.equal(ph.answerIndex, undefined, "no answer before you answer");
  p1.send({ type: "pinned_answer", choice: 0 });
  const pr = await p1.next((e) => e.type === "pinned_result");
  assert.ok(Number.isInteger(pr.answerIndex) && typeof pr.right === "boolean");
  const first = pr.choice;
  p1.send({ type: "pinned_answer", choice: 1 });
  assert.equal((await p1.next((e) => e.type === "pinned_result")).choice, first, "one answer each");
  const tally = await p1.next((e) => e.type === "pinned" && e.pinned);
  assert.ok(tally.pinned.tally.answered >= 1 && tally.pinned.mine === null && tally.pinned.answerIndex === undefined, "the room sees a tally, not who answered");
  assert.equal((await admin("jobs/run", { job: "pins" })).data.pinned, 0, "one pin a day");
  p1.ws.close();
  step("each room pins a question a day, one answer each, a shared tally");

  // --- Photos in "Send to pod": members of that room only, gone after 7 days ---------------------------------
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(64).fill(7), 0xff, 0xd9]).toString("base64");
  assert.equal((await post("/rooms/photo", { memberId: outsider, roomId: "room-repeaters", image: { mime: "image/jpeg", data: jpeg } })).status, 403, "join first");
  assert.equal((await post("/rooms/photo", { memberId: m1, roomId: "room-repeaters", image: { mime: "image/png", data: jpeg } })).status, 400, "JPEG only");
  assert.equal((await post("/rooms/photo", { memberId: m1, roomId: "room-repeaters", image: { mime: "image/jpeg", data: Buffer.from("GIF89a").toString("base64") } })).status, 400, "really a JPEG");
  const up = await post("/rooms/photo", { memberId: m1, roomId: "room-repeaters", image: { mime: "image/jpeg", data: jpeg } });
  assert.equal(up.status, 200, JSON.stringify(up.data));
  assert.match(up.data.ref, /^photo:[0-9a-f]{32}$/);
  assert.ok(Math.abs(new Date(up.data.expiresAt) - Date.now() - 7 * 86400_000) < 60_000, "kept 7 days");
  const got = await fetch(`${BASE}/rooms/photo/${up.data.id}?member=${m2}`);
  assert.equal(got.status, 200);
  assert.equal(got.headers.get("content-type"), "image/jpeg");
  assert.equal((await got.arrayBuffer()).byteLength, Buffer.from(jpeg, "base64").length);
  assert.equal((await fetch(`${BASE}/rooms/photo/${up.data.id}?member=${outsider}`)).status, 403, "only that room's members");
  const swept = await admin("jobs/run", { job: "photos", at: new Date(Date.now() + 8 * 86400_000).toISOString() });
  assert.ok(swept.data.deleted >= 1);
  assert.equal((await fetch(`${BASE}/rooms/photo/${up.data.id}?member=${m2}`)).status, 404, "swept after 7 days");
  step("a photo sent to a room: JPEG only, members only, swept after 7 days");

  // --- At the threshold matched pods switch on, rooms stay ---------------------------------------------------
  assert.equal((await admin("growth/threshold", { signupThreshold: 0 })).data.mode, "matched");
  const joined = await post("/pods/join", { memberId: m1, stage: "rooms" + rid().slice(0, 6) });
  assert.ok(joined.data.podId, "matched pods are on");
  assert.ok((await post("/rooms/list", { memberId: m1 })).data.rooms.find((r) => r.id === "room-mains-writing").joined, "rooms stay as the public layer");
  step("at the threshold matched pods switch on and the rooms stay");

  // --- Answer Studio: checks before any model call -----------------------------------------------------------
  const ev = (body) => post("/answers/evaluate", { memberId: m1, question: "Critically examine the role of SHGs in rural livelihoods.", words: 150, ...body });
  assert.equal((await ev({})).status, 400, "text or a photo is required");
  assert.equal((await ev({ image: { mime: "image/gif", data: "R0lG" } })).status, 400, "photo types are checked");
  assert.equal((await ev({ image: { mime: "image/jpeg", data: "x".repeat(5_700_000) } })).status, 400, "photo size is checked");
  const care = await ev({ text: "I want to die, I can't do this anymore" });
  assert.equal(care.data.care, true, "distress gets helplines, not a grade");
  await admin("llm/controls", { purposes: { evaluate: false } });
  const off = await ev({ text: "SHGs give women credit and voice. ".repeat(10) });
  assert.equal(off.status, 503, "with the evaluate switch off no model is called");
  assert.equal(off.data.offline, true);
  step("the evaluate route checks the answer, distress and the AI switch before any model call");
} finally {
  await admin("llm/controls", { purposes: { evaluate: true } });
  await admin("growth/threshold", { signupThreshold: before.threshold });
}
console.log("\nRooms and Answer Studio checks passed.");
