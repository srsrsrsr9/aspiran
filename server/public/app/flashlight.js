// Chotu's flashlight (prototype, 21 Nov 2026; on the GST vote chapter only).
// The owner's review: the side comments compete with the content. So while the visitor works a chapter, Chotu says
// nothing. Once the chapter is done, the screen dims except one part; Chotu sits beside it with one short line (said
// aloud too), then moves the light to the next part. 2 to 4 stops, then one pitch line on the chapter's next button.
// - One thing at a time. Next, Skip, or tap anywhere to go on. Esc skips. Reduced motion: the light jumps, no sweep.
// - Voice: on by default (the owner's decision, 21 Nov 2026, an exception to "sound off by default" for the demo's
//   guide only). Browsers block sound until a click, so the visitor's first click in the demo unlocks it. The speaker
//   button turns it off and that is remembered. The voice player says nothing about the voice.
// - Chotu never responds to feelings, ranks or results; the lines describe the screen, never the visitor's score.
// Recorded lines: public/app/demo-voice/<chapter>/<lang>-<n>.mp3, made by scripts/flash-voice.mjs from LINES below.

import { kulhad } from "./kulhad.js";

/** The lines, by chapter id. `sel` is what gets lit; `speak` (if any) is how the line is read aloud. */
export const LINES = {
  "sim-gst": [
    { sel: ".sc-gst-map",
      en: { text: "This is the GST Council. 31 seats for the states, the Centre at the front. You just ran the vote.",
        speak: "This is the GST Council. Thirty-one seats for the states, the Centre at the front. You just ran the vote." },
      hi: { text: "यह GST परिषद है। 31 सीटें राज्यों की, और सामने केंद्र। वोटिंग अभी आपने चलाई।",
        speak: "यह जी एस टी परिषद है। इकतीस सीटें राज्यों की, और सामने केंद्र। वोटिंग अभी आपने चलाई।" } },
    { sel: ".sc-gst .sc-meter, .sc-gst .sc-meter-l",
      en: { text: "This bar is the whole rule. The Centre counts for one-third, all the states together two-thirds. Under 75% nothing passes.",
        speak: "This bar is the whole rule. The Centre counts for one third, all the states together two thirds. Under seventy-five per cent, nothing passes." },
      hi: { text: "पूरा नियम इसी पट्टी में है। केंद्र का मत एक-तिहाई, सारे राज्य मिलकर दो-तिहाई। 75% से कम पर कुछ पारित नहीं होता।",
        speak: "पूरा नियम इसी पट्टी में है। केंद्र का मत एक-तिहाई, सारे राज्य मिलकर दो-तिहाई। पचहत्तर प्रतिशत से कम पर कुछ पारित नहीं होता।" } },
    { sel: ".sc-finds",
      en: { text: "These three you found yourself. The Centre can block alone. The states need twelve of them to do the same." },
      hi: { text: "ये तीनों बातें आपने ख़ुद खोजीं। केंद्र अकेले रोक सकता है। राज्यों को ऐसा करने के लिए बारह का साथ चाहिए।" } },
    { sel: ".sc-gst .sc-why.ok",
      en: { text: "So neither side passes anything alone. You didn't memorise that. You voted your way to it." },
      hi: { text: "यानी कोई भी पक्ष अकेले कुछ पारित नहीं कर सकता। आपने यह रटा नहीं; वोट करके खोजा।" } },
    { sel: ".sc-bar .sc-go", pitch: true,
      en: { text: "The app has 60 interactives like this one. Next, we plan a real Mains answer.",
        speak: "The app has sixty interactives like this one. Next, we plan a real Mains answer." },
      hi: { text: "App में ऐसे 60 interactives हैं। आगे, एक असली Mains उत्तर का ढाँचा।",
        speak: "ऐप में ऐसे साठ इंटरऐक्टिव हैं। आगे, एक असली मेन्स उत्तर का ढाँचा।" } },
  ],
};

const WORDS = {
  en: { next: "Next", skip: "Skip", go: "Go", close: "Stay here", who: "Chotu", step: (i, n) => `${i} of ${n}`, again: "Chotu's tour of this screen",
    soundOff: "Turn sound off", soundOn: "Turn sound on" },
  hi: { next: "आगे", skip: "छोड़िए", go: "चलिए", close: "यहीं रुकिए", who: "छोटू", step: (i, n) => `${n} में से ${i}`, again: "इस स्क्रीन पर छोटू का टूर",
    soundOff: "आवाज़ बंद कीजिए", soundOn: "आवाज़ चालू कीजिए" },
};

