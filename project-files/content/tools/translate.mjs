#!/usr/bin/env node
// Translate checked packs into another language with Claude Haiku 5.5, then validate the translation files.
//
//   npm install @anthropic-ai/sdk
//   node tools/translate.mjs te content/myths/chanakya-myth-or-fact.json [more packs]   writes <pack>.te.json beside each
//   node tools/translate.mjs te content/ --dry-run        print the prompts, call nothing
//   node tools/translate.mjs te content/ --stale          list translation files whose English has changed since
//
// A folder means every pack in it. Packs that are about one language (precis, translate-it, usage-fix) are skipped.
// Every file comes out as review.status "draft". A language editor approves it before the app shows it.
import fs from "node:fs";
import path from "node:path";
import { T, ROOT, byKey } from "./templates.mjs";

const args = process.argv.slice(2), flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const pos = []; for (let i = 0; i < args.length; i++) { if (args[i] === "--model") i++; else if (!args[i].startsWith("--")) pos.push(args[i]); }
const [lang, ...targets] = pos, MODEL = opt("--model", "claude-haiku-5-5");
if (!lang || !targets.length) { console.error("usage: node tools/translate.mjs <lang> <pack.json|folder> ... [--dry-run] [--stale] [--model id]\nlanguages: " + Object.keys(T.LANGS).filter((l) => l !== "en").join(", ")); process.exit(2); }
if (!T.LANGS[lang] || lang === "en") { console.error(`Unknown language "${lang}".`); process.exit(2); }
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const SYSTEM = read("templates/languages/TRANSLATE_PROMPT.md"), NOTE = read(`templates/languages/${lang}.md`);

const packs = [];
(function add(list) { for (const t of list) { const st = fs.statSync(t); if (st.isDirectory()) add(fs.readdirSync(t).filter((f) => !f.startsWith("_")).map((f) => path.join(t, f))); else if (/\.json$/.test(t) && !/\.[a-z]{2}\.json$/.test(t)) packs.push(t); } })(targets);

const jobs = packs.map((f) => { const pack = JSON.parse(fs.readFileSync(f, "utf8")); let t = null; try { t = pack.schema && byKey(pack.schema); } catch {} return { f, pack, t, out: f.replace(/\.json$/, `.${lang}.json`) }; })
  .filter((j) => j.t && !["precis", "translate-it", "usage-fix"].includes(j.t.key));

if (flag("--stale")) {
  let n = 0;
  for (const j of jobs) { if (!fs.existsSync(j.out)) continue; const r = T.validateTranslation(j.pack, JSON.parse(fs.readFileSync(j.out, "utf8")), j.t.schema); const st = r.errors.filter((e) => /changed|missing|not an English/.test(e)); if (st.length) { n++; console.log(`${j.out}: ${st.length} strings to redo`); } }
  console.log(n ? `${n} file(s) need another pass` : "Every translation matches its English."); process.exit(0);
}
if (flag("--dry-run")) { for (const j of jobs) { const p = T.buildTranslationPrompt(j.pack, lang, SYSTEM, NOTE, j.t.schema); console.log(`\n=== ${j.f} -> ${j.out} ===\n${p.user}`); } process.exit(0); }

const { default: Anthropic } = await import("@anthropic-ai/sdk");
const client = new Anthropic();
const report = [];
for (const j of jobs) {
  const p = T.buildTranslationPrompt(j.pack, lang, SYSTEM, NOTE, j.t.schema);
  const messages = [{ role: "user", content: p.user }];
  let tr = null, r = null;
  try {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const m = await client.messages.create({ model: MODEL, max_tokens: 16000, system: [{ type: "text", text: p.system, cache_control: { type: "ephemeral" } }], messages, output_config: { effort: "medium", format: { type: "json_schema", schema: p.schema } } });
      if (m.stop_reason === "refusal" || m.stop_reason === "max_tokens") { r = { errors: [m.stop_reason] }; break; }
      const reply = JSON.parse(m.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
      tr = T.makeTranslation(j.pack, lang, reply, { generator: "tools/translate.mjs", model: MODEL, attempts: attempt, createdOn: new Date().toISOString().slice(0, 10) });
      r = T.validateTranslation(j.pack, tr, j.t.schema, { generated: true });
      if (!r.errors.length || attempt === 2) break;
      messages.push({ role: "assistant", content: m.content }, { role: "user", content: `Problems:\n${r.errors.map((e) => "- " + e).join("\n")}\n\nFix them and return the whole JSON object again.` });
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) { console.error("No valid API key. Set ANTHROPIC_API_KEY or run `ant auth login`."); process.exit(1); }
    r = { errors: [String(e.message || e)] };
  }
  if (tr) fs.writeFileSync(j.out, JSON.stringify(tr, null, 2) + "\n");
  report.push({ pack: j.f, file: tr ? j.out : null, status: r.errors.length ? "fail" : r.warnings?.length ? "check" : "ok", errors: r.errors, warnings: r.warnings || [] });
  console.log(`${report.at(-1).status.padEnd(5)} ${j.out}`);
}
const n = (s) => report.filter((x) => x.status === s).length;
console.log(`\n${n("ok")} ok, ${n("check")} to check, ${n("fail")} failed. Every file is a draft until a ${T.LANGS[lang].name} editor approves it.`);
