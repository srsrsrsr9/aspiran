#!/usr/bin/env node
// Validate content packs against their template.
//   node tools/validate.mjs content/scratch/three-quick-facts.json [more.json ...]
//   node tools/validate.mjs --source story.txt pack.json     also flags numbers missing from the source
//   node tools/validate.mjs content/myths/x.te.json            a translation file, checked against content/myths/x.json
// Exit code 1 if any pack has errors. Warnings never fail.
import fs from "node:fs";
import { T, byKey } from "./templates.mjs";

const args = process.argv.slice(2);
let source = null, files = [];
for (let i = 0; i < args.length; i++) { if (args[i] === "--source") source = fs.readFileSync(args[++i], "utf8"); else files.push(args[i]); }
if (!files.length) { console.error("usage: node tools/validate.mjs [--source file.txt] pack.json ..."); process.exit(2); }

let bad = 0;
for (const f of files) {
  let pack;
  try { pack = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.log(`FAIL ${f}\n  x not valid JSON: ${e.message}`); bad++; continue; }
  if (!pack.schema) { console.log(`skip ${f} (no "schema" field)`); continue; }
  if (pack.schema === "upsc-pods/translation@1") {
    // A translation file is checked against the pack beside it: content/x/y.te.json -> content/x/y.json
    const base = f.replace(/\.[a-z]{2}\.json$/, ".json");
    if (!fs.existsSync(base)) { console.log(`FAIL ${f}\n  x no pack at ${base}`); bad++; continue; }
    const p = JSON.parse(fs.readFileSync(base, "utf8")), t = byKey(p.schema), r = T.validateTranslation(p, pack, t.schema);
    console.log(`${r.errors.length ? "FAIL" : r.warnings.length ? "warn" : "ok  "} ${f}  [${pack.lang} translation of ${t.key}]`);
    r.errors.forEach((e) => console.log("  x " + e)); r.warnings.forEach((w) => console.log("  ! " + w));
    if (r.errors.length) bad++; continue;
  }
  let t; try { t = byKey(pack.schema); } catch (e) { console.log(`skip ${f} (${e.message})`); continue; }
  const r = T.validate(pack, t.schema, { source });
  console.log(`${r.errors.length ? "FAIL" : r.warnings.length ? "warn" : "ok  "} ${f}  [${t.key}]`);
  r.errors.forEach((e) => console.log("  x " + e));
  r.warnings.forEach((w) => console.log("  ! " + w));
  if (r.errors.length) bad++;
}
process.exit(bad ? 1 : 0);