let X = null;
const w = (k, ...a) => { const v = (WORDS[X.lang()] ?? WORDS.en)[k]; return typeof v === "function" ? v(...a) : v; };
const RM = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

// --- Voice ------------------------------------------------------------------------------------------------------------
// One shared <audio>. iOS lets an element play later only if it was started inside a click once, so the first click
// anywhere in the demo plays a moment of silence on it ("unlocks" it). Nothing plays before that click.

const SILENCE = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAlgAenp6enp6enp6enp6enp6enp6enp6enp6pqampqampqampqampqampqampqampqamptPT09PT09PT09PT09PT09PT09PT09PT09P/////////////////////////////////AAAAAExhdmM2Mi4yOAAAAAAAAAAAAAAAACQCcQAAAAAAAAJY+/pGGwAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
let audio = null, unlocked = false;
export const voiceOn = () => X.store.get("try:voice", true) !== false;
function unlock() {
  if (unlocked || !voiceOn()) return;
  unlocked = true;
  try { audio ??= new Audio(); audio.src = SILENCE; const p = audio.play(); p?.catch?.(() => { unlocked = false; }); } catch { unlocked = false; }
}
let listening = false;
/** try.js/showcase.js call this whenever the demo draws: the first click in the demo turns the voice on. */
export function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("keydown", unlock, { capture: true });
}
function speak(chapter, n) {
  stopVoice();
  if (!voiceOn()) return;
  try {
    audio ??= new Audio();
    audio.src = `/app/demo-voice/${chapter}/${X.lang() === "hi" ? "hi" : "en"}-${n + 1}.mp3`;
    audio.play()?.catch?.(() => {}); // blocked (no click yet) or missing: the text is still there
  } catch {}
}
export function stopVoice() { try { if (audio && !audio.paused) audio.pause(); } catch {} }

// --- The flashlight ---------------------------------------------------------------------------------------------------

let open = null;
export const isOpen = () => !!open;
export const seen = (chapter) => !!X.getA("sc:flash:" + chapter);

