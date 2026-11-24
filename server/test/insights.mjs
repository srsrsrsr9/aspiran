// Admin → Insights (src/insights.ts) and coaching-centre reports (src/inst-reports.ts), against a running local server
// with AUTH_MODE=dev and no PostHog key: `npm run test:all -- insights`, or `npm run dev` then `node test/insights.mjs`.
// Signs in by itself (dev tokens). Switches the institutes flag on locally for the run and puts it back after.
// Checks: Insights needs a staff key and says "not connected" for every PostHog part without the key, while our own
// numbers still show; studying events are kept as codes; a centre's report is its own students only, from when they
// joined; batch figures hide under 5 students; a student's own practice never reaches the centre; leaving takes you out;
// students can't open reports; the CSV defuses formulas and has no emails.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN ?? "dev-editor-token";
const editor = { authorization: "Bearer " + TOKEN, "content-type": "application/json" };
const step = (name) => console.log("✓", name);
const rid = () => Math.random().toString(36).slice(2, 10);

async function person(label) {
  const tok = `dev:${label}${rid()}:${label}-${rid()}@example.com`;
  const call = async (path, body) => {
    const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: { authorization: "Bearer " + tok, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, data, text, headers: r.headers };
  };
  const s = await call("/auth/session", {});
  assert.equal(s.status, 200, "signs in");
  return { tok, call, memberId: s.data.memberId, label };
}
const staff = async (path, body) => {
  const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: editor, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
};

// --- Insights without a PostHog key ------------------------------------------------------------------------------------
assert.equal((await fetch(BASE + "/admin/api/insights")).status, 401, "a staff key is needed");
const install = rid() + rid();
let r = await fetch(BASE + "/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ installId: install, platform: "web", events: [
  { name: "practice_answer", props: { where: "chai", node: "gs2-1", right: 1, sure: 1 } },
  { name: "practice_answer", props: { where: "chai", node: "Free text, with spaces!", right: 0 } },
  { name: "practice_answer", props: { where: "chai", node: "gs2-1" } },
  { name: "note_open", props: { node: "polity-governor", lang: "en" } },
  { name: "mock_done", props: { paper: "gs1-2025", attempted: 80, of: 100, minutes: 110, score: 92 } },
] }) }).then((x) => x.json());
assert.equal(r.kept, 4, "a practice answer without right/wrong is dropped");
let ins = await staff("/admin/api/insights?fresh=1");
assert.equal(ins.status, 200, JSON.stringify(ins.data));
const I = ins.data;
assert.equal(I.posthogConnected, false);
for (const c of ["today", "funnel", "sources", "return", "used", "health", "breaks", "organisations"]) {
  assert.ok(I.cards[c]?.title && I.cards[c].says, `card ${c} has a title and a sentence`);
}
assert.equal(I.cards.today.rows.find((x) => x.what === "Website visitors").today, null, "website visitors: not connected");
assert.equal(I.cards.today.posthog.connected, false);
assert.equal(I.cards.funnel.steps[0].n, null, "the funnel's website step is empty without PostHog");
assert.equal(I.cards.funnel.posthog.connected, false);
assert.equal(I.cards.sources.campaigns, null);
assert.equal(I.cards.breaks.errors, null);
assert.equal(I.cards.breaks.posthog.connected, false);
assert.equal(I.cards.today.trend.values.length, 30, "our own trend still shows");
const used = I.cards.used.features.find((f) => f.name === "practice_answer");
assert.ok(used && used.n >= 2, "the studying events count");
assert.ok(I.cards.health.answers >= 2);
assert.ok(!JSON.stringify(I).includes("Free text, with spaces!"), "free text is turned into a code");
assert.ok(!JSON.stringify(I).includes("score"), "a mock's score is never kept");
step("Insights: staff key only; every PostHog part says not connected without the key; our numbers and codes still show");

// Home → "How it's going" (src/glance.ts, src/stat.ts): read from the roll-up, staff only, kept for an hour unless asked fresh.
assert.equal((await fetch(BASE + "/admin/api/glance")).status, 401, "glance needs a staff key");
assert.equal((await fetch(BASE + "/admin/api/stats/roll", { method: "POST", body: "{}" })).status, 401, "rolling needs a staff key");
const rolled = await staff("/admin/api/stats/roll", {});
assert.equal(rolled.status, 200, JSON.stringify(rolled.data));
assert.ok(rolled.data.events >= 4, "today's events were counted");
let gl = await staff("/admin/api/glance?fresh=1");
assert.equal(gl.status, 200, JSON.stringify(gl.data));
assert.equal(gl.data.cached, false);
assert.ok(gl.data.marketing.funnel30 && Array.isArray(gl.data.marketing.sources), "marketing: funnel and sources");
assert.ok(gl.data.product.activation && Array.isArray(gl.data.product.features), "product: activation and features");
assert.ok(gl.data.product.features.some((f) => f.name === "practice_answer"), "practice shows in what gets used");
assert.ok(gl.data.content.notes.most.some((p) => p.piece === "polity-governor"), "content: the note opened above");
assert.equal(gl.data.daysCounted, 1, "only today has been counted");
assert.ok(gl.data.content.practice.answers >= 2, "practice answers counted");
assert.ok(!JSON.stringify(gl.data).includes(install), "no install id in the summary");
assert.ok(!JSON.stringify(gl.data).includes("@example.com"), "no emails in the summary");
gl = await staff("/admin/api/glance");
assert.equal(gl.data.cached, true, "the second look comes from the hour's copy");
step("Home summary: from the roll-up; staff only; marketing, product and content; kept for an hour; no emails or ids");

