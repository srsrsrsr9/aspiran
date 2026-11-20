// Plain-text past papers for the content prompt (batches M5 and M6 in artefacts/content-mega-prompt-2026-11-20.md).
//   node content/pyq/tools/pyq-text.mjs        writes content/pyq/text/pyq-mains-<year>.txt and pyq-prelims-<year>.txt
// Mains: GS1 to GS4 (and the Essay) of 2013 to 2024, word for word, with paper, number, marks and word limit.
// Prelims: GS Paper I of 1995 to 2017, only papers with UPSC's own answer key, the keyed answer after each question.
// Everything comes from content/pyq/pyq.json, which holds UPSC's papers only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const { papers } = JSON.parse(readFileSync(join(DIR, "pyq.json"), "utf8"));
const out = join(DIR, "text");
mkdirSync(out, { recursive: true });
const NAME = { gs1: "GS Paper I", gs2: "GS Paper II", gs3: "GS Paper III", gs4: "GS Paper IV", essay: "Essay", prelims: "GS Paper I", csat: "GS Paper II (CSAT)" };
const ORDER = ["gs1", "gs2", "gs3", "gs4", "essay"];
const real = papers.filter((p) => !p.sample && !p.id.startsWith("sample"));
const years = (exam) => [...new Set(real.filter((p) => p.exam === exam).map((p) => p.year))].sort((a, b) => b - a);
const written = [];

for (const y of years("mains").filter((y) => y >= 2013 && y <= 2024)) {
  const ps = real.filter((p) => p.exam === "mains" && p.year === y).sort((a, b) => ORDER.indexOf(a.paper) - ORDER.indexOf(b.paper));
  let t = `UPSC Civil Services (Main) Examination ${y}: question papers, word for word from UPSC (upsc.gov.in).\n`;
  t += `Papers in this file: ${ps.map((p) => NAME[p.paper]).join(", ")}.\n`;
  t += `Each question: [year paper number] marks, word limit, syllabus node, then the question exactly as UPSC set it.\n`;
  for (const p of ps) {
    t += `\n==== ${y} ${NAME[p.paper]} (${p.id}) ====\nSource: ${p.source.url}\n`;
    for (const q of p.questions) {
      t += `\n[${y} ${NAME[p.paper]} Q${q.n}] ${q.marks ?? "?"} marks, ${q.words ? q.words + " words" : "no word limit given"}, node ${q.nodes.join(", ")}\n${q.en.q}\n`;
    }
  }
  writeFileSync(join(out, `pyq-mains-${y}.txt`), t);
  written.push(`pyq-mains-${y}.txt (${ps.length} papers)`);
}

for (const y of years("prelims").filter((y) => y >= 1995 && y <= 2017)) {
  const p = real.find((x) => x.exam === "prelims" && x.year === y && x.paper === "prelims");
  if (!p || p.answerKey?.status !== "official") continue; // no UPSC key, no file: never guess an answer
  const dropped = new Set(p.answerKey.dropped ?? []);
  let t = `UPSC Civil Services (Preliminary) Examination ${y}, GS Paper I: questions word for word from UPSC (upsc.gov.in),\n`;
  t += `answers from UPSC's official answer key only (${p.answerKey.url}).\nSource: ${p.source.url}\n`;
  for (const q of p.questions) {
    t += `\n[${y} Prelims GS1 Q${q.n}] node ${q.nodes.join(", ")}\n${q.en.q}\n`;
    q.en.options.forEach((o, i) => { t += `(${"abcd"[i]}) ${o}\n`; });
    t += dropped.has(q.n) ? `UPSC's key: dropped (no answer counted)\n` : `UPSC's key: (${"abcd"[q.answer]})\n`;
  }
  writeFileSync(join(out, `pyq-prelims-${y}.txt`), t);
  written.push(`pyq-prelims-${y}.txt`);
}
console.log(written.join("\n") || "nothing to write");
