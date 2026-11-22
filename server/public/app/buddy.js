// Chotu beside the visitor (the demo's only voice). Rebuilt 21 Nov 2026 from the owner's verdict on the tour and the
// flashlight ("the 2012 SaaS product tour; no class, no connect"). The idea, "Study with Chotu":
// - While the visitor works, nobody talks. Chotu sits small at the bottom of the screen, steam rising.
// - He speaks only to help: a nudge when the visitor stalls or misses (never the answer, never the screen, never praise
//   or judgement, never feelings, ranks or results), plus one hello and one goodbye. A tap on him asks for a nudge.
// - Quiet hours: from 23:30 to 07:00 IST he never starts talking and never speaks aloud; a tap still gets a nudge in text.
// - Voice: on by default (the owner's decision, 21 Nov 2026, an exception to "sound off by default" for the demo only).
//   Browsers block sound until a click, so the visitor's first click in the demo unlocks it. The speaker button turns it
//   off and that is remembered. Nothing about the voice is said anywhere.
// Recorded lines: public/app/demo-voice/chotu/<key>-<lang>.mp3, made by scripts/buddy-voice.mjs from LINES below.

import { kulhad } from "./kulhad.js";

/** Every line Chotu can say. `speak` (if any) is how it's read aloud. Keys are file names: keep them stable. */
export const LINES = {
  hello: {
    en: { text: "Hi, I'm Chotu. I'll sit with you while you try this. If you get stuck, I'll give you a nudge, not the answer." },
    hi: { text: "नमस्ते, मैं छोटू हूँ। आप यह करके देखिए, मैं साथ बैठा हूँ। कहीं अटकें तो एक इशारा दूँगा, जवाब नहीं।" } },
  bye: {
    en: { text: "That's one whole topic. Whenever you want the next one, I'll be here." },
    hi: { text: "यह रहा एक पूरा topic। जब अगला करना हो, मैं यहीं मिलूँगा।", speak: "यह रहा एक पूरा टॉपिक। जब अगला करना हो, मैं यहीं मिलूँगा।" } },
  warmup: {
    en: { text: "Just guess. Nothing here is marked, and a guess before the answer helps it stick." },
    hi: { text: "बस अंदाज़ा लगाइए। यहाँ कोई अंक नहीं है, और जवाब से पहले का अंदाज़ा उसे याद रखने में मदद करता है।" } },
  read: {
    en: { text: "Read it once, slowly. Then press Done reading, and it will ask you from memory." },
    hi: { text: "एक बार, धीरे से पढ़िए। फिर 'पढ़ लिया' दबाइए, और यह आपसे याद से पूछेगा।" } },
  video: {
    en: { text: "Tap play. It's under a minute, and the question beside it comes straight from the video." },
    hi: { text: "चलाइए। एक मिनट से कम का है, और बगल का सवाल सीधे इसी वीडियो से है।" } },
  governor: {
    en: { text: "Read the bill once more. Is it ordinary, does it touch the High Court, or is it about money?" },
    hi: { text: "विधेयक एक बार और पढ़िए। साधारण है, हाई कोर्ट से जुड़ा है, या पैसे का मामला है?" } },
  sort: {
    en: { text: "Start with the one you're surest about. Drag it into a list, or tap it and then tap the list." },
    hi: { text: "जिस पर सबसे पक्के हैं, उसी से शुरू कीजिए। उसे सूची में खींचिए, या उस पर टैप करके सूची पर टैप कीजिए।" } },
  pyq: {
    en: { text: "Pick the one you'd mark in the exam. Then say how sure you are." },
    hi: { text: "वह चुनिए जो आप परीक्षा में लगाते। फिर बताइए कितने पक्के हैं।" } },
  retry: {
    en: { text: "Have another look. Rule out the option you're surest is wrong, then pick again." },
    hi: { text: "एक बार फिर देखिए। जो विकल्प सबसे पक्का ग़लत लगे, उसे हटाइए, फिर चुनिए।" } },
  // The Federalism PYQs (the demo's main topic): a nudge for each, after a first miss.
  "pyq-0": {
    en: { text: "Take them one at a time. Which of these three can you tie to an Article of the Constitution?" },
    hi: { text: "एक-एक करके देखिए। इन तीनों में से किसे आप संविधान के किसी अनुच्छेद से जोड़ सकते हैं?" } },
  "pyq-1": {
    en: { text: "Go option by option. Does President's Rule dissolve the Assembly by itself? And whose authority does the state's law-making go to?" },
    hi: { text: "एक-एक विकल्प देखिए। क्या राष्ट्रपति शासन से विधानसभा अपने आप भंग हो जाती है? और राज्य का क़ानून बनाना किसके अधिकार में जाता है?" } },
  "pyq-2": {
    en: { text: "Think about who holds a state bill before it goes anywhere. Can the President reach in and take one?" },
    hi: { text: "सोचिए, राज्य का विधेयक आगे जाने से पहले किसके पास रहता है। क्या राष्ट्रपति ख़ुद उसे मँगा सकते हैं?" } },
  "gst-start": {
    en: { text: "Try the Centre's seat first. Switch it to No and watch the bar." },
    hi: { text: "पहले केंद्र की सीट आज़माइए। उसे 'ना' कीजिए और पट्टी देखिए।" } },
  "gst-all": {
    en: { text: "Now give the states every vote they have. Does it pass?" },
    hi: { text: "अब राज्यों के सारे वोट 'हाँ' कर दीजिए। क्या पारित होता है?" } },
  "gst-close": {
    en: { text: "Centre back to Yes. Now find the line: what does one more state do to the bar?" },
    hi: { text: "केंद्र फिर 'हाँ'। अब रेखा खोजिए: एक राज्य और जोड़ने से पट्टी पर क्या होता है?" } },
  "gst-flip": {
    en: { text: "Now flip it round. You're the states saying no. How few of you can stop it?" },
    hi: { text: "अब उलटकर देखिए। आप वे राज्य हैं जो 'ना' कह रहे हैं। कम से कम कितने रोक सकते हैं?" } },
  "gst-last": {
    en: { text: "One question left, just under the chamber. Does a Council decision bind anyone?" },
    hi: { text: "बस एक सवाल बाक़ी है, ठीक नीचे। क्या परिषद का फ़ैसला किसी पर बाध्यकारी है?" } },
  mains: {
    en: { text: "Press Build the plan and watch a strong answer come together, one line at a time." },
    hi: { text: "'ढाँचा बनाइए' दबाइए और देखिए एक अच्छा उत्तर लाइन-दर-लाइन कैसे बनता है।" } },
  ending: {
    en: { text: "Read the last line of each. Which one actually answers the question?" },
    hi: { text: "दोनों की आख़िरी पंक्ति पढ़िए। कौन-सी सच में सवाल का जवाब देती है?" } },
  essay: {
    en: { text: "Tap through the pages. The notes in the margin are what an examiner would say about each one." },
    hi: { text: "पेज एक-एक करके देखिए। हाशिये की टिप्पणियाँ वही हैं जो परीक्षक हर पेज पर कहेगा।" } },
  next: {
    en: { text: "When you're ready, the button at the bottom takes you on. You can always come back." },
    hi: { text: "जब तैयार हों, नीचे का बटन आपको आगे ले जाएगा। आप कभी भी लौट सकते हैं।" } },
  keep: {
    en: { text: "Have a go. You've seen all of these in the last few minutes." },
    hi: { text: "कोशिश कीजिए। ये सब आपने पिछले कुछ मिनटों में देखे हैं।" } },
};

