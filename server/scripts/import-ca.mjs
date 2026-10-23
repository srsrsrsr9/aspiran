// Uploads one week of cinematic current affairs (upsc-pods/ca-week@1) to the server.
//   npm run import:ca -- content/motion/ca/2026-41
// Needs EDITOR_TOKEN in the environment (the value you typed into .dev.vars). BASE defaults to the local server.
// The social cuts (mp4Social) stay behind: the app doesn't use them. Scenes go out to phones only once their
// review.status is "approved" in the manifest; re-upload the manifest after an editor signs a scene off.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!dir) throw new Error("Usage: npm run import:ca -- <week folder>");
if (!TOKEN) throw new Error("Set EDITOR_TOKEN to the value in your .dev.vars");

const manifestBytes = readFileSync(join(dir, "manifest.json"));
const week = JSON.parse(manifestBytes.toString("utf8")).week;

async function put(path, bytes) {
  const res = await fetch(`${BASE}/desk/api/ca/${encodeURIComponent(week)}/files/${path}`, {
    method: "PUT",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "application/octet-stream" },
    body: bytes,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${(data.errors ?? [data.error ?? res.status]).join("\n  ")}`);
  return data;
}

const { files } = await put("manifest.json", manifestBytes);
let sent = 0;
const missing = [];
for (const f of files) {
  const p = join(dir, f);
  if (!existsSync(p)) { missing.push(f); continue; }
  await put(f, readFileSync(p));
  sent++;
}
console.log(`Week ${week}: uploaded ${sent} of ${files.length} files`);
for (const f of missing) console.log(`  missing ${f} (not in the folder)`);
if (missing.length) process.exitCode = 1;
