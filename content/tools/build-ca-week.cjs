// Builds a cinematic current-affairs week: voices, renders and packages every scene in motion/ca/<week>/.
// Usage: NODE_PATH=$(npm root -g) node build-ca-week.cjs <content-root> <yyyy-ww> [--skip-render]
// Voices: story.voice.provider "elevenlabs" (ELEVENLABS_API_KEY) or "sarvam" (Sarvam Bulbul, SARVAM_API_KEY) for Hindi; see motion-vo.cjs.
// Each scene folder (01-<id>/story.json, kind "ca-scene") gives, next to manifest.json:
//   <n>-<id>.mp4 (app cut, 720x1280, no captions), <n>-<id>.vtt, <n>-<id>.jpg (poster), <n>-<id>.social.mp4 (1080x1920, captions burned).
// Then week.mp4 (all app cuts joined) and manifest.json (upsc-pods/ca-week@1), the contract the Android player reads.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const [root, week] = process.argv.slice(2), skip = process.argv.includes("--skip-render");
if (!root || !week) { console.error("usage: build-ca-week.cjs <content-root> <yyyy-ww>"); process.exit(1); }
const dir = path.join(root, "motion", "ca", week), tools = __dirname;
const run = (script, ...a) => execFileSync(process.execPath, [path.join(tools, script), root, ...a], { stdio: "inherit" });
const scenes = fs.readdirSync(dir).filter(f => /^\d\d-/.test(f) && fs.existsSync(path.join(dir, f, "story.json"))).sort();
const episodes = [];
for (const f of scenes) {
  const rel = path.join("motion", "ca", week, f, "story.json"), story = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  run("motion-vo.cjs", rel);
  if (!skip) { run("render-motion.cjs", rel, path.join(dir, `${f}.mp4`), "--cut", "app"); run("render-motion.cjs", rel, path.join(dir, `${f}.social.mp4`), "--cut", "social"); }
  const durationSec = +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(dir, `${f}.mp4`)]).toString()).toFixed(2);
  episodes.push({ n: episodes.length + 1, id: story.id, title: story.title, durationSec, mp4: `${f}.mp4`, mp4Social: `${f}.social.mp4`, vtt: `${f}.vtt`, poster: `${f}.jpg`,
    syllabusNodes: story.syllabusNodes || [], gsPaper: story.gsPaper || [], sources: story.sources || [], quiz: story.quiz || [],
    free: !!story.free, review: story.review, tone: story.tone, card: story.card });
}
// Join the app cuts. They share codec settings, so a stream copy is enough.
const list = path.join(dir, "week.txt");
fs.writeFileSync(list, episodes.map(e => `file '${e.mp4}'`).join("\n"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", path.join(dir, "week.mp4")]);
fs.unlinkSync(list);
const first = JSON.parse(fs.readFileSync(path.join(dir, scenes[0], "story.json"), "utf8"));
const manifest = { schema: "upsc-pods/ca-week@1", week, lang: first.lang || "en", generatedAt: new Date().toISOString(),
  voice: { provider: first.voice.provider, voiceId: first.voice.voiceId }, weekMp4: "week.mp4",
  weekDurationSec: +episodes.reduce((s, e) => s + e.durationSec, 0).toFixed(2), episodes };
fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log("wrote", path.join(dir, "manifest.json"), episodes.length, "scenes,", manifest.weekDurationSec + "s");