const WORDS = {
  en: { who: "Chotu", ask: "Chotu: ask for a nudge", showMe: "Show me", close: "Close" },
  hi: { who: "छोटू", ask: "छोटू: एक इशारा माँगिए", showMe: "दिखाइए", close: "बंद कीजिए" },
};

let X = null;
const w = (k) => (WORDS[X.lang()] ?? WORDS.en)[k];
const line = (key) => { const l = LINES[key]; return l ? (l[X.lang()] ?? l.en) : null; };

/** 23:30 to 07:00 in India: Chotu never starts talking and never speaks aloud. */
export function quiet() {
  const now = new Date(Date.now() + 5.5 * 3600e3), m = now.getUTCHours() * 60 + now.getUTCMinutes();
  return m >= 23 * 60 + 30 || m < 7 * 60;
}

// --- Voice ------------------------------------------------------------------------------------------------------------
// One shared <audio>. iOS lets an element play later only if it was started inside a click once, so the first click
// anywhere in the demo plays a moment of silence on it ("unlocks" it). Nothing plays before that click.

const SILENCE = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYyLjEyLjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAlgAenp6enp6enp6enp6enp6enp6enp6enp6pqampqampqampqampqampqampqampqamptPT09PT09PT09PT09PT09PT09PT09PT09P/////////////////////////////////AAAAAExhdmM2Mi4yOAAAAAAAAAAAAAAAACQCcQAAAAAAAAJY+/pGGwAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
let audio = null, unlocked = false;
export const voiceOn = () => X.store.get("try:voice", true) !== false;
function unlock() {
  if (unlocked || !voiceOn()) return;
  unlocked = true;
  if (audio && !audio.paused) return; // already speaking, so already allowed
  try { audio ??= new Audio(); audio.src = SILENCE; const p = audio.play(); p?.catch?.((e) => { if (e?.name === "NotAllowedError") unlocked = false; }); } catch { unlocked = false; }
}
let listening = false;
/** showcase.js calls this whenever the demo draws: the first click in the demo turns the voice on. */
export function listen() {
  if (listening) return;
  listening = true;
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("keydown", unlock, { capture: true });
}
function speak(key) {
  stopVoice();
  if (!voiceOn() || quiet() || !LINES[key]) return;
  try {
    audio ??= new Audio();
    audio.src = `/app/demo-voice/chotu/${key}-${X.lang() === "hi" ? "hi" : "en"}.mp3`;
    audio.play()?.catch?.(() => {}); // blocked (no click yet) or missing: the words are still on screen
  } catch {}
}
export function stopVoice() { try { if (audio && !audio.paused) audio.pause(); } catch {} }
/** After the speaker is switched back on: unlock again inside that click. */
export function relock() { unlocked = false; unlock(); }

