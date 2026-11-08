// "Try one topic" (#try): one whole syllabus topic, open to visitors with no account. It walks a topic path
// (aspiran/topic-path@1, served by server/src/try.ts) one screen at a time.
//
// Two routes over the same content, picked on the cover: Express (about 15 minutes, the default door, for someone
// deciding whether we're any good) and Whole topic (about 75 minutes in three sittings, for someone learning it).
// Answers are kept by step id, so switching from Express to the whole topic never asks anything twice. Extras
// (videos, news cards, the essay snaps, the GST simulator in Express, the app tour) are "side doors": optional, opened
// from inside a step, never numbered, never required.
//
// What it holds to, and why (the "why we do it" note under each title says the same to the learner):
// - Guess first, then read: being wrong before the answer makes the answer stick (pretesting).
// - Short reads with a check straight after: retrieval beats re-reading.
// - Lookalikes mixed in one sort: telling things apart is what Prelims tests (interleaving).
// - "How sure?" before each PYQ: under negative marking, knowing when you're guessing is a skill (calibration).
// - Plan before you see ours: the skeleton opens only after you try (try before show; expertise reversal).
// - Keep it: cards go into the same FSRS review queue and syllabus map the app uses (spacing).
// - No timers, streaks or public scores; counts are private, on this device. No sound or motion. Every piece ends.
//
// What leaves the device: only the one-tap answers and survey answers the visitor chooses to give (anonymous, with a
// random session id), and a contact only if they type one and tick consent. A "Delete what I sent" button removes all
// of it. Progress itself stays in this browser under try:<id>, so a visitor who later joins keeps their review cards.
//
// Members see it inside the app shell; visitors in the public shell (PUBLIC in app.js). Editors walk a draft with
// #try/<id>?preview and their desk key. The richer steps live in try-parts.js.

import * as F from "./fsrs.js";
import * as MP from "./map.js";
import * as P from "./try-parts.js";

let C = null;
/** app.js hands over its helpers once at start. */
export function init(ctx) { C = ctx; injectStyles(); }

const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);

// --- Language: the member's own, or a visitor's pick on this page --------------------------------------------------

let cur = null; // { id, data, draft, languages }
const langs = () => cur?.languages ?? ["en"];
function lang() {
  const mine = C.profile() ? C.lang() : C.store.get("try:lang", (navigator.language || "").startsWith("hi") ? "hi" : "en");
  return langs().includes(mine) ? mine : "en";
}
/** A { en, hi } text in the reading language. */
const L = (v) => (v && typeof v === "object" ? (v[lang()] || v.en || "") : v ?? "");
/** Text with **bold** lead-ins, as nodes. */
const rich = (t) => String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) => (s.startsWith("**") ? h("strong", s.slice(2, -2)) : s));

