// Previous-year UPSC questions (content/pyq/pyq.json, schema in content/pyq/pyq.schema.json).
//   node scripts/pyq.mjs add <paper id> <questions.tsv> <upsc.gov.in url>   add or replace a paper from a transcription
//   node scripts/pyq.mjs key <paper id> <key.csv> <upsc.gov.in key url>    fill a Prelims paper's answers from UPSC's key
//   node scripts/pyq.mjs check                                             check every paper
//   node scripts/pyq.mjs pack [out folder]                                 write a library pack, then: npm run import -- <folder>
// The papers on upsc.gov.in are scans, so questions arrive as a transcription TSV, one per line:
//   <n> TAB <marks> TAB <words> TAB <node[,node]> TAB <question>        (Mains; "\n" in the text is a new line)
//   <n> TAB <marks> TAB TAB <node[,node]> TAB <question> TAB <a> TAB <b> TAB <c> TAB <d>   (Prelims)
// A key CSV is "<n>,<a|b|c|d|dropped>" per line, copied from UPSC's own answer key and no other.
// Nothing here goes live: the pack lands on the desk as drafts, and an editor checks each paper against the PDF.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = join(ROOT, "content", "pyq", "pyq.json");
const PAPERS = { gs1: "GS Paper I", csat: "GS Paper II (CSAT)", gs2: "GS Paper II", gs3: "GS Paper III", gs4: "GS Paper IV", essay: "Essay" };
const NODE = /^(pre|csat|gs1|gs2|gs3|gs4|essay)-([0-9]+|[a-z]+)$/;
const UPSC = /^https:\/\/(www\.)?upsc\.gov\.in\//;

const load = () => JSON.parse(readFileSync(FILE, "utf8"));
const save = (d) => writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n");
const today = () => new Date().toISOString().slice(0, 10);

/** "csm-2025-gs1" → exam, year and the Syllabus.kt paper id. Prelims GS Paper I is "prelims" there. */
function parseId(id) {
  const m = /^(csp|csm|sample)-(\d{4})-(gs1|csat|gs2|gs3|gs4|essay)$/.exec(id);
  if (!m) throw new Error(`${id}: ids look like csp-2025-gs1, csp-2025-csat or csm-2025-gs3`);
  const exam = m[1] === "csm" ? "mains" : "prelims";
  return { exam, year: Number(m[2]), paper: exam === "prelims" && m[3] === "gs1" ? "prelims" : m[3], short: m[3] };
}

function fromTsv(text, exam) {
  return text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#")).map((line, i) => {
    const c = line.split("\t");
    const [n, marks, words, nodes, q, ...options] = c;
    if (!n || !q) throw new Error(`line ${i + 1}: needs at least a number and the question`);
    const out = { n: n.trim(), nodes: (nodes ?? "").split(",").map((s) => s.trim()).filter(Boolean), cards: [], en: { q: q.replace(/\\n/g, "\n").trim() } };
    if (marks) out.marks = Number(marks);
    if (words) out.words = Number(words);
    if (exam === "prelims") {
      if (options.length !== 4) throw new Error(`line ${i + 1}: a Prelims question needs four options`);
      out.en.options = options.map((o) => o.trim().replace(/^\([a-d]\)\s*/i, ""));
      out.answer = null;
    }
    return out;
  });
}

