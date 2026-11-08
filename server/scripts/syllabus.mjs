// Syllabus notes, CSAT passage sets and full mocks written by our editors, packed as drafts for the desk.
//   node scripts/syllabus.mjs check              check every source file
//   node scripts/syllabus.mjs pack [out folder]  write a library pack, then: npm run import -- <folder>
// Sources (all English, all drafts):
//   content/syllabus/<subject>.json   upsc-pods/syllabus-notes@1: one long read per syllabus topic
//   content/csat/<set>.json           upsc-pods/csat-passages@1: passages with their questions
//   content/topic-paths/<topic>.json  aspiran/topic-path@1: one whole topic as a guided path (the open "Try one
//                                     topic" sample at /try). Already in the app's shape; packed as it is.
//   content/mocks/<mock>.json         upsc-pods/mock-source@1: a full paper of questions. Optional per question:
//                                     "hi" (q, statements, ask, options, why), "passage" (an id in the file's
//                                     "passages" list) and "table" (rows of strings, header first; "hi.table" too).
// Node ids are checked against the papers and topics in the app's Syllabus.kt ("gs3-2" is GS3's second topic,
// "pre-4" the fourth Prelims one). Each item carries an editor flag saying what to verify. Nothing here is
// approved: the pack lands on the desk as drafts.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = join(ROOT, "content");
const KT = join(ROOT, "android", "app", "src", "main", "java", "com", "upscpods", "app", "data", "Syllabus.kt");
const today = () => new Date().toISOString().slice(0, 10);
const SUBJECTS = ["pol", "his", "anc", "art", "geo", "env", "eco", "sci", "ir", "sec", "soc", "eth", "mains", "ess", "csat"];

/** Paper id → number of topics, read from Syllabus.kt. Prelims GS Paper I is "pre" in node ids. */
function papers() {
  const out = {};
  let cur = null;
  for (const line of readFileSync(KT, "utf8").split(/\r?\n/)) {
    const p = /SyllabusPaper\("([a-z0-9]+)"/.exec(line);
    if (p) { cur = p[1] === "prelims" ? "pre" : p[1]; out[cur] = 0; continue; }
    if (cur && /^\s*t\("/.test(line)) out[cur]++;
  }
  return out;
}
const PAPERS = papers();

function nodeErr(n) {
  const m = /^([a-z0-9]+)-([0-9]+)$/.exec(n ?? "");
  if (!m) return `${n} isn't a node id like gs3-2`;
  const count = PAPERS[m[1]];
  if (count == null) return `${n}: no paper ${m[1]} in Syllabus.kt`;
  if (Number(m[2]) < 1 || Number(m[2]) > count) return `${n}: ${m[1]} has ${count} topics`;
  return null;
}

const list = (dir) => existsSync(join(CONTENT, dir)) ? readdirSync(join(CONTENT, dir)).filter((f) => f.endsWith(".json")).sort().map((f) => `${dir}/${f}`) : [];
const load = (p) => JSON.parse(readFileSync(join(CONTENT, p), "utf8"));
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function checkMcq(q, at, errs) {
  if (!q.q?.trim()) errs.push(`${at}: no question`);
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !String(o ?? "").trim())) errs.push(`${at}: needs four options`);
  else if (new Set(q.options.map(norm)).size !== 4) errs.push(`${at}: two options are the same`);
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) errs.push(`${at}: answerIndex should be 0 to 3`);
  if (!q.why?.trim()) errs.push(`${at}: no why`);
  for (const n of q.nodes ?? []) { const e = nodeErr(n); if (e) errs.push(`${at}: ${e}`); }
  if (!q.nodes?.length) errs.push(`${at}: no syllabus node`);
}

