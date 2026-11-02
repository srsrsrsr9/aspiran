// Community-first routes against a running local server: pods (states, merge, stay/move), the matching
// fields, the Commons, the season, Chotu's host schedule in pods, @Chotu name-swapping, and Plus (test mode).
//   EDITOR_TOKEN=... node test/community.mjs        (BASE defaults to http://127.0.0.1:8787)
// It runs scheduled jobs for every pod on the server and flips the "plus" flag, so use a local database.
import assert from "node:assert/strict";
import { anonymise } from "../src/anonymise.ts";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
// These suites test matched pods, so switch them on (rooms.ts): below the sign-up threshold /pods/join refuses.
await fetch(BASE + "/admin/api/growth/threshold", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: JSON.stringify({ signupThreshold: 0 }) });

const call = async (path, { method = "GET", body, auth = false } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
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

// --- @Chotu: names out before anything leaves the pod ------------------------------------------------
assert.equal(anonymise("@Chotu Ravi and ravi k asked, Priya agreed", ["Ravi", "Ravi K", "Priya"]), "@Chotu Member C and Member A asked, Member B agreed");
assert.equal(anonymise("Ravikumar is not Ravi", ["Ravi"]), "Ravikumar is not Member A", "only whole names are swapped");
assert.equal(anonymise("मीरा ने पूछा", ["मीरा"]), "Member A ने पूछा");
step("@Chotu questions have every pod name swapped for Member A, B...");

// --- Joining: honest counts, never Chotu ------------------------------------------------------------
const bucket = { stage: "cf" + rid().slice(0, 8), language: "english" };
const m1 = rid(), m2 = rid();
const j1 = (await post("/pods/join", { memberId: m1, ...bucket })).data;
assert.equal(j1.state, "forming");
assert.equal(j1.humans, 1, "Chotu is never counted");
assert.equal(j1.capacity, 8);
assert.match(j1.opensOn, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Date(j1.opensOn + "T00:00:00Z").getUTCDay(), 1, "a forming pod opens on a Monday");
const j2 = (await post("/pods/join", { memberId: m2, ...bucket })).data;
assert.equal(j2.podId, j1.podId);
assert.equal(j2.humans, 2);
assert.equal((await post("/pods/join", { memberId: m1, ...bucket })).data.humans, 2, "joining twice doesn't count twice");
const me = (await post("/pods/me", { memberId: m2 })).data;
assert.equal(me.podId, j1.podId);
step("pods show forming · n of 8 with real people only, and the Monday they open");

// --- Matching fields: only the four, nothing else ---------------------------------------------------
const prof = (await post("/members/profile", { memberId: m1, stage: "prelims", attempt_band: "first", lang: "hi", time_band: "night", nickname: "Meera", mood: 2, journal: "secret" })).data;
assert.equal(prof.ok, true);
assert.deepEqual(Object.keys(prof.stored).sort(), ["attempt_band", "lang", "stage", "time_band"].filter((k) => k in prof.stored).sort());
assert.ok(!("nickname" in prof.stored) && !("mood" in prof.stored) && !("journal" in prof.stored));
// Since sign-in (auth.ts) the server puts the account's own member id in, so a malformed one in the body is ignored, not refused.
assert.equal((await post("/members/profile", { memberId: "short" })).status, 200);
step("the server takes only stage, attempt band, language and time band");
// Deleting a field in Me → Profile clears the server's copy.
await post("/members/profile", { memberId: m1, clear: ["time_band", "nickname"] });
const exported = (await post("/privacy/export", { memberId: m1 })).data;
assert.ok(!JSON.stringify(exported).includes('"time_band":"night"'), "a cleared field is gone from the server");
step("deleting a matching field clears it on the server too");

// --- Merging: the Monday match folds a forming pod into a small pod with room ----------------------
const mb = { stage: "cfm" + rid().slice(0, 8), language: "english" };
const big = [];
for (let i = 0; i < 8; i++) big.push(rid());
for (const id of big) await post("/pods/join", { memberId: id, ...mb });
const bigPod = (await post("/pods/me", { memberId: big[0] })).data.podId;
const late = rid();
const lonely = (await post("/pods/join", { memberId: late, ...mb })).data;
assert.notEqual(lonely.podId, bigPod, "a full pod takes nobody else");
assert.equal(lonely.humans, 1);
await post("/pods/leave", { memberId: big[6] });
await post("/pods/leave", { memberId: big[7] });
const watcher = await connect(lonely.podId, late, "Late");
await watcher.next((e) => e.type === "history");
const match = (await admin("jobs/run", { job: "match" })).data;
assert.ok(match.merged >= 1);
const moved = (await post("/pods/me", { memberId: late })).data;
assert.equal(moved.podId, bigPod, "the forming pod's member now belongs to the small pod");
assert.equal(moved.humans, 7);
const notice = await watcher.next((e) => e.type === "moved" || (e.type === "history" && e.movedTo), 5000).catch(() => null);
assert.ok(notice, "people in the old pod are told where they went");
watcher.ws.close();
step("Monday match merges a forming pod into a small pod, and tells its members");

// --- Stay or move ----------------------------------------------------------------------------------
assert.equal((await post("/pods/choose", { memberId: m2, choice: "stay" })).data.stayed, true);
assert.equal((await post("/pods/choose", { memberId: m2, choice: "maybe" })).status, 400);
const mv = (await post("/pods/choose", { memberId: m2, choice: "move" })).data;
assert.ok(mv.podId && mv.podId !== j1.podId, "move puts the member in another pod");
step("a member can choose to stay or move");

// --- Day 1: the closest pod, and the Monday offer to move ------------------------------------------------
const cs = "cc" + rid().slice(0, 8);
const B = { stage: cs, language: "english", time_band: "night" }, X = { stage: cs, language: "english", time_band: "morning" };
const bm = Array.from({ length: 3 }, rid);
const bPod = (await post("/pods/join", { memberId: bm[0], ...B })).data.podId;
for (const id of bm.slice(1)) assert.equal((await post("/pods/join", { memberId: id, ...B })).data.podId, bPod);
const x = rid();
const xj = (await post("/pods/join", { memberId: x, ...X })).data;
assert.equal(xj.podId, bPod, "nobody in the exact group yet: the closest pod, same stage and language");
assert.equal(xj.closest, true);
assert.equal((await post("/pods/me", { memberId: x })).data.closest, true);
assert.notEqual((await post("/pods/join", { memberId: rid(), stage: cs, language: "hindi" })).data.podId, bPod, "never across languages");
for (let i = 0; i < 4; i++) await post("/pods/join", { memberId: rid(), ...B });
const ym = Array.from({ length: 3 }, rid);
const yPod = (await post("/pods/join", { memberId: ym[0], ...X })).data;
assert.notEqual(yPod.podId, bPod, "a full closest pod takes nobody: the exact group starts its own");
assert.equal(yPod.closest, false);
for (const id of ym.slice(1)) assert.equal((await post("/pods/join", { memberId: id, ...X })).data.podId, yPod.podId);
const offer = (await admin("jobs/run", { job: "match" })).data;
assert.ok(offer.offered >= 1, "Monday asks the member in the closest pod privately");
assert.equal((await post("/pods/me", { memberId: x })).data.closest, false, "asked once");
assert.equal((await post("/pods/me", { memberId: x })).data.podId, bPod, "nobody moves without choosing");
assert.equal((await post("/pods/choose", { memberId: x, choice: "move" })).data.podId, yPod.podId, "moving goes to the exact group's pod");
step("on day 1 a new member joins the closest active pod, and is offered their exact group's pod once it forms");

// --- Chotu's host schedule in a pod --------------------------------------------------------------------
// Times inside the current IST week, so the goal and quiz count as this week's.
const istToday = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
const monday = (() => { const d = new Date(istToday + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; })();
const ist = (days, hm) => { const d = new Date(monday); d.setUTCDate(d.getUTCDate() + days); return new Date(d.toISOString().slice(0, 10) + "T" + hm + ":00+05:30").toISOString(); };

const hb = { stage: "cfh" + rid().slice(0, 8), language: "english" };
const h1 = rid(), h2 = rid();
const hp = (await post("/pods/join", { memberId: h1, ...hb })).data.podId;
await post("/pods/join", { memberId: h2, ...hb });
const asha = await connect(hp, h1, "Asha");
assert.equal((await asha.next((e) => e.type === "history")).youAreLead, true);
const bina = await connect(hp, h2, "Bina");
await bina.next((e) => e.type === "history");

const quietRun = (await admin("jobs/run", { job: "host", at: ist(0, "23:45") })).data;
assert.equal(quietRun.posted, 0, "nothing between 23:30 and 07:00");
await assert.rejects(asha.next((e) => e.type === "msg" && e.message.memberId === "chotu", 800));

await admin("jobs/run", { job: "host", at: ist(0, "08:00") });
const goalPost = await asha.next((e) => e.type === "msg" && e.message.memberId === "chotu" && /pod goal/.test(e.message.text));
assert.equal(goalPost.message.name.includes("Chotu"), true);
const goal = await asha.next((e) => e.type === "goal");
assert.equal(goal.goal.setBy, "chotu");
await admin("jobs/run", { job: "host", at: ist(0, "08:00") });
await admin("jobs/run", { job: "host", at: ist(0, "08:00") });
await asha.next((e) => e.type === "msg" && e.message.memberId === "chotu");
await assert.rejects(asha.next((e) => e.type === "msg" && e.message.memberId === "chotu", 1000), "at most 2 Chotu posts a day");
step("host: Monday goal posts, never in quiet hours, at most twice a day");

// The lead's own goal replaces Chotu's; members add to one shared bar.
bina.send({ type: "goal_set", text: "not mine to set", target: 5 });
assert.match((await bina.next((e) => e.type === "error")).message, /lead/);
asha.send({ type: "goal_set", text: "40 questions together", target: 40, unit: "questions" });
assert.equal((await bina.next((e) => e.type === "goal" && e.goal.setBy === "lead")).goal.target, 40);
bina.send({ type: "goal_add", n: 5 });
assert.equal((await asha.next((e) => e.type === "goal" && e.goal.done === 5)).goal.done, 5);
step("the lead sets the week's goal; everyone adds to one shared bar");

// Friday quiz: a shared pod score, never per person.
await admin("jobs/run", { job: "host", at: ist(4, "20:00") });
const quiz = await asha.next((e) => e.type === "quiz");
assert.equal(quiz.quiz.questions.length, 5);
assert.ok(quiz.quiz.questions.every((q) => !("answerIndex" in q)), "answers aren't sent before you answer");
asha.send({ type: "quiz_answer", q: 0, choice: 1 });
const res = await asha.next((e) => e.type === "quiz_result");
assert.equal(typeof res.right, "boolean");
const shared = await bina.next((e) => e.type === "quiz" && e.quiz.score.answered === 1);
assert.ok(!JSON.stringify(shared).includes(h1) && !JSON.stringify(shared).includes("Asha"), "the score names nobody");
step("Pod Quiz Night: 5 questions, one shared pod score");

// Thanks.
asha.send({ type: "say", text: "Sharing my Polity notes in the drive", clientId: "t1" });
const note = await bina.next((e) => e.type === "msg" && e.message.text.startsWith("Sharing my Polity"));
bina.send({ type: "thanks", id: note.message.id });
assert.equal((await asha.next((e) => e.type === "thanked")).id, note.message.id);
step("🙏 thanks reach the pod");

// A claimed ritual is left to the person who claimed it.
bina.send({ type: "claim", ritual: "wins" });
await asha.next((e) => e.type === "msg" && e.message.kind === "system" && /running this week's wins/.test(e.message.text));
await admin("jobs/run", { job: "host", at: ist(6, "18:00") });
await assert.rejects(asha.next((e) => e.type === "msg" && e.message.memberId === "chotu" && /Wins of the week/.test(e.message.text), 1000));
step("a ritual a member claimed, Chotu stays out of");

// @Chotu with distress never reaches the model: the writer gets care instead.
bina.send({ type: "say", text: "@Chotu honestly I want to die" });
await bina.next((e) => e.type === "care");
await assert.rejects(bina.next((e) => e.type === "msg" && e.message.kind === "chotu", 1500));
step("@Chotu checks for distress first");
asha.ws.close(); bina.ws.close();

// --- Commons and season ------------------------------------------------------------------------------
const commons = (await call("/commons")).data;
assert.ok(Array.isArray(commons.rooms) && commons.rooms.length >= 3);
if (commons.total == null) assert.ok(commons.rooms.every((r) => r.count == null), "numbers under 10 are never shown");
assert.equal((await call("/commons/nope/ws")).status, 404);
const room = commons.rooms[0].id;
const cws = new WebSocket(`${BASE.replace("http", "ws")}/commons/${room}/ws`);
const presence = await new Promise((res, rej) => { cws.onmessage = (e) => res(JSON.parse(e.data)); cws.onerror = rej; setTimeout(() => rej(new Error("no presence")), 5000); });
assert.equal(presence.type, "presence");
cws.send(JSON.stringify({ type: "say", text: "hello" }));
cws.close();
step("the Commons is presence-only, and small numbers are hidden");

const s0 = (await call("/season")).data;
assert.ok(s0.title && s0.goal > 0 && typeof s0.done === "number");
assert.equal((await post("/season/add", { n: 3 })).data.added, 3);
assert.ok((await post("/season/add", { n: 999 })).data.added <= 50);
assert.ok((await call("/season")).data.done >= s0.done + 3);
step("community season counter adds up, a capped amount at a time");

// --- Mock score band: opt-in, anonymous, a band never a rank, only once 30 people have shared ---------
assert.equal((await post("/mocks/band", { mockId: "quick", pct: 50 })).status, 400, "quick mocks have no band");
assert.equal((await post("/mocks/band", { mockId: "x", pct: 140 })).status, 400);
const paper = "test-paper-" + rid().slice(0, 8);
for (let i = 0; i < 29; i++) {
  const b = (await post("/mocks/band", { mockId: paper, pct: i * 3 })).data;
  if (i === 28) { assert.equal(b.band, null); assert.equal(b.n, 29); assert.match(b.note, /30 people/); }
}
const top = (await post("/mocks/band", { mockId: paper, pct: 99 })).data;
assert.equal(top.n, 30);
assert.match(top.band, /^In the top 10% of 30 people/);
assert.ok(!/rank/i.test(JSON.stringify(top)), "never a rank");
const mid = (await post("/mocks/band", { mockId: paper, pct: 40 })).data;
assert.match(mid.band, /from the top, of 31 people/);
step("mock score band: anonymous, hidden under 30 people, a band and never a rank");

// --- Reporting a Chotu reply: id, reason and that reply only ------------------------------------------
assert.equal((await post("/chotu/report", { reason: "wrong" })).status, 400);
assert.equal((await post("/chotu/report", { messageId: rid(), reason: "Wrong facts", text: "Article 21 is about trade." })).data.ok, true);
const chotuReports = (await admin("reports?kind=chotu")).data.reports;
assert.ok(chotuReports.some((r) => r.reason === "Wrong facts" && r.author === "Chotu · AI" && !r.member_id), "in the moderation queue, with no member id");
step("Chotu replies can be reported to the safety queue");

// --- Plus: off by default, test mode only -----------------------------------------------------------
const pm = rid();
await post("/pods/join", { memberId: pm, stage: "cfp" + rid().slice(0, 8) });
const flagsNow = (await admin("flags")).data.flags;
assert.equal(flagsNow.plus, false, "Plus is off by default");
assert.equal((await post("/plus/status", { memberId: pm })).data.enabled, false);
assert.equal((await post("/plus/offer", { memberId: pm, surface: "prep", moment: "feedback_used" })).status, 404);
for (let i = 0; i < 20; i++) assert.equal((await post("/plus/use", { memberId: pm, kind: "chotu" })).status, 404);
const before = (await admin("community")).data;
await post("/plus/impression", { surface: "adda", moment: "feedback_used" });
const after = (await admin("community")).data;
const forbidden = (m) => m.forbiddenOfferImpressions.total;
assert.equal(forbidden(after), forbidden(before) + 1, "an offer seen outside Prep is counted for the admin");
assert.equal(after.forbiddenOfferImpressions.alert, true);
assert.ok(after.forbiddenOfferImpressions.bySurface.adda >= 1);
step("Plus is off by default; an offer shown on a forbidden surface is counted");

await admin("flags", { flags: { plus: true } });
try {
  const offer = (s, m, ctx = {}) => post("/plus/offer", { memberId: pm, surface: s, moment: m, context: ctx }).then((r) => r.data);
  for (const s of ["adda", "pod", "commons", "chotu_talk", "close_the_day", "calm", "me", "onboarding"]) assert.equal((await offer(s, "feedback_used", { localTime: "10:00" })).reason, "surface", s);
  assert.equal((await offer("prep", "feedback_used", { localTime: "23:00" })).reason, "late");
  assert.equal((await offer("prep", "feedback_used", { localTime: "10:00", resultWithin72h: true })).reason, "result");
  assert.equal((await offer("prep", "feedback_used", { localTime: "10:00", distress: true })).reason, "distress");
  assert.equal((await offer("prep", "nonsense", { localTime: "10:00" })).reason, "moment");
  const ok = await offer("prep", "feedback_used", { localTime: "10:00" });
  assert.ok(ok.offer && ok.offer.notNow === "Not now" && ok.offer.testMode === true);
  step("offers only in Prep, with an equal Not now; never late, near results or after distress");

  for (let i = 0; i < 15; i++) assert.equal((await post("/plus/use", { memberId: pm, kind: "chotu" })).data.ok, true);
  assert.equal((await post("/plus/use", { memberId: pm, kind: "chotu" })).data.ok, false);
  const limited = await post("/chotu", { memberId: pm, messages: [{ role: "user", content: "What is Article 21?" }] });
  assert.equal(limited.status, 429);
  assert.equal(limited.data.offline, true);
  for (let i = 0; i < 3; i++) assert.equal((await post("/plus/use", { memberId: pm, kind: "feedback" })).data.ok, true);
  assert.equal((await post("/plus/use", { memberId: pm, kind: "feedback" })).data.ok, false);
  step("free limits: 15 cloud Chotu turns a day (then offline Chotu), 3 feedbacks a week");

  assert.equal((await post("/plus/purchase", { memberId: pm, plan: "monthly" })).status, 400, "no real payments");
  assert.equal((await post("/plus/trial", { memberId: pm })).status, 403, "trial unlocks after a week");
  const bought = (await post("/plus/purchase", { memberId: pm, plan: "monthly", testMode: true })).data;
  assert.ok(bought.testMode && bought.invoice.id.startsWith("TEST-") && bought.invoice.amountInr === 299);
  const st = (await post("/plus/status", { memberId: pm })).data;
  assert.ok(st.plan && st.plan.plan === "monthly" && st.plan.endsAt);
  assert.equal((await post("/plus/offer", { memberId: pm, surface: "prep", moment: "feedback_used", context: { localTime: "10:00" } })).data.reason, "has_plus");
  assert.equal((await post("/plus/use", { memberId: pm, kind: "feedback" })).data.ok, true, "Plus has no feedback limit");
  assert.equal((await post("/plus/cancel", { memberId: pm })).data.ok, true);
  step("test-mode purchase gives Plus; cancelling is one call");

  const gift = (await post("/plus/gift", { memberId: pm, plan: "monthly", testMode: true })).data;
  assert.match(gift.code, /^[A-Z0-9]{6}$/);
  assert.equal((await call(`/plus/gift/${gift.code}`)).data.valid, true);
  const friend = rid();
  assert.equal((await post(`/plus/gift/${gift.code}/redeem`, { memberId: friend })).data.ok, true);
  assert.equal((await post(`/plus/gift/${gift.code}/redeem`, { memberId: rid() })).status, 409);
  const sch = (await call("/plus/scholarships")).data;
  assert.ok(typeof sch.seats === "number" && typeof sch.open === "number");
  step("Gift Plus links work once; the scholarship counter is public");

  // Result-day mode: 72 hours from the start of the result day, set by an admin.
  assert.equal((await admin("results", { results: [{ day: "nope" }] })).status, 400);
  await admin("results", { results: [{ day: istToday, label: "Prelims result (test)" }] });
  try {
    const cfg = (await call("/config")).data;
    assert.equal(cfg.resultNow?.label, "Prelims result (test)");
    assert.equal((await post("/plus/offer", { memberId: rid(), surface: "prep", moment: "feedback_used", context: { localTime: "10:00" } })).data.reason, "result", "no offers in the 72 hours after a result");
    assert.equal((await post("/mocks/band", { mockId: paper, pct: 50 })).data.reason, "result", "no mock bands in result week");
  } finally {
    await admin("results", { results: [] });
  }
  assert.equal((await call("/config")).data.resultNow, null);
  step("result-day mode: in /config for every app, and no offers for 72 hours");
} finally {
  await admin("flags", { flags: { plus: false } });
}

const metrics = (await admin("community")).data;
assert.ok(metrics.podStates && typeof metrics.podStates === "object" && Array.isArray(metrics.lurkerToPoster));
step("admin community metrics");

console.log("\nAll community checks passed.");
