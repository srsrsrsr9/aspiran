// Voices each beat of a motion story and saves word timings for the renderer.
// Usage: node motion-vo.cjs <content-root> <story.json>
// Writes <story dir>/vo/<n>.mp3 and <story dir>/timing.json ({beats:[{file, seconds, words:[{w, t0, t1}]}]}).
// story.voice.provider picks the voice:
//   "elevenlabs" (default): needs ELEVENLABS_API_KEY (or a proxy that injects it); word timings come from the API.
//   "sarvam": Sarvam Bulbul, for Hindi (and other Indian languages). Needs SARVAM_API_KEY. voice: { provider: "sarvam",
//     voiceId: "<speaker, e.g. ritu>", model: "bulbul:v3", lang: "hi-IN", pace: 1 }. Bulbul gives no word timings, so
//     each beat's measured length is spread over its words by length: captions are close, not exact. Check the sync.
// Re-voices only beats whose text or voice changed.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync } = require("child_process");
const [root, storyRel] = process.argv.slice(2);
if (!root || !storyRel) { console.error("usage: motion-vo.cjs <content-root> <story.json>"); process.exit(1); }
const storyPath = path.join(root, storyRel), dir = path.dirname(storyPath);
const story = JSON.parse(fs.readFileSync(storyPath, "utf8")), V = story.voice;
const timingPath = path.join(dir, "timing.json");
const old = fs.existsSync(timingPath) ? JSON.parse(fs.readFileSync(timingPath, "utf8")) : { beats: [] };
fs.mkdirSync(path.join(dir, "vo"), { recursive: true });

/** Sarvam Bulbul: one beat as mp3, its length from ffprobe, words timed by their share of the characters. */
function sarvam(text, file) {
  if (!process.env.SARVAM_API_KEY) { console.error("Set SARVAM_API_KEY to voice with Sarvam"); process.exit(1); }
  const body = JSON.stringify({ text, language_code: V.lang || "hi-IN", speaker: V.voiceId, model: V.model || "bulbul:v3",
    pace: V.pace ?? 1, speech_sample_rate: 44100, output_audio_codec: "mp3" });
  const d = JSON.parse(execFileSync("curl", ["-s", "-X", "POST", "https://api.sarvam.ai/text-to-speech", "-H", "Content-Type: application/json",
    "-H", `api-subscription-key: ${process.env.SARVAM_API_KEY}`, "--data-binary", "@-"], { input: body, maxBuffer: 64 << 20 }));
  if (!d.audios?.[0]) return d;
  fs.writeFileSync(path.join(dir, file), Buffer.from(d.audios[0], "base64"));
  const seconds = +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(dir, file)]).toString());
  const ws = text.split(/\s+/).filter(Boolean), total = ws.reduce((s, w) => s + w.length, 0) || 1;
  let t = 0;
  return { words: ws.map((w) => { const t0 = t; t += seconds * w.length / total; return { w, t0: +t0.toFixed(3), t1: +t.toFixed(3) }; }) };
}

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
    if (V.provider === "sarvam") {
      const s = sarvam(b.say, file);
      if (!s.words) { console.error("beat", i + 1, JSON.stringify(s).slice(0, 300)); process.exit(1); }
      beats.push({ hash, file, seconds: s.words[s.words.length - 1].t1, words: s.words });
      console.log("voiced", file, beats[i].seconds + "s (Sarvam)");
      continue;
    }
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
