// Renders a motion story (upsc-pods/motion@1) to a 1080x1920 MP4 with voice-over, music bed, effects and captions.
// Usage: NODE_PATH=$(npm root -g) node render-motion.cjs <content-root> <story.json> [out.mp4] [--cut social|app] [--stills 1,5.5,12]
// --cut social (default): 1080x1920, captions burned in. --cut app: 720x1280, no captions, plus <out>.vtt and <out>.jpg poster.
// Run motion-vo.cjs first so timing.json and vo/*.mp3 exist. Needs Playwright (Chromium) and ffmpeg.
// Frames: motion/engine/player.html is served locally, MOTION.seek(t) is called per frame, JPEG screenshots are piped to ffmpeg.
// Sound: voice at full level, the bed looped under it and ducked while the voice speaks, effects at their listed gain, motif at the end.
const fs = require("fs"), path = require("path"), os = require("os"), http = require("http"), { spawn, execFileSync } = require("child_process");
const { chromium } = require("playwright");

const args = process.argv.slice(2), cut = args.includes("--cut") ? args.splice(args.indexOf("--cut"), 2)[1] : "social", stillsAt = args.includes("--stills") ? args.splice(args.indexOf("--stills"), 2)[1].split(",").map(Number) : null;
const [root, storyRel, outArg] = args;
if (!root || !storyRel) { console.error("usage: render-motion.cjs <content-root> <story.json> [out.mp4] [--stills t1,t2]"); process.exit(1); }
const absRoot = path.resolve(root), story = JSON.parse(fs.readFileSync(path.join(absRoot, storyRel), "utf8"));
const storyDir = path.dirname(path.join(absRoot, storyRel));
const out = outArg || path.join(storyDir, "out", `${story.id}.${story.lang || "en"}.mp4`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "motion-"));
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".m4a": "audio/mp4", ".mp3": "audio/mpeg" };

const server = http.createServer((req, res) => {
  const f = path.join(absRoot, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!f.startsWith(absRoot) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});

async function main() {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port, rel = path.relative(absRoot, path.join(absRoot, storyRel)).split(path.sep).join("/");
  const url = `http://127.0.0.1:${port}/motion/engine/player.html?render=1&root=/&story=/${rel}${cut === "app" ? "&captions=0" : ""}`;
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: cut === "app" ? 2 / 3 : 1 }); // app cut captured at 720x1280 directly
  page.on("pageerror", e => console.error("page error:", e.message));
  await page.goto(url); await page.waitForFunction(() => window.MOTION && window.MOTION.ready, null, { timeout: 30000 });
  const { total, fps, audio, cues, tone } = await page.evaluate(() => ({ total: MOTION.total, fps: MOTION.fps, audio: MOTION.audio, cues: MOTION.cues, tone: MOTION.tone }));
  const toneRules = JSON.parse(fs.readFileSync(path.join(absRoot, "tokens.json"), "utf8")).tone[tone] || {};
  const music = toneRules.music !== false, effects = tone !== "TRAGIC";

  if (stillsAt) {
    for (const t of stillsAt) { await page.evaluate(t => MOTION.seek(t), t); const f = path.join(path.dirname(out), `still-${t}.jpg`);
      fs.mkdirSync(path.dirname(f), { recursive: true }); await page.screenshot({ path: f, type: "jpeg", quality: 80 }); console.log(f); }
    await browser.close(); server.close(); return;
  }

  const frames = Math.ceil(total * fps), video = path.join(tmp, "video.mp4"), posterAt = Math.min(2.2, total / 2);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", cut === "app" ? "25" : "20", "-pix_fmt", "yuv420p", "-r", String(fps), video], { stdio: ["pipe", "inherit", "inherit"] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => MOTION.seek(t), f / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    if (cut === "app" && f === Math.round(posterAt * fps)) fs.writeFileSync(out.replace(/\.mp4$/, ".jpg"), buf);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`frame ${f}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await new Promise(r => ff.on("close", r));
  await browser.close(); server.close();

  // Audio mix. Inputs: video, bed, motif, each VO line, each effect.
  const sfxLib = JSON.parse(fs.readFileSync(path.join(absRoot, "audio/sfx/sfx.json"), "utf8")).effects;
  const inputs = [], filters = [];
  const add = (file, extra = []) => { inputs.push(...extra, "-i", file); return inputs.filter(x => x === "-i").length; }; // index of the new input (video is 0)
  const M = audio.music, ms = s => Math.round(s * 1000);
  const bed = add(path.join(absRoot, M.bed), ["-stream_loop", "-1"]);
  const motif = add(path.join(absRoot, M.end));
  const vo = audio.vo.map(v => add(path.join(storyDir, v.file)));
  const fx = (effects ? audio.sfx : []).map(s => ({ s, i: add(path.join(absRoot, "audio", sfxLib[s.id].m4a)) }));
  vo.forEach((i, k) => filters.push(`[${i}:a]aresample=48000,adelay=${ms(audio.vo[k].at)}:all=1,apad[v${k}]`));
  filters.push(`${vo.map((_, k) => `[v${k}]`).join("")}amix=inputs=${vo.length}:normalize=0,atrim=0:${total.toFixed(3)},asplit=2[vo][key]`);
  filters.push(`[${bed}:a]aresample=48000,atrim=0:${total.toFixed(3)},volume=${music ? M.gain : 0},afade=t=in:d=0.6,afade=t=out:st=${(total - 3.4).toFixed(2)}:d=2.4[bedraw]`);
  filters.push(M.duck ? `[bedraw][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=600[bed]` : `[bedraw]anull[bed]`);
  filters.push(`[${motif}:a]aresample=48000,volume=${music ? 0.7 : 0},adelay=${ms(total - 3.3)}:all=1,apad[motif]`);
  fx.forEach(({ s, i }, k) => filters.push(`[${i}:a]aresample=48000,volume=${(s.gain * (sfxLib[s.id].gain || 0.5) * 1.4).toFixed(3)},adelay=${ms(Math.max(0, s.at))}:all=1,apad[f${k}]`));
  filters.push(`[vo][bed][motif]${fx.map((_, k) => `[f${k}]`).join("")}amix=inputs=${3 + fx.length}:normalize=0,atrim=0:${total.toFixed(3)},alimiter=limit=0.89,loudnorm=I=-16:TP=-1.5:LRA=11[a]`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", video, ...inputs, "-filter_complex", filters.join(";"),
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-shortest", out], { stdio: "inherit" });
  if (cut === "app") {
    // WebVTT from the same caption chunks the social cut burns in.
    const ts = s => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, x = Math.floor(ms / 1000) % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`; };
    const vtt = ["WEBVTT", "", ...cues.flatMap((c, i) => [String(i + 1), `${ts(c.t0)} --> ${ts(Math.min(cues[i + 1]?.t0 ?? c.t1 + 0.6, c.t1 + 0.6))}`, c.text, ""])].join("\n");
    fs.writeFileSync(out.replace(/\.mp4$/, ".vtt"), vtt);
  }
  console.log("wrote", out, `${total.toFixed(1)}s`, `${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
}
main().catch(e => { console.error(e); process.exit(1); });
