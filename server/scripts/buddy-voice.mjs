// Records Chotu's demo lines (public/app/buddy.js, LINES) as small MP3s in public/app/demo-voice/chotu/<key>-<lang>.mp3.
// Uses Chotu's designed Fish Audio voice (src/voice.ts, VOICES.chotu) with the same model and settings.
// Run from server/:  FISH_AUDIO_API_KEY=… node scripts/buddy-voice.mjs [key] [--force]
// The key is read from the environment only; never put it in a file. Existing files are kept unless --force.
import { mkdirSync, existsSync, writeFileSync } from "node:fs";

// buddy.js imports kulhad.js, which only touches `document` when called; importing it in node is safe.
const { LINES } = await import(new URL("../public/app/buddy.js", import.meta.url));
const KEY = process.env.FISH_AUDIO_API_KEY;
if (!KEY) { console.error("FISH_AUDIO_API_KEY is not set."); process.exit(1); }
const CHOTU = "cae60a8fbea3456c9c941161ce4e9d80", MODEL = "s2.1-pro";
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
    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", model: MODEL },
      body: JSON.stringify({ text, reference_id: CHOTU, format: "mp3", mp3_bitrate: 64, normalize: true, latency: "normal", prosody: { speed: 1 } }),
    });
    if (!res.ok) { console.error("failed", key, lang, res.status); process.exitCode = 1; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    console.log("made", key, lang, buf.length, "bytes");
  }
}
