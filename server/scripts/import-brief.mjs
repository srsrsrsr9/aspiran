// Imports the owner's content batches (the claude.ai Project's output, saved in content/brief/aspiran-content) into the
// desk as drafts, through the same pack upload as import-pack.mjs.
//   npm run import:brief -- ../content/brief/aspiran-content
// Only files a batch's checks/manifest-*.json lists are sent: those are the ones the checker passed. Each file gets its
// schema from its folder, so the server knows its kind. Re-running is safe: unchanged items stay as they are; a changed
// one goes back to draft with its approvals cleared. Needs EDITOR_TOKEN (and BASE for production), as import-pack does.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Usage: npm run import:brief -- <aspiran-content folder>");

/** The folder a file sits in names its kind. */
const SCHEMA_OF = [
  [/^pause-lines\//, "aspiran/pause-lines@1"],
  [/^chotu\/voice\.json$/, "aspiran/chotu-voice@1"],
  [/^essay\//, "aspiran/essay-topic@1"],
  [/^terms\//, "aspiran/term-list@1"],
  [/^interview\/personas\.json$/, "aspiran/interview-personas@1"],
  [/^interview\//, "aspiran/interview-bank@1"],
  [/^optionals\/[a-z-]+\/nodes\//, "aspiran/optional-node@1"],
];

const checks = join(src, "checks");
const listed = [];
for (const f of readdirSync(checks).filter((n) => /^manifest-.+\.json$/.test(n)).sort()) {
  const m = JSON.parse(readFileSync(join(checks, f), "utf8"));
  for (const file of m.files ?? []) listed.push({ path: file.path, batch: m.batch });
}

const day = new Date().toISOString().slice(0, 10);
const packId = `brief-${day}`;
const out = mkdtempSync(join(tmpdir(), "aspiran-brief-"));
const files = [], entry = [];
const unknown = [], missing = [];
for (const { path, batch } of listed) {
  if (!existsSync(join(src, path))) { missing.push(path); continue; }
  const schema = SCHEMA_OF.find(([re]) => re.test(path))?.[1];
  if (!schema) { unknown.push(path); continue; }
  const data = JSON.parse(readFileSync(join(src, path), "utf8"));
  const bytes = Buffer.from(JSON.stringify({ schema, ...data, review: { ...(data.review ?? {}), note: `Batch ${batch}, made in the claude.ai Project` } }, null, 2));
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  files.push({ path, sha256: createHash("sha256").update(bytes).digest("hex") });
  entry.push(path);
}
if (missing.length) console.log(`Listed in a batch but not in the folder (not made yet?): ${missing.join(", ")}`);
if (unknown.length) console.log(`Not imported (no kind for these yet): ${unknown.join(", ")}`);
writeFileSync(join(out, "manifest.json"), JSON.stringify({ schema: "upsc-pods/pack-manifest@1", packId, createdOn: day, files, entry: { brief: entry } }, null, 2));
console.log(`${entry.length} files from ${new Set(listed.map((l) => l.batch)).size} batches → pack ${packId}`);
execFileSync(process.execPath, [join(import.meta.dirname, "import-pack.mjs"), out], { stdio: "inherit" });
