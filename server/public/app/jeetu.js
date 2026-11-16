// Jeetu · AI, the method coach from the trailer "Page 42" (artefacts/jeetu-2026-11-14.md). Chotu does the content;
// Jeetu only the method. He shows up at the moments the method matters, with one short line (English or Hindi), and
// answers method questions in Ask Jeetu (server POST /jeetu).
//
// Rules: always labelled "Jeetu · AI"; quiet from 23:30 to 07:00 IST and in result week; never feelings, ranks or
// results (the server answers those itself); no streaks, timers or scores; still picture, no sound. The `jeetu` flag
// switches him off everywhere.

import { kulhad } from "./kulhad.js";
import { ACT, LINES } from "./jeetu-lines.js";

let C = null;
/** app.js hands over its helpers once at start. */
export function init(ctx) { C = ctx; injectStyles(); }

const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);

export { LINES };

const lang = (l) => ((l ?? C.lang?.()) === "hi" ? "hi" : "en");
const line = (key, l) => LINES[key]?.[lang(l)] ?? LINES[key]?.en ?? "";

/** True from 23:30 to 07:00 in India, whatever the device's own time zone. */
export function quietNow(d = new Date()) {
  const ist = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 5.5 * 3600000), hm = ist.getHours() * 60 + ist.getMinutes();
  return hm >= 23 * 60 + 30 || hm < 7 * 60;
}
/** Whether Jeetu shows at all right now: his flag, quiet hours and result week. */
export const awake = () => !!C && C.on("jeetu") && !quietNow() && !C.resultMode?.();

// --- The portrait: adapted from the trailer's bust (artefacts/trailer-2026-11-13/scenes/chars.js) ------------------

const INK = "#2A1B12";
const FACE = `
  <path d="M40 540 Q48 400 140 370 L300 370 Q392 400 400 540Z" fill="#EDE3D2"/>
  <path d="M30 540 Q40 420 130 372 L176 360 Q150 450 170 540Z" fill="#5B2A22"/><path d="M410 540 Q400 420 310 372 L264 360 Q290 450 270 540Z" fill="#5B2A22"/>
  <path d="M168 540 Q150 450 176 362" fill="none" stroke="#C98A0B" stroke-width="8"/><path d="M272 540 Q290 450 264 362" fill="none" stroke="#C98A0B" stroke-width="8"/>
  <rect x="190" y="320" width="60" height="56" rx="16" fill="#8E5A3E"/>
  <ellipse cx="220" cy="244" rx="86" ry="100" fill="#9C6646"/>
  <ellipse cx="136" cy="248" rx="14" ry="22" fill="#8E5A3E"/><ellipse cx="304" cy="248" rx="14" ry="22" fill="#8E5A3E"/>
  <path d="M134 226 Q128 160 170 142 Q220 128 270 142 Q312 160 306 226 Q296 186 280 176 Q290 160 262 154 Q220 150 178 154 Q150 160 160 176 Q144 186 134 226Z" fill="#D9D4CC"/>
  <path d="M150 300 Q160 350 220 356 Q280 350 290 300 Q280 330 250 332 Q220 340 190 332 Q160 330 150 300Z" fill="#CFC8BE"/>
  <path d="M184 296 Q220 280 256 296 Q240 302 220 300 Q200 302 184 296Z" fill="#E3DDD4"/>
  <path d="M198 312 Q220 320 242 312" fill="none" stroke="#4A1F14" stroke-width="4" stroke-linecap="round"/>
  <g fill="none" stroke="#CFC8BE" stroke-width="8" stroke-linecap="round"><path d="M168 204 Q186 192 204 205"/><path d="M236 208 Q254 200 272 210"/></g>
  <ellipse cx="186" cy="238" rx="7.5" ry="8.5" fill="${INK}"/><circle cx="188" cy="235" r="2.3" fill="#fff"/>
  <ellipse cx="254" cy="238" rx="7.5" ry="8.5" fill="${INK}"/><circle cx="256" cy="235" r="2.3" fill="#fff"/>
  <path d="M164 254 Q170 262 180 262 M260 262 Q270 262 276 254" fill="none" stroke="#7E4F35" stroke-width="2.5" opacity=".6"/>
  <path d="M218 246 Q210 270 220 276 Q228 276 230 270" fill="none" stroke="#7E4F35" stroke-width="4" stroke-linecap="round"/>
  <g fill="rgba(200,230,255,.08)" stroke="${INK}" stroke-width="5"><circle cx="186" cy="238" r="27"/><circle cx="254" cy="238" r="27"/></g>
  <path d="M213 236 Q220 230 227 236 M159 232 L136 226 M281 232 L304 226" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  <g opacity=".5"><path d="M170 226 L182 214" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M238 226 L250 214" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`;
