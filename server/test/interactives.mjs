// "Try it yourself" (content kind "interactive", schema aspiran/syllabus-interactive@1) against a running local server:
// the real pack (content/interactives/) imports as 60 drafts with no flags; drafts stay out of /library and the
// visitor shelf; once approved, members get every piece in /library and visitors get only the free ones at
// /library/shelf. A broken piece is flagged for the editor.
//   EDITOR_TOKEN=... node --import ./test/dev-auth.mjs test/interactives.mjs   (BASE defaults to http://127.0.0.1:8787)
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
  return { status: res.status, data: await res.json().catch(() => null) };
};
const step = (name) => console.log("✓", name);

const dir = new URL("../../content/interactives/syllabus-interactives-2026-11-14/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("manifest.json", dir), "utf8"));
const pack = "test-interactives-" + Date.now();
manifest.packId = pack;
const paths = manifest.entry.interactives;
assert.equal(paths.length, 60, "60 pieces in the pack");

assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(manifest)) })).status, 200);
for (const p of paths) {
  const bytes = readFileSync(new URL(p, dir));
  assert.equal(manifest.files.find((f) => f.path === p).sha256, createHash("sha256").update(bytes).digest("hex"), `${p} matches its checksum`);
  assert.equal((await call(`/desk/api/packs/${pack}/files/${p}`, { method: "PUT", raw: bytes })).status, 200);
}
for (let from = 0; from != null;) {
  const r = await call(`/desk/api/packs/${pack}/import?from=${from}&count=40`, { method: "POST" });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  from = r.data.next ?? null;
}
const rows = (await call("/desk/api/library")).data.filter((r) => r.kind === "interactive");
assert.equal(rows.length, 60, "60 interactive drafts");
const types = {};
for (const r of rows) {
  types[r.data.type] = (types[r.data.type] ?? 0) + 1;
  const real = r.flags.filter((f) => !/^From pack/.test(f));
  assert.deepEqual(real, [], `${r.id}: ${real.join("; ")}`);
}
assert.deepEqual(Object.values(types), [10, 10, 10, 10, 10, 10], JSON.stringify(types));
step("the pack imports as 60 drafts, 10 of each kind, with no flags");

const members = async () => (await call("/library?member=interactives-tester", { auth: false })).data.items.filter((i) => i.kind === "interactive");
const shelf = async () => (await call("/library/shelf", { auth: false })).data.items.filter((i) => i.kind === "interactive");
assert.equal((await members()).length, 0, "drafts stay out of /library");
assert.equal((await shelf()).length, 0, "and off the visitor shelf");
step("drafts are hidden");

const free = rows.find((r) => r.data.free), paid = rows.find((r) => !r.data.free);
for (const r of [free, paid]) for (const lang of ["en", "hi"]) {
  const a = await call(`/desk/api/library/${r.id}/approve`, { method: "POST", body: { lang, editor: "Aspiran (owner publish)" } });
  assert.equal(a.status, 200, JSON.stringify(a.data));
}
const m = await members();
assert.deepEqual(m.map((i) => i.data.id).sort(), [free.data.id, paid.data.id].sort(), "members get both approved pieces");
const one = m.find((i) => i.data.id === free.data.id).data;
assert.ok(one.title.hi && one.prompt.hi, "Hindi ships once approved");
assert.equal(one.week, free.data.week);
assert.equal(one.episode, free.data.episode);
const s = await shelf();
assert.deepEqual(s.map((i) => i.data.id), [free.data.id], "visitors get only the free piece");
step("approved: members get every piece, visitors only the free ones");

// A broken piece is flagged, not silently shown.
const bad = { schema: "aspiran/syllabus-interactive@1", id: "try-broken-" + Date.now(), type: "dial", week: "2000-01", episode: "clock-angle", node: "csat-4",
  title: { en: "Broken" }, prompt: { en: "?" }, takeaway: { en: "." }, sources: [], min: 0, max: 10, step: 1, answer: 50 };
const bytes = Buffer.from(JSON.stringify(bad));
const p2 = "interactive/broken.json", pack2 = pack + "-bad";
const m2 = { schema: "upsc-pods/pack-manifest@1", packId: pack2, createdOn: "2026-11-14", entry: { interactives: [p2] },
  files: [{ path: p2, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }] };
await call(`/desk/api/packs/${pack2}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(m2)) });
await call(`/desk/api/packs/${pack2}/files/${p2}`, { method: "PUT", raw: bytes });
assert.equal((await call(`/desk/api/packs/${pack2}/import`, { method: "POST" })).status, 200);
const row2 = (await call("/desk/api/library")).data.find((r) => r.data?.id === bad.id);
for (const re of [/No sources/, /missing English or Hindi/, /between its min and max/])
  assert.ok(row2.flags.some((f) => re.test(f)), `flagged ${re}: ${row2.flags.join("; ")}`);
step("a broken piece is flagged for the editor");
console.log("interactives: all good");
