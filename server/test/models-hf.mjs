// Gemma pass-through from Hugging Face, against a local server with no MODEL_FILES_URL and nothing in R2:
//   npx wrangler dev --port 8791 --persist-to .wrangler-hf --var MODEL_FILES_URL:
//   BASE=http://127.0.0.1:8791 node test/models-hf.mjs
// Needs internet. Downloads only a few bytes of each file.
import assert from "node:assert/strict";

const BASE = process.env.BASE ?? "http://127.0.0.1:8791";
const step = (name) => console.log("✓", name);

const { models } = await (await fetch(BASE + "/models")).json();
const gemma = models.filter((m) => m.id.startsWith("gemma-4-"));
assert.deepEqual(gemma.map((m) => m.id).sort(), ["gemma-4-e2b", "gemma-4-e4b"]);
for (const m of models) assert.equal(m.source, undefined, "the Hugging Face address stays on the server");
step("both Gemma models listed from Hugging Face");

for (const m of gemma) {
  const head = await fetch(BASE + m.url, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get("content-length")), m.bytes);

  const r = await fetch(BASE + m.url, { headers: { range: `bytes=${m.bytes - 16}-` } });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get("content-range"), `bytes ${m.bytes - 16}-${m.bytes - 1}/${m.bytes}`);
  assert.equal((await r.arrayBuffer()).byteLength, 16);
  // Only our own headers go to the phone: nothing that names or links to Hugging Face.
  for (const h of ["x-repo-commit", "x-linked-etag", "x-linked-size", "link", "location", "set-cookie"]) assert.equal(r.headers.get(h), null, h);
  assert.equal(r.headers.get("content-type"), "application/octet-stream");
}
step("Range requests resume (206) with the right sizes and no Hugging Face headers");