function check(d) {
  const errs = [], notes = [];
  if (d.schema !== "upsc-pods/pyq@1") errs.push("schema should be upsc-pods/pyq@1");
  const ids = new Set();
  for (const p of d.papers ?? []) {
    const at = p.id ?? "(no id)";
    try { parseId(p.id); } catch (e) { errs.push(e.message); continue; }
    if (ids.has(p.id)) errs.push(`${at}: listed twice`);
    ids.add(p.id);
    if (!p.sample && !UPSC.test(p.source?.url ?? "")) errs.push(`${at}: the source must be the paper on upsc.gov.in`);
    if (p.exam === "mains" && p.answerKey?.status !== "none") errs.push(`${at}: Mains papers have no answer key`);
    if (p.answerKey?.status === "official" && !UPSC.test(p.answerKey.url ?? "")) errs.push(`${at}: an official key needs its upsc.gov.in url`);
    const seen = new Set();
    for (const q of p.questions ?? []) {
      const qa = `${at} Q${q.n}`;
      if (seen.has(q.n)) errs.push(`${qa}: number used twice`);
      seen.add(q.n);
      if (!q.en?.q?.trim()) errs.push(`${qa}: no question text`);
      if (!q.nodes?.length) notes.push(`${qa}: no syllabus node`);
      for (const n of q.nodes ?? []) if (!NODE.test(n)) errs.push(`${qa}: ${n} isn't a node id`);
      if (p.exam === "mains" && ("answer" in q || q.en?.options)) errs.push(`${qa}: Mains questions carry no options or answer`);
      if (p.exam === "prelims") {
        if (q.en?.options?.length !== 4) errs.push(`${qa}: needs four options`);
        if (q.answer != null && p.answerKey?.status !== "official") errs.push(`${qa}: has an answer but the paper has no official key`);
        if (p.answerKey?.status === "official" && q.answer == null && !(p.answerKey.dropped ?? []).includes(q.n)) notes.push(`${qa}: no answer in the key`);
      }
    }
    if (p.review?.status !== "draft" && p.review?.status !== "approved") errs.push(`${at}: review.status should be draft or approved`);
  }
  return { errs, notes };
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "add") {
  const [id, tsv, url] = args;
  if (!id || !tsv || !UPSC.test(url ?? "")) throw new Error("Usage: node scripts/pyq.mjs add <paper id> <questions.tsv> <upsc.gov.in url of the paper>");
  const { exam, year, paper, short } = parseId(id);
  const d = load();
  const old = d.papers.find((p) => p.id === id);
  const entry = {
    id, exam, year, paper,
    title: { en: `${id.startsWith("sample") ? "SAMPLE, not a UPSC paper" : `UPSC ${exam === "mains" ? "Mains" : "Prelims"} ${year}`} · ${PAPERS[short]}` },
    ...(id.startsWith("sample") ? { sample: true } : {}),
    source: { publisher: "UPSC", url, fetchedOn: today(), how: "Transcribed from the scanned PDF on upsc.gov.in. English only." },
    answerKey: exam === "mains" ? { status: "none" } : old?.answerKey ?? { status: "awaiting" },
    questions: fromTsv(readFileSync(tsv, "utf8"), exam),
    review: { status: "draft", note: "Check every question against the PDF before approving." },
  };
  d.papers = [...d.papers.filter((p) => p.id !== id), entry].sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
  save(d);
  console.log(`${id}: ${entry.questions.length} questions, draft`);
} else if (cmd === "key") {
  const [id, csv, url] = args;
  if (!id || !csv || !UPSC.test(url ?? "")) throw new Error("Usage: node scripts/pyq.mjs key <paper id> <key.csv> <upsc.gov.in url of the official key>");
  const d = load();
  const p = d.papers.find((x) => x.id === id);
  if (!p || p.exam !== "prelims") throw new Error(`${id}: no Prelims paper with that id`);
  const dropped = [];
  let n = 0;
  for (const line of readFileSync(csv, "utf8").split(/\r?\n/).filter((l) => l.trim())) {
    const [num, letter] = line.split(",").map((s) => s.trim().toLowerCase());
    const q = p.questions.find((x) => x.n === num);
    if (!q) throw new Error(`${id}: the key has Q${num} but the paper doesn't`);
    if (letter === "dropped") { dropped.push(num); q.answer = null; continue; }
    const i = "abcd".indexOf(letter);
    if (i < 0 || letter.length !== 1) throw new Error(`Q${num}: "${letter}" should be a, b, c, d or dropped`);
    q.answer = i;
    n++;
  }
  p.answerKey = { status: "official", url, ...(dropped.length ? { dropped } : {}) };
  p.review = { status: "draft", note: "Answers filled from the official key: check a few against the PDF before approving." };
  save(d);
  console.log(`${id}: ${n} answers from the official key${dropped.length ? `, ${dropped.length} dropped` : ""}`);
} else if (cmd === "check" || cmd === "pack") {
  const d = load();
  const { errs, notes } = check(d);
  for (const n of notes) console.log("  note: " + n);
  if (errs.length) { for (const e of errs) console.error("  " + e); process.exit(1); }
  const real = d.papers.filter((p) => !p.sample);
  console.log(`${real.length} papers, ${real.reduce((s, p) => s + p.questions.length, 0)} questions (${d.papers.length - real.length} sample papers, never packed)`);
  if (cmd === "pack") {
    const packId = `pyq-${today()}`;
    const out = args[0] ?? join(ROOT, "server", "content", packId);
    mkdirSync(join(out, "pyq"), { recursive: true });
    const files = [];
    for (const p of real) {
      const body = Buffer.from(JSON.stringify({ schema: "upsc-pods/pyq-paper@1", ...p }, null, 2) + "\n");
      const path = `pyq/${p.id}.json`;
      writeFileSync(join(out, path), body);
      files.push({ path, bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") });
    }
    const manifest = {
      schema: "upsc-pods/pack-manifest@1", packId, createdOn: today(), status: "draft, not editor-approved",
      entry: { pyqs: files.map((f) => f.path) }, files, totalBytes: files.reduce((s, f) => s + f.bytes, 0),
    };
    writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Pack ${packId} written to ${out}. Next: npm run import -- ${out}`);
  }
} else {
  console.log("Commands: add, key, check, pack (see the top of scripts/pyq.mjs)");
}
