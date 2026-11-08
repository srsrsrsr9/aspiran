// "Try one topic" (src/try.ts) against a running local server: a topic path imports as a draft, stays hidden from
// visitors until an English editor approves it, ships without Hindi until a Hindi editor approves, and drafts are
// previewable with a desk key only. EDITOR_TOKEN=... node test/try.mjs   (BASE defaults to http://127.0.0.1:8787)
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

const source = JSON.parse(readFileSync(new URL("../../content/topic-paths/federalism.json", import.meta.url), "utf8"));
const file = Buffer.from(JSON.stringify(source));
const pack = "test-try-" + Date.now();
const path = `topic-path/${source.id}.json`;
const manifest = { schema: "upsc-pods/pack-manifest@1", packId: pack, createdOn: "2026-11-08", status: "draft", entry: { paths: [path] },
  files: [{ path, bytes: file.length, sha256: createHash("sha256").update(file).digest("hex") }] };

assert.equal((await call(`/desk/api/packs/${pack}/files/manifest.json`, { method: "PUT", raw: Buffer.from(JSON.stringify(manifest)) })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/files/${path}`, { method: "PUT", raw: file })).status, 200);
assert.equal((await call(`/desk/api/packs/${pack}/import`, { method: "POST" })).status, 200);
const row = (await call("/desk/api/library")).data.find((r) => r.kind === "topic-path" && r.data.id === source.id);
assert.ok(row, "imported as a topic-path draft");
assert.ok(row.flags.some((f) => /Check these \d+ facts/.test(f)), "facts to check reach the editor");
assert.ok(!row.flags.some((f) => /no Hindi|need four options|PYQ needs/.test(f)), row.flags.join("; "));
step("imports as a draft, with its facts flagged for the editor");

const pub = (id = "") => call(`/try${id ? "/" + id : ""}`, { auth: false });
assert.equal((await pub(source.id)).status, 404, "a draft stays closed to visitors");
assert.ok(!(await pub()).data.items.some((i) => i.id === source.id));
assert.equal((await call(`/try/${source.id}?preview=1`, { auth: false })).status, 401, "no preview without a desk key");
const prev = await call(`/try/${source.id}?preview=1`);
assert.equal(prev.status, 200);
assert.equal(prev.data.draft, true);
step("drafts: closed to visitors, previewable with a desk key");

await call(`/desk/api/library/${row.id}/approve`, { method: "POST", body: { lang: "en", editor: "Test Editor" } });
const live = await pub(source.id);
assert.equal(live.status, 200);
assert.equal(live.data.draft, false);
assert.equal(live.data.id, source.id);
assert.equal(live.data.data.steps.length, source.steps.length);
assert.equal(live.data.data.steps[1].body.hi, undefined, "Hindi waits for a Hindi editor");
assert.ok((await pub()).data.items.some((i) => i.id === source.id));
step("opens after English approval, without Hindi");

await call(`/desk/api/library/${row.id}/unapprove`, { method: "POST" });
assert.equal((await pub(source.id)).status, 404);
assert.equal((await call(`/desk/api/library/${row.id}/delete`, { method: "POST" })).status, 200);
step("closes again when unapproved; cleaned up");