const UI = {
  en: {
    loading: "Loading the topic…", notOpen: "This topic opens once an editor has checked it.", notOpenMore: "In the meantime, the Free Shelf works without an account.",
    shelf: "Open the Free Shelf", back: "Back", next: "Next", resume: "Carry on where you left off", of: (i, n) => `${i}/${n}`,
    restart: "Start again", startOver: "Start this topic again? Your answers on this page are cleared; cards already in your review stay.",
    sure: "Sure", notSure: "Not sure", pickSure: "First: how sure are you?", right: "Right.", notQuite: "Not quite.", answer: "Right answer", yourPick: "your pick",
    readCheck: "Quick check", readMin: (m) => `about ${m} min`, part: (n) => `Part ${n} of 5`,
    sortPick: "Tap a subject, then its list.", sortCheck: "Check", sortLeft: (n) => `${n} left to place`, sortAgain: "Try those again",
    sortYouPut: "you put", sortIts: "it's", sortLook: (n) => n ? `${n} to look at again. Only you see this.` : "All in the right list.",
    recallPlaceholder: "Type what you remember, or say it aloud and just tick below.", recallTick: "Now tick what you got:",
    recallCount: (a, n) => `You recalled ${a} of ${n}. Only you see this.`, recallSaved: "Saved on this device.",
    qOf: (i, n) => `Question ${i} of ${n}`, nextQ: "Next question", seeTally: "How did I do?",
    pyqTally: (r, n) => `${r} of ${n} right.`, sureWrong: (n) => n ? `${n} you were sure of but got wrong: in Prelims those are the expensive ones (no mark, plus a penalty).` : "Nothing you were sure of went wrong. That's good calibration.",
    unsureRight: (n) => n ? `${n} you weren't sure of were right: you know more than you think. Trust yourself a little more.` : "",
    choose: "Choose one question", yourPlan: "Your plan (about two minutes, no clock):", planHolder: "Opening line…\n1.\n2.\n3.\nWay forward…",
    onPaper: "I planned on paper", showOurs: "Show our skeleton", ours: "Our skeleton", intro: "Open", wayForward: "Way forward", mistake: "Common mistake",
    checkYours: "Check your plan against these:", whichBetter: "Which conclusion is better?", directive: "What the question asks", toConclusions: "Next: the conclusion",
    keepBtn: "Add these to my review", kept: "Added to your review.", firstBack: (n, d) => `${n} cards. The first come back on ${d}, just before you'd start forgetting.`,
    keepVisitor: "Saved in this browser. Join free to keep them on your phone and in your pod.", keepMember: "They're in Review, with the rest of your queue.",
    mapMet: "Federalism is ticked on your syllabus map: learnt once, review due.", openReview: "Open Review", openMap: "Your syllabus map",
    canDo: "You can now:", join: "Join free, no card needed", another: "Look around the Free Shelf", draft: "Draft · not yet checked by an editor · desk-key preview only",
    whyNote: "Why we do it this way", evidence: "Evidence", band: (b) => `band ${b}`, sideDoor: "Side door", backToPath: "Back to the topic",
    express: "Express", full: "Whole topic", min: (m) => `${m} min`, inside: "What's inside", switchFull: "Carry on into the whole topic",
    stage: { learn: "Learn", practise: "Practise", write: "Write", keep: "Keep" },
    quickOne: "Quick one (optional)", thanks: "Thanks", privacyOnce: "Your taps are sent anonymously to help us improve. Nothing else is.",
    videoData: "Tap to load. Nothing downloads until you do.", transcript: "Read it instead", yourTurn: "Your turn",
    yes: "Yes", no: "No", all: "All", none: "None", billN: (i, n) => `Bill ${i} of ${n}`, nextBill: "Next bill", done: "Done", again: "Play again",
    tryYours: "Try yours", evaluator: "What an evaluator looks for here", usualSlip: "The usual slip:", nextSnap: (n) => `Next snap: ${n}`,
    snapPhoto: "Snap or pick your page", yourPage: "Your page", staysHere: "Your photo stays on this phone. We don't upload it.",
    cardN: (i, n) => `Card ${i} of ${n}`, staticLink: "Static link:", examCorner: "Exam corner", sources: "Sources:", prevCard: "Previous", nextCard: "Next card",
    offline: "Couldn't send just now. Check your connection and try again.", ofN: (n) => `Shown once at least ${n} people have answered.`,
    filter: "Show", levels: { S: "Structure", C: "Content", E: "Expression" }, asText: "Read the page as text",
    doneReading: "Done reading: test me", showText: "Show the text again", sureHow: "How sure are you?", sure3: ["Sure", "Can rule out one or two", "Pure guess"],
    sureWrongN: (n) => n ? `${n} you were sure of but got wrong. Those cost in Prelims, and they're also the ones you'll now remember best.` : "Nothing you were sure of went wrong. That's good calibration.",
    guessRight: (n, m) => `When you could rule some out, you got ${n} of ${m} right.`, noMoreQs: "No more questions, thanks", noMoreDone: "Got it. No more questions.",
    triedFirst: "Type a few lines first, or tap \"I said it aloud\".", saidAloud: "I said it aloud", secondGo: "Second go: close the list and try just the ones you didn't tick.",
    secondHolder: "The ones you missed, from memory…", secondShow: "Check the missed ones", workedFirst: "New to Mains? See one worked plan first",
    cardOf: (i, n) => `Card ${i} of ${n}`, keepDone: "Done", stop: "Stop here for now", carryOn: "Carry on",
  },
  hi: {
    loading: "Topic खुल रहा है…", notOpen: "यह topic संपादक की जाँच के बाद खुलेगा।", notOpenMore: "तब तक Free Shelf बिना account के चलता है।",
    shelf: "Free Shelf खोलिए", back: "पीछे", next: "आगे", resume: "जहाँ छोड़ा था, वहीं से", of: (i, n) => `${i}/${n}`,
    restart: "फिर से शुरू", startOver: "यह topic फिर से शुरू करें? इस पेज के आपके जवाब मिट जाएँगे; review में जा चुके cards बने रहेंगे।",
    sure: "पक्का", notSure: "पक्का नहीं", pickSure: "पहले: आप कितने पक्के हैं?", right: "सही।", notQuite: "पूरी तरह नहीं।", answer: "सही उत्तर", yourPick: "आपका चुनाव",
    readCheck: "छोटी जाँच", readMin: (m) => `लगभग ${m} मिनट`, part: (n) => `भाग ${n} / 5`,
    sortPick: "पहले विषय पर टैप कीजिए, फिर उसकी सूची पर।", sortCheck: "जाँचिए", sortLeft: (n) => `${n} बाक़ी`, sortAgain: "इन्हें फिर से कीजिए",
    sortYouPut: "आपने रखा", sortIts: "सही है", sortLook: (n) => n ? `${n} दोबारा देखने लायक। यह केवल आप देखते हैं।` : "सब सही सूची में।",
    recallPlaceholder: "जो याद है, लिखिए, या ज़ोर से बोलिए और बस नीचे टिक कीजिए।", recallTick: "अब जो आया, उस पर टिक कीजिए:",
    recallCount: (a, n) => `आपको ${n} में से ${a} याद आए। यह केवल आप देखते हैं।`, recallSaved: "इसी device पर सहेजा गया।",
    qOf: (i, n) => `सवाल ${i} / ${n}`, nextQ: "अगला सवाल", seeTally: "मेरा कैसा रहा?",
    pyqTally: (r, n) => `${n} में से ${r} सही।`, sureWrong: (n) => n ? `${n} पर आप पक्के थे पर गलत हुए: Prelims में यही महँगे पड़ते हैं (नंबर भी नहीं, ऊपर से कटौती)।` : "जिन पर आप पक्के थे, उनमें कोई गलत नहीं हुआ। अच्छा अंदाज़ा।",
    unsureRight: (n) => n ? `${n} पर आप पक्के नहीं थे पर सही थे: आपको जितना लगता है, उससे ज़्यादा पता है।` : "",
    choose: "एक सवाल चुनिए", yourPlan: "आपका ढाँचा (लगभग दो मिनट, कोई घड़ी नहीं):", planHolder: "शुरुआत…\n1.\n2.\n3.\nआगे का रास्ता…",
    onPaper: "मैंने काग़ज़ पर बनाया", showOurs: "हमारा ढाँचा दिखाइए", ours: "हमारा ढाँचा", intro: "शुरुआत", wayForward: "आगे का रास्ता", mistake: "आम ग़लती",
    checkYours: "अपने ढाँचे को इनसे मिलाइए:", whichBetter: "कौन-सा निष्कर्ष बेहतर है?", directive: "सवाल क्या माँगता है", toConclusions: "आगे: निष्कर्ष",
    keepBtn: "इन्हें मेरे review में जोड़िए", kept: "आपके review में जुड़ गए।", firstBack: (n, d) => `${n} cards। पहले ${d} को लौटेंगे, भूलना शुरू होने से ठीक पहले।`,
    keepVisitor: "इस browser में सहेजा गया। Phone और pod में रखने के लिए मुफ़्त जुड़िए।", keepMember: "ये Review में आपकी बाक़ी सूची के साथ हैं।",
    mapMet: "आपके syllabus map पर संघवाद पर टिक लग गया: एक बार पढ़ा, review बाक़ी।", openReview: "Review खोलिए", openMap: "आपका syllabus map",
    canDo: "अब आप:", join: "मुफ़्त जुड़िए, कोई card नहीं चाहिए", another: "Free Shelf देखिए", draft: "Draft · अभी संपादक ने नहीं जाँचा · केवल desk key से",
    whyNote: "हम ऐसा क्यों करते हैं", evidence: "प्रमाण", band: (b) => `स्तर ${b}`, sideDoor: "साइड डोर", backToPath: "Topic पर लौटिए",
    express: "Express", full: "पूरा topic", min: (m) => `${m} मिनट`, inside: "अंदर क्या है", switchFull: "पूरे topic में आगे बढ़िए",
    stage: { learn: "सीखिए", practise: "अभ्यास", write: "लिखिए", keep: "याद रखिए" },
    quickOne: "एक छोटा सवाल (ज़रूरी नहीं)", thanks: "शुक्रिया", privacyOnce: "आपके टैप बिना नाम के भेजे जाते हैं, ताकि हम बेहतर बनें। और कुछ नहीं।",
    videoData: "लोड करने के लिए टैप कीजिए। तब तक कुछ डाउनलोड नहीं होता।", transcript: "पढ़कर देखिए", yourTurn: "आपकी बारी",
    yes: "हाँ", no: "ना", all: "सब", none: "कोई नहीं", billN: (i, n) => `विधेयक ${i} / ${n}`, nextBill: "अगला विधेयक", done: "हो गया", again: "फिर से खेलिए",
    tryYours: "अपना आज़माइए", evaluator: "यहाँ परीक्षक क्या देखता है", usualSlip: "आम चूक:", nextSnap: (n) => `अगला snap: ${n}`,
    snapPhoto: "अपने पेज की फ़ोटो लीजिए या चुनिए", yourPage: "आपका पेज", staysHere: "आपकी फ़ोटो इसी phone पर रहती है। हम इसे अपलोड नहीं करते।",
    cardN: (i, n) => `Card ${i} / ${n}`, staticLink: "Static जुड़ाव:", examCorner: "Exam corner", sources: "स्रोत:", prevCard: "पिछला", nextCard: "अगला card",
    offline: "अभी भेजा नहीं जा सका। कनेक्शन देखकर फिर कोशिश कीजिए।", ofN: (n) => `कम से कम ${n} लोगों के जवाब के बाद ही दिखता है।`,
    filter: "दिखाइए", levels: { S: "ढाँचा", C: "सामग्री", E: "अभिव्यक्ति" }, asText: "पेज को पाठ के रूप में पढ़िए",
    doneReading: "पढ़ लिया: अब जाँचिए", showText: "पाठ फिर दिखाइए", sureHow: "आप कितने पक्के हैं?", sure3: ["पक्का", "एक-दो विकल्प हटा सकता हूँ", "पूरा अंदाज़ा"],
    sureWrongN: (n) => n ? `${n} पर आप पक्के थे पर गलत हुए। Prelims में ये महँगे पड़ते हैं, और अब यही आपको सबसे अच्छे से याद रहेंगे।` : "जिन पर आप पक्के थे, उनमें कोई गलत नहीं हुआ। अच्छा अंदाज़ा।",
    guessRight: (n, m) => `जहाँ आप कुछ विकल्प हटा सके, वहाँ ${m} में से ${n} सही रहे।`, noMoreQs: "अब और सवाल नहीं, शुक्रिया", noMoreDone: "ठीक है। अब और सवाल नहीं।",
    triedFirst: "पहले कुछ पंक्तियाँ लिखिए, या \"मैंने बोलकर किया\" दबाइए।", saidAloud: "मैंने बोलकर किया", secondGo: "दूसरी कोशिश: सूची बंद कीजिए और सिर्फ़ वे याद कीजिए जिन पर टिक नहीं लगा।",
    secondHolder: "जो छूटे, याद से…", secondShow: "छूटे हुए जाँचिए", workedFirst: "Mains नया है? पहले एक बना हुआ ढाँचा देखिए",
    cardOf: (i, n) => `Card ${i} / ${n}`, keepDone: "हो गया", stop: "अभी यहीं रुकिए", carryOn: "आगे बढ़िए",
  },
};
const u = (k, ...a) => { const v = (UI[lang()] ?? UI.en)[k] ?? UI.en[k]; return typeof v === "function" ? v(...a) : v; };

