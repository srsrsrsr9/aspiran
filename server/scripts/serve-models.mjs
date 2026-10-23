// Dev only: serves Chotu's on-device model files from server/models/ with resumable Range downloads.
// The Worker's /models/files/<name> proxies here when MODEL_FILES_URL is set in .dev.vars.
// Deployed, the same files live in R2 under models/ instead. Usage: `npm run models` (port 8788).
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = process.env.MODEL_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "..", "models");
const PORT = Number(process.env.PORT ?? 8788);

createServer((req, res) => {
  const name = basename(decodeURIComponent(new URL(req.url, "http://x").pathname));
  let size;
  try { size = statSync(join(DIR, name)).size; } catch { res.writeHead(404).end("not found"); return; }
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  let start = 0, end = size - 1, status = 200;
  if (m && (m[1] || m[2])) {
    start = m[1] ? Number(m[1]) : Math.max(size - Number(m[2]), 0);
    end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) { res.writeHead(416, { "content-range": `bytes */${size}` }).end(); return; }
    status = 206;
  }
  res.writeHead(status, {
    "content-type": "application/octet-stream", "accept-ranges": "bytes", "content-length": end - start + 1,
    ...(status === 206 ? { "content-range": `bytes ${start}-${end}/${size}` } : {}),
  });
  if (req.method === "HEAD") { res.end(); return; }
  createReadStream(join(DIR, name), { start, end }).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`Model files from ${DIR} on http://127.0.0.1:${PORT}`));