/** Starts the tour of one chapter's screen. `onGo` runs the chapter's next button (the last stop). */
export function start(ctx, chapter, { onGo, onSound } = {}) {
  X = ctx;
  close();
  const stops = (LINES[chapter] ?? []).map((s, n) => ({ ...s, n })).filter((s) => document.querySelector(s.sel));
  if (!stops.length) return;
  X.setA("sc:flash:" + chapter, true);
  const hole = X.h("div.fl-hole");
  const who = X.h("div.fl-who", X.h("span.fl-av", kulhad("warm", 44)), X.h("b", w("who")));
  const text = X.h("p.fl-text", { "aria-live": "polite" });
  const count = X.h("span.fl-count");
  const snd = X.h("button.fl-snd", { type: "button" });
  const paintSnd = () => { const on = voiceOn(); snd.setAttribute("aria-pressed", String(on)); snd.setAttribute("aria-label", on ? w("soundOff") : w("soundOn")); snd.title = snd.getAttribute("aria-label"); snd.innerHTML = speakerSvg(on); };
  paintSnd();
  const skip = X.h("button.fl-skip", { type: "button" }, w("skip"));
  const next = X.h("button.fl-next", { type: "button" });
  const card = X.h("div.fl-card", { role: "dialog", "aria-modal": "true", "aria-label": w("who"), lang: X.lang() }, who, text, X.h("div.fl-ctl", count, snd, X.h("span.fl-sp"), skip, next));
  const veil = X.h("div.fl-veil" + (RM() ? ".rm" : ""), hole, card);
  document.body.append(veil);
  document.documentElement.classList.add("fl-on");
  let at = -1, raf = 0;

  const place = () => {
    const s = stops[at]; if (!s) return;
    const r = rectOf(s.sel); if (!r) return;
    const pad = 10, vw = innerWidth, vh = innerHeight;
    const x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), wd = Math.min(vw - 8, r.width + pad * 2), ht = Math.min(vh - 8, r.height + pad * 2);
    Object.assign(hole.style, { left: x + "px", top: y + "px", width: wd + "px", height: ht + "px", borderRadius: s.pitch ? "999px" : "18px" });
    // The card never covers the lit part: below it if it fits, else above, else beside it (laptops), else docked at
    // the bottom of the screen with the lit part kept above it.
    const cw = Math.min(380, vw - 32), gap = 14;
    card.style.width = cw + "px";
    const ch = card.offsetHeight || 170;
    const clampX = (v) => Math.min(Math.max(16, v), vw - cw - 16), clampY = (v) => Math.min(Math.max(12, v), vh - ch - 12);
    let top, left = clampX(x + wd / 2 - cw / 2);
    if (y + ht + gap + ch <= vh - 12) top = y + ht + gap;
    else if (y - gap - ch >= 12) top = y - gap - ch;
    else if (x + wd + gap + cw <= vw - 16) { left = x + wd + gap; top = clampY(y + ht / 2 - ch / 2); }
    else if (x - gap - cw >= 16) { left = x - gap - cw; top = clampY(y + ht / 2 - ch / 2); }
    else { top = vh - ch - 12; left = (vw - cw) / 2; }
    Object.assign(card.style, { left: left + "px", top: top + "px", width: cw + "px" });
  };
  // The light follows its target every frame (scrolling, a late font, a redraw), and glides only right after a stop
  // changes; otherwise it would trail behind the page as it scrolls.
  const loop = () => { place(); raf = requestAnimationFrame(loop); };
  let glide = 0;

  const show = (i) => {
    at = i;
    const s = stops[at], last = at === stops.length - 1;
    const el = rectOf(s.sel);
    // Laptops: the lit part in the middle. Phones: near the top, so Chotu's card fits under it.
    const first = document.querySelector(s.sel);
    if (el && first && !s.pitch) {
      const small = innerWidth < 700 || el.height > innerHeight - 200;
      first.style.scrollMarginTop = "84px";
      first.scrollIntoView({ block: small ? "start" : "center", behavior: RM() ? "auto" : "smooth" });
    }
    const L = s[X.lang()] ?? s.en;
    text.textContent = L.text;
    card.classList.toggle("pitch", !!s.pitch);
    count.textContent = w("step", at + 1, stops.length);
    next.textContent = last ? w("go") + " →" : w("next") + " →";
    skip.textContent = last ? w("close") : w("skip");
    card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");
    if (!RM()) { veil.classList.add("moving"); clearTimeout(glide); glide = setTimeout(() => veil.classList.remove("moving"), 700); }
    speak(chapter, s.n);
    next.focus({ preventScroll: true });
    X.track("demo_act", { step: chapter, act: "flash_" + (at + 1) });
  };
  const advance = () => { if (at + 1 < stops.length) show(at + 1); else { close(); onGo?.(); } };

  veil.addEventListener("click", (e) => {
    if (e.target.closest(".fl-ctl button")) return;
    const s = stops[at];
    // On the last stop, a tap on the lit button is that button.
    if (s?.pitch) { const r = hole.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { close(); return onGo?.(); } }
    if (s?.pitch && !card.contains(e.target)) return; // the last stop waits for a choice
    advance();
  });
  next.onclick = advance;
  skip.onclick = () => { X.track("demo_act", { step: chapter, act: "flash_skip", at: at + 1 }); close(); };
  snd.onclick = () => { const on = !voiceOn(); onSound?.(on); paintSnd(); if (on) { unlocked = false; unlock(); speak(chapter, stops[at].n); } else stopVoice(); };
  const key = (e) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); advance(); }
    else if (e.key === "Tab") { // keep focus inside the card
      const f = [...card.querySelectorAll("button")]; const i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  };
  document.addEventListener("keydown", key, true);
  const api = { teardown: () => { document.removeEventListener("keydown", key, true); cancelAnimationFrame(raf); clearTimeout(glide); stopVoice(); veil.remove(); document.documentElement.classList.remove("fl-on"); } };
  open = api;
  requestAnimationFrame(() => { veil.classList.add("on"); show(0); loop(); });
}

export function close() { if (!open) return; const o = open; open = null; o.teardown(); }

