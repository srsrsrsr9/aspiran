// Loads a template folder (schema, config, brief, system prompt) by type key.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const T = require("./lib/pods-templates.js");
export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

export function registry() { return JSON.parse(read("templates/registry.json")).types; }
export function byKey(key) {
  const reg = registry();
  const r = reg.find((x) => x.key === key || x.schema === key || x.schema.replace(/@\d+$/, "") === "upsc-pods/" + key);
  if (!r) throw new Error(`Unknown type "${key}". Known: ${reg.map((x) => x.key).join(", ")}`);
  const dir = `templates/${r.key}/`;
  return {
    ...r, dir,
    schema: JSON.parse(read(dir + "schema.json")),
    config: JSON.parse(read(dir + "config.json")),
    brief: read(dir + "brief.md"),
    system: read("templates/SYSTEM_PROMPT.md"),
    title: r.title
  };
}
// Job config overrides go on top of the template's config.
export function jobConfig(t, overrides = {}) { return T.merge(t.config, overrides); }
