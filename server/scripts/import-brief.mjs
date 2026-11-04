// Imports the owner's content batches (the claude.ai Project's output, saved in content/brief/aspiran-content) into the
// desk as drafts, through the same pack upload as import-pack.mjs.
//   npm run import:brief -- ../content/brief/aspiran-content
// Syllabus notes (B14–B22) and full mocks (B23, B24) are not here: they live in content/syllabus and content/mocks and go
// in with scripts/syllabus.mjs.
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
  [/^optionals\/[a-z-]+\/syllabus\.json$/, "aspiran/optional-syllabus@1"],
  [/^optionals\/[a-z-]+\/priority\.json$/, "aspiran/optional-priority@1"],
  [/^skeletons\//, "aspiran/mains-skeleton@1"],
  [/^gs4-cases\//, "aspiran/gs4-case@1"],
  [/^gs4-terms\//, "aspiran/gs4-glossary@1"],
  [/^csat\//, "aspiran/csat-week@1"],
  [/^walk\//, "aspiran/walk-script@1"],
  [/^restart\//, "aspiran/restart-day@1"],
  [/^printables\//, "aspiran/printable@1"],
  [/^audio\/[^/]+\.json$/, "aspiran/audio-lecture@1"],
];

const checks = join(src, "checks");
// A file a later batch fixed (B10-fix, B09-rest) is listed twice; the fixing batch wins.
const byPath = new Map();
const later = (n) => (/-(fix|rest)\.json$/.test(n) ? 1 : 0);
for (const f of readdirSync(checks).filter((n) => /^manifest-.+\.json$/.test(n)).sort((a, b) => later(a) - later(b) || a.localeCompare(b))) {
  const m = JSON.parse(readFileSync(join(checks, f), "utf8"));
  for (const file of m.files ?? []) byPath.set(file.path, { path: file.path, batch: m.batch });
}
const listed = [...byPath.values()];

const day = new Date().toISOString().slice(0, 10);

// A talk's Sarvam recording sits in content/audio/recordings/<id>/ as <id>.en-01.mp3, <id>.hi-01.mp3 and so on. A
// language goes in only when every part of its .voice.txt is recorded; until then the app reads the script aloud.
const RECORDINGS = join(src, "..", "..", "audio", "recordings");
const recorded = [];
function withRecording(data, jsonPath) {
  const dir = join(RECORDINGS, data.id);
  if (!existsSync(dir)) return data;
  const recording = {};
  for (const l of ["en", "hi"]) {
    const script = jsonPath.replace(/\.json$/, `.${l}.voice.txt`);
    const want = existsSync(script) ? (readFileSync(script, "utf8").match(/^--- part \d+ ---/gm) ?? []).length : 0;
    const parts = readdirSync(dir).filter((n) => n.startsWith(`${data.id}.${l}-`) && n.endsWith(".mp3")).sort();
    if (!parts.length) continue;
    if (parts.length !== want) { console.log(`  ${data.id} (${l}): ${parts.length} of ${want} parts recorded; the device voice reads it for now`); continue; }
    recording[l] = parts.map((n) => {
      const path = `recordings/${data.id}/${n}`;
      const bytes = readFileSync(join(dir, n));
      recorded.push({ path, bytes });
      return path;
    });
  }
  return Object.keys(recording).length ? { ...data, recording } : data;
}
const packId = `brief-${day}`;
const out = mkdtempSync(join(tmpdir(), "aspiran-brief-"));
const files = [], entry = [];
const unknown = [], missing = [];
for (const { path, batch } of listed) {
  // Full mocks (B23, B24) live in content/mocks and go in with scripts/syllabus.mjs.
  if (path.startsWith("mocks/")) continue;
  if (!existsSync(join(src, path))) { missing.push(path); continue; }
  let data = JSON.parse(readFileSync(join(src, path), "utf8"));
  // Practice formats (X1–X5, F1) carry their own upsc-pods/<format>@1 schema.
  const schema = path.startsWith("practice/") && /^upsc-pods\/[a-z-]+@1$/.test(data.schema ?? "") ? data.schema : SCHEMA_OF.find(([re]) => re.test(path))?.[1];
  if (!schema) { unknown.push(path); continue; }
  if (schema === "aspiran/audio-lecture@1") data = withRecording(data, join(src, path));
  const bytes = Buffer.from(JSON.stringify({ schema, ...data, review: { ...(data.review ?? {}), note: `Batch ${batch}, made in the claude.ai Project` } }, null, 2));
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  files.push({ path, sha256: createHash("sha256").update(bytes).digest("hex") });
  entry.push(path);
}
for (const { path, bytes } of recorded) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), bytes);
  files.push({ path, sha256: createHash("sha256").update(bytes).digest("hex") });
}
if (recorded.length) console.log(`${recorded.length} recorded parts go with the talks`);
if (missing.length) console.log(`Listed in a batch but not in the folder (not made yet?): ${missing.join(", ")}`);
if (unknown.length) console.log(`Not imported (no kind for these yet): ${unknown.join(", ")}`);
writeFileSync(join(out, "manifest.json"), JSON.stringify({ schema: "upsc-pods/pack-manifest@1", packId, createdOn: day, files, entry: { brief: entry } }, null, 2));
console.log(`${entry.length} files from ${new Set(listed.map((l) => l.batch)).size} batches → pack ${packId}`);
execFileSync(process.execPath, [join(import.meta.dirname, "import-pack.mjs"), out], { stdio: "inherit" });
