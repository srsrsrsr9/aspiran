// The daily fact watch (src/factwatch.ts) against a running local server in dev mode: the source pages and the AI's
// replies are handed in, so no network or AI key is needed. One new value is only a candidate; the same value on a
// second day rewrites the content (the old text kept as a version); a quote that isn't on the page is ignored; a
// source that can't be opened needs a person.   EDITOR_TOKEN=... node test/factwatch.mjs
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

// One real note (the Supreme Court one), imported through the normal pack upload.
const dir = mkdtempSync(join(tmpdir(), "fw-"));
execFileSync(process.execPath, [fileURLToPath(new URL("../scripts/syllabus.mjs", import.meta.url)), "pack", dir], { stdio: "pipe" });
const path = "long-read/pol-syl-supreme-court.json";
const bytes = readFileSync(join(dir, path));
assert.ok(bytes.toString().includes("from 34 to 38"), "the note carries the phrase the watch rewrites");
const pack = "factwatch-test";
const manifest = Buffer.from(JSON.stringify({ schema: "upsc-pods/pack-manifest@1", packId: pack, createdOn: "2026-11-14", status: "draft",
  entry: { reads: [path] }, totalBytes: bytes.length, files: [{ path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }] }));
assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: manifest })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/files/${path}`, { method: "PUT", raw: bytes })).status, 200);
const imp = await call(`/desk/api/packs/${pack}/import`, { method: "POST", body: {} });
assert.equal(imp.status, 200, JSON.stringify(imp.data));
step("a note with the Supreme Court's strength is in the library");

const W = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=Supreme_Court_of_India";
const page = "The Supreme Court of India has a sanctioned strength of 40 judges including the Chief Justice of India.";
const pages = { [W]: page };
const answers = { "sc-strength": JSON.stringify({ value: "40", quote: page }) };
const run = (body) => call("/admin/api/factwatch/run", { method: "POST", body: { pages, ...body } });
const by = (r) => Object.fromEntries(r.data.results.map((o) => [o.id, o]));

let r = by(await run({ answers, today: "2026-11-14" }));
assert.equal(r["sc-strength"].status, "candidate");
assert.equal(r["sc-strength"].value, "38", "one day's reading changes nothing");
assert.equal(r.crr.status, "needs-person", "a source that can't be opened needs a person");
step("a new value is only a candidate on the first day");

r = by(await run({ answers, today: "2026-11-14" }));
assert.equal(r["sc-strength"].status, "candidate", "the same day twice is still one day");

r = by(await run({ answers, today: "2026-11-15" }));
assert.equal(r["sc-strength"].status, "updated");
assert.equal(r["sc-strength"].value, "40");
assert.deepEqual(r["sc-strength"].items, ["read:pol-syl-supreme-court"]);
const v = await call("/admin/api/versions/library/" + encodeURIComponent("read:pol-syl-supreme-court"));
assert.equal(v.status, 200);
assert.ok(JSON.stringify(v.data).includes("fact watch: sc-strength 38 → 40"), "the old text is kept as a version");
step("the same value on a second day rewrites the content and keeps the old text");

const list = await call("/admin/api/factwatch");
assert.equal(list.data.facts.find((f) => f.id === "sc-strength").value, "40");

// An answer whose quote isn't on the page is ignored.
const bad = { "sc-strength": JSON.stringify({ value: "41", quote: "The court has 41 judges." }) };
r = by(await run({ answers: bad, today: "2026-11-16" }));
assert.equal(r["sc-strength"].status, "needs-person");
assert.equal(r["sc-strength"].value, "40");
step("an AI answer the page doesn't back is ignored");

await call(`/desk/api/library/${encodeURIComponent("read:pol-syl-supreme-court")}/delete`, { method: "POST", body: {} });
console.log("\nFact watch: all checks passed");
