// The welcome: greetings in eleven languages rise from Chotu's kulhad like chai steam, one after another.
// The app itself stays in English (with Hindi where it already exists); this only says hello.
//
// NEEDS NATIVE-SPEAKER CHECK: every non-English greeting and romanisation below was written without a native
// speaker. Have one check each line before launch, then set `checked` to their name. Nothing here is verified yet.
// The same list is in android/.../ui/Welcome.kt; change both together.

/** code, BCP 47 tag for the lang attribute, English name, the greeting, how it's said, and who checked it. */
export const GREETINGS = [
  { code: "en", tag: "en", name: "English", word: "Welcome", say: null, checked: "n/a" },
  { code: "hi", tag: "hi", name: "Hindi", word: "स्वागत है", say: "Swagat hai", checked: null },
  { code: "ta", tag: "ta", name: "Tamil", word: "வணக்கம்", say: "Vanakkam", checked: null },
  { code: "bn", tag: "bn", name: "Bengali", word: "স্বাগতম", say: "Swagatam", checked: null },
  { code: "te", tag: "te", name: "Telugu", word: "స్వాగతం", say: "Swagatam", checked: null },
  { code: "hinglish", tag: "hi-Latn", name: "Hinglish", word: "Aao, baitho!", say: "Come, pull up a chair", checked: null },
  { code: "mr", tag: "mr", name: "Marathi", word: "स्वागत आहे", say: "Swagat aahe", checked: null },
  { code: "ml", tag: "ml", name: "Malayalam", word: "സ്വാഗതം", say: "Swagatham", checked: null },
  { code: "gu", tag: "gu", name: "Gujarati", word: "સ્વાગત છે", say: "Swagat chhe", checked: null },
  { code: "kn", tag: "kn", name: "Kannada", word: "ಸುಸ್ವಾಗತ", say: "Suswagata", checked: null },
  { code: "or", tag: "or", name: "Odia", word: "ସ୍ୱାଗତ", say: "Swagata", checked: null },
];

/** Languages people can ask for (same as the server's REQUESTABLE; used when /config hasn't loaded). Native names need a check too. */
export const REQUESTABLE = [
  { code: "hinglish", name: "Hinglish", native: "Hinglish" },
  { code: "te", name: "Telugu", native: "తెలుగు" }, { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "bn", name: "Bengali", native: "বাংলা" }, { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" }, { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" }, { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
];

// Noto first for each script so nothing shows as boxes, then what Windows (Nirmala UI) and Apple ship.
const NOTO = { hi: "Devanagari", mr: "Devanagari", te: "Telugu", ta: "Tamil", bn: "Bengali", kn: "Kannada", ml: "Malayalam", gu: "Gujarati", or: "Oriya" };
export const fontFor = (code) => NOTO[code]
  ? `"Noto Sans ${NOTO[code]}", "Nirmala UI", "${NOTO[code]} Sangam MN", "Kohinoor ${NOTO[code]}", system-ui, sans-serif`
  : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

/**
 * Loads the Noto families for these scripts once, from Google Fonts. Each family is split by unicode-range there,
 * so a browser fetches only the script subsets it draws. Only the welcome and the language request use it.
 * To keep every request on your own domain, self-host these woff2 files and point this link at them instead.
 */
export function loadNoto() {
  if (document.getElementById("noto-indic")) return;
  const fams = [...new Set(Object.values(NOTO))].map((f) => "family=Noto+Sans+" + f + ":wght@500;700").join("&");
  const link = Object.assign(document.createElement("link"), { id: "noto-indic", rel: "stylesheet", href: `https://fonts.googleapis.com/css2?${fams}&display=swap` });
  document.head.append(link);
}

/**
 * The steam scene. `kulhad` draws Chotu. Words rise in a 22-second loop, one every 2 seconds, with pure CSS,
 * so re-renders never leave timers behind. With reduced motion the greetings sit still around the cup instead.
 * The moving words are hidden from screen readers; a plain list carries the same greetings with their languages.
 */
export function welcomeScene(kulhad) {
  loadNoto();
  const el = (tag, cls, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const scene = el("div", "welcome-scene");
  const steam = el("div", "welcome-steam", { "aria-hidden": "true" });
  // Steam drifts a little left and right, never in a straight column.
  const drift = [-36, 28, -12, 40, -44, 14, -24, 34, -6, 22, -30];
  GREETINGS.forEach((g, i) => {
    const w = el("span", "welcome-word", { lang: g.tag });
    w.style.setProperty("--i", i);
    w.style.setProperty("--x", drift[i] + "px");
    const big = el("span", "ww-big"); big.textContent = g.word; big.style.fontFamily = fontFor(g.code);
    const small = el("span", "ww-small"); small.textContent = g.say ? `${g.name} · ${g.say}` : g.name;
    w.append(big, small);
    steam.append(w);
  });
  const cup = el("div", "welcome-cup"); cup.append(kulhad("warm", 112));
  const list = el("ul", "sr-only");
  list.setAttribute("aria-label", "Welcome, in eleven languages");
  for (const g of GREETINGS) { const li = el("li", "", { lang: g.tag }); li.textContent = `${g.word} (${g.name})`; list.append(li); }
  scene.append(steam, cup, list);
  return scene;
}

/** One greeting a day for the Adda header, cycling through all eleven. */
export function greetingOfTheDay(d = new Date()) {
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86400_000);
  return GREETINGS[day % GREETINGS.length];
}
