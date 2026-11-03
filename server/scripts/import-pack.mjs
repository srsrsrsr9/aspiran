// Uploads a content pack folder to the server and imports it into the editor queue as drafts.
//   npm run import -- content/preview-2026-10-10
// Needs EDITOR_TOKEN in the environment (the value you typed into .dev.vars). BASE defaults to
// the local server. Nothing goes live: every card and item waits for an editor on the desk.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!dir) throw new Error("Usage: npm run import -- <pack folder>");
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const manifestBytes = readFileSync(join(dir, "manifest.json"));
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const pack = manifest.packId;

async function put(path, bytes) {
  const res = await fetch(`${BASE}/desk/api/packs/${encodeURIComponent(pack)}/files/${path}`, {
    method: "PUT",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "application/octet-stream" },
    body: bytes,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${data.error ?? res.status}`);
}

await put("manifest.json", manifestBytes);
let sent = 0, skipped = 0;
for (const f of manifest.files) {
  const p = join(dir, f.path);
  if (!existsSync(p)) { console.log(`  skip ${f.path} (not in the folder)`); skipped++; continue; }
  const bytes = readFileSync(p);
  const local = createHash("sha256").update(bytes).digest("hex");
  if (local !== f.sha256 && !f.path.endsWith(".svg")) throw new Error(`${f.path} doesn't match the manifest; re-export the pack`);
  await put(f.path, bytes);
  sent++;
}
console.log(`Uploaded ${sent} files to pack ${pack}${skipped ? `, skipped ${skipped}` : ""}`);

// 40 items at a time: one live request may make only 1,000 calls to the database and storage.
for (let from = 0; from != null; ) {
  const res = await fetch(`${BASE}/desk/api/packs/${encodeURIComponent(pack)}/import?from=${from}&count=40`, { method: "POST", headers: { authorization: "Bearer " + TOKEN } });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { throw new Error(`The server answered ${res.status} with a page, not data (items ${from} onwards). Run the same command again; finished items say "unchanged".`); }
  for (const line of out.log ?? []) console.log("  " + line);
  for (const line of out.warnings ?? []) console.log("  note: " + line);
  if (!res.ok) throw new Error(out.error ?? "Import failed");
  from = out.next ?? null;
  if (from != null) console.log(`  … ${from} of ${out.total} done`);
}
console.log(`\nImported. Approve on the desk: ${BASE}/desk`);
