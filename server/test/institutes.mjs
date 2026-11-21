// Aspiran for coaching centres (src/institutes.ts) against a running local server with AUTH_MODE=dev:
// `npm run test:all -- institutes`, or `npm run dev` then `node test/institutes.mjs`. Signs in by itself (dev tokens).
//
// The flag is switched on locally for the run and put back after. Checks: the flag; staff setting up an institute; the
// owner, admins, teachers and students joining by code (single use, expiry, cancel); every role limit (no escalation);
// that one institute can never read or change another's anything; chat and the distress guard; doubts with a photo;
// plans and ticks; notes, practice and tests (answers never sent to students before they answer); analytics and the
// CSV; leaving; and erasure.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN ?? "dev-editor-token";
const editor = { authorization: "Bearer " + TOKEN, "content-type": "application/json" };
const step = (name) => console.log("✓", name);
const rid = () => Math.random().toString(36).slice(2, 10);

/** A signed-in person: a dev token of their own, and helpers that call with it. */
async function person(label) {
  const tok = `dev:${label}${rid()}:${label}-${rid()}@example.com`;
  const call = async (path, body) => {
    const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: { authorization: "Bearer " + tok, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, data, headers: r.headers };
  };
  const s = await call("/auth/session", {});
  assert.equal(s.status, 200, "signs in");
  return { tok, call, memberId: s.data.memberId, label };
}
const staff = async (path, body) => {
  const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: editor, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => null) };
};

// --- The flag --------------------------------------------------------------------------------------------------------
const flagsBefore = (await staff("/admin/api/flags")).data.flags;
assert.equal(flagsBefore.institutes, false, "off by default");
const owner = await person("owner");
assert.equal((await owner.call("/inst/me")).status, 404, "flag off: the routes don't exist");
assert.equal((await fetch(BASE + "/config").then((r) => r.json())).flags.institutes, false);
step("off by default: /inst answers 404 and /config says off");

