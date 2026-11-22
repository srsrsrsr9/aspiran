// Records the showreel's voice (public/app/showreel.js, LINES) as MP3s in public/app/demo-voice/showreel/<key>-<lang>.mp3,
// writes durations.json there (seconds per clip, used when the tour plays without sound) and transcribes every new clip
// back to check it says the line.
//
// Voices (--voice): sumeet (ElevenLabs "Sumeet", confident Indian narrator; default), bhargav (ElevenLabs, the first
// recording), jeetu or chotu (the Fish Audio voices designed for Aspiran). Samples: artefacts/showreel/voice-samples-2026-11-22/.
//
// Why it sounds natural (owner feedback, 22 Nov 2026: "robotic in places, awkward pauses"):
//  - lines are whole, flowing sentences (no "Short. Sharp." fragments, which made 0.6 to 0.9 s stops);
//  - ElevenLabs gets the lines before and after each clip (previous_text / next_text), so the tone carries across clips;
//  - calmer settings (more stability, less style) for a grown-up, steady delivery;
//  - every clip is trimmed: 0.05 s of silence kept at the start, 0.08 s at the end, and no pause inside longer than 0.35 s.
//
// Run from server/, with the key read inline from the Keychain (never in a file or chat):
//   ELEVENLABS_API_KEY=$(security find-generic-password -a aspiran -s elevenlabs-api-key -w) node scripts/showreel-voice.mjs [key] [--force] [--no-check]
// For a Fish Audio voice add the Fish key the same way:
//   FISH_AUDIO_API_KEY=$(security find-generic-password -a aspiran -s fish-audio-api-key -w) ELEVENLABS_API_KEY=$(...) node scripts/showreel-voice.mjs --voice=jeetu --force
// Existing clips are kept unless --force (add --resume-after=<ms since 1970> to keep clips re-made after that time). `key` (e.g. gst-2) records just that line. Needs ffmpeg and ffprobe.
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const { clips } = await import(new URL("../public/app/showreel.js", import.meta.url));
const EL_KEY = process.env.ELEVENLABS_API_KEY, FISH_KEY = process.env.FISH_AUDIO_API_KEY;
const VOICES = {
  sumeet: { el: "5x75eykrmdby4c1wlkAP" },
  bhargav: { el: "1Ldxg5RgFoi1bX6vz2rB" },
  jeetu: { fish: "edcdf002d20a4fc085bfc65842efdf9f", speed: 0.95 },
  chotu: { fish: "cae60a8fbea3456c9c941161ce4e9d80", speed: 0.9 },
};
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const voiceName = arg("voice") ?? "sumeet", voice = VOICES[voiceName];
const SETTINGS = { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: 1.0 };
const force = process.argv.includes("--force"), check = !process.argv.includes("--no-check");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const resumeAfter = Number(arg("resume-after") ?? 0);   // with --force: keep clips already re-made after this time (ms), to resume a run
const dir = new URL("../public/app/demo-voice/showreel/", import.meta.url);
mkdirSync(dir, { recursive: true });
if (!voice) { console.error("Unknown voice:", voiceName, "Use one of", Object.keys(VOICES).join(", ")); process.exit(1); }
if (voice.el && !EL_KEY) { console.error("ELEVENLABS_API_KEY is not set."); process.exit(1); }
if (voice.fish && !FISH_KEY) { console.error("FISH_AUDIO_API_KEY is not set."); process.exit(1); }
console.log("voice:", voiceName);

/** One try can hang on the voice service; each gets 90 seconds, and there are three tries. */
async function speak(...a) {
  for (let i = 1; ; i++) {
    try { return await speakOnce(...a); }
    catch (e) { if (i >= 3) throw e; console.error("retry", i, e.message); await new Promise((r) => setTimeout(r, 3000)); }
  }
}
async function speakOnce(text, lang, prev, next) {
  if (voice.el) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.el}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": EL_KEY, "content-type": "application/json", accept: "audio/mpeg" }, signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", language_code: lang, previous_text: prev, next_text: next, voice_settings: SETTINGS }),
    });
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
    return Buffer.from(await r.arrayBuffer());
  }
  const r = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { authorization: `Bearer ${FISH_KEY}`, "content-type": "application/json", model: "s2.1-pro" }, signal: AbortSignal.timeout(90000),
    body: JSON.stringify({ text, reference_id: voice.fish, format: "mp3", mp3_bitrate: 64, normalize: true, latency: "normal", prosody: { speed: voice.speed } }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Trims the silence at both ends and shortens any pause inside to 0.35 s. */
function tidy(file) {
  const tmp = file + ".tmp.mp3";
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", file, "-af",
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05:stop_periods=-1:stop_duration=0.45:stop_threshold=-38dB:stop_silence=0.35," +
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse",
    "-ar", "44100", "-b:a", "64k", tmp]);
  renameSync(tmp, file);
}

// Lines in the order they are heard, so each clip knows what comes before and after it.
const all = clips();
const made = [];
for (let n = 0; n < all.length; n++) {
  const [key, text] = all[n];
  if (only && only !== key) continue;
  const scene = key.split("-")[0];
  const near = (m) => (all[m] && all[m][0].split("-")[0] === scene ? all[m][1] : null);
  for (const lang of ["en", "hi"]) {
    const path = fileURLToPath(new URL(`${key}-${lang}.mp3`, dir));
    if (existsSync(path) && (!force || statSync(path).mtimeMs > resumeAfter && resumeAfter)) { console.log("kept", key, lang); continue; }
    try {
      const buf = await speak(text[lang], lang, near(n - 1)?.[lang], near(n + 1)?.[lang]);
      writeFileSync(path, buf);
      tidy(path);
      made.push([key, lang, text[lang], readFileSync(path)]);
      console.log("made", key, lang);
    } catch (e) {
      console.error("failed", key, lang, e.message); process.exitCode = 1;
      if (existsSync(path + ".tmp.mp3")) unlinkSync(path + ".tmp.mp3");
    }
  }
}

// Durations of every clip in the folder.
const dpath = fileURLToPath(new URL("durations.json", dir));
const durations = existsSync(dpath) ? JSON.parse(readFileSync(dpath, "utf8")) : {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mp3"))) {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fileURLToPath(new URL(f, dir))]).toString().trim();
    durations[f.replace(/\.mp3$/, "")] = Math.round(parseFloat(out) * 100) / 100;
  } catch { console.error("no duration for", f); }
}
writeFileSync(dpath, JSON.stringify(Object.fromEntries(Object.entries(durations).sort()), null, 1) + "\n");
console.log("durations:", Object.keys(durations).length);

// Read the new clips back and show the transcript next to the line, so a slip is easy to spot.
if (check && EL_KEY) for (const [key, lang, text, buf] of made) {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1"); fd.append("language_code", lang === "hi" ? "hin" : "eng");
  fd.append("file", new Blob([buf], { type: "audio/mpeg" }), `${key}.mp3`);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": EL_KEY }, body: fd });
  const heard = r.ok ? (await r.json()).text : `(check failed: ${r.status})`;
  console.log(`\n${key}-${lang}\n  line:  ${text}\n  heard: ${heard}`);
}
