#!/usr/bin/env node
// For every template: strip the example down to what a writer fills, assemble it again from config, and validate.
// Proves that fill.schema.json + config.json are enough to rebuild a valid pack.
import { T, registry, byKey } from "./templates.mjs";

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
function fillPart(v, s) {
  if (!s || s["x-from"] === "config") return undefined;
  if (s.anyOf) { const alt = s.anyOf.find((a) => a.type === (v === null ? "null" : Array.isArray(v) ? "array" : typeof v)) || s.anyOf[0]; return fillPart(v, alt); }
  if (Array.isArray(v) && s.items) return v.map((x) => fillPart(x, s.items) ?? null);
  if (isObj(v) && s.properties) { const o = {}; for (const k of Object.keys(v)) { const c = fillPart(v[k], s.properties[k]); if (c !== undefined) o[k] = c; } return o; }
  return v;
}

let bad = 0;
for (const r of registry()) {
  const t = byKey(r.key);
  const ex = (await import("node:fs")).readFileSync(new URL(`../templates/${r.key}/example.json`, import.meta.url), "utf8");
  const example = JSON.parse(ex);
  const fill = fillPart(example, t.schema);
  if (r.key === "reel") { const seg = example.segments; fill.intro = seg.find((s) => s.kind === "intro").text; fill.outro = seg.find((s) => s.kind === "outro").text; }
  if (r.key === "map-card") fill.find.targetAnchor = "strait";
  const fs1 = T.fillSchema(t.schema, t.config);
  const f1 = T.validate(fill, fs1, {});
  const pack = T.assemble(r.key, fill, t.config);
  const p1 = T.validate(pack, t.schema, { generated: true });
  const errs = f1.errors.map((e) => "fill " + e).concat(p1.errors.map((e) => "pack " + e));
  console.log(`${errs.length ? "FAIL" : "ok  "} ${r.key}`);
  errs.slice(0, 6).forEach((e) => console.log("  x " + e));
  if (errs.length) bad++;
}
console.log(bad ? `${bad} template(s) failed` : "All templates rebuild valid packs from fill + config");
process.exit(bad ? 1 : 0);
