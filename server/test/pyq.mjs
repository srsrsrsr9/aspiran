// Previous-year UPSC questions (content/pyq/pyq.json → scripts/pyq.mjs pack) against a running local server: the pack
// imports as drafts with the editor's flags, SAMPLE papers never pack, a draft stays off phones, approval ships it, and
// clean-up. EDITOR_TOKEN=... node test/pyq.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, raw } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": raw ? "application/octet-stream" : "application/json", authorization: "Bearer " + TOKEN },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const script = new URL("../scripts/pyq.mjs", import.meta.url);
const dir = mkdtempSync(join(tmpdir(), "pyq-"));
execFileSync(process.execPath, [fileURLToPath(script), "pack", dir], { stdio: "pipe" });
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
const source = JSON.parse(readFileSync(new URL("../../content/pyq/pyq.json", import.meta.url), "utf8"));
assert.ok(manifest.entry.pyqs.length > 0, "the pack lists papers");
assert.ok(!manifest.entry.pyqs.some((p) => p.includes("sample")), "SAMPLE papers are never packed");
assert.equal(manifest.entry.pyqs.length, source.papers.filter((p) => !p.sample).length);
step(`pack written: ${manifest.entry.pyqs.length} papers, no samples`);

const pack = manifest.packId;
assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: readFileSync(join(dir, "manifest.json")) })).status, 200);
for (const f of manifest.files) {
  assert.equal((await call(`/desk/api/packs/${pack}/files/${f.path}`, { method: "PUT", raw: readFileSync(join(dir, f.path)) })).status, 200);
}
const imp = await call(`/desk/api/packs/${pack}/import`, { method: "POST" });
assert.equal(imp.status, 200, JSON.stringify(imp.data));
step("pack uploaded and imported");

const rows = (await call("/desk/api/library")).data.filter((r) => r.kind === "pyq");
assert.equal(rows.length, manifest.entry.pyqs.length, "one library item per paper");
const gs1 = rows.find((r) => r.data.id === "csm-2025-gs1");
assert.ok(gs1, "Mains 2025 GS1 is on the desk");
assert.equal(gs1.status, "draft");
assert.equal(gs1.data.questions.length, 20);
assert.ok(gs1.data.questions.every((q) => q.answer === undefined && !q.en.options), "Mains questions carry no answers or options");
assert.ok(gs1.data.questions.every((q) => q.nodes.length > 0), "every question has a syllabus node");
assert.ok(gs1.flags.some((f) => f.includes("upsc.gov.in")), "the editor is pointed at the PDF");
assert.ok(!gs1.flags.some((f) => /No Hindi/.test(f)), "no Hindi noise on an English-only paper");
step("drafts on the desk: text only, nodes, the PDF to check against");

const shipped = async () => (await (await fetch(BASE + "/library")).json()).items.find((i) => i.id === gs1.id);
assert.equal(await shipped(), undefined, "a draft stays off phones");
await call(`/desk/api/library/${gs1.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const live = await shipped();
assert.ok(live, "approved English ships");
assert.equal(live.data.questions[0].en.q, "Discuss the salient features of the Harappan architecture.");
assert.deepEqual(live.data.questions[0].nodes, ["gs1-1"]);
step("ships after approval");

for (const r of rows) {
  await call(`/desk/api/library/${r.id}/unapprove`, { method: "POST" });
  assert.equal((await call(`/desk/api/library/${r.id}/delete`, { method: "POST" })).status, 200);
}
step("cleaned up");