// --- Progress on this device ----------------------------------------------------------------------------------------
// { route: "express" | "full" | null, pos: index in the route (-1 = cover), door: side-door step id or null, a: answers }

const key = () => "try:" + cur.id;
const prog = () => { const p = C.store.get(key(), null) ?? { route: null, pos: -1, a: {} }; if (p.a == null) p.a = {}; return p; };
const save = (p) => C.store.set(key(), p);
const setA = (k, v) => { const p = prog(); p.a[k] = v; save(p); };
const getA = (k, d = null) => prog().a[k] ?? d;
const stepById = (id) => cur.data.steps.find((s) => s.id === id);
const route = () => { const r = prog().route ?? "express"; return { id: r, ...cur.data.routes[r] }; };
/** The step as this route shows it: Express may use a shorter version (fewer items, fewer questions). */
const view = (st, r = route().id) => (r === "express" && st.express ? { ...st, ...st.express } : st);
function focusTop() { requestAnimationFrame(() => { document.querySelector(".try h1")?.focus?.(); window.scrollTo(0, 0); }); }
function go(pos, routeId) {
  const p = prog();
  if (routeId) p.route = routeId;
  p.pos = pos; p.door = null;
  if (pos >= 0) { p.last = { ...(p.last ?? {}), [p.route]: pos }; p.seen = { ...(p.seen ?? {}), [route().steps?.[pos] ?? pos]: true }; }
  save(p); draw(); focusTop();
}
function openDoor(id) { const p = prog(); p.door = id; save(p); draw(); focusTop(); send("door:" + id, "opened", null, true); }

// --- Feedback out ---------------------------------------------------------------------------------------------------
// Anonymous: a random session id, the path, the question and the answer. Queued if offline, sent with the next one.

function sessionId() {
  let s = C.store.get("try:session");
  if (!s) { s = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join(""); C.store.set("try:session", s); }
  return s;
}
async function post(path, body) {
  try {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: sessionId(), pathId: cur.id, lang: lang(), ...body }) });
    return await r.json().catch(() => ({ ok: r.ok }));
  } catch { return null; }
}
/** One answer. `quiet` ones (side doors opened, route chosen) are usage, not opinions; they go the same way. */
async function send(question, answer, text = null, quiet = false) {
  if (cur.draft && !quiet) { /* previews count too; editors' taps are marked by the draft flag in the question */ }
  const q = (cur.draft ? "draft:" : "") + question;
  const queue = C.store.get("try:outbox", []);
  queue.push({ question: q.slice(0, 48), answer, text });
  C.store.set("try:outbox", queue.slice(-60));
  const left = [];
  for (const item of C.store.get("try:outbox", [])) {
    const r = await post("/try/feedback", item);
    if (!r) left.push(item);
    if (r?.care) showCare();
  }
  C.store.set("try:outbox", left);
}
async function forget() {
  const r = await post("/try/forget", {});
  C.store.set("try:outbox", []);
  const p = prog(); for (const k of Object.keys(p.a)) if (/^(ask:|survey:|contact:)/.test(k)) delete p.a[k]; save(p);
  C.toast?.(r?.ok ? (lang() === "hi" ? "मिटा दिया गया।" : "Deleted.") : u("offline"));
}
function showCare() {
  const box = document.querySelector(".try-care");
  if (box && C.careBox) put(box, C.careBox());
}

// --- Loading -------------------------------------------------------------------------------------------------------

let root = null;
async function load(id, preview) {
  const headers = {};
  if (preview) {
    let k = ""; try { k = sessionStorage.getItem("token") || ""; } catch {}
    if (!k) k = prompt("Desk key, to preview a draft:") || "";
    if (k) { headers.authorization = "Bearer " + k; try { sessionStorage.setItem("token", k); } catch {} }
  }
  try {
    if (!id) {
      const r = await fetch("/try");
      const list = r.ok ? (await r.json()).items ?? [] : [];
      if (list.length === 1) { location.replace("#try/" + encodeURIComponent(list[0].id)); return null; }
      return { list };
    }
    const r = await fetch(`/try/${encodeURIComponent(id)}${preview ? "?preview=1" : ""}`, { headers });
    if (r.ok) { const d = await r.json(); C.store.set("try:data:" + id + (preview ? ":preview" : ""), d); return d; }
    if (r.status === 404 || r.status === 401) return { closed: true };
  } catch {}
  return C.store.get("try:data:" + id + (preview ? ":preview" : "")) ?? { closed: true }; // offline: the last copy
}

