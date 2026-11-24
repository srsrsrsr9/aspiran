// Coverage and review (src/content-review.ts, admin "Coverage and review") against a running local server:
// the summary counts a new quiz by type, paper and language and names the gaps; it is kept, not rebuilt on every load,
// until "Count again"; a piece opens with English and Hindi side by side (missing Hindi shown); a review saves with a
// 1-5 rating, issues and a note, bad input is refused, the queue puts unreviewed and low-rated pieces first, and an
// edit after the review shows as "changed since review".
//   EDITOR_TOKEN=... node --import ./test/dev-auth.mjs test/reviews.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, auth = true } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

// Staff only.
assert.equal((await call("/admin/api/review/summary", { auth: false })).status, 401);
step("the review API needs a staff key");

// A polity quiz: two questions, the second with no Hindi.
const run = Date.now().toString(36);
const made = await call("/desk/api/library/new", { method: "POST", body: { kind: "quiz" } });
assert.equal(made.status, 200, JSON.stringify(made.data));
const id = made.data.id;
const quizId = id.split(":")[1];
const data = {
  schema: "upsc-pods/quiz-pack@1", id: quizId, title: { en: `Parliament quiz ${run}`, hi: `संसद प्रश्नोत्तरी ${run}` },
  questions: [
    { en: { question: "Who presides over the Lok Sabha?", options: ["Speaker", "President", "Prime Minister", "Chief Justice"], answerIndex: 0, explanation: "The Speaker presides." },
      hi: { question: "लोकसभा की अध्यक्षता कौन करता है?", options: ["अध्यक्ष", "राष्ट्रपति", "प्रधानमंत्री", "मुख्य न्यायाधीश"], answerIndex: 0, explanation: "अध्यक्ष अध्यक्षता करते हैं।" } },
    { en: { question: "How many members can the President nominate to the Rajya Sabha?", options: ["10", "12", "14", "2"], answerIndex: 1, explanation: "Article 80 allows 12." } },
  ],
};
assert.equal((await call(`/desk/api/library/${id}`, { method: "POST", body: { data } })).status, 200);
assert.equal((await call(`/desk/api/library/${id}/approve`, { method: "POST", body: { lang: "en", editor: "Review test" } })).status, 200);
const ref = `library:${id}`;

// The summary: counted once, then kept.
const fresh = await call("/admin/api/review/refresh", { method: "POST", body: {} });
assert.equal(fresh.status, 200, JSON.stringify(fresh.data));
let sum = (await call("/admin/api/review/summary")).data;
assert.equal(sum.builtAt, fresh.data.builtAt, "the summary is the one just counted");
assert.ok(sum.byType.practice.live >= 1, "the quiz counts as practice, in the app");
assert.ok(sum.byType.practice.questions >= 2, "its questions are counted");
assert.ok(sum.matrix.gs2.practice.live >= 1 || sum.matrix.prelims.practice.live >= 1, "under a polity paper");
assert.ok(Array.isArray(sum.gaps) && sum.gaps.length > 0, "a near-empty database has gaps");
assert.ok(sum.gaps.some((g) => /Chai/.test(g.text)), "missing Chai is named");
assert.ok(!JSON.stringify(sum).includes("checked by a human"), "nothing claims a human check");
const before = sum.progress.all;
assert.ok(before.total >= 1 && before.reviewed === 0);
step("the summary counts by type, paper and language and names the gaps");

// A second, unreviewed quiz made after the count doesn't appear until "Count again": loads read the kept summary.
const other = (await call("/desk/api/library/new", { method: "POST", body: { kind: "quiz" } })).data.id;
sum = (await call("/admin/api/review/summary")).data;
assert.equal(sum.builtAt, fresh.data.builtAt, "not rebuilt on load");
assert.equal(sum.progress.all.total, before.total, "the new draft isn't counted yet");
await call("/admin/api/review/refresh", { method: "POST", body: {} });
sum = (await call("/admin/api/review/summary")).data;
assert.equal(sum.progress.all.total, before.total + 1, "counted after Count again");
step("the summary is kept between loads and recounted on request");