await staff("/admin/api/flags", { flags: { institutes: true } });
try {
  assert.equal((await fetch(BASE + "/config").then((r) => r.json())).flags.institutes, true);

  // --- Aspiran staff set up two institutes ---------------------------------------------------------------------------
  assert.equal((await fetch(BASE + "/admin/api/institutes", { method: "POST", body: "{}" })).status, 401, "staff key needed");
  assert.equal((await owner.call("/admin/api/institutes", { name: "Sneaky" })).status, 401, "a member's token is not a staff key");
  let r = await staff("/admin/api/institutes", { name: "Vidya IAS Academy", city: "Hyderabad" });
  assert.equal(r.status, 200);
  const A = { id: r.data.id, ownerCode: r.data.ownerCode };
  assert.match(A.ownerCode, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  r = await staff("/admin/api/institutes", { name: "Other Coaching", city: "Delhi" });
  const B = { id: r.data.id, ownerCode: r.data.ownerCode };
  const list = (await staff("/admin/api/institutes")).data;
  assert.ok(list.flagOn && list.institutes.some((i) => i.id === A.id));
  step("Aspiran staff make institutes (staff key only) and get a one-time owner code");

  // --- Joining ---------------------------------------------------------------------------------------------------------
  assert.equal((await owner.call("/inst/me")).data.institute, null);
  r = await owner.call("/inst/join", { code: A.ownerCode, displayName: "Ravi Sir" });
  assert.equal(r.status, 400, "consent needed");
  r = await owner.call("/inst/join", { code: A.ownerCode, displayName: "Ravi Sir", consent: true });
  assert.equal(r.status, 400, "18+ needed");
  r = await owner.call("/inst/join", { code: A.ownerCode.toLowerCase().replace("-", " "), displayName: "Ravi Sir", consent: true, adult: true });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.role, "owner");
  const owner2 = await person("owner2");
  r = await owner2.call("/inst/join", { code: A.ownerCode, displayName: "Not Ravi", consent: true, adult: true });
  assert.equal(r.status, 404, "the owner code works once");
  const ownerB = await person("ownerb");
  assert.equal((await ownerB.call("/inst/join", { code: B.ownerCode, displayName: "Owner B", consent: true, adult: true })).status, 200);
  step("joining needs consent and 18+, codes are case- and dash-blind, and an owner code works once");

  // Owner makes a batch and codes.
  r = await owner.call("/inst/admin/batches", { name: "Prelims 2027 Morning", examYear: 2027 });
  assert.equal(r.status, 200);
  const batch1 = r.data.id;
  const batch2 = (await owner.call("/inst/admin/batches", { name: "Mains 2026" })).data.id;
  const batchB = (await ownerB.call("/inst/admin/batches", { name: "B batch" })).data.id;
  const adminCode = (await owner.call("/inst/admin/codes", { role: "admin" })).data.code;
  const teacherCode = (await owner.call("/inst/admin/codes", { role: "teacher" })).data.code;
  const studentCode = (await owner.call("/inst/admin/codes", { role: "student", batchId: batch1, maxUses: 3 })).data.code;
  assert.ok(adminCode && teacherCode && studentCode);
  assert.equal((await owner.call("/inst/admin/codes", { role: "student", batchId: batchB })).status, 400, "another institute's batch can't take a code");
  assert.equal((await owner.call("/inst/admin/codes", { role: "owner" })).status, 400, "no owner codes from inside");

  const admin = await person("admin"), teacher = await person("teacher");
  const s1 = await person("stuone"), s2 = await person("stutwo"), s3 = await person("stuthree"), s4 = await person("stufour");
  const join = (p, code, name) => p.call("/inst/join", { code, displayName: name, consent: true, adult: true });
  // The invite link's landing: no sign-in needed; says which centre and batch, never more.
  const pv = await fetch(`${BASE}/inst/invite/${studentCode.replace("-", "")}`).then(async (x) => ({ status: x.status, data: await x.json() }));
  assert.equal(pv.status, 200, "invite preview works signed out");
  assert.equal(pv.data.role, "student"); assert.ok(pv.data.institute.name && pv.data.batch.name);
  assert.equal(pv.data.institute.id, undefined, "no internal id"); assert.equal(pv.data.uses, undefined);
  assert.equal((await fetch(`${BASE}/inst/invite/ZZZZZZZZ`)).status, 404, "unknown code: nothing about anyone");
  assert.equal((await join(admin, adminCode, "Admin Anu")).data.role, "admin");
  assert.equal((await join(teacher, teacherCode, "Teacher Tara")).data.role, "teacher");
  for (const [p, n] of [[s1, "Student One"], [s2, "Student Two"], [s3, "Student Three"]]) assert.equal((await join(p, studentCode, n)).status, 200);
  r = await join(s4, studentCode, "Student Four");
  assert.equal(r.status, 404, "a code for 3 is used up after 3");
  assert.equal((await join(s1, (await owner.call("/inst/admin/codes", { role: "student", batchId: batch1 })).data.code, "Again")).status, 409, "already in");
  const bCode = (await ownerB.call("/inst/admin/codes", { role: "student", batchId: batchB })).data.code;
  assert.equal((await join(s1, bCode, "Two places")).status, 409, "one institute at a time");
  const me1 = (await s1.call("/inst/me")).data;
  assert.equal(me1.institute.name, "Vidya IAS Academy");
  assert.equal(me1.batch.id, batch1);
  assert.equal(me1.role, "student");
  step("batches and codes: roles join with their codes, a code's use limit holds, one institute at a time");

  // Cancel and expiry.
  const spare = (await teacher.call("/inst/admin/codes", { role: "student", batchId: batch2 })).data.code;
  assert.equal((await teacher.call(`/inst/admin/codes/${spare}/revoke`, {})).status, 200);
  assert.equal((await join(s4, spare, "Four")).status, 404, "a cancelled code doesn't work");
  assert.equal((await fetch(`${BASE}/inst/invite/${spare}`)).status, 404, "a cancelled code's link shows nothing");
  assert.equal((await ownerB.call(`/inst/admin/codes/${studentCode}/revoke`, {})).status, 404, "another institute can't cancel our code");
  const s4code = (await teacher.call("/inst/admin/codes", { role: "student", batchId: batch2 })).data.code;
  assert.equal((await join(s4, s4code, "Student Four")).status, 200);
  step("a cancelled code stops working; another institute can't cancel it");

  // --- Role limits: nobody climbs ---------------------------------------------------------------------------------------
  for (const [path, body] of [["/inst/admin/overview"], ["/inst/admin/dashboard"], ["/inst/admin/roster"], ["/inst/admin/analytics"], ["/inst/admin/analytics.csv"], ["/inst/admin/codes", { role: "student", batchId: batch1 }],
    ["/inst/admin/batches", { name: "Mine" }], ["/inst/admin/branding", { name: "Hacked" }], ["/inst/admin/content", { kind: "note", title: "x", data: { en: { body: "x" } } }], ["/inst/admin/plans", { title: "x", batchId: batch1 }]]) {
    assert.equal((await s1.call(path, body)).status, 403, `a student is refused ${path}`);
  }
  assert.equal((await teacher.call("/inst/admin/codes", { role: "teacher" })).status, 403, "a teacher can't invite teachers");
  assert.equal((await teacher.call("/inst/admin/codes", { role: "admin" })).status, 403, "a teacher can't invite admins");
  assert.equal((await teacher.call("/inst/admin/batches", { name: "T batch" })).status, 403, "a teacher can't make batches");
  assert.equal((await teacher.call(`/inst/admin/members/${s1.memberId}`, { role: "teacher" })).status, 403, "a teacher can't change roles");
  assert.equal((await teacher.call("/inst/admin/branding", { name: "Teacher's" })).status, 403);
  assert.equal((await admin.call("/inst/admin/codes", { role: "admin" })).status, 403, "an admin can't invite admins");
  assert.equal((await admin.call(`/inst/admin/members/${teacher.memberId}`, { role: "admin" })).status, 403, "an admin can't make admins");
  assert.equal((await admin.call(`/inst/admin/members/${owner.memberId}`, { remove: true })).status, 403, "nobody touches the owner");
  assert.equal((await admin.call(`/inst/admin/members/${admin.memberId}`, { role: "student", batchId: batch1 })).status, 403, "nobody changes themselves");
  assert.equal((await owner.call(`/inst/admin/members/${owner.memberId}`, { role: "admin" })).status, 403, "not even the owner");
  assert.equal((await owner.call("/inst/leave", {})).status, 409, "the owner can't just leave");
  const admin2 = await person("admintwo");
  assert.equal((await join(admin2, (await owner.call("/inst/admin/codes", { role: "admin" })).data.code, "Admin Two")).status, 200);
  assert.equal((await admin.call(`/inst/admin/members/${admin2.memberId}`, { remove: true })).status, 403, "an admin can't remove another admin");
  assert.equal((await owner.call(`/inst/admin/members/${admin2.memberId}`, { role: "teacher" })).status, 200, "the owner can");
  assert.equal((await admin.call(`/inst/admin/members/${s3.memberId}`, { role: "student", batchId: batchB })).status, 400, "another institute's batch is refused");
  assert.equal((await admin.call(`/inst/admin/members/${s3.memberId}`, { batchId: batch2 })).status, 200, "an admin moves a student");
  assert.equal((await s3.call("/inst/me")).data.batch.id, batch2);
  assert.equal((await admin.call(`/inst/admin/members/${s3.memberId}`, { batchId: batch1 })).status, 200);
  step("role limits: students get no console; teachers can't invite staff or change roles; admins can't make admins or touch the owner; nobody changes themselves");

  // --- Isolation: B can't see or change anything of A's ---------------------------------------------------------------
  const isolated = [
    ["/inst/admin/members/" + s1.memberId, { remove: true }], ["/inst/admin/batches/" + batch1, { archived: true }],
    ["/inst/admin/plans", { title: "x", batchId: batch1 }], ["/inst/admin/content", { kind: "note", title: "x", batchId: batch1, data: { en: { body: "x" } } }],
  ];
  for (const [path, body] of isolated) assert.equal((await ownerB.call(path, body)).status, 404, `B is refused ${path}`);
  assert.ok(!(await ownerB.call("/inst/admin/roster")).data.people.some((p) => p.memberId === s1.memberId), "B's roster has only B");
  assert.ok(!(await ownerB.call("/inst/admin/analytics")).data.students.some((p) => p.memberId === s1.memberId));
  assert.equal((await ownerB.call("/inst/feed?batch=" + batch1)).status, 400, "B can't read A's batch chat");
  assert.equal((await ownerB.call("/inst/chat", { text: "hello from B", batchId: batch1 })).status, 404, "B can't post into A's batch");
  step("isolation: another institute's owner can't read or change our people, batches, chat, plans or content");

  // --- Branding ------------------------------------------------------------------------------------------------------------
  assert.equal((await admin.call("/inst/admin/branding", { color: "red" })).status, 400);
  r = await admin.call("/inst/admin/branding", { color: "#1F5FAD", city: "Hyderabad" });
  assert.equal(r.status, 200);
  assert.equal(r.data.institute.color, "#1F5FAD");
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString("base64");
  assert.equal((await admin.call("/inst/admin/logo", { mime: "image/png", data: Buffer.from("not a png").toString("base64") })).status, 400);
  assert.equal((await admin.call("/inst/admin/logo", { mime: "image/png", data: png })).status, 200);
  const logo = await fetch(`${BASE}/inst/logo/${A.id}`);
  assert.equal(logo.status, 200);
  assert.equal(logo.headers.get("content-type"), "image/png");
  const me2 = (await s2.call("/inst/me")).data;
  assert.equal(me2.institute.color, "#1F5FAD");
  assert.equal(me2.institute.logo, `/inst/logo/${A.id}`);
  step("branding: colour (hex only) and logo (real PNG/JPEG only) reach the students");

  // --- Chat --------------------------------------------------------------------------------------------------------------
  assert.equal((await s1.call("/inst/chat", { text: "Anyone doing Laxmikanth ch 12 today?" })).status, 200);
  assert.equal((await s1.call("/inst/chat", { text: "Please read this", announce: true })).status, 403, "students can't announce");
  assert.equal((await teacher.call("/inst/chat", { text: "Test on Sunday, 10 am.", announce: true })).status, 200, "an institute-wide announcement");
  assert.equal((await teacher.call("/inst/chat", { text: "Batch 1 only: bring the map", batchId: batch1, announce: true })).status, 200);
  assert.equal((await s4.call("/inst/chat", { text: "Mains batch says hi" })).status, 200);
  let feed = (await s2.call("/inst/feed")).data;
  assert.equal(feed.batch.id, batch1);
  assert.ok(feed.messages.some((m) => m.text.startsWith("Anyone doing")));
  assert.ok(!feed.messages.some((m) => m.text === "Mains batch says hi"), "batches don't see each other's chat");
  assert.equal(feed.announcements.length, 2);
  assert.ok(!(await s4.call("/inst/feed")).data.announcements.some((a) => a.text.startsWith("Batch 1 only")));
  // The feed ignores ?batch= for students: they only ever get their own.
  assert.equal((await s4.call("/inst/feed?batch=" + batch1)).data.batch.id, batch2);
  step("chat: one per batch, students only ever see their own; announcements for a batch or everyone, by teachers");

  r = await s2.call("/inst/chat", { text: "I want to die, nothing is working" });
  assert.equal(r.status, 200);
  assert.equal(r.data.held, true);
  assert.ok(r.data.care.helplines.some((h) => h.number === "112"));
  feed = (await teacher.call("/inst/feed?batch=" + batch1)).data;
  assert.ok(!feed.messages.some((m) => /want to die/.test(m.text)), "never posted, and the institute isn't shown it");
  const reports = (await staff("/mod/api/reports")).data;
  assert.ok(reports.some((x) => x.kind === "distress" && x.pod_id === `inst:${A.id}`), "Aspiran's care queue has it");
  step("distress in chat is held, the student gets helplines (112), and it goes to Aspiran's care team, not the institute");

  const msg = feed.messages.find((m) => m.text.startsWith("Anyone doing"));
  assert.equal((await s2.call("/inst/chat/report", { id: msg.id, reason: "off topic" })).status, 200);
  assert.equal((await s4.call("/inst/chat/report", { id: msg.id })).status, 404, "can't report another batch's message");
  assert.equal((await teacher.call("/inst/admin/reported")).data.messages[0].id, msg.id);
  assert.equal((await teacher.call(`/inst/admin/messages/${msg.id}/hide`, { hidden: true })).status, 200);
  assert.ok(!(await s2.call("/inst/feed")).data.messages.some((m) => m.id === msg.id), "hidden from students");
  assert.equal((await ownerB.call(`/inst/admin/messages/${msg.id}/hide`, { hidden: false })).status, 404, "B can't unhide ours");
  step("students report a message; teachers see it and hide it; another institute can't touch it");

  // --- Doubts --------------------------------------------------------------------------------------------------------------
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]).toString("base64");
  assert.equal((await s1.call("/inst/doubts", { text: "hm" })).status, 400, "a doubt needs a sentence");
  r = await s1.call("/inst/doubts", { text: "Why is the Governor's discretion narrower after Nabam Rebia?", nodeId: "gs2-1", photo: { mime: "image/jpeg", data: jpg } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const doubt = r.data.id;
  assert.equal((await s1.call("/inst/doubts", { text: "A doubt with a bad topic id here", nodeId: "nope-1" })).status, 400);
  assert.equal((await s1.call("/inst/doubts", { text: "A doubt with a PNG", photo: { mime: "image/png", data: png } })).status, 400, "JPEG only");
  assert.equal((await s2.call(`/inst/doubts/${doubt}`)).status, 404, "another student can't read my doubt");
  assert.equal((await s2.call(`/inst/doubts/${doubt}/photo`)).status, 404);
  assert.equal((await ownerB.call(`/inst/doubts/${doubt}`)).status, 404, "another institute can't read it");
  assert.equal((await ownerB.call(`/inst/doubts/${doubt}/reply`, { text: "From B" })).status, 404);
  const ph = await fetch(`${BASE}/inst/doubts/${doubt}/photo`, { headers: { authorization: "Bearer " + teacher.tok } });
  assert.equal(ph.status, 200);
  assert.equal(ph.headers.get("content-type"), "image/jpeg");
  assert.equal((await teacher.call("/inst/doubts?status=open")).data.doubts[0].id, doubt);
  assert.equal((await teacher.call(`/inst/doubts/${doubt}/reply`, { text: "Because of the SC's 2016 reading of Article 163." })).data.status, "answered");
  assert.equal((await s1.call(`/inst/doubts/${doubt}/reply`, { text: "Does that apply to summoning the House too?" })).data.status, "open", "the student writing back opens it again");
  assert.equal((await s1.call(`/inst/doubts/${doubt}/status`, { status: "resolved" })).status, 200);
  const d = (await s1.call(`/inst/doubts/${doubt}`)).data;
  assert.equal(d.doubt.status, "resolved");
  assert.deepEqual(d.replies.map((x) => x.role), ["teacher", "student"]);
  assert.equal((await s1.call("/inst/doubts", { text: "I feel hopeless, I want to end my life" })).data.held, true, "distress in a doubt is held too");
  step("doubts: JPEG photo, topic from the syllabus list, only you and your teachers see it, answered → open → resolved, distress held");

  // AI first answer: on, the AI never answers feelings or ranks (and no key here, so it may not answer at all).
  await admin.call("/inst/admin/branding", { aiFirstAnswer: true });
  r = await s3.call("/inst/doubts", { text: "What rank will I get if I score 95 in prelims?" });
  assert.equal(r.data.aiAnswered, false, "never answers ranks");
  const rd = (await s3.call(`/inst/doubts/${r.data.id}`)).data;
  assert.ok(!rd.replies.some((x) => x.role === "ai"));
  await admin.call("/inst/admin/branding", { aiFirstAnswer: false });
  step("the AI first answer never answers ranks or results");

  // --- Content -------------------------------------------------------------------------------------------------------------
  const quiz = { questions: [
    { en: { question: "Article 163 is about?", options: ["Council of Ministers to aid the Governor", "Money bills", "Ordinances", "Finance Commission"], answerIndex: 0, explanation: "Art 163: CoM aids and advises the Governor." } },
    { en: { question: "Nabam Rebia was decided in?", options: ["2010", "2016", "2019", "2023"], answerIndex: 1, explanation: "2016, Constitution Bench." }, hi: { question: "नबाम रेबिया का फ़ैसला कब आया?", options: ["2010", "2016", "2019", "2023"], answerIndex: 1, explanation: "2016, संविधान पीठ।" } },
  ] };
  assert.equal((await teacher.call("/inst/admin/content", { kind: "practice", title: "Bad", data: { questions: [{ en: { question: "x", options: ["a"], answerIndex: 3 } }] } })).status, 400, "bad quiz refused");
  const practice = (await teacher.call("/inst/admin/content", { kind: "practice", title: "Governor drill", nodeId: "gs2-1", data: quiz })).data.id;
  const test = (await teacher.call("/inst/admin/content", { kind: "test", title: "Polity test 1", nodeId: "gs2-1", status: "published", data: quiz })).data.id;
  const note = (await teacher.call("/inst/admin/content", { kind: "note", title: "Governor: one page", nodeId: "gs2-1", batchId: batch1, status: "published", data: { en: { body: "Para one.\n\nPara two." } } })).data.id;
  const pack = { schema: "upsc-pods/quiz-pack@1", title: "Imported set", questions: quiz.questions };
  r = await teacher.call("/inst/admin/content", { kind: "practice", pack, nodeId: "gs2-1" });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.status, "draft", "an import lands as a draft");
  let items = (await s1.call("/inst/content")).data.items;
  assert.ok(!items.some((c) => c.id === practice), "drafts stay hidden");
  assert.ok(items.some((c) => c.id === note) && items.some((c) => c.id === test));
  assert.ok(!(await s4.call("/inst/content")).data.items.some((c) => c.id === note), "a note for batch 1 isn't shown to batch 2");
  assert.equal((await s4.call(`/inst/content/${note}`)).status, 404);
  assert.equal((await s1.call(`/inst/content/${practice}`)).status, 404, "a draft can't be opened by id");
  assert.equal((await ownerB.call(`/inst/content/${test}`)).status, 404, "nor by another institute");
  await teacher.call(`/inst/admin/content/${practice}`, { status: "published" });
  const open = (await s1.call(`/inst/content/${test}`)).data;
  assert.equal(open.data.questions.length, 2);
  assert.ok(!JSON.stringify(open.data).includes("answerIndex") && !JSON.stringify(open.data).includes("Constitution Bench"), "answers and explanations aren't sent before answering");
  step("content: notes, practice and tests; quiz-pack import as draft; drafts and other batches' pieces hidden; no answers sent early");

  r = await s1.call("/inst/attempts", { contentId: test, answers: [0, 2] });
  assert.deepEqual([r.data.right, r.data.total], [1, 2]);
  assert.equal(r.data.review[1].answerIndex, 1, "the answers come after");
  assert.equal((await s1.call("/inst/attempts", { contentId: test, answers: [0, 1] })).status, 409, "a test is one go");
  assert.ok((await s1.call(`/inst/content/${test}`)).data.taken, "and shows your answers after");
  assert.equal((await s2.call("/inst/attempts", { contentId: test, answers: [0, 1] })).data.right, 2);
  assert.equal((await s3.call("/inst/attempts", { contentId: test, answers: [1, 0] })).data.right, 0);
  for (let i = 0; i < 3; i++) assert.equal((await s1.call("/inst/attempts", { contentId: practice, answers: [1, 0] })).status, 200, "practice can be repeated");
  assert.equal((await ownerB.call("/inst/attempts", { contentId: practice, answers: [0] })).status, 404);
  step("attempts: marked on the server, a test is one go, practice repeats, other institutes can't");

  // --- Plans ---------------------------------------------------------------------------------------------------------------
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const plan = (await teacher.call("/inst/admin/plans", { title: "November: Polity", startsOn: today, batchId: batch1 })).data.id;
  assert.equal((await teacher.call(`/inst/admin/plans/${plan}`, { items: [{ day: today, kind: "topic", nodeId: "nope" }] })).status, 400);
  assert.equal((await ownerB.call(`/inst/admin/plans/${plan}`, { items: [] })).status, 404, "B can't edit our plan");
  const otherContent = (await ownerB.call("/inst/admin/content", { kind: "note", title: "B note", data: { en: { body: "b" } } })).data.id;
  assert.equal((await teacher.call(`/inst/admin/plans/${plan}`, { items: [{ day: today, kind: "note", contentId: otherContent }] })).status, 400, "can't point at B's content");
  assert.equal((await teacher.call(`/inst/admin/plans/${plan}`, { items: [
    { day: today, kind: "topic", nodeId: "gs2-1" }, { day: today, kind: "practice", contentId: practice, title: "Governor drill" }, { day: today, kind: "task", title: "Write one 150-word answer" },
  ] })).status, 200);
  const solo = (await teacher.call("/inst/admin/plans", { title: "Just for Three", batchId: undefined, memberId: s3.memberId })).data.id;
  assert.ok(solo);
  let mine = (await s1.call("/inst/plan")).data;
  assert.equal(mine.plans.length, 1);
  const [it1, it2] = mine.plans[0].items;
  assert.match(it1.title, /^Constitution/, "a topic item takes the syllabus name");
  assert.equal((await s1.call("/inst/plan/done", { itemId: it1.id })).status, 200);
  assert.equal((await s4.call("/inst/plan/done", { itemId: it2.id })).status, 404, "not your batch's plan");
  assert.ok((await s3.call("/inst/plan")).data.plans.some((p) => p.forYou));
  assert.ok(!(await s2.call("/inst/plan")).data.plans.some((p) => p.forYou), "one student's plan is only theirs");
  // Editing keeps item ids, so ticks survive.
  const cur = (await teacher.call("/inst/admin/plans")).data.plans.find((p) => p.id === plan);
  assert.equal((await teacher.call(`/inst/admin/plans/${plan}`, { items: cur.items.map((i) => ({ ...i, title: i.title + " (edited)" })) })).status, 200);
  mine = (await s1.call("/inst/plan")).data;
  assert.equal(mine.plans[0].items.find((i) => i.id === it1.id).done, true, "the tick stayed");
  step("plans: for a batch or one student, topics from the syllabus, only this institute's content, ticks survive edits");

  // --- Analytics -----------------------------------------------------------------------------------------------------------
  const a = (await teacher.call("/inst/admin/analytics")).data;
  const one = a.students.find((s) => s.memberId === s1.memberId);
  assert.ok(one);
  assert.equal(one.answered, 2 + 3 * 2);
  assert.equal(one.right, 1 + 0);
  assert.equal(one.planDone, 1);
  assert.equal(one.doubtsRaised, 1);
  assert.equal(one.doubtsResolved, 1);
  assert.ok(one.weakTopics.some((w) => w.nodeId === "gs2-1"), "8 answers, 1 right: a weak topic");
  const t1 = a.tests.find((t) => t.contentId === test);
  assert.deepEqual([t1.took, t1.low, t1.median, t1.high], [3, 0, 50, 100]);
  assert.ok(a.coverage.some((c) => c.nodeId === "gs2-1"));
  assert.ok(!a.students.some((s) => s.memberId === teacher.memberId), "only students");
  const onlyB2 = (await teacher.call("/inst/admin/analytics?batch=" + batch2)).data;
  assert.deepEqual(onlyB2.students.map((s) => s.memberId), [s4.memberId]);
  const csv = await fetch(`${BASE}/inst/admin/analytics.csv`, { headers: { authorization: "Bearer " + teacher.tok } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  const csvText = await csv.text();
  assert.ok(csvText.includes("Student One") && !csvText.includes("@example.com"), "names, never emails");
  // Students: their own numbers only.
  const p1 = (await s1.call("/inst/progress")).data.you;
  assert.equal(p1.memberId, s1.memberId);
  assert.equal(JSON.stringify(await s1.call("/inst/progress")).includes(s2.memberId), false);
  step("analytics from real data (answers, tests, plan, doubts), by batch, CSV without emails; a student sees only their own");

  // --- The console's dashboard ----------------------------------------------------------------------------------------------
  const dash = (await teacher.call("/inst/admin/dashboard")).data;
  assert.equal(dash.daily.length, 14, "14 days of activity");
  assert.equal(dash.totals.students, a.students.length, "same students as analytics");
  assert.ok(dash.batches.some((b) => b.id === batch1) && dash.batches.some((b) => b.id === batch2));
  assert.ok(dash.batches.reduce((n, b) => n + b.students, 0) <= dash.totals.students, "open batches add up to at most everyone");
  assert.ok(dash.totals.openDoubts >= dash.batches.reduce((n, b) => n + b.openDoubts, 0));
  assert.ok(dash.recent.some((x) => x.kind === "joined" && x.name === "Student One"), "recent joins, by the name the institute sees");
  for (const k of ["batch", "students", "teacher", "branding", "announcement", "content", "plan"]) assert.equal(typeof dash.checklist[k], "boolean", "checklist " + k);
  assert.equal(dash.checklist.batch && dash.checklist.students && dash.checklist.teacher, true);
  assert.ok(!JSON.stringify(dash).includes("@example.com"), "no emails");
  const dashB = (await ownerB.call("/inst/admin/dashboard")).data;
  assert.ok(!dashB.batches.some((b) => b.id === batch1) && !JSON.stringify(dashB).includes("Student One"), "B's dashboard has only B");
  step("dashboard: batches, activity, doubts waiting and a getting-started checklist; staff only, own institute only, no emails");

  // --- Aspiran Admin's home dashboard ---------------------------------------------------------------------------------------
  assert.equal((await fetch(BASE + "/admin/api/dashboard")).status, 401, "staff key needed");
  assert.equal((await s1.call("/admin/api/dashboard")).status, 401, "a member's token is not a staff key");
  const home = (await staff("/admin/api/dashboard")).data;
  assert.ok(home.institutes.total >= 2 && home.institutes.flagOn === true && home.institutes.students >= 1);
  assert.equal(home.people.signups.length, 14);
  for (const k of ["plus", "library", "chai", "helpers", "leads", "attention"]) assert.ok(home[k], "has " + k);
  assert.ok(home.money && typeof home.money.revenue === "number", "the owner key sees money");
  assert.ok(!JSON.stringify(home).includes("@example.com"), "counts only, no emails");
  step("Admin home dashboard: counts for people, Plus, money, content, Chai, helpers, leads and centres; staff key only");

  // A formula in a name is defused in the CSV.
  const evil = await person("evil");
  const evilCode = (await teacher.call("/inst/admin/codes", { role: "student", batchId: batch2 })).data.code;
  await join(evil, evilCode, "=HYPERLINK(1)");
  const csv2 = await (await fetch(`${BASE}/inst/admin/analytics.csv?batch=${batch2}`, { headers: { authorization: "Bearer " + teacher.tok } })).text();
  assert.ok(csv2.includes(`"'=HYPERLINK(1)"`), "a leading = is defused");
  step("CSV cells are defused against spreadsheet formulas");

  // --- Pausing, leaving, removal, erasure -----------------------------------------------------------------------------------
  assert.equal((await staff(`/admin/api/institutes/${B.id}/status`, { status: "paused" })).status, 200);
  assert.equal((await ownerB.call("/inst/admin/overview")).status, 403, "a paused institute's console is closed");
  assert.equal((await ownerB.call("/inst/me")).data.paused, true);
  await staff(`/admin/api/institutes/${B.id}/status`, { status: "active" });

  assert.equal((await s2.call("/inst/leave", {})).status, 200);
  assert.equal((await s2.call("/inst/me")).data.institute, null);
  assert.equal((await s2.call("/inst/feed")).status, 404);
  let a2 = (await teacher.call("/inst/admin/analytics")).data;
  assert.ok(!a2.students.some((s) => s.memberId === s2.memberId), "gone from analytics");
  assert.equal(a2.tests.find((t) => t.contentId === test).took, 2, "their test answers went with them");
  assert.equal((await admin.call(`/inst/admin/members/${s3.memberId}`, { remove: true })).status, 200);
  assert.equal((await s3.call("/inst/plan")).status, 404, "removed: no access");
  step("pause closes the console; leaving and removal take you out and your answers with you");

  // Erasure: deleting an Aspiran account removes them from the institute; their doubts stay without their name.
  r = await s1.call("/privacy/delete", {});
  assert.equal(r.status, 200);
  const roster = (await admin.call("/inst/admin/roster")).data.people;
  assert.ok(!roster.some((p) => p.memberId === s1.memberId), "gone from the roster");
  const anyDoubts = (await teacher.call("/inst/doubts")).data.doubts;
  const kept = anyDoubts.find((x) => x.id === doubt);
  assert.ok(!kept || kept.name !== "Student One", "their name is gone");
  a2 = (await teacher.call("/inst/admin/analytics")).data;
  assert.equal(a2.tests.find((t) => t.contentId === test)?.took ?? 0, 0, "s1 was the last one who took it");
  step("deleting your Aspiran account erases you from the institute too");

  console.log("\ninstitutes: all checks passed");
} finally {
  await staff("/admin/api/flags", { flags: { institutes: flagsBefore.institutes ?? false } });
}
process.exit(0);
