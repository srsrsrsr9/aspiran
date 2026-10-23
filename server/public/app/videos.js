// "Akela Nahi" ("not alone"): a 45-second rap, one video per language, served as static files from /videos/.
// The lyrics are burned into each video in its own script, with an English line under them, so the words are
// always on screen. Nothing ever autoplays: the member presses play, and on mobile data (or Data Saver) not
// even the first frame is fetched until they do.
//
// NEEDS NATIVE-SPEAKER CHECK: the lyrics in every non-English video were written and voiced without a native
// speaker (ElevenLabs). Have one check each video before launch, then set `checked` to their name.
// The same list is in android/.../ui/RapVideo.kt; change both together.

/** code (as in welcome.js), BCP 47 tag, English name, file under /videos/, who checked the lyrics. */
export const RAP_VIDEOS = [
  { code: "en", tag: "en", name: "English", file: "akela-nahi-english-elevenlabs.mp4", checked: "n/a" },
  { code: "hi", tag: "hi", name: "Hindi", file: "akela-nahi-hindi-elevenlabs.mp4", checked: null },
  { code: "hinglish", tag: "hi-Latn", name: "Hinglish", file: "akela-nahi-hinglish-elevenlabs.mp4", checked: null },
  { code: "ta", tag: "ta", name: "Tamil", file: "akela-nahi-tamil-elevenlabs.mp4", checked: null },
  { code: "bn", tag: "bn", name: "Bengali", file: "akela-nahi-bengali-elevenlabs.mp4", checked: null },
  { code: "mr", tag: "mr", name: "Marathi", file: "akela-nahi-marathi-elevenlabs.mp4", checked: null },
  { code: "kn", tag: "kn", name: "Kannada", file: "akela-nahi-kannada-elevenlabs.mp4", checked: null },
  { code: "ml", tag: "ml", name: "Malayalam", file: "akela-nahi-malayalam-elevenlabs.mp4", checked: null },
  { code: "gu", tag: "gu", name: "Gujarati", file: "akela-nahi-gujarati-elevenlabs.mp4", checked: null },
  { code: "or", tag: "or", name: "Odia", file: "akela-nahi-odia-elevenlabs.mp4", checked: null },
  { code: "te", tag: "te", name: "Telugu", file: "akela-nahi-telugu-elevenlabs.mp4", checked: null },
];

const BY_POD_LANG = { english: "en", hindi: "hi", telugu: "te", marathi: "mr", tamil: "ta", bengali: "bn", kannada: "kn" };

/** The member's language as a video code: their pod language, else the first language they asked for, else English. */
export function rapLangFor(podLang, requested = []) {
  const want = [BY_POD_LANG[podLang], ...requested].filter((c) => c && c !== "en");
  return { want: want[0] ?? "en", have: want.find((c) => RAP_VIDEOS.some((v) => v.code === c)) ?? "en" };
}

/** Mobile data or Data Saver: don't fetch anything until the member presses play. */
export const onMeteredData = () => {
  const c = navigator.connection;
  return !!(c && (c.saveData || c.type === "cellular" || /^(slow-)?2g$/.test(c.effectiveType ?? "")));
};
