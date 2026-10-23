// Copies the content team's templates into the server, so the desk's Author tab writes with the same
// prompts, schemas and checks as their tools.
//
//   node scripts/sync-templates.mjs <bundle.json> [pods-templates.js]
//
// bundle.json is content/templates/bundle.json from the project library (rebuilt there by build.mjs);
// pods-templates.js is content/tools/lib/pods-templates.js. Restart `npm run dev` afterwards.
import { copyFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [bundle, lib] = process.argv.slice(2);
if (!bundle) {
  console.error("Usage: node scripts/sync-templates.mjs <bundle.json> [pods-templates.js]");
  process.exit(1);
}
const vendor = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "vendor");
const b = JSON.parse(readFileSync(bundle, "utf8"));
for (const k of ["systemPrompt", "translatePrompt", "registry", "languageNotes", "types"]) {
  if (!b[k]) throw new Error(`${bundle} has no "${k}"; is it content/templates/bundle.json?`);
}
copyFileSync(bundle, join(vendor, "templates.json"));
console.log(`templates.json: ${Object.keys(b.types).length} types, made ${b.createdOn}`);
if (lib) {
  const src = readFileSync(lib, "utf8");
  if (!/root\.PodsTemplates\s*=/.test(src)) throw new Error(`${lib} doesn't look like pods-templates.js`);
  copyFileSync(lib, join(vendor, "pods-templates.cjs"));
  console.log("pods-templates.cjs copied");
}