const ins2 = await staff("/admin/api/insights");
assert.equal(ins2.data.cached, true, "Insights is kept for an hour too");

// --- Coaching-centre reports -------------------------------------------------------------------------------------------
const flagsBefore = (await staff("/admin/api/flags")).data.flags;
await staff("/admin/api/flags", { flags: { institutes: true } });
try {
  const A = (await staff("/admin/api/institutes", { name: "Report Academy", city: "Pune" })).data;
  const B = (await staff("/admin/api/institutes", { name: "Elsewhere Classes", city: "Delhi" })).data;
  const join = (p, code, name) => p.call("/inst/join", { code, displayName: name, consent: true, adult: true });
  const owner = await person("rowner"), ownerB = await person("rownerb"), teacher = await person("rteacher");
  assert.equal((await join(owner, A.ownerCode, "Owner A")).status, 200);
  assert.equal((await join(ownerB, B.ownerCode, "Owner B")).status, 200);
  const big = (await owner.call("/inst/admin/batches", { name: "Big batch" })).data.id;
  const small = (await owner.call("/inst/admin/batches", { name: "Small batch" })).data.id;
  const batchB = (await ownerB.call("/inst/admin/batches", { name: "B batch" })).data.id;
  assert.equal((await join(teacher, (await owner.call("/inst/admin/codes", { role: "teacher" })).data.code, "Teacher T")).status, 200);
  const bigCode = (await owner.call("/inst/admin/codes", { role: "student", batchId: big, maxUses: 10 })).data.code;
  const smallCode = (await owner.call("/inst/admin/codes", { role: "student", batchId: small, maxUses: 10 })).data.code;
  const bCode = (await ownerB.call("/inst/admin/codes", { role: "student", batchId: batchB })).data.code;
  const bigs = [];
  for (const n of ["=HYPERLINK(1)", "Asha", "Bala", "Chitra", "Dev"]) { const p = await person("rs"); assert.equal((await join(p, bigCode, n)).status, 200); bigs.push(p); }
  const smalls = [];
  for (const n of ["Esha", "Farid"]) { const p = await person("rs"); assert.equal((await join(p, smallCode, n)).status, 200); smalls.push(p); }
  const outsider = await person("rsb");
  assert.equal((await join(outsider, bCode, "Outsider")).status, 200);

  // A practice set on one topic; everyone in the big batch gets both wrong (answers 0 and 1 are right).
  const quiz = { questions: [
    { en: { question: "Article 163 is about?", options: ["Council of Ministers aids the Governor", "Money bills", "Ordinances", "Finance Commission"], answerIndex: 0, explanation: "Art 163." } },
    { en: { question: "Nabam Rebia was decided in?", options: ["2010", "2016", "2019", "2023"], answerIndex: 1, explanation: "2016." } },
  ] };
  const set = (await teacher.call("/inst/admin/content", { kind: "practice", title: "Governor drill", nodeId: "gs2-1", status: "published", data: quiz })).data.id;
  for (const p of bigs) assert.equal((await p.call("/inst/attempts", { contentId: set, answers: [1, 0] })).status, 200);
  const outSet = (await ownerB.call("/inst/admin/content", { kind: "practice", title: "B set", nodeId: "gs2-1", status: "published", data: quiz })).data.id;
  await outsider.call("/inst/attempts", { contentId: outSet, answers: [0, 1] });
  // A doubt, answered by the teacher.
  const doubt = (await bigs[1].call("/inst/doubts", { text: "Why is the Governor's discretion narrower now?", nodeId: "gs2-1" })).data.id;
  assert.ok(doubt);
  assert.equal((await teacher.call(`/inst/doubts/${doubt}/reply`, { text: "Because of Nabam Rebia (2016)." })).status, 200);
  // A student's own practice in Aspiran: never part of the centre's report.
  const own = await bigs[2].call("/events", { memberId: bigs[2].memberId, platform: "web", events: Array.from({ length: 5 }, () => ({ name: "practice_answer", props: { where: "chai", node: "gs1-1", right: 1 } })) });
  assert.equal(own.status, 200, JSON.stringify(own.data));

  // Students can't open reports; the teacher can.
  assert.equal((await bigs[0].call("/inst/admin/reports")).status, 403, "a student can't open reports");
  assert.equal((await bigs[0].call("/inst/admin/reports.csv")).status, 403);
  r = await teacher.call("/inst/admin/reports");
  assert.equal(r.status, 200, JSON.stringify(r.data));
  let rep = r.data;
  const bigRow = rep.batches.find((b) => b.batchId === big), smallRow = rep.batches.find((b) => b.batchId === small);
  assert.equal(bigRow.students, 5);
  assert.equal(bigRow.hidden, false, "5 students: figures show");
  assert.equal(bigRow.week.activeStudents, 5);
  assert.equal(bigRow.week.questionsAnswered, 10);
  assert.equal(bigRow.week.doubtsAsked, 1);
  assert.equal(bigRow.week.doubtsAnswered, 1);
  assert.equal(bigRow.doubts.answered, 1);
  assert.ok(bigRow.doubts.avgHoursToAnswer != null);
  assert.deepEqual(bigRow.weakTopics.map((t) => [t.nodeId, t.answered, t.rightPct]), [["gs2-1", 10, 0]], "a weak topic: 5+ answers, under 60%");
  assert.equal(smallRow.students, 2);
  assert.equal(smallRow.hidden, true, "under 5 students: hidden");
  assert.ok(!("week" in smallRow) && !("weakTopics" in smallRow) && !("doubts" in smallRow), "a hidden batch carries no figures");
  assert.equal(rep.minBatch, 5);
  assert.equal(rep.checking.available, false);
  assert.equal(rep.students.length, 7, "only this centre's active students");
  assert.ok(!rep.students.some((s) => s.memberId === outsider.memberId || s.name === "Teacher T" || s.name === "Owner A"), "no other centre's students and no staff");
  assert.deepEqual(rep.students.map((s) => s.name), [...rep.students.map((s) => s.name)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })), "listed by name, never ranked");
  const s2 = rep.students.find((s) => s.memberId === bigs[2].memberId);
  assert.equal(s2.answered, 2, "own practice in Aspiran isn't counted for the centre");
  assert.equal(s2.topicsCovered, 1);
  assert.equal(s2.accuracy, 0);
  assert.equal(rep.students.find((s) => s.memberId === bigs[1].memberId).doubtsAsked, 1);
  assert.ok(rep.students.every((s) => !("email" in s) && !("rank" in s)));
  assert.ok(!JSON.stringify(rep).includes("gs1-1"), "nothing from their own practice");
  assert.equal(rep.quiet.length, 0, "everyone did something this week");
  step("reports: own students only; 5+ students show batch figures, fewer are hidden; weak topics; doubts; own practice never shared");

  // Scoping: another centre sees only its own, and can't name our batch.
  const repB = (await ownerB.call("/inst/admin/reports")).data;
  assert.deepEqual(repB.students.map((s) => s.memberId), [outsider.memberId]);
  assert.equal(repB.batches[0].hidden, true);
  assert.equal((await ownerB.call(`/inst/admin/reports?batch=${big}`)).status, 404, "another centre's batch is refused");
  const onlySmall = (await teacher.call(`/inst/admin/reports?batch=${small}`)).data;
  assert.deepEqual(onlySmall.batches.map((b) => b.batchId), [small]);
  assert.equal(onlySmall.students.length, 2);
  step("one centre never sees another's; the batch filter narrows to that batch");

  // CSV: formulas defused, no emails, hidden batches say so.
  const csv = await fetch(`${BASE}/inst/admin/reports.csv`, { headers: { authorization: "Bearer " + teacher.tok } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  const text = await csv.text();
  assert.ok(text.includes(`"'=HYPERLINK(1)"`), "a name that looks like a formula is defused");
  assert.ok(text.includes("Hidden: under 5 students"));
  assert.ok(text.includes('"Weak topic"'));
  assert.ok(!text.includes("@example.com"), "no emails");
  assert.ok(!/rank/i.test(text), "no rankings");
  step("CSV: formulas defused, no emails, no rankings, hidden batches marked");

  // Leaving: out of the report, and the batch drops under 5 and hides.
  assert.equal((await bigs[4].call("/inst/leave", {})).status, 200);
  rep = (await teacher.call("/inst/admin/reports")).data;
  assert.ok(!rep.students.some((s) => s.memberId === bigs[4].memberId), "gone from the report");
  assert.equal(rep.batches.find((b) => b.batchId === big).hidden, true, "4 left: the batch hides");
  step("leaving takes you out; a batch that drops under 5 hides");

  // Insights' organisations card: the centre's students and answers, D1 only.
  ins = (await staff("/admin/api/insights?fresh=1")).data;
  const orgA = ins.cards.organisations.centres.find((c) => c.id === A.id);
  assert.equal(orgA.students, 6);
  assert.equal(orgA.setAnswers30, 8, "the student who left took their answers with them");
  assert.equal(orgA.doubtsAnswered30, 1);
  assert.equal(orgA.activeByWeek.length, 4);
  assert.equal(orgA.plus, 0);
  step("Insights → Organisations: students, answers, doubts answered and Plus share per centre");

  console.log("\ninsights: all checks passed");
} finally {
  await staff("/admin/api/flags", { flags: { institutes: flagsBefore.institutes ?? false } });
}
process.exit(0);