// --- Chotu at the bottom of the screen -------------------------------------------------------------------------------
// He keeps out of the way. While the visitor is working he has ducked out of sight (only the top of his steam peeks over
// the edge, so a tap can still ask him for a nudge). After 30 seconds with nothing touched he wanders back and potters
// about, saying nothing. At 45 seconds he gives his nudge. Any touch and he quietly goes again.

let corner = null, bub = null, cup = null, onAsk = null, showing = null;
const said = new Set();

/** The little kulhad (and his speech bubble). `ask` returns the nudge for right now, or null. */
export function mount(ask) {
  onAsk = ask;
  if (!corner) {
    bub = X.h("div.bd-bub", { role: "status", "aria-live": "polite", hidden: true });
    cup = X.h("button.bd-cup", { type: "button", "aria-label": w("ask"), title: w("ask"), onclick: () => tapCup() }, X.h("span.bd-body", kulhad(quiet() ? "night" : "warm", 46)));
    corner = X.h("div.bd-corner.away", bub, cup);
  }
  cup.setAttribute("aria-label", w("ask")); cup.title = w("ask");
  return corner;
}
function tapCup() {
  X.track("demo_act", { act: "chotu_tap" });
  if (showing) return hush();
  const n = onAsk?.();
  if (n) show(n.key, { ...n, asked: true });
  else arrive();
}
/** He comes back on screen (from his hiding place at the bottom), and potters about until something happens. */
function arrive() {
  if (!corner) return;
  clearTimeout(goTimer);
  if (corner.classList.contains("away")) { corner.classList.remove("away"); corner.classList.add("here"); X.track("demo_act", { act: "chotu_back" }); }
}
let goTimer = 0;
/** He ducks out of sight. If he's still speaking he finishes the sentence first. */
function leave() {
  if (!corner || showing) return;
  clearTimeout(goTimer);
  const go = () => { if (!showing) { corner.classList.remove("here", "talking"); corner.classList.add("away"); } };
  if (audio && !audio.paused && !audio.ended) { audio.onended = () => { audio.onended = null; go(); }; goTimer = setTimeout(go, 9000); }
  else go();
}
/**
 * Says one line (once per visit unless `again`). opts: { action: { label, run } } adds a button (such as "Show me").
 * Unasked lines wait until quiet hours are over.
 */
