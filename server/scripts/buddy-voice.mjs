// Records Chotu's demo lines (public/app/buddy.js, LINES) as small MP3s in public/app/demo-voice/chotu/<key>-<lang>.mp3.
// Uses Chotu's designed Fish Audio voice (src/voice.ts, VOICES.chotu), made younger and a touch slower for the demo:
// spoken at SPEED, then raised PITCH semitones (tempo kept) and trimmed of silence at both ends with ffmpeg.
// These settings are Chotu's own; the Showreel narrator has his own script (showreel-voice.mjs).
// Run from server/:  FISH_AUDIO_API_KEY=… node scripts/buddy-voice.mjs [key] [--force]   (needs ffmpeg)
// The key is read from the environment only; never put it in a file. Existing files are kept unless --force.
import { mkdirSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// buddy.js imports kulhad.js, which only touches `document` when called; importing it in node is safe.
const { LINES } = await import(new URL("../public/app/buddy.js", import.meta.url));
const KEY = process.env.FISH_AUDIO_API_KEY;
if (!KEY) { console.error("FISH_AUDIO_API_KEY is not set."); process.exit(1); }
const CHOTU = "cae60a8fbea3456c9c941161ce4e9d80", MODEL = "s2.1-pro";
const SPEED = 0.9, PITCH = 2; // sample A, owner pick (22 Nov 2026); PITCH in semitones
const F = 2 ** (PITCH / 12);
const TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05";
const force = process.argv.includes("--force");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const dir = new URL("../public/app/demo-voice/chotu/", import.meta.url);
mkdirSync(dir, { recursive: true });

for (const [key, line] of Object.entries(LINES)) {
  if (only && only !== key) continue;
  for (const lang of ["en", "hi"]) {
    const file = new URL(`${key}-${lang}.mp3`, dir);
    if (existsSync(file) && !force) { console.log("kept", key, lang); continue; }
    const text = line[lang].speak ?? line[lang].text;
    let res = null;
    for (let tries = 0; tries < 3 && !res?.ok; tries++) {
      try {
        res = await fetch("https://api.fish.audio/v1/tts", {
          method: "POST", signal: AbortSignal.timeout(60000),
          headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", model: MODEL },
          body: JSON.stringify({ text, reference_id: CHOTU, format: "wav", normalize: true, latency: "normal", prosody: { speed: SPEED } }),
        });
      } catch (e) { console.error("retry", key, lang, e.name); res = null; }
    }
    if (!res) { console.error("failed", key, lang, "timeout"); process.exitCode = 1; continue; }
    if (!res.ok) { console.error("failed", key, lang, res.status); process.exitCode = 1; continue; }
    const wav = fileURLToPath(file) + ".wav";
    writeFileSync(wav, Buffer.from(await res.arrayBuffer()));
    const sr = execFileSync("ffprobe", ["-v", "0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", wav]).toString().trim();
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-af", `asetrate=${sr}*${F},aresample=${sr},atempo=${1 / F},${TRIM},areverse,${TRIM},areverse`, "-b:a", "64k", fileURLToPath(file)]);
    unlinkSync(wav);
    console.log("made", key, lang);
  }
}