export function viewTry(arg = "") {
  const [path, query] = String(arg).split("?");
  const id = decodeURIComponent(path || "");
  const preview = /(^|&)preview/.test(query ?? "") || /[?&]preview/.test(location.hash);
  root = h("div.try.col", h("p.muted", u("loading")));
  load(id, preview).then((d) => {
    if (!d || !root.isConnected) return;
    if (d.list) return put(root, listView(d.list));
    if (d.closed) return put(root, closedView());
    cur = { id: d.id, data: d.data, draft: !!d.draft, languages: d.languages ?? ["en"] };
    P.init({ h, put, L, u, getA, setA, mcq, lang, send, forget, pathId: () => cur.id, head, joke, rich,
      contact: (contact, consentText, company) => post("/try/contact", { contact, consent: true, consentText, company }) });
    draw();
  });
  return root;
}

function closedView() {
  return [h("h1", "Try one topic"), h("p", u("notOpen")), h("p.muted", u("notOpenMore")), h("a.btn.primary", { href: "#shelf" }, u("shelf"))];
}
function listView(list) {
  if (!list.length) return closedView();
  return [h("h1", "Try one topic"), list.map((p) => h("a.card.link", { href: "#try/" + encodeURIComponent(p.id) }, h("strong", L(p.title))))];
}

// --- The frame around every screen ------------------------------------------------------------------------------------

const STAGES = ["learn", "practise", "write", "keep"];
function draw() {
  if (!root || !cur) return;
  const p = prog();
  document.documentElement.lang = lang();
  const strip = cur.draft && h("div.try-draft", { role: "status" }, u("draft"));
  if (p.pos < 0 || !p.route) return put(root, strip, cover());
  const r = route();
  if (p.door) {
    const st = stepById(p.door);
    if (st) return put(root, strip, bar(r, null), h("article", { lang: lang() }, renderStep(st)),
      h("div.try-nav", h("button.primary", { onclick: () => { const q = prog(); q.door = null; save(q); draw(); focusTop(); } }, "← " + u("backToPath"))));
  }
  const pos = Math.min(p.pos, r.steps.length - 1), st = view(stepById(r.steps[pos]));
  put(root, strip, bar(r, pos),
    h("article", { lang: lang() }, renderStep(st)),
    st.type !== "finish" && h("div.try-nav",
      h("button", { disabled: pos === 0, onclick: () => go(pos - 1) }, "← " + u("back")),
      h("button.primary", { onclick: () => go(pos + 1) }, u("next") + " →")));
}

/** One slim bar: back to the cover, the stage, where you are, and the language. */
function bar(r, pos) {
  const st = pos == null ? null : stepById(r.steps[pos]);
  const stage = st?.stage;
  return h("div.try-bar",
    h("a", { href: "#try/" + encodeURIComponent(cur.id), "aria-label": L(cur.data.title), onclick: (e) => { e.preventDefault(); go(-1); } }, "← " + L(cur.data.short ?? cur.data.title)),
    h("ol.try-stages", { "aria-label": "Stages" }, STAGES.map((s) => h("li" + (s === stage ? ".on" : STAGES.indexOf(s) < STAGES.indexOf(stage) ? ".past" : ""), { "aria-current": s === stage ? "step" : null }, u("stage")[s]))),
    pos != null && h("span.small.muted", u("of", pos + 1, r.steps.length)),
    langSwitch());
}

function langSwitch() {
  if (C.profile() || langs().length < 2) return null;
  return h("div.try-lang", [["en", "EN"], ["hi", "हि"]].filter(([c]) => langs().includes(c))
    .map(([c, n]) => h("button.chip", { "aria-pressed": String(lang() === c), "aria-label": c === "en" ? "English" : "हिन्दी", onclick: () => { C.store.set("try:lang", c); draw(); } }, n)));
}

function cover() {
  const d = cur.data, p = prog();
  const last = p.last ?? {};
  const routeBtn = (id, primary) => {
    const r = d.routes[id], at = last[id];
    return h("button" + (primary ? ".primary" : "") + ".try-route", { onclick: () => { send("route", id, null, true); go(at ?? 0, id); } },
      h("strong", `${L(r.label)} · ${u("min", r.minutes)}`), h("span.small", at != null ? u("resume") : L(r.note)));
  };
  return [
    h("div.try-bar", h("span.small.muted", "Aspiran"), langSwitch()),
    h("h1.try-headline", { tabindex: "-1" }, L(d.cover.headline)),
    h("p", L(d.cover.pitch)),
    h("div.try-routes", routeBtn("express", true), routeBtn("full", false)),
    h("p.small.muted", L(d.cover.honesty)),
    h("p.small.try-joke", L(d.cover.joke)),
    h("details.try-inside", h("summary", u("inside")),
      h("h3", L(d.cover.canDoTitle)), h("ul", d.canDo.map((x) => h("li", L(x)))),
      h("p", L(d.why)), h("p.small.muted", L(d.sittings))),
    (last.express != null || last.full != null) && h("button.ghost.small", { onclick: () => { if (confirm(u("startOver"))) { save({ route: null, pos: -1, a: {} }); draw(); } } }, u("restart")),
  ];
}

// --- Shared bits: the "why" note, a joke, a side door, the quick question --------------------------------------------

const head = (st) => h("h1", { tabindex: "-1" }, L(st.title));
const joke = (st) => st.joke && h("p.small.try-joke", L(st.joke));
const pause = (st) => st.pause && h("p.small.pause", L(st.pause));
function whyNote(st) {
  if (!st.why) return null;
  return h("details.try-why-note", { ontoggle: (e) => e.target.open && send("why:" + st.id, "opened", null, true) },
    h("summary.small", "🧠 " + u("whyNote")),
    h("p.small", L(st.why)),
    st.why.cite && h("p.small.muted", `${u("evidence")}: ${st.why.cite}${st.why.band ? ` · ${u("band", st.why.band)}` : ""}`));
}
function doors(st) {
  if (!st.doors?.length) return null;
  const r = route().id;
  const list = st.doors.filter((d) => !(typeof d === "object" && d.only && d.only !== r)).map((d) => (typeof d === "string" ? d : d.id));
  return list.map((id) => {
    const s = stepById(id);
    if (!s) return null;
    return h("button.card.link.try-door", { onclick: () => openDoor(id) },
      h("span.small.muted", `${s.icon ?? "🚪"} ${u("sideDoor")} · ${u("min", s.minutes ?? 2)}`), h("strong", L(s.doorTitle ?? s.title)), h("span", "›"));
  });
}
let privacyShown = false;
function quickAsk(st) {
  if (C.store.get("try:noAsk")) return null;
  const box = P.ask(st);
  if (!box) return null;
  const first = !privacyShown && !getA("privacy:seen");
  if (first) { privacyShown = true; setA("privacy:seen", true); }
  const off = h("button.ghost.small", { onclick: () => { C.store.set("try:noAsk", true); send("no-more-asks", "1", null, true); put(off.parentNode, h("p.small.muted", u("noMoreDone"))); } }, u("noMoreQs"));
  return [box, h("div.row.between", first ? h("p.small.muted", { style: { margin: 0 } }, u("privacyOnce")) : h("span"), off)];
}

