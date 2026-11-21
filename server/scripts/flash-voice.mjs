// Records Chotu's flashlight lines (public/app/flashlight.js, LINES) as small MP3s in public/app/demo-voice/<chapter>/.
// Uses Chotu's designed Fish Audio voice (src/voice.ts, VOICES.chotu) with the same model and settings.
// Run from server/:  FISH_AUDIO_API_KEY=… node scripts/flash-voice.mjs [chapter] [--force]
// The key is read from the environment only; never put it in a file. Existing files are kept unless --force.
import { mkdirSync, existsSync, writeFileSync } from "node:fs";

// flashlight.js imports kulhad.js, which only touches `document` when called; importing it in node is safe.
const { LINES } = await import(new URL("../public/app/flashlight.js", import.meta.url));
const KEY = process.env.FISH_AUDIO_API_KEY;
if (!KEY) { console.error("FISH_AUDIO_API_KEY is not set."); process.exit(1); }
const CHOTU = "cae60a8fbea3456c9c941161ce4e9d80", MODEL = "s2.1-pro";
const force = process.argv.includes("--force");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));

for (const [chapter, stops] of Object.entries(LINES)) {
  if (only && only !== chapter) continue;
  const dir = new URL(`../public/app/demo-voice/${chapter}/`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const [n, s] of stops.entries()) for (const lang of ["en", "hi"]) {
    const file = new URL(`${lang}-${n + 1}.mp3`, dir);
    if (existsSync(file) && !force) { console.log("kept", chapter, lang, n + 1); continue; }
    const text = s[lang].speak ?? s[lang].text;
    const res = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json", model: MODEL },
      body: JSON.stringify({ text, reference_id: CHOTU, format: "mp3", mp3_bitrate: 64, normalize: true, latency: "normal", prosody: { speed: 1 } }),
    });
    if (!res.ok) { console.error("failed", chapter, lang, n + 1, res.status); process.exitCode = 1; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    console.log("made", chapter, lang, n + 1, buf.length, "bytes");
  }
}