/** The box around everything a selector matches (a stop can light two neighbours as one). */
function rectOf(sel) {
  const rs = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect()).filter((r) => r.width || r.height);
  if (!rs.length) return null;
  const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
  const right = Math.max(...rs.map((r) => r.right)), bottom = Math.max(...rs.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
function speakerSvg(on) {
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="${on ? "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" : "M4 9h4l5-4v14l-5-4H4zM16 9.5l5 5M21 9.5l-5 5"}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** A small button under a finished chapter to see Chotu's tour again. */
export function againButton(onclick) {
  return X?.h("button.fl-again", { type: "button", onclick }, X.h("span.fl-av", kulhad("calm", 26)), w("again"));
}
export function init(ctx) { X = ctx; css(); }

function css() {
  if (document.getElementById("fl-css")) return;
  const s = document.createElement("style");
  s.id = "fl-css";
  s.textContent = `
.fl-veil{position:fixed;inset:0;z-index:80;cursor:pointer;opacity:0;transition:opacity .35s ease}
.fl-veil.on{opacity:1}
.fl-veil.rm,.fl-veil.rm *{transition:none!important;animation:none!important}
.fl-hole{position:fixed;left:50%;top:50%;width:0;height:0;border-radius:18px;pointer-events:none;
  box-shadow:0 0 0 2px rgba(255,214,150,.55),0 0 34px 14px rgba(255,190,110,.22),0 0 0 200vmax rgba(14,10,7,.74);
}
.fl-veil.moving .fl-hole{transition:left .55s cubic-bezier(.65,0,.35,1),top .55s cubic-bezier(.65,0,.35,1),width .55s cubic-bezier(.65,0,.35,1),height .55s cubic-bezier(.65,0,.35,1),border-radius .55s}
.fl-card{position:fixed;cursor:default;background:var(--sc-card,#fffaf3);color:var(--sc-ink,#241a12);border-radius:18px;padding:14px 16px 12px;
  box-shadow:0 18px 50px rgba(0,0,0,.35);border:1px solid rgba(240,160,75,.45)}
.fl-veil.moving .fl-card{transition:left .55s cubic-bezier(.65,0,.35,1),top .55s cubic-bezier(.65,0,.35,1)}
.fl-card.in{animation:fl-in .4s ease both}
@keyframes fl-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fl-who{display:flex;align-items:center;gap:8px;margin:-2px 0 6px}
.fl-who b{font-size:.82rem;letter-spacing:.02em;color:#B5562B}
.fl-av{display:inline-flex;line-height:0}
.fl-av svg .steam{animation:fl-steam 2.6s ease-in-out infinite}
@keyframes fl-steam{50%{transform:translateY(-2px);opacity:.5}}
.fl-text{margin:0 0 12px;font-size:1.02rem;line-height:1.5}
.fl-card[lang=hi] .fl-text{font-size:1.06rem;line-height:1.65}
.fl-card.pitch .fl-text{font-weight:600}
.fl-ctl{display:flex;align-items:center;gap:8px}
.fl-sp{flex:1}
.fl-count{font-size:.78rem;opacity:.65}
.fl-ctl button{font:inherit;border:0;border-radius:999px;cursor:pointer;min-height:40px}
.fl-snd svg{width:20px!important;height:20px!important;flex:none}
.fl-snd{background:transparent;color:inherit;width:40px;display:inline-flex;align-items:center;justify-content:center;opacity:.75}
.fl-snd[aria-pressed=false]{opacity:.45}
.fl-skip{background:transparent;color:inherit;padding:0 10px;opacity:.75}
.fl-next{background:#C8693A;color:#fff;padding:0 16px;font-weight:600}
.fl-ctl button:focus-visible{outline:2px solid #F0A04B;outline-offset:2px}
.fl-again{display:inline-flex;align-items:center;gap:8px;margin:14px 0 4px;background:transparent;border:1px dashed rgba(181,86,43,.45);
  color:inherit;border-radius:999px;padding:4px 14px 4px 6px;font:inherit;font-size:.88rem;cursor:pointer}
html.fl-on{overscroll-behavior:none}
html.sc-on .sc-stage.fl-quiet{grid-template-columns:minmax(0,1fr)!important}
html.sc-on .sc-stage.fl-quiet .sc-guide{display:none!important}
@media (max-width:640px){.fl-text{font-size:.98rem}.fl-card{padding:12px 14px 10px}}
`;
  document.head.append(s);
}