function check() {
  const errs = [], counts = { notes: {}, passages: 0, passageQuestions: 0, mocks: {} };
  const ids = new Set();
  const seenQ = new Map();
  for (const p of list("syllabus")) {
    const d = load(p);
    if (d.schema !== "upsc-pods/syllabus-notes@1") { errs.push(`${p}: schema should be upsc-pods/syllabus-notes@1`); continue; }
    if (!SUBJECTS.includes(d.subject)) errs.push(`${p}: subject ${d.subject} isn't a Prep subject key`);
    counts.notes[d.subject] = d.notes.length;
    for (const n of d.notes) {
      const at = `${p} ${n.id}`;
      if (ids.has(n.id)) errs.push(`${at}: id used twice`);
      ids.add(n.id);
      // Prep files a read under the subject its id starts with.
      if (n.id.split("-")[0] !== d.subject) errs.push(`${at}: the id should start with ${d.subject}-`);
      if (!n.title?.trim() || !n.dek?.trim()) errs.push(`${at}: needs a title and a dek`);
      if (!(n.sections?.length >= 2) || n.sections.some((s) => !s.head?.trim() || !s.body?.trim())) errs.push(`${at}: needs at least two sections with a head and a body`);
      if (!n.keyFacts?.length || !n.selfCheck?.length || !n.examAngle?.trim()) errs.push(`${at}: needs key facts, an exam angle and a self-check`);
      if (!n.sources?.length) errs.push(`${at}: no sources`);
      if (!n.verify?.trim()) errs.push(`${at}: no editor flag (verify)`);
      if (!n.nodes?.length) errs.push(`${at}: no syllabus node`);
      for (const x of n.nodes ?? []) { const e = nodeErr(x); if (e) errs.push(`${at}: ${e}`); }
    }
  }
  for (const p of list("csat")) {
    const d = load(p);
    if (d.schema !== "upsc-pods/csat-passages@1") { errs.push(`${p}: schema should be upsc-pods/csat-passages@1`); continue; }
    if (ids.has(d.id)) errs.push(`${p}: id ${d.id} used twice`);
    ids.add(d.id);
    for (const [i, s] of d.sets.entries()) {
      const words = s.passage.split(/\s+/).filter(Boolean).length;
      if (words < 280 || words > 470) errs.push(`${p} set ${i + 1}: the passage has ${words} words (aim for 300 to 450)`);
      if (s.questions.length < 4 || s.questions.length > 6) errs.push(`${p} set ${i + 1}: needs 4 to 6 questions`);
      counts.passages++;
      s.questions.forEach((q, k) => { checkMcq(q, `${p} set ${i + 1} Q${k + 1}`, errs); counts.passageQuestions++; });
    }
  }
  for (const p of list("mocks")) {
    const d = load(p);
    if (d.schema !== "upsc-pods/mock-source@1") { errs.push(`${p}: schema should be upsc-pods/mock-source@1`); continue; }
    if (ids.has(d.id)) errs.push(`${p}: id ${d.id} used twice`);
    ids.add(d.id);
    const full = d.paper === "prelims-csat" ? 80 : 100;
    if (d.questions.length !== full) errs.push(`${p}: ${d.questions.length} questions; a full ${d.paper === "prelims-csat" ? "CSAT paper" : "GS Paper I"} has ${full}`);
    const passages = new Set((d.passages ?? []).map((x) => x.id));
    const topics = {};
    d.questions.forEach((q, k) => {
      const at = `${p} Q${k + 1}`;
      checkMcq(q, at, errs);
      if (q.passage && !passages.has(q.passage)) errs.push(`${at}: passage ${q.passage} isn't in the file's passages`);
      if (q.hi && (!q.hi.q?.trim() || q.hi.options?.length !== 4 || !q.hi.why?.trim())) errs.push(`${at}: the Hindi needs q, four options and why`);
      topics[q.topic] = (topics[q.topic] ?? 0) + 1;
      // No question twice, in this mock or any other.
      // Generic stems ("Which assumption is implicit…") repeat across passages, so the passage, table and options count too.
      const key = [q.q, ...(q.statements ?? []), q.passage ?? "", tableText(q.table ?? []), ...(q.options ?? [])].map(norm).join(" | ");
      if (seenQ.has(key)) errs.push(`${at}: same question as ${seenQ.get(key)}`);
      seenQ.set(key, at);
    });
    counts.mocks[d.id] = { questions: d.questions.length, topics };
  }
  counts.paths = {};
  for (const p of list("topic-paths")) {
    const d = load(p);
    if (d.schema !== "aspiran/topic-path@1") { errs.push(`${p}: schema should be aspiran/topic-path@1`); continue; }
    if (ids.has(d.id)) errs.push(`${p}: id ${d.id} used twice`);
    ids.add(d.id);
    for (const x of d.nodes ?? []) { const e = nodeErr(x); if (e) errs.push(`${p}: ${e}`); }
    if (!d.nodes?.includes(d.node)) errs.push(`${p}: node ${d.node} should be in nodes`);
    if (d.review?.status !== "draft") errs.push(`${p}: a source file is always a draft; editors approve on the desk`);
    let qs = 0;
    const missingHi = [];
    const walk = (o, at) => {
      if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${at}[${i}]`));
      if (!o || typeof o !== "object") return;
      if (typeof o.en === "string" && o.en && !o.hi && !at.endsWith("sources") && !at.includes("hiNote")) missingHi.push(at);
      for (const [k, v] of Object.entries(o)) walk(v, `${at}.${k}`);
    };
    walk(d, d.id);
    if (missingHi.length) errs.push(`${p}: no Hindi at ${missingHi.slice(0, 5).join(", ")}${missingHi.length > 5 ? ` and ${missingHi.length - 5} more` : ""}`);
    for (const [i, st] of (d.steps ?? []).entries()) {
      const at = `${p} step ${i + 1} (${st.type})`;
      for (const q of [...(st.questions ?? []), ...(st.check ?? []), ...(st.cards ?? [])]) {
        if (!q.options) continue;
        qs++;
        if (q.options.length !== 4 || new Set(q.options.map((o) => norm(o.en))).size !== 4) errs.push(`${at}: "${q.q?.en?.slice(0, 40)}" needs four different options`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errs.push(`${at}: answer should be 0 to 3`);
        if (!q.why?.en) errs.push(`${at}: no why`);
      }
      if (st.type === "pyq") for (const q of st.questions) if (!q.source?.paper || !q.source?.n) errs.push(`${at}: every PYQ needs source.paper and source.n`);
      if (st.type === "sort") for (const it of st.items ?? []) if (!(it.bucket >= 0 && it.bucket < (st.buckets?.length ?? 0))) errs.push(`${at}: ${it.text?.en} has no bucket`);
    }
    // PYQ answers must match the official key in content/pyq/pyq.json, question for question.
    const bank = existsSync(join(CONTENT, "pyq", "pyq.json")) ? load("pyq/pyq.json") : { papers: [] };
    for (const st of (d.steps ?? []).filter((x) => x.type === "pyq")) for (const q of st.questions) {
      const paper = bank.papers.find((x) => x.id === q.source.paper);
      const orig = paper?.questions.find((x) => String(x.n) === String(q.source.n));
      if (!orig) errs.push(`${p}: ${q.source.paper} Q${q.source.n} isn't in pyq.json`);
      else if (orig.answer !== q.answer) errs.push(`${p}: ${q.source.paper} Q${q.source.n} answer ${q.answer}, but the official key in pyq.json says ${orig.answer}`);
    }
    counts.paths[d.id] = { steps: d.steps.length, questions: qs };
  }
  return { errs, counts };
}