export function say(key, opts = {}) {
  if (!corner || (!opts.asked && quiet())) return false;
  const id = (opts.scope ?? "") + ":" + key;
  if (said.has(id) && !opts.again && !opts.asked) return false;
  said.add(id);
  return show(key, opts);
}
function show(key, opts = {}) {
  const l = line(key);
  if (!l) return false;
  showing = key;
  arrive();
  X.put(bub,
    X.h("p", { lang: X.lang() }, l.text),
    opts.action && X.h("div.bd-row", X.h("button.bd-act", { type: "button", onclick: () => { hush(); opts.action.run(); } }, opts.action.label ?? w("showMe"))),
    X.h("button.bd-x", { type: "button", "aria-label": w("close"), onclick: () => hush() }, "×"));
  bub.hidden = false;
  bub.classList.remove("in"); void bub.offsetWidth; bub.classList.add("in");
  corner.classList.add("talking");
  speak(key);
  X.track("demo_act", { act: "chotu_say", line: key });
  return true;
}
/** Puts the bubble away and sends him off. A touch elsewhere lets the spoken line finish; a close, or a new chapter, stops it. */
export function hush(keepVoice = false) {
  showing = null; if (!keepVoice) stopVoice();
  if (bub) bub.hidden = true; corner?.classList.remove("talking");
  leave();
}
export const isShowing = () => showing;
export const showMe = () => w("showMe");
/** A new chapter: he goes, and forgets what was said in the last one (hello and goodbye stay said). */
export function newChapter() { hush(); for (const k of [...said]) if (!/^:(hello|bye)$/.test(k)) said.delete(k); }

// --- Watching for a stall -----------------------------------------------------------------------------------------------
// No clock on screen, ever. If nothing has been touched for 30 seconds and there's still something to do here, he
// comes back. At 45 seconds the chapter's `nudge()` picks the line for where they are, and every 45 seconds after that
// it's asked again (so on the GST vote a visitor who stays stuck reaches "Show me"). Any touch resets it all.

export const BACK_MS = 30000, NUDGE_MS = 45000;
let backT = 0, nudgeT = 0, watchFn = null, activeFn = null;
/** fn() returns the nudge for right now or null; active() says whether there's still something to do on this screen. */
export function watch(fn, active = () => true) { watchFn = fn; activeFn = active; poke(true); }
export function unwatch() { clearTimeout(backT); clearTimeout(nudgeT); watchFn = activeFn = null; }
function poke(keep = false) {
  clearTimeout(backT); clearTimeout(nudgeT);
  if (!keep && showing && !bub?.matches(":hover")) hush(true);
  else if (!keep && !showing) leave();
  if (!watchFn) return;
  backT = setTimeout(() => { if (activeFn?.()) arrive(); }, BACK_MS);
  const ask = () => {
    const n = watchFn?.();
    if (n && say(n.key, n)) X.track("demo_act", { act: "chotu_stall", line: n.key });
    nudgeT = setTimeout(ask, NUDGE_MS);
  };
  nudgeT = setTimeout(ask, NUDGE_MS);
}
let poked = false;
function listenPokes() {
  if (poked) return; poked = true;
  const on = (e) => { if (corner?.contains(e.target)) return; if (document.documentElement.classList.contains("sc-on")) poke(); };
  document.addEventListener("pointerdown", on, { capture: true, passive: true });
  document.addEventListener("keydown", on, { capture: true });
  document.addEventListener("scroll", () => { if (watchFn && !showing) poke(true); }, { passive: true });
}

export function init(ctx) { X = ctx; css(); listenPokes(); }

