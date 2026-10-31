// Imports questions from an official UPSC Prelims question paper PDF into content/pyq/pyq.json.
// Every imported question is marked "needs-check": an editor compares it with the PDF before it is used.
// Usage:
//   node pyq-import.mjs paper <pdf> --year 2025 --paper prelims-gs1 --series A --origin "upsc.gov.in previous question papers, downloaded 2026-10-12"
//   node pyq-import.mjs key <pdf-or-txt> --year 2025 --paper prelims-gs1 --series A --origin "..."
//   node pyq-import.mjs check            (counts, missing answers, duplicate ids)
// Needs pdftotext (poppler-utils). Nothing here writes or guesses a question: text comes only from the PDF.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DB = path.join(ROOT, "pyq/pyq.json");
const args = process.argv.slice(2), mode = args[0], file = args[1];
const opt = (k, d = null) => { const i = args.indexOf("--" + k); return i > 0 ? args[i + 1] : d; };
const db = JSON.parse(fs.readFileSync(DB, "utf8"));
const save = () => fs.writeFileSync(DB, JSON.stringify(db, null, 2) + "\n");
const DEVANAGARI = /[ऀ-ॿ]/;

function text(f) { return f.endsWith(".txt") ? fs.readFileSync(f, "utf8") : execFileSync("pdftotext", ["-layout", f, "-"], { maxBuffer: 1 << 28 }).toString(); }
function addSource(kind, f) {
  const year = Number(opt("year")), paper = opt("paper", "prelims-gs1"), series = opt("series"), origin = opt("origin");
  if (!year || !origin) throw new Error("--year and --origin are required (origin: where and when the PDF was downloaded)");
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const id = `cse-${paper}-${year}${series ? "-" + series.toLowerCase() : ""}-${kind === "question-paper" ? "qp" : "key"}`;
  db.sources = db.sources.filter((s) => s.id !== id).concat({ id, year, paper, kind, series, file: path.relative(path.join(ROOT, "pyq"), path.resolve(f)), sha256, origin });
  return { id, year, paper, series };
}

// Splits the English half of each question. UPSC papers print the English and Hindi versions one after the other;
// lines with Devanagari go to the Hindi side. Layout differs a little between years, so every result is "needs-check".
function parseQuestions(raw) {
  const lines = raw.replace(/\f/g, "\n").split("\n").map((l) => l.replace(/\s+$/, ""));
  const qs = []; let cur = null;
  for (const line of lines) {
    const m = line.match(/^\s{0,6}(\d{1,3})\.\s+(\S.*)$/);
    // a new question starts only after the previous one has shown its option (d), so numbered statements are not mistaken for questions
    if (m && !DEVANAGARI.test(line) && Number(m[1]) === (cur ? cur.qno + 1 : 1) && (!cur || /\(d\)/.test(cur.en.join(" ")))) { cur = { qno: Number(m[1]), en: [m[2]], hi: [] }; qs.push(cur); continue; }
    if (!cur || !line.trim()) continue;
    (DEVANAGARI.test(line) ? cur.hi : cur.en).push(DEVANAGARI.test(line) && !cur.hi.length ? line.trim().replace(/^\d{1,3}\.\s*/, "") : line.trim());
  }
  return qs.map((q) => ({ qno: q.qno, en: side(q.en), hi: q.hi.length ? side(q.hi) : null }));
}
function side(lines) {
  const body = lines.join("\n"), warnings = [];
  const parts = body.split(/\n?\(([a-d])\)\s*/); const head = parts[0], options = [];
  for (let i = 1; i < parts.length; i += 2) options.push(parts[i + 1].replace(/\s+/g, " ").trim());
  if (options.length !== 4) warnings.push(`found ${options.length} options, expected 4`);
  const st = head.split(/\n(?=\d\.\s)/), stem = st[0].replace(/\s+/g, " ").trim();
  const statements = st.slice(1).map((s) => s.replace(/^\d\.\s*/, "").replace(/\s+/g, " ").trim());
  let ask = null; if (statements.length) { const last = statements[statements.length - 1], k = last.search(/(Which|How many|Select|Choose)\b/);
    if (k > 0) { ask = last.slice(k).trim(); statements[statements.length - 1] = last.slice(0, k).trim(); } }
  return { stem, statements, ask, options: options.slice(0, 4).concat(Array(Math.max(0, 4 - options.length)).fill("")), _warnings: warnings };
}

if (mode === "paper") {
  const src = addSource("question-paper", file), parsed = parseQuestions(text(file));
  let added = 0;
  for (const q of parsed) {
    const id = `pyq-${src.year}-${src.paper.replace("prelims-", "")}-${(src.series || "x").toLowerCase()}-${String(q.qno).padStart(3, "0")}`;
    const warnings = [...q.en._warnings, ...(q.hi ? q.hi._warnings.map((w) => "hi: " + w) : ["no Hindi text found"])];
    delete q.en._warnings; if (q.hi) delete q.hi._warnings;
    db.questions = db.questions.filter((x) => x.id !== id).concat({ id, source: src.id, qno: q.qno, page: null, en: q.en, hi: q.hi, answer: null, answerSource: null, dropped: false, format: null, nodes: [],
      import: { status: "needs-check", warnings }, review: { status: "draft", checkedBy: null, checkedOn: null } }); added++;
  }
  save(); console.log(`${added} questions from ${path.basename(file)} (${src.id}); expected 100 for GS1, 80 for CSAT. All marked needs-check.`);
} else if (mode === "key") {
  const src = addSource("answer-key", file), raw = text(file); let set = 0;
  // Keys are printed as pairs of question number and letter (A to D), sometimes with "dropped" or "*".
  for (const m of raw.matchAll(/\b(\d{1,3})\s*[.)-]?\s+([ABCD]|Dropped|\*)\b/gi)) {
    const qno = Number(m[1]), q = db.questions.find((x) => x.qno === qno && x.source.startsWith(`cse-${src.paper}-${src.year}${src.series ? "-" + src.series.toLowerCase() : ""}`));
    if (!q) continue; const v = m[2].toUpperCase();
    if (v === "DROPPED" || v === "*") { q.dropped = true; q.answer = null; } else q.answer = "ABCD".indexOf(v);
    q.answerSource = src.id; set++;
  }
  save(); console.log(`answers set for ${set} questions from ${src.id}. Check a sample against the PDF.`);
} else if (mode === "check") {
  const by = {}; db.questions.forEach((q) => { (by[q.source] ||= []).push(q); });
  for (const [s, qs] of Object.entries(by)) console.log(`${s}: ${qs.length} questions, ${qs.filter((q) => q.answer == null && !q.dropped).length} without an answer, ${qs.filter((q) => q.import.status !== "checked").length} not yet checked, ${qs.filter((q) => !q.nodes.length).length} without syllabus nodes`);
  const ids = db.questions.map((q) => q.id); if (new Set(ids).size !== ids.length) console.log("duplicate ids found");
  if (!db.questions.length) console.log("No questions yet. Put official PDFs in content/pyq/papers/ and run the paper and key modes.");
} else { console.log("modes: paper <pdf>, key <pdf>, check. See the header of this file."); }