// --- Pack ---------------------------------------------------------------------------------------------

const REVIEW = (note) => ({ status: "draft", checkedBy: null, checkedOn: null, note });
const PROVENANCE = { generator: "Claude (syllabus content drafts)", createdOn: today(), note: "Written from general knowledge and the named sources, not copied from them. A subject editor checks every fact." };
const MOCK_LOOK = {
  mood: { bed: null, sfx: true, motion: "crisp" },
  sfx: { pick: "sfx/tick", right: null, wrong: null, done: "sfx/chime" },
  timer: { default: "off", counts: "up", note: "Never a countdown. A member may switch on an upward timer; the suggested time is shown as plain text." },
};

function toRead(d, n) {
  return {
    schema: "upsc-pods/long-read@1", id: n.id, tone: n.tone ?? "NEUTRAL", title: n.hi?.title ? { en: n.title, hi: n.hi.title } : { en: n.title },
    node: n.nodes[0], nodes: n.nodes, topic: d.topic, gsPaper: n.gsPaper, minutes: n.minutes,
    en: { dek: n.dek, sections: n.sections, keyFacts: n.keyFacts, examAngle: n.examAngle, selfCheck: n.selfCheck },
    ...(n.hi?.sections?.length ? { hi: { dek: n.hi.dek, sections: n.hi.sections, keyFacts: n.hi.keyFacts ?? [], examAngle: n.hi.examAngle ?? "", selfCheck: n.hi.selfCheck ?? [] } } : {}),
    sources: { en: n.sources.join("; ") },
    ...(n.factsToCheck?.length ? { factsToCheck: n.factsToCheck } : {}),
    review: REVIEW(`Draft, ${n.hi?.sections?.length ? "English and Hindi" : "English only"}. Verify: ${n.verify}`),
    provenance: PROVENANCE,
  };
}

/** A table as plain lines, since the player shows text: "Year | Wheat | Rice". */
const tableText = (rows) => (rows ?? []).map((r) => r.join(" | ")).join("\n");

/**
 * A question in the template shape normalizeMock() in src/content.ts plays, in English and (when written) Hindi.
 * A passage or table goes above the question, because the player shows one question at a time.
 */
const toMockQ = (q, stem, passages = {}) => {
  const lang = (m, l) => {
    const p = passages[q.passage];
    const pass = p ? (l === "hi" && p.hi ? `${p.hi.title}\n\n${p.hi.text}` : `${p.title}\n\n${p.text}`) : null;
    const table = l === "hi" ? (m.table ?? q.table) : q.table;
    return { stem: [pass, l === "en" && stem ? stem : m.q, table ? tableText(table) : null].filter(Boolean).join("\n\n"),
      statements: m.statements ?? [], ask: m.ask ?? null, options: m.options, why: m.why };
  };
  return {
    format: q.format ?? "direct", node: q.nodes[0], nodes: q.nodes, topic: q.topic, answer: q.answerIndex, difficulty: q.difficulty ?? "medium",
    en: lang(q, "en"), ...(q.hi ? { hi: lang(q.hi, "hi") } : {}),
  };
};