const TUMBLER = `<g transform="translate(320 450) scale(.8)">
  <path d="M-34 -70 H34 L28 40 Q27 50 18 50 H-18 Q-27 50 -28 40Z" fill="url(#jeetu-steel)"/>
  <ellipse cx="0" cy="-70" rx="34" ry="7" fill="#DDE3E8"/><ellipse cx="0" cy="-70" rx="28" ry="4.5" fill="#7A4A26"/>
  <path d="M-20 -60 L-16 36" stroke="#fff" stroke-width="6" opacity=".55" stroke-linecap="round"/></g>`;
const STEEL = `<linearGradient id="jeetu-steel" x1="0" x2="1"><stop offset="0" stop-color="#8E979F"/><stop offset=".35" stop-color="#E4E9ED"/><stop offset=".7" stop-color="#A9B1B8"/><stop offset="1" stop-color="#6E767E"/></linearGradient>`;

/** Jeetu's portrait as an <svg>. Small sizes are a round head-and-shawl badge; `full` is the bust with his tumbler. */
export function portrait(size = 48, { full = false } = {}) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", size); svg.setAttribute("height", full ? Math.round(size * 540 / 440) : size);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("jeetu-portrait");
  if (full) {
    svg.setAttribute("viewBox", "0 100 440 440");
    svg.setAttribute("height", size);
    svg.innerHTML = `<defs>${STEEL}</defs><circle cx="220" cy="320" r="218" class="jeetu-bg"/>${FACE}${TUMBLER}`;
  } else {
    // The round badge: his head and the top of the shawl, clipped to a circle on the theme's soft colour.
    svg.setAttribute("viewBox", "92 112 256 256");
    const id = "jc" + Math.random().toString(36).slice(2, 7);
    svg.innerHTML = `<defs><clipPath id="${id}"><circle cx="220" cy="240" r="126"/></clipPath></defs>
      <circle cx="220" cy="240" r="126" class="jeetu-bg"/><g clip-path="url(#${id})">${FACE}</g>`;
  }
  return svg;
}

/** "Jeetu · AI": the portrait and the label together, everywhere he appears. */
export const label = (size = 28) => h("span.jeetu-label", portrait(size), h("span", "Jeetu · AI"));

/** One of his lines as a small card, or nothing when he's off, quiet or it's result week. `l` overrides the language. */
export function say(key, { l = null, text = null } = {}) {
  if (!awake()) return null;
  const words = text ?? line(key, l);
  if (!words) return null;
  // His scripted lines can be heard (voice.js): by key, so the server speaks only its own copy of the words.
  const hear = text ? null : C.listen?.({ who: "jeetu", line: key, lang: lang(l) }, { hi: lang(l) === "hi" });
  return h("div.jeetu-say", { role: "note" }, portrait(44), h("div", h("div.jeetu-name", "Jeetu · AI"), h("p", words), hear));
}

// --- The weekly note: how much came back, against your own past only -----------------------------------------------