function css() {
  if (document.getElementById("bd-css")) return;
  const s = document.createElement("style");
  s.id = "bd-css";
  s.textContent = `
.bd-corner{position:relative;display:flex;align-items:center;flex:none}
.bd-cup{width:52px;height:52px;min-height:0;padding:0;border:0;background:transparent;border-radius:50%;cursor:pointer;display:grid;place-items:center;
  transition:transform .55s cubic-bezier(.3,1.4,.5,1),opacity .45s ease}
.bd-cup:focus-visible{outline:2px solid #F0A04B;outline-offset:2px}
.bd-body{display:block;line-height:0}
.bd-cup svg .steam{animation:bd-steam 3s ease-in-out infinite}
.bd-cup svg circle{transform-box:fill-box;transform-origin:center;animation:bd-blink 5.5s infinite}
/* Out of sight: sunk below the bar, only the steam peeking. A hover or a keyboard focus lifts him a little. */
.bd-corner.away .bd-cup{transform:translateY(50px);opacity:.9;transition:transform .5s ease-in,opacity .5s ease}
.bd-corner.away .bd-cup:hover,.bd-corner.away .bd-cup:focus-visible{transform:translateY(36px)}
/* Back, pottering about: a wander along the bar, a look round, a hop with a spin, a puff of steam. Silent. */
.bd-corner.here:not(.talking) .bd-body{animation:bd-potter 16s ease-in-out .6s infinite}
.bd-corner.here:not(.talking) svg .steam{animation-duration:1.6s}
.bd-corner.talking .bd-body{animation:bd-nod 1.4s ease-in-out infinite}
@keyframes bd-steam{50%{transform:translateY(-2px);opacity:.45}}
@keyframes bd-nod{50%{transform:translateY(-2px) rotate(-3deg)}}
@keyframes bd-blink{0%,46%,50%,100%{transform:scaleY(1)}48%{transform:scaleY(.1)}}
@keyframes bd-potter{
  0%{transform:none}
  5%{transform:translate(10px,-6px) rotate(5deg)} 8%{transform:translate(18px,0)}
  12%{transform:translate(28px,-6px) rotate(5deg)} 15%{transform:translate(36px,0)}
  22%{transform:translate(36px,0) rotate(-10deg)} 28%{transform:translate(36px,0) rotate(10deg)} 32%{transform:translate(36px,0)}
  40%{transform:translate(36px,0) scale(1.06,.9)} 44%{transform:translate(36px,-18px) rotate(180deg)} 48%{transform:translate(36px,0) rotate(360deg) scale(1.08,.9)}
  51%{transform:translate(36px,0) rotate(360deg)}
  60%{transform:translate(24px,-5px) rotate(355deg)} 63%{transform:translate(16px,0) rotate(360deg)}
  67%{transform:translate(8px,-5px) rotate(355deg)} 70%{transform:translate(0,0) rotate(360deg)}
  80%{transform:rotate(360deg) translateY(2px) scale(1.03,.95)} 88%{transform:rotate(360deg)}
  100%{transform:rotate(360deg)}
}
.bd-bub{position:absolute;left:4px;bottom:calc(100% + 10px);width:min(360px,calc(100vw - 32px));background:#FBF5E8;color:#2A1B12;border-radius:16px 16px 16px 4px;
  padding:12px 40px 12px 14px;box-shadow:0 14px 40px rgba(0,0,0,.45);font-size:15px;line-height:1.5;z-index:40}
.bd-bub[lang=hi],.bd-bub p[lang=hi]{font-size:15.5px;line-height:1.65}
.bd-bub p{margin:0}
.bd-bub.in{animation:bd-in .35s ease both}
@keyframes bd-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.bd-row{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:6px}
.bd-act{background:#C8693A;color:#fff!important;border:0;border-radius:999px;padding:6px 14px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;min-height:34px}
.bd-x{position:absolute;top:6px;right:6px;background:transparent;border:0;color:#6E5A4C!important;font-size:22px;line-height:1;width:32px;height:32px;min-height:0;padding:0;cursor:pointer;border-radius:50%}
.bd-act:focus-visible,.bd-x:focus-visible{outline:2px solid #C8693A;outline-offset:2px}
/* Reduced motion: no wandering, no hops. He fades out and in where he sits. */
@media (prefers-reduced-motion: reduce){.bd-corner *{animation:none!important}
  .bd-cup,.bd-corner.away .bd-cup{transform:none!important;transition:opacity .4s linear!important}
  .bd-corner.away .bd-cup{opacity:.28}}
`;
  document.head.append(s);
}
