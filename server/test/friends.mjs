// Pod friends (src/friends.ts) against a running local server started with AUTH_MODE=dev:
//   EDITOR_TOKEN=... BASE=http://127.0.0.1:8790 node --import ./test/dev-auth.mjs test/friends.mjs
// Checks the labels, quiet hours, one post per slot, the level by real-people count, cheering plain study wins only,
// never being counted or thanked, and the pod_friends flag. It runs the host job for every pod and flips the
// pod_friends flag (and puts it back), so use a local database.
import assert from "node:assert/strict";
import { friendLevel, friendPosts, isStudyWin, FRIENDS } from "../src/friends.ts";

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
function connect(podId, member, name) {
  const ws = new WebSocket(`${BASE.replace("http", "ws")}/pods/${podId}/ws?member=${member}&name=${name}`);
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
const friendMsg = (e) => e.type === "msg" && e.message.memberId.startsWith("friend:");

// --- The rules, without a server ---------------------------------------------------------------------------
for (const f of FRIENDS) { assert.ok(f.name.endsWith(" · AI"), f.name); assert.ok(f.id.startsWith("friend:")); assert.match(f.color, /^#[0-9a-f]{6}$/i); }
assert.equal(friendLevel(0), "full"); assert.equal(friendLevel(2), "full"); assert.equal(friendLevel(3), "light"); assert.equal(friendLevel(5), "light"); assert.equal(friendLevel(6), "rituals");
const q = { topic: "Polity", question: "Which article?", options: ["14", "19", "21", "32"], answerIndex: 2, explanation: "Article 21." };
const allDay = (level, weekday) => { const out = []; for (let m = 0; m < 48 * 30; m += 30) { const hm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; out.push(...friendPosts(hm, weekday, level, 20000, q).map((p) => ({ hm, ...p }))); } return out; };
for (const level of ["full", "light", "rituals"]) for (let wd = 0; wd < 7; wd++) {
  const posts = allDay(level, wd);
  assert.ok(posts.every((p) => p.hm >= "07:00" && p.hm < "23:30"), "quiet hours 23:30-07:00");
  assert.ok(posts.every((p) => !/\b(rank|AIR|cut-?off|marks|cleared (prelims|mains|the exam)|selected|result)\b/i.test(p.text)), "never ranks or results");
  assert.ok(posts.every((p) => p.friend.name.endsWith("· AI")));
}
assert.ok(allDay("full", 3).length > allDay("light", 3).length && allDay("light", 3).length > allDay("rituals", 3).length, "fewer posts as more people join");
assert.equal(allDay("rituals", 3).length, 0, "rituals only: nothing on a plain Wednesday");
assert.ok(allDay("rituals", 2).some((p) => /answer-writing hour|Answer-writing hour|Mains answer/.test(p.text)), "answer hour on Tuesday");
assert.ok(isStudyWin("Finished 30 questions on Polity today"));
for (const t of ["So tired, finished nothing today", "I feel low, wrote one answer", "Got my mock marks, 80", "finished but anxious about the result", "hello all"]) assert.ok(!isStudyWin(t), t);
step("labels, levels, quiet hours and wording (no ranks or results, no feelings)");

// --- In a pod ---------------------------------------------------------------------------------------------
const istToday = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
const monday = (() => { const d = new Date(istToday + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; })();
const ist = (days, hm) => { const d = new Date(monday); d.setUTCDate(d.getUTCDate() + days); return new Date(d.toISOString().slice(0, 10) + "T" + hm + ":00+05:30").toISOString(); };
const flagsBefore = (await admin("flags")).data.flags;
assert.equal(flagsBefore.pod_friends, true, "on by default");

const b1 = { stage: "fr" + rid().slice(0, 8), language: "english" };
const m1 = rid();
const pod1 = (await post("/pods/join", { memberId: m1, ...b1 })).data;
assert.equal(pod1.humans, 1);
const asha = await connect(pod1.podId, m1, "Asha");
await asha.next((e) => e.type === "history");

const night = (await admin("jobs/run", { job: "host", at: ist(2, "23:45") })).data;
assert.equal(night.friendPosts, 0, "nothing in quiet hours");
await admin("jobs/run", { job: "host", at: ist(2, "07:00") });
const morning = await asha.next(friendMsg);
assert.equal(morning.message.memberId, "friend:arjun"); assert.equal(morning.message.name, "Arjun · AI"); assert.equal(morning.message.kind, "friend");
await admin("jobs/run", { job: "host", at: ist(2, "07:00") });
await assert.rejects(asha.next(friendMsg, 1200), "each slot posts once");
await admin("jobs/run", { job: "host", at: ist(2, "16:30") });
const ask = await asha.next(friendMsg), answer = await asha.next(friendMsg);
assert.notEqual(ask.message.memberId, answer.message.memberId, "the friends talk to each other");
step("a 1-person pod: labelled posts, quiet hours, one post per slot, friends talking to each other");

// Not counted, not thanked, never in presence or the pod size.
const me = (await post("/pods/me", { memberId: m1 })).data;
assert.equal(me.humans, 1, "friends are never counted");
asha.send({ type: "thanks", id: morning.message.id });
await assert.rejects(asha.next((e) => e.type === "thanked", 1000), "AI posts can't be thanked");
const hist = (await connect(pod1.podId, m1, "Asha")); const h = await hist.next((e) => e.type === "history");
assert.ok(!h.online.some((n) => / · AI$/.test(n)), "never in presence");
hist.ws.close();
step("never counted, thanked or shown as online");

// Cheering a study win, never feelings; at most one every 3 hours.
asha.send({ type: "say", text: "I'm so tired today, finished nothing", clientId: "c1" });
await assert.rejects(asha.next(friendMsg, 1500), "no reaction to feelings");
asha.send({ type: "say", text: "Finished 30 Polity questions today", clientId: "c2" });
const cheer = await asha.next(friendMsg);
assert.ok(!/Asha/.test(cheer.message.text), "never names the person");
asha.send({ type: "say", text: "Also revised 2 chapters", clientId: "c3" });
await assert.rejects(asha.next(friendMsg, 1500), "not again within 3 hours");
step("a plain study win gets a general cheer; feelings never do; rate-limited");

// A bigger pod (6 people): rituals only.
const b2 = { stage: "fr" + rid().slice(0, 8), language: "english" };
const six = Array.from({ length: 6 }, () => rid());
let pod2; for (const m of six) pod2 = (await post("/pods/join", { memberId: m, ...b2 })).data;
assert.equal(pod2.humans, 6);
const ravi = await connect(pod2.podId, six[0], "Ravi");
await ravi.next((e) => e.type === "history");
await admin("jobs/run", { job: "host", at: ist(2, "10:30") });
await assert.rejects(ravi.next(friendMsg, 1200), "no everyday posts with 6 people");
await admin("jobs/run", { job: "host", at: ist(1, "19:00") });
const hour = await ravi.next(friendMsg);
assert.equal(hour.message.memberId, "friend:meera");
step("with 6 people, only rituals (Meera starts Tuesday's answer hour)");

// The flag switches them off. (The jobs above ran for every pod, so Asha's pod has posts waiting: clear them.)
for (let quiet = 0; quiet < 3;) { await new Promise((r) => setTimeout(r, 500)); if (asha.events.length) { asha.events.splice(0); quiet = 0; } else quiet++; }
await admin("flags", { flags: { pod_friends: false } });
try {
  await admin("jobs/run", { job: "host", at: ist(3, "07:00") });
  await assert.rejects(asha.next(friendMsg, 1200), "flag off: silent");
} finally { await admin("flags", { flags: { pod_friends: true } }); }
step("the pod_friends flag switches them off");

asha.ws.close(); ravi.ws.close();
console.log("\nAll pod friends checks passed.");
