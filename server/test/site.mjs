// GET /web/site-content (src/site-content.ts), the feed aspiran.in builds its free reading pages from, against a running
// local server: drafts stay out, an approved item comes in without who checked it or how it was made, and a tragic
// item never comes in. EDITOR_TOKEN=... node test/site.mjs   (BASE defaults to http://127.0.0.1:8787)
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const call = async (path, { method = "GET", body, raw, auth = true } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": raw ? "application/octet-stream" : "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, headers: res.headers, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const base = JSON.parse(readFileSync(new URL("../content/prep-content-2026-10-20/landmark-case/pol-kesavananda-bharati.json", import.meta.url), "utf8"));
const stamp = Date.now();
const ok = { ...base, id: `site-test-${stamp}`, provenance: { generator: "test", note: "internal" } };
const sad = { ...base, id: `site-test-tragic-${stamp}`, tone: "TRAGIC" };
const pack = "test-site-" + stamp;
const files = [ok, sad].map((d) => ({ path: `landmark-case/${d.id}.json`, buf: Buffer.from(JSON.stringify(d)) }));
const manifest = { schema: "upsc-pods/pack-manifest@1", packId: pack, createdOn: "2026-11-22", status: "draft", entry: { paths: files.map((f) => f.path) },
  files: files.map((f) => ({ path: f.path, bytes: f.buf.length, sha256: createHash("sha256").update(f.buf).digest("hex") })) };
assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(manifest)) })).status, 200);
for (const f of files) assert.equal((await call(`/desk/api/packs/${pack}/files/${f.path}`, { method: "PUT", raw: f.buf })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/import`, { method: "POST" })).status, 200);

const feed = async () => (await call("/web/site-content", { auth: false }));
let r = await feed();
assert.equal(r.status, 200);
assert.equal(r.headers.get("access-control-allow-origin"), "*");
assert.ok(Array.isArray(r.data.items) && Array.isArray(r.data.briefs) && Array.isArray(r.data.papers));
for (const p of r.data.papers) { assert.ok(!("review" in p) && !("shareable" in p)); assert.match(p.id, /^cs[pm]-/); }
assert.ok(r.data.nodes.length > 100 && r.data.nodes[0].learn.startsWith("/learn/"), "syllabus names come along");
assert.ok(!r.data.items.some((i) => i.data.id === ok.id), "a draft stays out");
step("open to anyone, drafts stay out");

const rows = (await call("/desk/api/library")).data.filter((x) => x.kind === "landmark-case" && [ok.id, sad.id].includes(x.data.id));
assert.equal(rows.length, 2);
for (const row of rows) await call(`/desk/api/library/${row.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
r = await feed();
const got = r.data.items.find((i) => i.data.id === ok.id);
assert.ok(got, "an approved item comes in");
assert.equal(got.kind, "landmark-case");
for (const k of ["provenance", "review", "mood", "sfx", "play", "factsToCheck"]) assert.ok(!(k in got.data), `no ${k}`);
assert.ok(!JSON.stringify(r.data).includes("Test Editor"), "no editor names");
assert.ok(got.data.en?.held, "the content itself is there");
step("approved items come in, without who checked them or how they were made");

assert.ok(!r.data.items.some((i) => i.data.id === sad.id), "a tragic item never comes in");
for (const b of r.data.briefs) for (const c of b.items) { assert.notEqual(String(c.tone).toUpperCase(), "TRAGIC"); assert.ok(!("chotu" in c)); }
step("tragic items and Chotu's jokes stay out");
console.log("site: all passed");
