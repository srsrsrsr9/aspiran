// Voices each beat of a motion story with ElevenLabs and saves word timings for the renderer.
// Usage: node motion-vo.cjs <content-root> <story.json>
// Writes <story dir>/vo/<n>.mp3 and <story dir>/timing.json ({beats:[{file, seconds, words:[{w, t0, t1}]}]}).
// Needs ELEVENLABS_API_KEY (or a proxy that injects it). Re-voices only beats whose text or voice changed.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync } = require("child_process");
const [root, storyRel] = process.argv.slice(2);
if (!root || !storyRel) { console.error("usage: motion-vo.cjs <content-root> <story.json>"); process.exit(1); }
const storyPath = path.join(root, storyRel), dir = path.dirname(storyPath);
const story = JSON.parse(fs.readFileSync(storyPath, "utf8")), V = story.voice;
const timingPath = path.join(dir, "timing.json");
const old = fs.existsSync(timingPath) ? JSON.parse(fs.readFileSync(timingPath, "utf8")) : { beats: [] };
fs.mkdirSync(path.join(dir, "vo"), { recursive: true });

function words(text, a) {
  // Group characters into space-separated words with their start and end times.
  const out = []; let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) out.push(cur), cur = null; return; }
    if (!cur) cur = { w: "", t0: a.character_start_times_seconds[i] };
    cur.w += ch; cur.t1 = a.character_end_times_seconds[i];
  });
  if (cur) out.push(cur);
  return out;
}

(() => {
  const beats = [];
  for (const [i, b] of story.beats.entries()) {
    const hash = crypto.createHash("sha1").update(JSON.stringify([b.say, V])).digest("hex").slice(0, 12);
    const file = `vo/${String(i + 1).padStart(2, "0")}.mp3`;
    const prev = old.beats[i];
    if (prev && prev.hash === hash && fs.existsSync(path.join(dir, file))) { beats.push(prev); continue; }
    // curl, not fetch, so the request goes through HTTPS_PROXY when one is set.
    const body = JSON.stringify({ text: b.say, model_id: V.model, voice_settings: V.settings,
      previous_text: story.beats[i - 1]?.say, next_text: story.beats[i + 1]?.say });
    const args = ["-s", "-X", "POST", `https://api.elevenlabs.io/v1/text-to-speech/${V.voiceId}/with-timestamps`,
      "-H", "Content-Type: application/json", "--data-binary", "@-"];
    if (process.env.ELEVENLABS_API_KEY) args.push("-H", `xi-api-key: ${process.env.ELEVENLABS_API_KEY}`);
    const d = JSON.parse(execFileSync("curl", args, { input: body, maxBuffer: 64 << 20 }));
    if (!d.audio_base64) { console.error("beat", i + 1, JSON.stringify(d).slice(0, 300)); process.exit(1); }
    fs.writeFileSync(path.join(dir, file), Buffer.from(d.audio_base64, "base64"));
    const w = words(b.say, d.alignment);
    beats.push({ hash, file, seconds: +w[w.length - 1].t1.toFixed(3), words: w });
    console.log("voiced", file, beats[i].seconds + "s");
  }
  fs.writeFileSync(timingPath, JSON.stringify({ voice: V.voiceId, beats }, null, 1));
})();