function renderStep(st) {
  const body = STEP[st.type]?.(st) ?? [head(st)];
  const arr = Array.isArray(body) ? body : [body];
  // The "why" note sits just under the title; side doors and the quick question after the step's own content.
  // The finish screen places its own side doors (above the survey); a game's quick question waits until it's played.
  const played = st.type !== "sim-governor" || getA(st.id + ":at", 0) >= (st.rounds?.length ?? 0);
  return [arr[0], whyNote(st), arr.slice(1), st.type !== "finish" && doors(st), played && quickAsk(st), h("div.try-care")];
}

// --- One multiple-choice question --------------------------------------------------------------------------------
// No buzzer, no colour alone: the right answer and your pick are labelled in words, and the explanation always shows.
// With `sure`, the reader says how sure they are before the options open (calibration under negative marking).

function mcq(q, k, { sure = false, onDone } = {}) {
  const box = h("div.try-q");
  const drawQ = () => {
    const picked = getA(k + ":pick"), conf = getA(k + ":sure");
    const done = picked != null;
    const needSure = sure && conf == null && !done;
    put(box,
      q.source?.label && h("div.small.muted", L(q.source.label)),
      h("p.try-stem", L(q.q)),
      needSure && h("div.try-sure", h("span.small", u("sureHow")),
        h("div.row", u("sure3").map((label, lvl) => h("button", { onclick: () => { setA(k + ":sure", 2 - lvl); drawQ(); } }, label)))),
      h("div.try-opts", { role: "group" }, q.options.map((o, i) => h("button.opt" + (done ? (i === q.answer ? ".right" : i === picked ? ".wrong" : ".dim") : ""),
        { disabled: done || needSure, "aria-pressed": done && i === picked ? "true" : null,
          onclick: () => { setA(k + ":pick", i); drawQ(); onDone?.(i === q.answer); } },
        h("span.try-letter", "abcd"[i] + ") "), L(o),
        done && i === q.answer && h("span.try-flag", ` ✓ ${u("answer")}`), done && i === picked && i !== q.answer && h("span.try-flag", ` · ${u("yourPick")}`)))),
      done && h("p.try-why", { role: "status" }, h("strong", (picked === q.answer ? u("right") : u("notQuite")) + " "), L(q.why)),
      done && picked !== q.answer && q.missJoke && h("p.small.try-joke", L(q.missJoke)));
  };
  drawQ();
  return box;
}

// --- The steps -----------------------------------------------------------------------------------------------------