// One piece, side by side.
const piece = await call("/admin/api/review/item?ref=" + encodeURIComponent(ref));
assert.equal(piece.status, 200, JSON.stringify(piece.data));
assert.equal(piece.data.type, "practice");
const titleRow = piece.data.rows.find((r) => r.path === "title");
assert.equal(titleRow.en, `Parliament quiz ${run}`);
assert.equal(titleRow.hi, `संसद प्रश्नोत्तरी ${run}`);
const q2 = piece.data.rows.find((r) => /Rajya Sabha/.test(r.en));
assert.ok(q2 && !q2.hi, "a part with no Hindi shows as missing");
assert.ok(piece.data.rows.some((r) => r.hi === "लोकसभा की अध्यक्षता कौन करता है?"), "Hindi sits beside its English");
assert.equal(piece.data.review, null);
assert.equal((await call("/admin/api/review/item?ref=library:nope:nothing")).status, 404);
assert.equal((await call("/admin/api/review/item?ref=bogus")).status, 400);
step("a piece opens with English and Hindi side by side");

// Saving: bad input is refused.
const save = (body) => call("/admin/api/review/save", { method: "POST", body: { ref, ...body } });
assert.equal((await save({ rating: 6 })).status, 400, "rating above 5");
assert.equal((await save({ rating: 0 })).status, 400, "rating below 1");
assert.equal((await save({ rating: 3, issues: ["spelling"] })).status, 400, "unknown issue");
assert.equal((await save({ issues: [] })).status, 400, "reviewed needs a rating");
assert.equal((await save({ rating: 3, issues: ["other"] })).status, 400, "Other needs a note");
assert.equal((await call("/admin/api/review/save", { method: "POST", body: { ref: "library:nope:nothing", rating: 3 } })).status, 404);
step("bad reviews are refused in plain words");

// Saving a low rating with issues; the queue puts it first among reviewed, unreviewed first overall.
const ok = await save({ rating: 2, issues: ["translation", "factual"], note: "Q2 has no Hindi; check Article 80 wording." });
assert.equal(ok.status, 200, JSON.stringify(ok.data));
const got = (await call("/admin/api/review/item?ref=" + encodeURIComponent(ref))).data.review;
assert.equal(got.rating, 2);
assert.deepEqual(got.issues.sort(), ["factual", "translation"]);
assert.equal(got.status, "reviewed");
assert.match(got.note, /Article 80/);

const todo = (await call("/admin/api/review/queue?show=todo&limit=100")).data;
assert.ok(!todo.rows.some((r) => r.ref === ref), "a reviewed piece leaves the to-review list");
assert.ok(todo.rows.some((r) => r.ref === `library:${other}`), "the unreviewed one is there");
const low = (await call("/admin/api/review/queue?show=low")).data;
assert.equal(low.rows[0].ref, ref, "rated 1 or 2 lists it");
const all = (await call("/admin/api/review/queue?show=all&type=practice&limit=100")).data.rows;
assert.ok(all.findIndex((r) => r.ref === `library:${other}`) < all.findIndex((r) => r.ref === ref), "unreviewed before reviewed");
const issues = (await call("/admin/api/review/queue?show=issues")).data.rows;
assert.deepEqual(issues.map((r) => r.ref), [ref]);
sum = (await call("/admin/api/review/summary")).data;
assert.equal(sum.progress.all.reviewed, 1, "progress counts it at once, without a recount");
assert.equal(sum.progress.all.low, 1);
assert.equal(sum.progress.byType.practice.avgRating, 2);
step("a review saves, and the queue and progress follow it");

// "Save, not finished" keeps it in the to-review list.
assert.equal((await call("/admin/api/review/save", { method: "POST", body: { ref: `library:${other}`, rating: 4, reviewed: false } })).status, 200);
assert.ok((await call("/admin/api/review/queue?show=todo&limit=100")).data.rows.some((r) => r.ref === `library:${other}` && r.status === "started"));
step("a started review stays in the queue");

// Edited after the review: back in the to-review list as changed.
await new Promise((r) => setTimeout(r, 1100));
data.title.en = `Parliament quiz ${run} (fixed)`;
assert.equal((await call(`/desk/api/library/${id}`, { method: "POST", body: { data } })).status, 200);
await call("/admin/api/review/refresh", { method: "POST", body: {} });
const back = (await call("/admin/api/review/queue?show=todo&limit=100")).data.rows.find((r) => r.ref === ref);
assert.ok(back && back.changed, "an edit after the review brings it back as changed");
step("an edit after the review shows as changed since review");

// Every save is in the audit log.
const audit = (await call("/admin/api/audit?q=review")).data;
assert.ok(audit.some((a) => /review\/save/.test(a.action)), "saves are audited");
step("review saves are in the audit log");

// The old Content section's topic table reads the kept summary too.
const cov = (await call("/admin/api/coverage")).data;
assert.ok(cov.papers?.length && cov.builtAt, "coverage comes from the kept summary");
step("the Content section's coverage reads the kept summary");

console.log("\nAll review checks passed.");
