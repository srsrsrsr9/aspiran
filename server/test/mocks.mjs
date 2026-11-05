// The sample mock paper (content/mock-sample-2026-10-12, schema upsc-pods/mock-paper@1 in the template's shape)
// against a running local server: import, conversion to the apps' shape, the count-up timer kept, approval,
// and clean-up. EDITOR_TOKEN=... node test/mocks.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");
const DIR = new URL("../content/mock-sample-2026-10-12/", import.meta.url);

const call = async (path, { method = "GET", body, raw } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": raw ? "application/octet-stream" : "application/json", authorization: "Bearer " + TOKEN },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const manifest = JSON.parse(readFileSync(new URL("manifest.json", DIR), "utf8"));
const source = JSON.parse(readFileSync(new URL("mocks/polity-sectional-mock-1.json", DIR), "utf8"));
const pack = manifest.packId;
assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: readFileSync(new URL("manifest.json", DIR)) })).status, 200);
for (const f of manifest.files) {
  assert.equal((await call(`/desk/api/packs/${pack}/files/${f.path}`, { method: "PUT", raw: readFileSync(new URL(f.path, DIR)) })).status, 200);
}
const imp = await call(`/desk/api/packs/${pack}/import`, { method: "POST" });
assert.equal(imp.status, 200, JSON.stringify(imp.data));
step("pack uploaded and imported");

const row = (await call("/desk/api/library")).data.find((r) => r.kind === "mock" && r.data.id === source.id);
assert.ok(row, "the paper is in the desk's library as a draft");
const d = row.data;
assert.equal(d.questions.length, 30);
assert.deepEqual(d.timer, { ...source.timer }, "the count-up timer setting is kept");
assert.equal(d.minutes, 36, "suggested time: 1.2 minutes a question");
assert.equal(d.marking.right, 2);
assert.equal(d.marking.wrong, -0.66);
d.questions.forEach((q, i) => {
  const s = source.questions[i];
  for (const l of ["en", "hi"]) {
    assert.equal(typeof q[l].question, "string");
    assert.ok(q[l].question.startsWith(s[l].stem), `Q${i + 1} ${l} starts with the stem`);
    assert.deepEqual(q[l].options, s[l].options);
    assert.equal(q[l].answerIndex, s.answer);
    assert.equal(q[l].explanation, s[l].why);
  }
  assert.ok(q.topic, `Q${i + 1} has a topic`);
});
const first = d.questions[0].en.question.split("\n");
assert.deepEqual(first.slice(1, 4).map((x) => x.slice(0, 3)), ["1. ", "2. ", "3. "], "statements are numbered");
const twoStatements = d.questions.find((q) => q.format === "statement-i-ii");
assert.match(twoStatements.en.question, /\nStatement I: .*\nStatement II: /s);
assert.match(twoStatements.hi.question, /\nकथन I: /);
const listMatch = d.questions.find((q) => q.format === "list-match");
assert.ok(listMatch.en.question.includes("\nA. Ireland\n"), "already-labelled lists are not renumbered");
assert.ok(!row.flags.some((f) => /at least 10|Set the time|no explanation|out of range|answers differ/.test(f)), row.flags.join("; "));
step("converted to the apps' shape: 30 questions, en + hi, answers and explanations kept");

const shipped = async () => (await (await fetch(BASE + "/library")).json()).items.find((i) => i.id === row.id);
assert.equal(await shipped(), undefined, "a draft stays off phones");
await call(`/desk/api/library/${row.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const live = await shipped();
assert.ok(live, "approved English ships");
assert.deepEqual(live.data.timer, { ...source.timer });
assert.equal(live.data.questions[0].hi, undefined, "Hindi waits for a Hindi editor");
step("ships after approval with the count-up timer");

// Re-importing must not double-convert.
assert.equal((await call(`/desk/api/packs/${pack}/import`, { method: "POST" })).status, 200);
const again = (await call("/desk/api/library")).data.filter((r) => r.kind === "mock" && r.data.id === source.id);
assert.equal(again.length, 1);
assert.equal(again[0].data.questions[0].en.question, d.questions[0].en.question);
step("re-import keeps one copy, same text");

await call(`/desk/api/library/${row.id}/unapprove`, { method: "POST" });
assert.equal((await call(`/desk/api/library/${row.id}/delete`, { method: "POST" })).status, 200);
step("cleaned up");

// The Desk inbox: a content zip for Claude Code, kept private in the backups bucket and never served.
const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from("test zip")]);
assert.equal((await call("/desk/api/inbox/part-test.zip", { method: "PUT", raw: zip })).status, 200);
assert.equal((await call("/desk/api/inbox/not-a-zip.zip", { method: "PUT", raw: Buffer.from("hello") })).status, 400);
const inbox = await call("/desk/api/inbox");
assert.ok(inbox.data.some((r) => r.key === "inbox/part-test.zip"));
assert.equal((await fetch(BASE + "/desk/api/inbox")).status, 401);
step("content zip goes to the private inbox; not a zip or no key is refused");