/** rightDays: {"YYYY-MM-DD": [right, total]}, kept on this device by every answer and topic check. */
export function weeklyText(rightDays, todayStr, l) {
  const hi = lang(l) === "hi";
  const day = (n) => { const d = new Date(todayStr + "T12:00:00"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const sum = (from, to) => { let r = 0, t = 0; for (let n = from; n < to; n++) { const x = rightDays?.[day(n)]; if (x) { r += x[0]; t += x[1]; } } return [r, t]; };
  const [r1, t1] = sum(0, 7), [r0, t0] = sum(7, 28);
  if (t1 < 5 || t0 < 10) return hi
    ? "दो-तीन हफ़्ते के रिव्यू के बाद यहाँ बताऊँगा कि कितना याद आ रहा है। सिर्फ़ तुम्हारे अपने पिछले हफ़्तों से तुलना, किसी और से नहीं।"
    : "After two or three weeks of reviews, I'll tell you here how much is coming back. Only against your own past weeks, never anyone else.";
  const a = r1 / t1, b = r0 / t0, now = Math.round(a * 10), before = Math.round(b * 10);
  if (a - b >= 0.05) return hi
    ? `इस हफ़्ते पहले से ज़्यादा याद आया: दस में करीब ${now}, पिछले तीन हफ़्तों में ${before}। फ़ासले काम कर रहे हैं, बेटा।`
    : `More came back this week: about ${now} in 10, against ${before} in 10 in the three weeks before. The gaps are working, beta.`;
  if (b - a >= 0.05) return hi
    ? `इस हफ़्ते थोड़ा कम याद आया: दस में करीब ${now}, पहले ${before}। नए टॉपिक आने पर ऐसा होता है। पहले जवाब देते रहो।`
    : `A little less came back this week: about ${now} in 10, against ${before} before. That's normal when new topics come in. Keep answering first.`;
  return hi ? `पहले जैसा ही: दस में करीब ${now}। स्थिर रहना अच्छा है, बेटा।` : `About the same as before: ${now} in 10 coming back. Steady is good, beta.`;
}
export function weekly(rightDays, todayStr) {
  if (!awake()) return null;
  return h("div.card.jeetu-week", h("div.row", portrait(44), h("div", h("strong", C.lang?.() === "hi" ? "इस हफ़्ते की याद" : "Your week of recall"), " ", h("span.ai-tag", "Jeetu · AI"))),
    h("p", weeklyText(rightDays, todayStr)),
    h("a.small", { href: "#jeetu" }, C.lang?.() === "hi" ? "Jeetu से तरीक़े के बारे में पूछें →" : "Ask Jeetu about the method →"));
}

/** The double act from the trailer: Chotu asks for a streak. */
export function doubleAct() {
  if (!awake() || !C.on("chotu")) return null;
  const hi = lang() === "hi";
  const l = hi ? "hi" : "en";
  const row = (who, key) => h("div.jeetu-act-row", who, h("p", ACT[key][l]), C.listen?.({ who: ACT[key].who, line: key, lang: l }, { hi }));
  return h("div.card.soft.jeetu-act", { "aria-label": "Chotu and Jeetu" },
    row(h("span.chotu-label", kulhad("warm", 24), h("span", "Chotu · AI")), "streakAsk"),
    row(label(24), "streakNo"),
    row(h("span.chotu-label", kulhad("calm", 24), h("span", "Chotu · AI")), "streakChai"));
}

// --- Ask Jeetu ----------------------------------------------------------------------------------------------------

const chat = { turns: [], busy: false, offline: null, care: false };

export function viewJeetu() {
  const hi = lang() === "hi";
  const head = [h("div.center", portrait(120, { full: true })), h("p.center", h("span.ai-tag", "Jeetu · AI")),
    h("h1.center", hi ? "Jeetu से पूछें" : "Ask Jeetu")];
  if (!C.on("jeetu")) return h("div.col", ...head, h("div.card.soft", h("p", hi ? "Jeetu अभी बंद है।" : "Jeetu is switched off for now.")), h("a.btn", { href: "#today" }, "Back to Today"));
  if (C.resultMode?.()) return h("div.col", ...head, h("div.card.soft", h("p", hi ? "इस हफ़्ते Jeetu चुप है।" : "Jeetu is staying quiet this week.")),
    h("div.row", h("a.btn", { href: "#calm" }, "Calm now"), h("a.btn", { href: "#pod" }, "Your pod")));
  if (quietNow()) return h("div.col", ...head, h("div.card.soft", h("p", hi ? "रात हो गई, बेटा। दिन बंद करो और सो जाओ। सुबह सात बजे मिलते हैं।" : "It's late, beta. Close the day and sleep. I'm back at seven.")),
    h("a.btn", { href: "#close" }, "Close the day"));
  const box = h("div");
  const input = h("textarea", { rows: 2, maxLength: 1500, placeholder: hi ? "जैसे: दोबारा पढ़ूँ या ख़ुद को टेस्ट करूँ?" : "For example: should I re-read my notes or test myself?" });
  const STARTERS = hi
    ? ["रिव्यू रोज़ कितना करूँ?", "मेन्स का उत्तर ख़ुद कैसे जाँचूँ?", "करंट अफ़ेयर्स कैसे याद रखूँ?"]
    : ["How long should my daily review be?", "How do I mark my own Mains answer?", "How do I keep current affairs from slipping?"];
  const draw = () => put(box,
    chat.care && C.careBox(),
    h("div.card.chat",
      chat.turns.length === 0 && [h("p.muted", hi ? "Jeetu सिर्फ़ तरीक़ा सिखाते हैं: कैसे पढ़ें, याद रखें, लिखें। तथ्य और व्याख्या के लिए Chotu से पूछें." : "Jeetu teaches the method: how to study, remember and write. For facts and explanations, ask Chotu."),
        h("div.chips", STARTERS.map((s) => h("button.chip", { onclick: () => { input.value = s; send(); } }, s)))],
      chat.turns.map((t) => h("div.msg" + (t.role === "assistant" ? ".jeetu" : ""),
        t.role === "assistant" ? label(18) : h("span.who", "You"),
        h("div", t.care ? "(kept on this device)" : t.content),
        t.role === "assistant" && C.listen?.({ who: "jeetu", text: t.content, sig: t.voice }, { hi }),
        t.role === "assistant" && t.id && h("button.ghost.small", { onclick: () => report(t) }, t.reported ? "Reported" : "Report"))),
      chat.busy && h("p.small.muted", hi ? "Jeetu सोच रहे हैं…" : "Jeetu is thinking…")),
    chat.offline && h("div.card.soft", chat.offline),
    h("div.row", h("div.grow", input), h("button.primary", { disabled: chat.busy, onclick: send }, hi ? "भेजें" : "Send")),
    h("p.small.muted", hi ? "Jeetu एक AI है, कोई इंसानी मेंटर नहीं। वह ग़लत हो सकता है, और रैंक, नतीजे या भावनाओं पर बात नहीं करता।"
      : "Jeetu is an AI, not a human mentor. He can be wrong, and he doesn't talk about ranks, results or feelings: those deserve a real person."),
    h("p.small", h("a", { href: "#chotu" }, hi ? "तथ्य या व्याख्या चाहिए? Chotu से पूछें →" : "Need a fact or an explanation? Ask Chotu →")));
  async function send() {
    const text = input.value.trim(); if (!text || chat.busy) return;
    input.value = "";
    // The on-device distress check first: a matching message never leaves this browser.
    if (C.distress(text)) { chat.care = true; chat.turns.push({ role: "user", content: text, care: true }); draw(); return; }
    chat.turns.push({ role: "user", content: text }); chat.busy = true; chat.offline = null; draw();
    const body = { messages: chat.turns.filter((t) => !t.care).slice(-8).map(({ role, content }) => ({ role, content })), context: { language: C.memberLang?.() ?? (hi ? "Hindi" : "English") } };
    if (C.plusOn?.()) body.memberId = C.profile()?.memberId;
    const r = await C.post("/jeetu", body);
    chat.busy = false;
    if (r?.care) chat.care = true;
    else if (r?.reply) chat.turns.push({ role: "assistant", content: r.reply, id: C.randomId(), voice: r.voice });
    else chat.offline = r?.error ?? (hi ? "Jeetu अभी जवाब नहीं दे पाए। एक मिनट बाद फिर कोशिश करें।" : "Jeetu couldn't answer just now. Try again in a minute.");
    draw();
  }
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
  draw();
  return h("div.col", ...head, box);
}

function report(t) {
  if (t.reported) return;
  const reason = prompt("What's wrong with this reply? (for example: wrong, unsafe, rude)");
  if (reason == null) return;
  C.post("/jeetu/report", { messageId: t.id, reason: reason.trim().slice(0, 300) || "Reported", text: t.content }).then((r) => {
    t.reported = r?.status === 200 || r?.ok === true; C.toast(t.reported ? "Thanks. A moderator will look at it." : "Couldn't send the report. Try again when online.");
  });
}

function injectStyles() {
  if (document.getElementById("jeetu-css")) return;
  const s = document.createElement("style");
  s.id = "jeetu-css";
  s.textContent = `
.jeetu-portrait .jeetu-bg { fill: var(--soft, #EFE6D8); stroke: var(--line, #E4D8C8); stroke-width: 4; }
.jeetu-portrait { flex: none; }
.jeetu-label { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; vertical-align: middle; }
.jeetu-say { display: flex; gap: 12px; align-items: flex-start; background: var(--card); border: 1px solid var(--line); border-left: 4px solid #7A2E24; border-radius: 16px; padding: 12px 14px; margin: 12px 0; }
.jeetu-say p { margin: 2px 0 0; font-family: var(--read-font, inherit); }
.jeetu-name { font-size: 13px; font-weight: 600; color: var(--muted); }
.jeetu-week .row { align-items: center; gap: 10px; }
.jeetu-act-row { display: flex; gap: 10px; align-items: center; margin: 6px 0; }
.jeetu-act-row > :first-child { min-width: 118px; }
.jeetu-act-row p { margin: 0; flex: 1; }
.voice-btn { white-space: nowrap; }
.jeetu-say .voice-btn { margin-top: 6px; }
.msg.jeetu { border-left: 3px solid #7A2E24; padding-left: 8px; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .jeetu-say, :root:not([data-theme="light"]) .msg.jeetu { border-left-color: #C98A6B; } }
:root[data-theme="dark"] .jeetu-say, :root[data-theme="dark"] .msg.jeetu { border-left-color: #C98A6B; }
`;
  document.head.append(s);
}
