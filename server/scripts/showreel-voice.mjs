// Records the showreel's voice (public/app/showreel.js, LINES) as MP3s in public/app/demo-voice/showreel/<key>-<lang>.mp3,
// writes durations.json there (seconds per clip, used when the tour plays without sound) and transcribes every new clip
// back to check it says the line.
// Voice: "Bhargav" from the ElevenLabs voice library (deep, warm, confident Indian male; chosen 21 Nov 2026 over
// Aaditya and Vinay: deepest and clearest in both languages). Auditions are in artefacts/showreel-voice-auditions/.
// Run from server/, with the key read inline from the Keychain (never in a file or chat):
//   ELEVENLABS_API_KEY=$(security find-generic-password -a aspiran -s elevenlabs-api-key -w) node scripts/showreel-voice.mjs [key] [--force] [--no-check]
// Existing clips are kept unless --force. `key` (e.g. gst-2) records just that line. Needs ffprobe for durations.
import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const { clips } = await import(new URL("../public/app/showreel.js", import.meta.url));
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = "1Ldxg5RgFoi1bX6vz2rB", MODEL = "eleven_multilingual_v2";
const SETTINGS = { stability: 0.4, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
const force = process.argv.includes("--force"), check = !process.argv.includes("--no-check");
const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
const dir = new URL("../public/app/demo-voice/showreel/", import.meta.url);
mkdirSync(dir, { recursive: true });
if (!KEY) { console.error("ELEVENLABS_API_KEY is not set."); process.exit(1); }

const made = [];
for (const [key, text] of clips()) {
  if (only && only !== key) continue;
  for (const lang of ["en", "hi"]) {
    const file = new URL(`${key}-${lang}.mp3`, dir);
    if (existsSync(file) && !force) { console.log("kept", key, lang); continue; }
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "xi-api-key": KEY, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text: text[lang], model_id: MODEL, language_code: lang, voice_settings: SETTINGS }),
    });
    if (!res.ok) { console.error("failed", key, lang, res.status, (await res.text()).slice(0, 200)); process.exitCode = 1; continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(file, buf);
    made.push([key, lang, text[lang], buf]);
    console.log("made", key, lang, buf.length, "bytes");
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
if (check) for (const [key, lang, text, buf] of made) {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1"); fd.append("language_code", lang === "hi" ? "hin" : "eng");
  fd.append("file", new Blob([buf], { type: "audio/mpeg" }), `${key}.mp3`);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": KEY }, body: fd });
  const heard = r.ok ? (await r.json()).text : `(check failed: ${r.status})`;
  console.log(`\n${key}-${lang}\n  line:  ${text}\n  heard: ${heard}`);
}