function toMock(d) {
  const flags = d.questions.map((q, i) => q.verify ? `Q${i + 1}: ${q.verify}` : null).filter(Boolean);
  const passages = Object.fromEntries((d.passages ?? []).map((p) => [p.id, p]));
  const hindi = d.questions.every((q) => q.hi);
  const hiCheck = (d.hiCheck ?? []).map((h) => typeof h === "string" ? h : JSON.stringify(h));
  return {
    ...MOCK_LOOK, marking: d.marking ?? { right: 2, wrong: -0.66, blank: 0 },
    tags: { stage: ["prelims"], papers: [d.paper] },
    id: d.id, tone: "NEUTRAL", title: d.hi?.title ? { en: d.title, hi: d.hi.title } : { en: d.title }, paper: d.paper, section: d.section, minutes: d.minutes,
    questions: d.questions.map((q) => toMockQ(q, null, passages)),
    sources: { en: d.sources.join("; ") }, schema: "upsc-pods/mock-paper@1",
    ...(d.factsToCheck?.length ? { factsToCheck: d.factsToCheck } : {}),
    review: REVIEW(`Draft, ${hindi ? "English and Hindi" : "English only"}. Check every answer. ${d.verify ?? ""}${flags.length ? " Date-sensitive or worth a second look: " + flags.join("; ") : ""}${hiCheck.length ? ` Hindi editor, check these terms: ${hiCheck.join("; ")}` : ""}`.trim()),
    provenance: PROVENANCE,
  };
}

/** CSAT passages: every question carries its passage, because the player shows one question at a time. */
function toCsatMock(d) {
  const questions = d.sets.flatMap((s, i) => s.questions.map((q) => toMockQ(q, `Passage ${i + 1}: ${s.title}\n\n${s.passage}\n\n${q.q}`)));
  return {
    ...MOCK_LOOK, marking: { right: 2.5, wrong: -0.83, blank: 0 },
    tags: { stage: ["prelims"], papers: ["prelims-csat"] },
    id: d.id, tone: "NEUTRAL", title: { en: d.title }, paper: "prelims-csat", section: "CSAT Comprehension", minutes: d.minutes,
    questions, sources: { en: d.sources }, schema: "upsc-pods/mock-paper@1",
    review: REVIEW(`Draft, English only. ${d.verify}`),
    provenance: PROVENANCE,
  };
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "check" || cmd === "pack") {
  const { errs, counts } = check();
  if (errs.length) { for (const e of errs) console.error("  " + e); process.exit(1); }
  console.log("Notes: " + Object.entries(counts.notes).map(([s, n]) => `${s} ${n}`).join(", "));
  console.log(`CSAT: ${counts.passages} passages, ${counts.passageQuestions} questions`);
  for (const [id, x] of Object.entries(counts.paths)) console.log(`Topic path ${id}: ${x.steps} steps, ${x.questions} questions`);
  for (const [id, m] of Object.entries(counts.mocks)) console.log(`Mock ${id}: ${m.questions} questions (${Object.entries(m.topics).map(([t, n]) => `${t} ${n}`).join(", ")})`);
  if (cmd === "pack") {
    const packId = `syllabus-${today()}`;
    const out = args[0] ?? join(ROOT, "server", "content", packId);
    const files = [], reads = [], mocks = [], paths = [];
    const write = (path, data, into) => {
      mkdirSync(dirname(join(out, path)), { recursive: true });
      const body = Buffer.from(JSON.stringify(data, null, 2) + "\n");
      writeFileSync(join(out, path), body);
      files.push({ path, bytes: body.length, sha256: createHash("sha256").update(body).digest("hex") });
      into.push(path);
    };
    for (const p of list("syllabus")) { const d = load(p); for (const n of d.notes) write(`long-read/${n.id}.json`, toRead(d, n), reads); }
    for (const p of list("csat")) { const d = load(p); write(`mock-paper/${d.id}.json`, toCsatMock(d), mocks); }
    for (const p of list("mocks")) { const d = load(p); write(`mock-paper/${d.id}.json`, toMock(d), mocks); }
    for (const p of list("topic-paths")) { const d = load(p); write(`topic-path/${d.id}.json`, d, paths); }
    const manifest = {
      schema: "upsc-pods/pack-manifest@1", packId, createdOn: today(), status: "draft, not editor-approved",
      entry: { reads, mocks, paths }, files, totalBytes: files.reduce((s, f) => s + f.bytes, 0),
    };
    writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`Pack ${packId}: ${reads.length} reads, ${mocks.length} mocks, ${paths.length} topic paths, written to ${out}. Next: npm run import -- ${out}`);
  }
} else {
  console.log("Commands: check, pack (see the top of scripts/syllabus.mjs)");
}
