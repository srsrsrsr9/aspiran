// "Try one topic" (src/try.ts) against a running local server: a topic path imports as a draft, stays hidden from
// visitors until an English editor approves it, ships without Hindi until a Hindi editor approves, and drafts are
// previewable with a desk key only. EDITOR_TOKEN=... node test/try.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, raw, auth = true } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": raw ? "application/octet-stream" : "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const source = JSON.parse(readFileSync(new URL("../../content/topic-paths/federalism.json", import.meta.url), "utf8"));
const file = Buffer.from(JSON.stringify(source));
const pack = "test-try-" + Date.now();
const path = `topic-path/${source.id}.json`;
const manifest = { schema: "upsc-pods/pack-manifest@1", packId: pack, createdOn: "2026-11-08", status: "draft", entry: { paths: [path] },
  files: [{ path, bytes: file.length, sha256: createHash("sha256").update(file).digest("hex") }] };

assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(manifest)) })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/files/${path}`, { method: "PUT", raw: file })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/import`, { method: "POST" })).status, 200);
const row = (await call("/desk/api/library")).data.find((r) => r.kind === "topic-path" && r.data.id === source.id);
assert.ok(row, "imported as a topic-path draft");
assert.ok(row.flags.some((f) => /Check these \d+ facts/.test(f)), "facts to check reach the editor");
assert.ok(!row.flags.some((f) => /no Hindi|need four options|PYQ needs/.test(f)), row.flags.join("; "));
step("imports as a draft, with its facts flagged for the editor");

const pub = (id = "") => call(`/try${id ? "/" + id : ""}`, { auth: false });
assert.equal((await pub(source.id)).status, 404, "a draft stays closed to visitors");
assert.ok(!(await pub()).data.items.some((i) => i.id === source.id));
assert.equal((await call(`/try/${source.id}?preview=1`, { auth: false })).status, 401, "no preview without a desk key");
const prev = await call(`/try/${source.id}?preview=1`);
assert.equal(prev.status, 200);
assert.equal(prev.data.draft, true);
step("drafts: closed to visitors, previewable with a desk key");

await call(`/desk/api/library/${row.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const live = await pub(source.id);
assert.equal(live.status, 200);
assert.equal(live.data.draft, false);
assert.equal(live.data.id, source.id);
assert.equal(live.data.data.steps.length, source.steps.length);
assert.equal(live.data.data.steps[1].body.hi, undefined, "Hindi waits for a Hindi editor");
assert.ok((await pub()).data.items.some((i) => i.id === source.id));
step("opens after English approval, without Hindi");

// Feedback: anonymous answers by session, replaced if asked again; contact needs consent; free text follows the crisis
// protocol; counts show only from MIN_SHOWN answers; "Delete what I sent" removes everything for that session.
const sid = "testsession" + Date.now().toString(36);
const fb = (path, body) => call(path, { method: "POST", body: { sessionId: sid, pathId: source.id, ...body }, auth: false });
assert.equal((await fb("/try/feedback", { question: "clarity", answer: "right" })).status, 200);
assert.equal((await fb("/try/feedback", { question: "clarity", answer: "dense" })).status, 200);
assert.equal((await fb("/try/feedback", { question: "Bad Question!", answer: "x" })).status, 400);
assert.equal((await call("/try/feedback", { method: "POST", body: { sessionId: "short", pathId: source.id, question: "q", answer: "a" }, auth: false })).status, 400);
const care = await fb("/try/feedback", { question: "missing", text: "i want to die" });
assert.equal(care.data.care, true, "distress text gets the helplines");
assert.ok(care.data.helplines?.length);
assert.equal((await fb("/try/contact", { contact: "aspirant@example.com" })).status, 400, "no contact without consent");
assert.equal((await fb("/try/contact", { contact: "12345", consent: true })).status, 400);
assert.equal((await fb("/try/contact", { contact: "98765 43210", consent: true, consentText: "18+, contact once" })).data.kind, "phone");
const adminRows = (await call("/admin/api/try/feedback")).data;
const mine = adminRows.rows.filter((r) => r.session_id === sid);
assert.equal(mine.find((r) => r.question === "clarity").answer, "dense", "asking again replaces the answer");
assert.equal(mine.find((r) => r.question === "missing").answer, "CARE", "distress is marked for a human");
assert.ok(adminRows.contacts.some((c) => c.session_id === sid && c.contact === "+919876543210"));
const summary = (await call(`/try/summary?path=${source.id}`, { auth: false })).data;
assert.ok(!summary.questions.clarity || summary.questions.clarity.total >= summary.minShown, "counts hidden below the minimum");
assert.ok(!JSON.stringify(summary).includes("die"), "free text never in the summary");
const gone = await fb("/try/forget", {});
assert.equal(gone.data.deleted, 3); // two answers and the contact
assert.ok(!(await call("/admin/api/try/feedback")).data.rows.some((r) => r.session_id === sid));
// "You asked, we did": staff write, visitors read the visible ones only.
assert.equal((await call("/admin/api/try/updates", { method: "POST", body: { pathId: source.id, en: "short" } })).status, 400);
assert.equal((await call("/admin/api/try/updates", { method: "POST", body: { pathId: source.id, en: "Test line: more Hindi PYQ explanations, added", hi: "परीक्षण पंक्ति", doneOn: "2026-11-08" } })).status, 200);
const upd = (await call(`/admin/api/try/updates?path=${source.id}`)).data.updates.find((x) => x.text_en.startsWith("Test line"));
assert.ok((await call(`/try/updates?path=${source.id}`, { auth: false })).data.updates.some((x) => x.en.startsWith("Test line")));
await call(`/admin/api/try/updates/${upd.id}/hide`, { method: "POST", body: {} });
assert.ok(!(await call(`/try/updates?path=${source.id}&x=1`, { auth: false })).data.updates.some((x) => x.en.startsWith("Test line")), "hidden lines don't show");
step("feedback: stored anonymously, consent for contact, crisis text flagged, summary gated, delete works");

await call(`/desk/api/library/${row.id}/unapprove`, { method: "POST" });
assert.equal((await pub(source.id)).status, 404);
assert.equal((await call(`/desk/api/library/${row.id}/delete`, { method: "POST" })).status, 200);
step("closes again when unapproved; cleaned up");