const STEP = {
  warmup: (st) => [head(st), joke(st), h("p.muted", L(st.lead)), st.questions.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`)))],

  // The text folds away before the check, so the check is remembering, not looking up.
  read(st) {
    const paras = L(st.body).split(/\n\n+/);
    const box = h("div");
    const drawR = () => {
      const tested = getA(st.id + ":tested", false) && (st.check ?? []).length > 0;
      const text = [h("div.reader.try-reader", paras.map((t) => h("p", rich(t)))), st.chart && chart(st.chart), st.remember && h("div.card.soft.try-remember", rich(L(st.remember)))];
      if (!(st.check ?? []).length) return put(box, text);
      if (!tested) return put(box, text, h("button.primary", { onclick: () => { setA(st.id + ":tested", true); drawR(); focusTop(); } }, u("doneReading") + " →"));
      put(box, h("h2", u("readCheck")), (st.check ?? []).map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`))),
        h("details.try-reread", h("summary.small", u("showText")), text));
    };
    drawR();
    return [
      head(st),
      h("div.small.muted.try-meta", [st.part && u("part", st.part), u("readMin", st.minutes)].filter(Boolean).join(" · ")),
      joke(st),
      box,
    ];
  },

  stop: (st) => [head(st), joke(st), h("p", L(st.body)), h("div.row", h("a.btn", { href: "#try/" + encodeURIComponent(cur.id), onclick: (e) => { e.preventDefault(); go(-1); } }, u("stop")))],

  sort(st) {
    const box = h("div");
    let sel = null;
    const items = (st.only ?? st.items.map((_, i) => i)).map((i) => [i, st.items[i]]);
    const drawS = () => {
      const place = getA(st.id + ":place", {}), checked = getA(st.id + ":checked", false);
      const left = items.filter(([i]) => place[i] == null);
      const wrong = checked ? items.filter(([i, it]) => place[i] !== it.bucket) : [];
      if (checked) {
        put(box,
          h("p", { role: "status" }, u("sortLook", wrong.length)),
          h("ul.try-sorted", items.map(([i, it]) => {
            const ok = place[i] === it.bucket;
            return h("li" + (ok ? ".ok" : ".no"), h("strong", L(it.text)), " · ",
              ok ? h("span", `✓ ${L(st.buckets[it.bucket])}`) : h("span", `${u("sortYouPut")} ${L(st.buckets[place[i]])} · ${u("sortIts")} `, h("strong", L(st.buckets[it.bucket]))),
              h("div.small.muted", L(it.why)));
          })),
          wrong.length > 0 && h("button", { onclick: () => { wrong.forEach(([i]) => delete place[i]); setA(st.id + ":place", place); setA(st.id + ":checked", false); drawS(); } }, u("sortAgain")));
        return;
      }
      put(box,
        h("p.small.muted", left.length ? u("sortPick") + " " + u("sortLeft", left.length) : ""),
        h("div.chips.try-pool", left.map(([i, it]) => h("button.chip", { "aria-pressed": String(sel === i), onclick: () => { sel = sel === i ? null : i; drawS(); } }, L(it.text)))),
        h("div.try-buckets", st.buckets.map((b, bi) => h("div.card.try-bucket",
          h("button.try-bucket-head" + (sel != null ? ".primary" : ""), { disabled: sel == null, onclick: () => { place[sel] = bi; setA(st.id + ":place", place); sel = null; drawS(); } }, L(b)),
          h("ul", items.map(([i, it]) => place[i] === bi && h("li", L(it.text),
            h("button.ghost.small", { "aria-label": "Undo", onclick: () => { delete place[i]; setA(st.id + ":place", place); drawS(); } }, "↺"))))))),
        !left.length && h("button.primary", { onclick: () => { setA(st.id + ":checked", true); drawS(); } }, u("sortCheck")));
    };
    drawS();
    return [head(st), joke(st), h("p.muted", L(st.lead)), box];
  },

  recall(st) {
    const ticks = getA("recall:ticks", {});
    const note = h("textarea", { rows: 8, placeholder: u("recallPlaceholder"), "aria-label": L(st.title), oninput: (e) => setA("recall:note", e.target.value) });
    note.value = getA("recall:note", "");
    const count = h("p.small.muted", { role: "status" });
    const upd = () => { const n = Object.values(getA("recall:ticks", {})).filter(Boolean).length; count.textContent = n ? u("recallCount", n, st.points.length) : ""; };
    const list = h("ul.try-ticks", st.points.map((pt, i) => h("li", h("label",
      h("input", { type: "checkbox", checked: !!ticks[i], onchange: (e) => { const t = getA("recall:ticks", {}); t[i] = e.target.checked; setA("recall:ticks", t); upd(); } }),
      " ", L(pt)))));
    // The checklist opens only after a real try (a few lines typed, or "I said it aloud"), then offers a second go on
    // the points missed: that second retrieval is where most of the gain is.
    const box = h("div");
    const drawC = () => {
      const open = getA("recall:open", false);
      if (!open) {
        put(box, h("p.small.muted", u("triedFirst")),
          h("div.row", h("button.primary", { onclick: () => { if ((getA("recall:note", "") || "").trim().length < 25) { note.focus(); return; } setA("recall:open", true); drawC(); } }, u("recallTick").replace(/:$/, "")),
            h("button", { onclick: () => { setA("recall:open", true); setA("recall:aloud", true); drawC(); } }, u("saidAloud"))));
        return;
      }
      const t = getA("recall:ticks", {}), missed = st.points.map((_, i) => i).filter((i) => !t[i]);
      const second = getA("recall:second");
      put(box, h("p", h("strong", u("recallTick"))), list, count, h("p.small", L(st.after)),
        missed.length > 0 && h("div.card.soft",
          h("p", u("secondGo")),
          second == null ? [h("textarea", { rows: 4, placeholder: u("secondHolder"), oninput: (e) => setA("recall:secondText", e.target.value) }),
            h("button", { onclick: () => { setA("recall:second", true); drawC(); } }, u("secondShow"))]
            : h("ul", missed.map((i) => h("li", L(st.points[i]))))));
    };
    upd(); drawC();
    return [head(st), joke(st), pause(st), h("p", L(st.prompt)), note, h("p.small.muted", u("recallSaved")), box];
  },

  // Real PYQs, one per screen, then a tally that is about calibration, not marks.
  pyq(st) {
    const qs = (st.only ?? st.questions.map((_, i) => i)).map((i) => [i, st.questions[i]]);
    const box = h("div");
    const drawP = () => {
      const at = Math.min(getA(st.id + ":at", 0), qs.length);
      if (at >= qs.length) {
        const res = qs.map(([i, q]) => ({ pick: getA(`${st.id}:${i}:pick`), sure: getA(`${st.id}:${i}:sure`), ans: q.answer })).filter((r) => r.pick != null);
        const right = res.filter((r) => r.pick === r.ans).length;
        // sure: 2 = sure, 1 = could rule some out, 0 = pure guess.
        const sw = res.filter((r) => r.sure === 2 && r.pick !== r.ans).length, ur = res.filter((r) => r.sure === 0 && r.pick === r.ans).length;
        const mid = res.filter((r) => r.sure === 1), midRight = mid.filter((r) => r.pick === r.ans).length;
        put(box, h("div.card.soft", { role: "status" },
          h("h3", { style: { marginTop: 0 } }, u("pyqTally", right, res.length)), h("p", u("sureWrongN", sw)), mid.length > 0 && h("p", u("guessRight", midRight, mid.length)), ur > 0 && h("p", u("unsureRight", ur)), st.tallyNote && h("p.small", L(st.tallyNote))),
          h("button.ghost", { onclick: () => { setA(st.id + ":at", 0); drawP(); } }, "← " + u("qOf", 1, qs.length)));
        return;
      }
      const [i, q] = qs[at];
      const picked = getA(`${st.id}:${i}:pick`);
      put(box,
        h("div.small.muted", u("qOf", at + 1, qs.length)),
        h("div.card", mcq(q, `${st.id}:${i}`, { sure: true, onDone: () => drawP() })),
        h("div.row", at > 0 && h("button.ghost", { onclick: () => { setA(st.id + ":at", at - 1); drawP(); } }, "←"),
          picked != null && h("button.primary", { onclick: () => { setA(st.id + ":at", at + 1); drawP(); focusTop(); } }, at + 1 < qs.length ? u("nextQ") + " →" : u("seeTally"))));
    };
    drawP();
    return [head(st), joke(st), h("p.muted", L(st.lead)), lang() === "hi" && st.hiNote?.hi && h("p.small.muted", st.hiNote.hi), box];
  },

  apply: (st) => [head(st), joke(st), h("p.muted", L(st.lead)), st.questions.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`)))],

  // Plan → our skeleton and a self-check → the better conclusion, as three screens inside one step.
  mains(st) {
    const box = h("div");
    const drawM = () => {
      const pick = getA("mains:pick");
      if (pick == null) {
        put(box, h("h2", u("choose")), st.questions.map((q) => h("button.card.link.try-pick", { onclick: () => { setA("mains:pick", q.id); drawM(); } },
          h("div.small.muted", `${L(q.source.label)} · ${q.marks} marks · ${q.words} words`), h("span", L(q.q)))));
        return;
      }
      const q = st.questions.find((x) => x.id === pick) ?? st.questions[0];
      const screen = getA("mains:screen:" + q.id, 0);
      const qCard = h("div.card",
        h("div.small.muted", `${L(q.source.label)} · ${q.marks} marks · ${q.words} words`),
        h("p.try-stem", L(q.q)),
        h("p.small", h("strong", u("directive") + ": "), L(q.directive)),
        h("button.ghost.small", { onclick: () => { setA("mains:pick", null); drawM(); } }, "↺ " + u("choose")));
      const to = (n) => { setA("mains:screen:" + q.id, n); drawM(); focusTop(); };
      if (screen === 0) {
        const plan = h("textarea", { rows: 7, placeholder: u("planHolder"), "aria-label": u("yourPlan"), oninput: (e) => { setA("mains:plan:" + q.id, e.target.value); show.disabled = e.target.value.trim().length < 15; } });
        plan.value = getA("mains:plan:" + q.id, "");
        const show = h("button.primary", { disabled: plan.value.trim().length < 15, onclick: () => to(1) }, u("showOurs"));
        const other = st.questions.find((x) => x.id !== q.id);
        put(box, qCard,
          other && h("details.try-worked", h("summary.small", u("workedFirst")),
            h("p.small.muted", L(other.q)), h("p.small", h("strong", u("intro") + ": "), L(other.skeleton.intro)),
            h("ol.small", other.skeleton.points.map((x) => h("li", L(x)))), h("p.small", h("strong", u("wayForward") + ": "), L(other.skeleton.wayForward))),
          h("label.small", u("yourPlan")), plan, h("div.row", show, h("button", { onclick: () => to(1) }, u("onPaper"))));
        return;
      }
      if (screen === 1) {
        const sk = q.skeleton, ticks = getA("mains:check:" + q.id, {});
        const mine = getA("mains:plan:" + q.id, "");
        put(box, qCard,
          mine && h("details", h("summary.small", u("yourPlan")), h("pre.try-mine-plan", mine)),
          h("div.card.soft",
            h("h3", { style: { marginTop: 0 } }, u("ours")),
            h("p", h("strong", u("intro") + ": "), L(sk.intro)),
            h("ol", sk.points.map((x) => h("li", L(x)))),
            h("p", h("strong", u("wayForward") + ": "), L(sk.wayForward)),
            h("p.small", h("strong", u("mistake") + ": "), L(q.commonMistake))),
          h("p", h("strong", u("checkYours"))),
          h("ul.try-ticks", st.selfCheck.map((c, i) => h("li", h("label",
            h("input", { type: "checkbox", checked: !!ticks[i], onchange: (e) => { const t = getA("mains:check:" + q.id, {}); t[i] = e.target.checked; setA("mains:check:" + q.id, t); } }), " ", L(c))))),
          h("button.primary", { onclick: () => to(2) }, u("toConclusions") + " →"));
        return;
      }
      put(box, h("h2", u("whichBetter")), st.conclusions.pairs.map((pr, n) => betterPick(pr, `mains:concl:${n}`)),
        h("button.ghost", { onclick: () => to(1) }, "← " + u("ours")));
    };
    drawM();
    return [head(st), joke(st), pause(st), h("p.muted", L(st.lead)), box];
  },

  // Keep it is a real attempt: the warm-up guesses come back first (closing the pretest loop), then each card cold.
  // A right answer starts the card a few days out; a miss brings it back tomorrow. The schedule follows memory.
  keep(st) {
    const box = h("div");
    const warm = stepById("warmup")?.questions ?? [];
    const cards = st.onlyCards ? st.cards.filter((c) => st.onlyCards.includes(c.id)) : st.cards;
    const items = [...warm.map((q, i) => ({ q, k: `keep:warm:${i}`, warm: true })), ...cards.map((c) => ({ q: c, k: `keep:${c.id}`, card: c }))];
    const drawK = () => {
      const kept = getA("keep:done");
      const at = Math.min(getA("keep:at", 0), items.length);
      if (!kept && at < items.length) {
        const it = items[at], picked = getA(it.k + ":pick");
        put(box,
          h("div.small.muted", it.warm ? L(st.revisit) : u("cardOf", at - warm.length + 1, cards.length)),
          h("div.card", mcq(it.q, it.k, { onDone: (ok) => { if (it.card) grade(it.card, ok); drawK(); } })),
          picked != null && h("button.primary", { onclick: () => { setA("keep:at", at + 1); drawK(); } }, at + 1 < items.length ? u("next") + " →" : u("keepDone")));
        return;
      }
      if (!kept) { setA("keep:done", keepCards(st, cards)); return drawK(); }
      put(box,
        kept && h("div.card.soft", { role: "status" },
          h("p", h("strong", u("kept") + " "), u("firstBack", kept.n, kept.due)),
          h("p", u("mapMet")),
          h("p.small.muted", C.profile() ? u("keepMember") : u("keepVisitor")),
          C.profile() && h("div.row", h("a.btn", { href: "#review" }, u("openReview")), h("a.btn", { href: "#map" }, u("openMap")))));
    };
    drawK();
    return [head(st), joke(st), h("p.muted", L(st.lead)), box];
  },

  finish(st) {
    const d = cur.data, r = route().id;
    return [
      h("h1", { tabindex: "-1" }, L(st.title)),
      pause(st),
      h("div.card", h("h3", { style: { marginTop: 0 } }, u("canDo")), h("ul", d.canDo.filter((x) => r === "full" || !x.fullOnly).map((x) => h("li", L(x))))),
      r === "express" && h("button.try-route", { onclick: () => { const p = prog(); go(p.last?.full ?? 0, "full"); } }, h("strong", u("switchFull")), h("span.small", L(d.routes.full.note))),
      h("p", L(st.next)),
      doors(st),
      st.survey && P.survey(stepById(st.survey), { embedded: true }),
      C.profile()
        ? h("div.row", h("a.btn.primary", { href: "#review" }, u("openReview")), h("a.btn", { href: "#map" }, u("openMap")))
        : h("div.row", h("a.btn.primary", { href: "#" }, u("join")), h("a.btn", { href: "#shelf" }, u("another"))),
      h("div.row", { style: { marginTop: "12px" } }, h("button.ghost", { onclick: () => go(route().steps.length - 2) }, "← " + u("back"))),
    ];
  },

  video: (st) => P.video(st),
  "sim-gst": (st) => P.simGst(st),
  "sim-governor": (st) => P.simGovernor(st),
  essay: (st) => P.essay(st),
  news: (st) => P.news(st),
  tour: (st) => P.tour(st),
  survey: (st) => P.survey(st),
};

/**
 * One series of bars (a number per label): one hue, thin bars from a zero baseline, the value written beside each bar,
 * a tooltip on hover or tap, and the numbers as a list for screen readers. Single series, so no legend: the title names it.
 */
function chart(c) {
  const max = c.max ?? Math.max(...c.bars.map((b) => b.value));
  const tip = h("div.try-tip", { role: "status", "aria-live": "polite" });
  return h("figure.try-chart",
    h("figcaption", h("strong", L(c.title))),
    h("div.try-bars", { "aria-hidden": "true" }, c.bars.map((b) => h("div.try-barrow",
      { tabindex: "0", onmouseenter: () => (tip.textContent = `${L(b.label)}: ${b.value}${c.unit}`), onfocus: () => (tip.textContent = `${L(b.label)}: ${b.value}${c.unit}`), onclick: () => (tip.textContent = `${L(b.label)}: ${b.value}${c.unit}`) },
      h("span.small", L(b.label)),
      h("span.try-track", h("i", { style: { width: `${(100 * b.value) / max}%` } })),
      h("span.small.try-val", `${b.value}${c.unit}`)))),
    h("ul.sr-only", c.bars.map((b) => h("li", `${L(b.label)}: ${b.value}${c.unit}`))),
    tip,
    c.note && h("p.small.muted", L(c.note)));
}

/** "Spot the better conclusion": two answers, pick one, then why. */
function betterPick(pr, k) {
  const box = h("div.card");
  const drawB = () => {
    const pick = getA(k);
    put(box, h("p.small.muted", L(pr.q)),
      ["a", "b"].map((side, i) => h("button.opt" + (pick == null ? "" : i === pr.better ? ".right" : i === pick ? ".wrong" : ""),
        { disabled: pick != null, onclick: () => { setA(k, i); drawB(); } }, h("span.try-letter", side.toUpperCase() + ") "), L(pr[side]),
        pick != null && i === pr.better && h("span.try-flag", ` ✓ ${u("answer")}`))),
      pick != null && h("p.try-why", { role: "status" }, h("strong", (pick === pr.better ? u("right") : u("notQuite")) + " "), L(pr.why)));
  };
  drawB();
  return box;
}

/**
 * Into the app's own review queue (store "reviews", the shape app.js uses) and the syllabus map ("map"). Every card starts
 * as a fresh FSRS card marked Good today, so its first return is a few days out. The map note is the reader's own recall.
 */
const mcqIn = (c, l) => (c.q[l] ? { question: c.q[l], options: c.options.map((o) => o[l] ?? o.en), answerIndex: c.answer, explanation: c.why[l] ?? c.why.en } : null);
/** One card into the app's review queue, graded by the attempt: a miss is Again (back tomorrow), a hit is Good. */
function grade(c, ok) {
  const day = C.today();
  const all = C.store.get("reviews", {}) ?? {};
  const id = `${cur.id}:${c.id}`;
  if (all[id]?.f?.last === day) return; // graded today already
  all[id] = { q: { id, topic: cur.data.title.en, en: mcqIn(c, "en"), hi: langs().includes("hi") ? mcqIn(c, "hi") : null }, f: F.review(all[id]?.f ?? null, ok ? F.GOOD : F.AGAIN, day) };
  C.store.set("reviews", all);
}
function keepCards(st, cards = st.cards) {
  const day = C.today();
  const all = C.store.get("reviews", {}) ?? {};
  let due = null;
  for (const c of cards) {
    const id = `${cur.id}:${c.id}`;
    if (!all[id]) { grade(c, getA(`keep:${c.id}:pick`) === c.answer); }
    const f = (C.store.get("reviews", {}) ?? {})[id]?.f;
    if (f) due = !due || f.due < due ? f.due : due;
  }
  const m = C.store.get("map", {}) ?? {};
  m[cur.data.node] = MP.meet(m[cur.data.node], day, (getA("recall:note", "") || "").slice(0, 2000));
  C.store.set("map", m);
  return { on: day, n: cards.length, due: new Date((due ?? day) + "T12:00:00").toLocaleDateString(lang() === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long" }) };
}

function injectStyles() {
  if (document.getElementById("try-css")) return;
  document.head.append(h("style", { id: "try-css" }, `
.try { max-width: 760px; padding-bottom: 84px; }
.try h1 { margin-top: 6px; }
.try h1:focus { outline: none; }
.try-headline { font-size: clamp(26px, 6vw, 36px); line-height: 1.15; }
.try-draft { font-size: 12px; padding: 4px 10px; border-radius: 8px; background: #fff4e5; color: #7a3e00; margin-bottom: 6px; }
.try-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-height: 44px; border-bottom: 1px solid var(--line, #0001); margin-bottom: 8px; }
.try-bar > a { font-size: 14px; margin-right: auto; }
.try-stages { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; font-size: 12px; }
.try-stages li { padding: 2px 8px; border-radius: 999px; color: var(--muted, #666); }
.try-stages li.past { color: inherit; }
.try-stages li.on { background: var(--brand, #9a4b0b); color: #fff; font-weight: 600; }
.try-lang { display: flex; gap: 4px; }
.try-lang .chip { min-width: 40px; min-height: 36px; }
.try-routes { display: grid; gap: 10px; margin: 16px 0 6px; }
.try-route { display: grid; gap: 2px; text-align: left; padding: 12px 16px; width: 100%; }
.try-inside { margin-top: 14px; }
.try-meta { margin: -4px 0 10px; }
.try-reader p { line-height: 1.7; margin: 0 0 1em; }
.try :lang(hi) p, .try:lang(hi) p, .try [lang="hi"] p, .try [lang="hi"] li { line-height: 1.85; }
.try-remember { font-size: 15px; }
.try-reread { margin-top: 14px; }
.try-chart { margin: 8px 0 18px; }
.try-bars { display: grid; gap: 6px; margin-top: 8px; }
.try-barrow { display: grid; grid-template-columns: 7.5em 1fr 3em; align-items: center; gap: 8px; padding: 4px 0; cursor: default; }
.try-track { position: relative; height: 10px; border-left: 1px solid var(--muted, #8888); }
.try-track i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 0 4px 4px 0; background: var(--try-bar); }
.try { --try-bar: #9A4E0E; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .try { --try-bar: #C4772A; } }
:root[data-theme="dark"] .try { --try-bar: #C4772A; }
.try-barrow:hover .try-track i, .try-barrow:focus .try-track i { filter: brightness(1.15); }
.try-val { text-align: right; font-variant-numeric: tabular-nums; }
.try-tip { min-height: 1.4em; font-size: 13px; }
.try-sure .row { flex-wrap: wrap; }
.try-stem { white-space: pre-line; font-weight: 600; }
.try-opts { display: grid; gap: 8px; }
.try .opt { text-align: left; width: 100%; }
.try .opt:disabled { opacity: 1; cursor: default; color: inherit; }
.try .opt.right { font-weight: 600; border-width: 2px; }
.try .opt.dim { opacity: .72; }
.try-flag { font-size: 13px; font-weight: 700; white-space: nowrap; }
.try-letter { opacity: .7; }
.try-why { margin-top: 10px; }
.try-sure { margin: 6px 0 10px; }
.try-sure .row { margin-top: 6px; }
.try-pool { min-height: 40px; }
.try-buckets { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-top: 10px; }
.try-bucket ul { list-style: none; padding: 0; margin: 8px 0 0; }
.try-bucket li { padding: 6px 0; border-top: 1px solid var(--line, #0001); display: flex; justify-content: space-between; align-items: center; }
.try-bucket-head { width: 100%; font-weight: 700; }
.try-bucket-head:disabled { opacity: 1; background: var(--soft, #f4f1ea); color: inherit; }
.try-sorted { list-style: none; padding: 0; }
.try-sorted li { padding: 8px 0; border-top: 1px solid var(--line, #0001); }
.try-sorted li.no { border-left: 3px solid #b42318; padding-left: 8px; }
.try-ticks { list-style: none; padding: 0; }
.try-ticks li { margin: 8px 0; }
.try-ticks input { margin-right: 6px; }
.try-pick { display: block; width: 100%; text-align: left; margin-bottom: 10px; }
.try-cards li { margin: 6px 0; }
.try-door { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 2px 10px; width: 100%; text-align: left; margin: 12px 0 0; }
.try-door > span:last-child { grid-row: 1 / 3; grid-column: 2; align-self: center; font-size: 20px; }
.try-mine-plan { white-space: pre-wrap; font: inherit; font-size: 14px; }
.try-nav { position: sticky; bottom: 0; display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; margin-top: 18px; background: var(--bg, #f5f3ee); border-top: 1px solid var(--line, #0001); z-index: 2; }
.try-nav button { min-height: 48px; min-width: 110px; }
.try textarea { width: 100%; }
@media print { .try-nav, .try-bar { display: none; } }
${P.CSS}
`));
}
