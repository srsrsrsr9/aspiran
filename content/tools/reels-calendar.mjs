#!/usr/bin/env node
// Reels calendar (20 Nov 2026, sales build order step 3): turns the illustrated shorts' social cuts
// (docs/content/asp/shorts-*.zip → *.social.mp4, 1080 × 1920 with captions burned in) into a posting calendar for
// Instagram Reels and YouTube Shorts, with a caption, title and hashtags for each. Files only: the owner posts.
//
//   node content/tools/reels-calendar.mjs [--zips <folder>] [--start 2026-11-23] [--out <folder>]
//
// What it reads: each zip's file list and each short's .vtt (the opening lines become the hook), and the table of
// 100 shorts in artefacts/video-mega-prompt-2026-11-16.md (title, paper, format, tone, premise).
// What it writes (in --out, default artefacts/daily-posts-2026-11-20/reels):
//   calendar.csv   one row per post: date, time, platform, language, number, file, zip, title, caption file
//   calendar.md    the same as a readable table, a week per section
//   captions/      one .txt per post, ready to paste (Instagram caption, or YouTube title + description)
// Rules kept: no "AI" labels; SERIOUS shorts get no emoji and a plain caption; no scores, ranks or countdowns.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (name, dflt) => { const i = process.argv.indexOf("--" + name); return i > 0 ? process.argv[i + 1] : dflt; };
// The zips aren't in git; a worktree finds them in the main checkout.
const mainCheckout = () => { try { return resolve(execFileSync("git", ["-C", ROOT, "rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim(), ".."); } catch { return ROOT; } };
const ZIPS = resolve(arg("zips", [join(ROOT, "docs/content/asp"), join(mainCheckout(), "docs/content/asp")].find(existsSync) ?? "docs/content/asp"));
const START = arg("start", "2026-11-23");
const OUT = resolve(arg("out", join(ROOT, "artefacts/daily-posts-2026-11-20/reels")));
const APP = "app.aspiran.in";

// --- The shorts' table from the mega prompt -------------------------------------------------------------------------
const table = readFileSync(join(ROOT, "artefacts/video-mega-prompt-2026-11-16.md"), "utf8");
const meta = new Map();
let section = "";
for (const line of table.split("\n")) {
  if (line.startsWith("### ")) section = line.slice(4).trim();
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length < 7 || !/^\d+$/.test(cells[1])) continue;
  const n = Number(cells[1]);
  // Pilots have "Paper · nodes"; the rest have nodes only.
  const nodes = (cells[3].includes("·") ? cells[3].split("·")[1] : cells[3]).split(",").map((s) => s.trim()).filter(Boolean);
  const [format, tone] = cells[4].split("·").map((s) => s.trim());
  meta.set(n, { n, title: cells[2], nodes, format: format.replace(/\s*\(.*\)$/, ""), serious: /SERIOUS/i.test(tone ?? ""), tragic: /TRAGIC/i.test(tone ?? ""), premise: cells[5], section });
}

// --- What's in the zips ---------------------------------------------------------------------------------------------
const zips = readdirSync(ZIPS).filter((f) => /^shorts-.*\.zip$/.test(f)).sort();
if (!zips.length) { console.error(`No shorts-*.zip in ${ZIPS}`); process.exit(1); }
const shorts = new Map(); // n → { en, hi }
for (const z of zips) {
  const lang = /hindi/i.test(z) ? "hi" : "en";
  const files = execFileSync("unzip", ["-Z1", join(ZIPS, z)], { encoding: "utf8", maxBuffer: 1e7 }).split("\n").filter((f) => f.endsWith(".social.mp4"));
  for (const f of files) {
    const m = f.match(/(?:^|\/)(\d{3})-([a-z0-9-]+)\.social\.mp4$/);
    if (!m) continue;
    const n = Number(m[1]);
    const vtt = execFileSync("unzip", ["-p", join(ZIPS, z), f.replace(/\.social\.mp4$/, ".vtt")], { encoding: "utf8", maxBuffer: 1e7 });
    const cues = vtt.split(/\n\n+/).map((b) => b.split("\n")).filter((b) => b.some((l) => l.includes("-->")));
    const lines = cues.map((b) => b.slice(b.findIndex((l) => l.includes("-->")) + 1).join(" ").trim()).filter(Boolean);
    const end = cues.length ? cues[cues.length - 1].find((l) => l.includes("-->")).split("-->")[1].trim() : "";
    const [hh, mm, ss] = end.split(":").map(Number);
    shorts.set(n, { ...shorts.get(n), [lang]: { zip: z, file: f, slug: m[2], lines, seconds: Math.round((hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0)) } });
  }
}

// --- Captions -------------------------------------------------------------------------------------------------------
const PAPER = (nodes) => {
  const p = nodes.map((x) => x.split("-")[0]);
  for (const k of ["gs1", "gs2", "gs3", "gs4", "essay", "pre"]) if (p.includes(k)) return k;
  return "gs1";
};
const PAPER_NAME = { gs1: "GS Paper I", gs2: "GS Paper II", gs3: "GS Paper III", gs4: "GS Paper IV (Ethics)", essay: "Essay", pre: "Prelims" };
const PAPER_HI = { gs1: "सामान्य अध्ययन I", gs2: "सामान्य अध्ययन II", gs3: "सामान्य अध्ययन III", gs4: "सामान्य अध्ययन IV (नीतिशास्त्र)", essay: "निबंध", pre: "प्रारंभिक परीक्षा" };
const NODE_TAGS = {
  "gs1-1": ["ArtAndCulture", "AncientIndia"], "gs1-2": ["ModernIndia"], "gs1-3": ["FreedomStruggle"], "gs1-4": ["PostIndependence"],
  "gs1-5": ["WorldHistory"], "gs1-6": ["IndianSociety"], "gs1-7": ["Geography"], "gs1-8": ["Geography"], "gs1-9": ["Geography", "DisasterManagement"],
  gs2: ["Polity", "Governance"], gs3: ["Economy", "Environment"], "gs3-5": ["ScienceAndTech"], "gs3-6": ["Environment"], "gs3-7": ["DisasterManagement"],
  "gs3-8": ["CyberSecurity"], gs4: ["Ethics", "GS4"], essay: ["EssayWriting"], pre: ["Prelims", "PYQ"],
};
const hashtags = (m, lang) => {
  const tags = ["UPSC", "UPSCPrep", "CivilServices", "IAS"];
  for (const node of m.nodes) tags.push(...(NODE_TAGS[node] ?? NODE_TAGS[node.split("-")[0]] ?? []));
  if (m.format === "PQ") tags.push("UPSCPYQ");
  if (lang === "hi") tags.push("UPSCHindi", "HindiMedium");
  return [...new Set(tags)].slice(0, 9).concat("Aspiran").map((t) => "#" + t);
};
/** The opening of the voice-over, to a sentence end, about 200 characters at most. */
const hook = (lines) => {
  let s = "";
  for (const l of lines) { s = (s + " " + l).trim(); if (s.length > 60 && /[.?!।]$/.test(s)) break; if (s.length > 200) break; }
  return s.length > 220 ? s.slice(0, s.lastIndexOf(" ", 210)) + "…" : s;
};
const LEAD = { IC: "📌", ST: "📖", CF: "⚖️", MJ: "🗺️", TS: "🕰️", "2S": "⚖️", PQ: "📝", BM: "📜" };

function instagram(m, s, lang) {
  const p = PAPER(m.nodes), calm = m.serious;
  if (lang === "hi") return [
    hook(s.lines), "",
    `UPSC ${PAPER_HI[p]} · ${m.title}`,
    m.format === "PQ" ? "असली UPSC प्रश्न, उसका जाल और उत्तर।" : m.format === "CF" ? "आप उस अफ़सर की जगह होते तो क्या करते? सोचिए, फिर ऐप में लिखकर देखिए।" : "",
    "", `इस टॉपिक पर और पढ़ाई, मुफ़्त, हिंदी और अंग्रेज़ी में: ${APP} (लिंक बायो में)`, "",
    hashtags(m, lang).join(" "),
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
  return [
    `${calm ? "" : (LEAD[m.format] ?? "") + " "}${m.title}`.trim(), "",
    hook(s.lines), "",
    `${m.premise.replace(/\s+/g, " ").replace(/\s*Told calmly;.*$|\s*No [a-z ]+ (scene|shown|pictures)\.?$/i, "").trim()}`,
    "", `UPSC ${PAPER_NAME[p]}.${m.format === "CF" ? " What would you do? Write it, then mark it in the app." : m.format === "PQ" ? " A real UPSC question, the trap and the answer." : ""}`,
    `More on this topic, free, in English and Hindi: ${APP} (link in bio)`, "",
    hashtags(m, lang).join(" "),
  ].join("\n");
}
function youtube(m, s, lang) {
  const p = PAPER(m.nodes);
  const title = (lang === "hi" ? `${m.title} (हिंदी) | UPSC ${PAPER_HI[p]}` : `${m.title} | UPSC ${PAPER_NAME[p]}`).slice(0, 90) + " #Shorts";
  const link = `https://${APP}/app/?utm_source=youtube&utm_medium=shorts&utm_campaign=short-${String(m.n).padStart(3, "0")}-${lang}`;
  const desc = [hook(s.lines), "", lang === "hi" ? `मुफ़्त अभ्यास, हिंदी और अंग्रेज़ी में: ${link}` : `Practise this topic free, in English and Hindi: ${link}`, "", hashtags(m, lang).join(" ")].join("\n");
  return { title, desc };
}

// --- The calendar ---------------------------------------------------------------------------------------------------
// Order: papers take turns so no two days running are the same paper; within a paper, the table's order. Tragic
// shorts are left out (none in the table today); serious ones never fall on a Sunday.
const ready = [...shorts.keys()].filter((n) => meta.has(n) && shorts.get(n).en && !meta.get(n).tragic).sort((a, b) => a - b);
const missing = [...shorts.keys()].filter((n) => !meta.has(n) || !shorts.get(n).en);
const queues = new Map();
for (const n of ready) { const p = PAPER(meta.get(n).nodes); queues.set(p, [...(queues.get(p) ?? []), n]); }
const order = [];
while ([...queues.values()].some((q) => q.length)) {
  for (const [p, q] of [...queues.entries()].sort((a, b) => b[1].length - a[1].length)) if (q.length) order.push(q.shift());
}
const dayOf = (i) => new Date(Date.parse(START + "T00:00:00Z") + i * 864e5);
for (let i = 0; i < order.length; i++) if (dayOf(i).getUTCDay() === 0 && meta.get(order[i]).serious) {
  const j = order.findIndex((n, k) => k > i && !meta.get(n).serious && dayOf(k).getUTCDay() !== 0);
  if (j > 0) [order[i], order[j]] = [order[j], order[i]];
}

rmSync(join(OUT, "captions"), { recursive: true, force: true });
mkdirSync(join(OUT, "captions"), { recursive: true });
const csv = [["date", "time_ist", "platform", "language", "short", "seconds", "zip", "file", "title", "caption_file"]];
const md = [`# Reels and Shorts calendar from ${START}`, "",
  `${order.length} shorts, one a day, in English and Hindi. Made by \`content/tools/reels-calendar.mjs\` from ${zips.length} zips in \`docs/content/asp/\`.`,
  "Each day: Instagram Reel (English) at 18:30 IST; YouTube Short in Hindi at 12:30 and in English at 18:30. Captions are in `captions/`.",
  "Upload the `.social.mp4` file (1080 × 1920, captions already on screen). Sound stays as recorded; nothing here autoplays on our side.", ""];
const DAYNAME = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
order.forEach((n, i) => {
  const d = dayOf(i), date = d.toISOString().slice(0, 10), m = meta.get(n), s = shorts.get(n);
  if (i % 7 === 0) md.push(`## Week of ${date}`, "", "| Day | # | Short | Paper | Hindi cut | Seconds |", "|---|---|---|---|---|---|");
  const id = `${date}-${String(n).padStart(3, "0")}`;
  const ig = `captions/${id}-instagram-en.txt`;
  writeFileSync(join(OUT, ig), instagram(m, s.en, "en") + "\n");
  csv.push([date, "18:30", "instagram", "en", n, s.en.seconds, s.en.zip, s.en.file, m.title, ig]);
  for (const [lang, time] of [["hi", "12:30"], ["en", "18:30"]]) {
    const c = s[lang];
    if (!c) continue;
    const y = youtube(m, c, lang), f = `captions/${id}-youtube-${lang}.txt`;
    writeFileSync(join(OUT, f), `TITLE\n${y.title}\n\nDESCRIPTION\n${y.desc}\n`);
    csv.push([date, time, "youtube", lang, n, c.seconds, c.zip, c.file, y.title, f]);
  }
  md.push(`| ${DAYNAME[d.getUTCDay()]} ${date.slice(5)} | ${n} | ${m.title}${m.serious ? " *(serious: calm caption, no emoji)*" : ""} | ${PAPER_NAME[PAPER(m.nodes)]} | ${s.hi ? "yes" : "no"} | ${s.en.seconds} |`);
  if (i % 7 === 6 || i === order.length - 1) md.push("");
});
if (missing.length) md.push(`Left out (no English cut, or not in the table): ${missing.join(", ")}.`, "");
const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
writeFileSync(join(OUT, "calendar.csv"), csv.map((r) => r.map(q).join(",")).join("\n") + "\n");
writeFileSync(join(OUT, "calendar.md"), md.join("\n"));
console.log(`${order.length} shorts from ${START} to ${dayOf(order.length - 1).toISOString().slice(0, 10)}; ${csv.length - 1} posts; written to ${OUT}`);
