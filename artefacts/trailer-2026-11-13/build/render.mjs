// Renders scenes/index.html frame by frame with headless Chrome, piping JPEG frames to ffmpeg (picture only).
// Usage: node build/render.mjs <width> <height> <out.mp4> [--stills t1,t2,...] [--from s --to s] [--workers 4]
import { launch } from "./cdp.mjs"; import { spawn } from "child_process"; import fs from "fs"; import path from "path";
const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a.splice(i, 2)[1] : null; };
const stills = opt("--stills"), from = +(opt("--from") || 0), toArg = opt("--to"), workers = +(opt("--workers") || 4);
const [w, h, out] = [+a[0], +a[1], a[2]];
const url = "file://" + path.resolve(new URL("../scenes/index.html", import.meta.url).pathname) + "?render=1";
async function open() { const p = await launch({ width: w, height: h }); await p.goto(url); for (let i = 0; i < 200 && !(await p.eval("window.FILM&&FILM.ready")); i++) await new Promise(r => setTimeout(r, 50)); return p; }
if (stills) {
  const p = await open(); fs.mkdirSync(out, { recursive: true });
  for (const t of stills.split(",").map(Number)) { await p.eval(`FILM.seek(${t})`); fs.writeFileSync(path.join(out, `still-${String(t.toFixed(2)).padStart(6, "0")}.jpg`), await p.shot("jpeg", 85)); }
  await p.close(); process.exit(0);
}
const p0 = await open(); const total = await p0.eval("FILM.total"), fps = await p0.eval("FILM.fps"); await p0.close();
const f0 = Math.round(from * fps), f1 = Math.ceil((toArg ? +toArg : total) * fps), n = f1 - f0;
const tmp = out + ".frames"; fs.mkdirSync(tmp, { recursive: true });
// workers render interleaved chunks to JPEG files; then ffmpeg encodes the sequence
let next = f0; const t0 = Date.now();
await Promise.all(Array.from({ length: workers }, async () => { const p = await open();
  while (next < f1) { const f = next++; const file = path.join(tmp, `f${String(f).padStart(5, "0")}.jpg`); if (fs.existsSync(file)) continue;
    await p.eval(`FILM.seek(${f / fps})`); fs.writeFileSync(file, await p.shot("jpeg", 93));
    if (f % 150 === 0) console.log(`frame ${f}/${f1} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  await p.close(); }));
await new Promise((res, rej) => spawn("ffmpeg", ["-y", "-v", "error", "-framerate", String(fps), "-start_number", String(f0), "-i", path.join(tmp, "f%05d.jpg"), "-frames:v", String(n),
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: "inherit" }).on("close", c => c ? rej(c) : res()));
console.log("wrote", out, n, "frames in", ((Date.now() - t0) / 1000).toFixed(0) + "s");
