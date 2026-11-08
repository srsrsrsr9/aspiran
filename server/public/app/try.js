// "Try one topic" (#try): one whole syllabus topic, open to visitors with no account. It walks a topic path
// (aspiran/topic-path@1, served by server/src/try.ts) one step at a time: guess first, read in short parts with a check
// after each, sort the lists, say it from memory, real PYQs with a "how sure?" tick, three situations, plan a Mains
// answer, then keep it (the cards go into the same review queue and syllabus map the app uses) and finish.
//
// The rules it follows: one thing on screen at a time; every step ends; no timers, streaks or public scores (the only
// counts shown are private, on this device); try before show (a skeleton opens only after you've planned your own);
// no sound or motion; nothing is sent anywhere. Progress stays in this browser, under try:<id>, so a visitor who joins
// later on the same browser keeps their review cards.
//
// Members see it inside the app shell; visitors see it in the public shell (PUBLIC in app.js). Editors can walk a
// draft with #try/<id>?preview and their desk key.

import * as F from "./fsrs.js";
import * as MP from "./map.js";

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
const UI = {
  en: {
    loading: "Loading the topic…", notOpen: "This topic opens once an editor has checked it.", notOpenMore: "In the meantime, the Free Shelf works without an account.",
    shelf: "Open the Free Shelf", step: (i, n) => `Step ${i} of ${n}`, back: "Back", next: "Next", start: "Start", resume: "Carry on where you left off",
    restart: "Start again", startOver: "Start this topic again? Your answers on this page are cleared; cards already in your review stay.",
    sure: "Sure", notSure: "Not sure", pickSure: "First: how sure are you?", right: "Right.", notQuite: "Not quite.", answer: "Answer",
    readCheck: "Quick check", readMin: (m) => `About ${m} min`, part: (n) => `Part ${n} of 5`,
    sortPick: "Tap a subject, then its list.", sortCheck: "Check", sortLeft: (n) => `${n} left to place`, sortAgain: "Try the ones you missed again",
    recallPlaceholder: "Type what you remember, or say it aloud and just tick below.", recallTick: "Now tick what you got:",
    recallCount: (a, n) => `You recalled ${a} of ${n}. Only you see this.`, recallSaved: "Saved on this device.",
    pyqTally: (r, n, s) => `${r} of ${n} right. ${s}`, sureWrong: (n) => n ? `${n} you were sure of but got wrong: those are the costly ones in Prelims.` : "Nothing you were sure of went wrong. Good calibration.",
    unsureRight: (n) => n ? ` ${n} you weren't sure of were right: you know more than you think.` : "",
    choose: "Choose one question", yourPlan: "Your plan (about two minutes, no clock):", planHolder: "Opening line…\n1.\n2.\n3.\nWay forward…",
    onPaper: "I planned on paper", showOurs: "Show our skeleton", ours: "Our skeleton", intro: "Open", wayForward: "Way forward", mistake: "Common mistake",
    checkYours: "Check your plan against these:", whichBetter: "Pick the better one", directive: "What the question asks",
    keepBtn: "Add these to my review", kept: "Added to your review.", firstBack: (d) => `The first ones come back on ${d}.`,
    keepVisitor: "Saved in this browser. Join free to keep them on your phone and in your pod.", keepMember: "They're in Review, with the rest of your queue.",
    mapMet: "Federalism is now Met on your syllabus map.", openReview: "Open Review", openMap: "Your syllabus map",
    canDo: "You can now:", join: "Join free, no card needed", another: "Look around the Free Shelf", draft: "Draft: not yet checked by an editor. Only people with a desk key see this.",
    langLabel: "Read in", sittings: "How long", whyTopic: "Why this topic", promise: "What you'll be able to do",
    peek: "Show the answer", saidIt: "Said it", pyqSource: "Source",
  },
  hi: {
    loading: "Topic खुल रहा है…", notOpen: "यह topic संपादक की जाँच के बाद खुलेगा।", notOpenMore: "तब तक Free Shelf बिना account के चलता है।",
    shelf: "Free Shelf खोलिए", step: (i, n) => `चरण ${i} / ${n}`, back: "पीछे", next: "आगे", start: "शुरू करें", resume: "जहाँ छोड़ा था, वहीं से",
    restart: "फिर से शुरू", startOver: "यह topic फिर से शुरू करें? इस पेज के आपके जवाब मिट जाएँगे; review में जा चुके cards बने रहेंगे।",
    sure: "पक्का", notSure: "पक्का नहीं", pickSure: "पहले: आप कितने पक्के हैं?", right: "सही।", notQuite: "पूरी तरह नहीं।", answer: "उत्तर",
    readCheck: "छोटी जाँच", readMin: (m) => `लगभग ${m} मिनट`, part: (n) => `भाग ${n} / 5`,
    sortPick: "पहले विषय पर टैप कीजिए, फिर उसकी सूची पर।", sortCheck: "जाँचिए", sortLeft: (n) => `${n} बाक़ी`, sortAgain: "जो छूटे, उन्हें फिर से कीजिए",
    recallPlaceholder: "जो याद है, लिखिए, या ज़ोर से बोलिए और बस नीचे टिक कीजिए।", recallTick: "अब जो आया, उस पर टिक कीजिए:",
    recallCount: (a, n) => `आपको ${n} में से ${a} याद आए। यह केवल आप देखते हैं।`, recallSaved: "इसी device पर सहेजा गया।",
    pyqTally: (r, n, s) => `${n} में से ${r} सही। ${s}`, sureWrong: (n) => n ? `${n} पर आप पक्के थे पर गलत हुए: Prelims में यही महँगे पड़ते हैं।` : "जिन पर आप पक्के थे, उनमें कोई गलत नहीं हुआ। अच्छा अंदाज़ा।",
    unsureRight: (n) => n ? ` ${n} पर आप पक्के नहीं थे पर सही थे: आपको जितना लगता है, उससे ज़्यादा पता है।` : "",
    choose: "एक सवाल चुनिए", yourPlan: "आपका ढाँचा (लगभग दो मिनट, कोई घड़ी नहीं):", planHolder: "शुरुआत…\n1.\n2.\n3.\nआगे का रास्ता…",
    onPaper: "मैंने काग़ज़ पर बनाया", showOurs: "हमारा ढाँचा दिखाइए", ours: "हमारा ढाँचा", intro: "शुरुआत", wayForward: "आगे का रास्ता", mistake: "आम ग़लती",
    checkYours: "अपने ढाँचे को इनसे मिलाइए:", whichBetter: "बेहतर वाला चुनिए", directive: "सवाल क्या माँगता है",
    keepBtn: "इन्हें मेरे review में जोड़िए", kept: "आपके review में जुड़ गए।", firstBack: (d) => `पहले cards ${d} को लौटेंगे।`,
    keepVisitor: "इस browser में सहेजा गया। Phone और pod में रखने के लिए मुफ़्त जुड़िए।", keepMember: "ये Review में आपकी बाक़ी सूची के साथ हैं।",
    mapMet: "संघवाद अब आपके syllabus map पर Met है।", openReview: "Review खोलिए", openMap: "आपका syllabus map",
    canDo: "अब आप:", join: "मुफ़्त जुड़िए, कोई card नहीं चाहिए", another: "Free Shelf देखिए", draft: "Draft: अभी संपादक ने नहीं जाँचा। यह केवल desk key वालों को दिखता है।",
    langLabel: "पढ़ें", sittings: "कितना समय", whyTopic: "यह topic क्यों", promise: "आप क्या कर पाएँगे",
    peek: "उत्तर दिखाइए", saidIt: "बोल लिया", pyqSource: "स्रोत",
  },
};
const u = (k, ...a) => { const v = (UI[lang()] ?? UI.en)[k] ?? UI.en[k]; return typeof v === "function" ? v(...a) : v; };

// --- Progress on this device ----------------------------------------------------------------------------------------

const key = () => "try:" + cur.id;
const prog = () => C.store.get(key(), { step: -1, a: {} });
const save = (p) => C.store.set(key(), p);
const setA = (k, v) => { const p = prog(); p.a[k] = v; save(p); };
const getA = (k, d = null) => prog().a[k] ?? d;
function go(step) {
  const p = prog(); p.step = step; if (step >= 0) p.last = step; save(p);
  draw();
  requestAnimationFrame(() => { document.querySelector(".try h1, .try h2")?.focus?.(); window.scrollTo(0, 0); });
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

// --- The frame around every step -------------------------------------------------------------------------------------

const steps = () => cur.data.steps;
function draw() {
  if (!root) return;
  const p = prog();
  document.documentElement.lang = lang();
  const banner = cur.draft && h("div.card.try-draft", { role: "status" }, u("draft"));
  if (p.step < 0) return put(root, banner, cover());
  const i = Math.min(p.step, steps().length - 1), st = steps()[i];
  const body = STEP[st.type]?.(st, i) ?? h("p", st.type);
  put(root, banner,
    h("div.row.between.try-top",
      h("a.small", { href: "#try/" + encodeURIComponent(cur.id), onclick: (e) => { e.preventDefault(); go(-1); } }, "← " + L(cur.data.title)),
      h("span.small.muted", u("step", i + 1, steps().length))),
    h("div.dots", { "aria-hidden": "true" }, steps().map((_, k) => h("i" + (k <= i ? ".on" : "")))),
    langSwitch(),
    h("article", { lang: lang() }, body),
    st.type !== "finish" && h("div.row.between.try-nav",
      h("button", { disabled: i === 0, onclick: () => go(i - 1) }, "← " + u("back")),
      h("button.primary", { onclick: () => go(i + 1) }, u("next") + " →")));
}

function langSwitch() {
  if (C.profile() || langs().length < 2) return null;
  return h("div.row", h("span.small.muted", u("langLabel")),
    h("div.chips", [["en", "English"], ["hi", "हिन्दी"]].filter(([c]) => langs().includes(c))
      .map(([c, n]) => h("button.chip", { "aria-pressed": String(lang() === c), onclick: () => { C.store.set("try:lang", c); draw(); } }, n))));
}

function cover() {
  const d = cur.data, p = prog(), started = p.last != null;
  return [
    langSwitch(),
    h("h1", { tabindex: "-1" }, L(d.title)),
    h("p", L(d.promise)),
    h("div.card.soft", h("h3", { style: { marginTop: 0 } }, u("promise")), h("ul", d.canDo.map((x) => h("li", L(x))))),
    h("p", h("strong", u("whyTopic") + ": "), L(d.why).replace(/^[^:：]+[:：]\s*/, "")),
    h("p.small.muted", h("strong", u("sittings") + ": "), L(d.sittings)),
    h("div.row",
      h("button.primary", { onclick: () => go(started ? Math.max(0, p.last ?? 0) : 0) }, started ? u("resume") : u("start")),
      started && h("button.ghost", { onclick: () => { if (confirm(u("startOver"))) { save({ step: -1, a: {} }); draw(); } } }, u("restart"))),
  ];
}

// --- One multiple-choice question --------------------------------------------------------------------------------
// No buzzer, no colour alone: the result is in words, and the explanation always shows. With `sure`, the reader says
// how sure they are before the options open (calibration, the Prelims skill of knowing when you're guessing).

function mcq(q, k, { sure = false, onDone } = {}) {
  const box = h("div.try-q");
  const drawQ = () => {
    const picked = getA(k + ":pick"), conf = getA(k + ":sure");
    const done = picked != null;
    const needSure = sure && conf == null && !done;
    put(box,
      q.source?.label && h("div.small.muted", u("pyqSource") + ": " + q.source.label),
      h("p.try-stem", L(q.q)),
      needSure && h("div.try-sure", h("span.small", u("pickSure")),
        h("div.row", h("button", { onclick: () => { setA(k + ":sure", 1); drawQ(); } }, u("sure")), h("button", { onclick: () => { setA(k + ":sure", 0); drawQ(); } }, u("notSure")))),
      h("div.try-opts", { role: "group" }, q.options.map((o, i) => h("button.opt" + (done ? (i === q.answer ? ".right" : i === picked ? ".wrong" : "") : ""),
        { disabled: done || needSure, "aria-pressed": done && i === picked ? "true" : null,
          onclick: () => { setA(k + ":pick", i); drawQ(); onDone?.(i === q.answer); } },
        h("span.try-letter", "abcd"[i] + ") "), L(o), done && i === q.answer ? " ✓" : ""))),
      done && h("p.try-why", { role: "status" }, h("strong", picked === q.answer ? u("right") + " " : u("notQuite") + " " + u("answer") + ": " + "abcd"[q.answer] + ". "), L(q.why)));
  };
  drawQ();
  return box;
}

// --- The steps -----------------------------------------------------------------------------------------------------

const head = (st) => h("h1", { tabindex: "-1" }, L(st.title));
const pause = (st) => st.pause && h("p.small.pause", L(st.pause));

const STEP = {
  warmup: (st) => [head(st), h("p.muted", L(st.lead)), st.questions.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`)))],

  read(st) {
    const paras = L(st.body).split(/\n\n+/);
    return [
      h("div.small.muted", `${u("part", st.part)} · ${u("readMin", st.minutes)}`),
      head(st),
      h("div.reader.try-reader", paras.map((t) => h("p", t))),
      h("h2", u("readCheck")),
      st.check.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`))),
    ];
  },

  sort(st) {
    const box = h("div");
    let sel = null;
    const drawS = () => {
      const place = getA(st.id + ":place", {}), checked = getA(st.id + ":checked", false);
      const left = st.items.map((_, i) => i).filter((i) => place[i] == null);
      const wrong = checked ? st.items.map((_, i) => i).filter((i) => place[i] !== st.items[i].bucket) : [];
      put(box,
        h("p.small.muted", left.length ? u("sortPick") + " " + u("sortLeft", left.length) : ""),
        h("div.chips.try-pool", left.map((i) => h("button.chip", { "aria-pressed": String(sel === i), onclick: () => { sel = sel === i ? null : i; drawS(); } }, L(st.items[i].text)))),
        h("div.try-buckets", st.buckets.map((b, bi) => h("div.card.try-bucket",
          h("button" + (sel != null ? ".primary" : ""), { disabled: sel == null || checked, onclick: () => { place[sel] = bi; setA(st.id + ":place", place); sel = null; drawS(); } }, L(b)),
          h("ul", st.items.map((it, i) => place[i] === bi && h("li" + (checked ? (it.bucket === bi ? ".try-ok" : ".try-no") : ""),
            L(it.text), checked && (it.bucket === bi ? " ✓" : ` → ${L(st.buckets[it.bucket])}`),
            checked && h("div.small.muted", L(it.why)),
            !checked && h("button.ghost.small", { "aria-label": "Undo", onclick: () => { delete place[i]; setA(st.id + ":place", place); drawS(); } }, "↺"))))))),
        !left.length && !checked && h("button.primary", { onclick: () => { setA(st.id + ":checked", true); drawS(); } }, u("sortCheck")),
        checked && h("p", { role: "status" }, h("strong", `${st.items.length - wrong.length} / ${st.items.length}`)),
        checked && wrong.length > 0 && h("button", { onclick: () => { wrong.forEach((i) => delete place[i]); setA(st.id + ":place", place); setA(st.id + ":checked", false); drawS(); } }, u("sortAgain")));
    };
    drawS();
    return [head(st), h("p.muted", L(st.lead)), box];
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
    // The checklist stays folded until they've tried: recall first, then compare.
    const tried = getA("recall:open", false);
    const reveal = h("details", { open: tried, ontoggle: (e) => e.target.open && setA("recall:open", true) }, h("summary", u("recallTick")), list, count, h("p.small", L(st.after)));
    upd();
    return [head(st), pause(st), h("p", L(st.prompt)), note, h("p.small.muted", u("recallSaved")), reveal];
  },

  pyq(st) {
    const tally = h("p", { role: "status" });
    const upd = () => {
      const res = st.questions.map((q, n) => ({ pick: getA(`${st.id}:${n}:pick`), sure: getA(`${st.id}:${n}:sure`), ans: q.answer })).filter((r) => r.pick != null);
      if (res.length < st.questions.length) { tally.textContent = ""; return; }
      const right = res.filter((r) => r.pick === r.ans).length;
      const sureWrong = res.filter((r) => r.sure === 1 && r.pick !== r.ans).length, unsureRight = res.filter((r) => r.sure === 0 && r.pick === r.ans).length;
      tally.textContent = u("pyqTally", right, res.length, u("sureWrong", sureWrong) + u("unsureRight", unsureRight));
    };
    const qs = st.questions.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`, { sure: true, onDone: upd })));
    upd();
    return [head(st), h("p.muted", L(st.lead)), lang() === "hi" && st.hiNote?.hi && h("p.small.muted", st.hiNote.hi), qs, tally];
  },

  apply: (st) => [head(st), h("p.muted", L(st.lead)), st.questions.map((q, n) => h("div.card", mcq(q, `${st.id}:${n}`)))],

  mains(st) {
    const box = h("div");
    const drawM = () => {
      const pick = getA("mains:pick");
      if (pick == null) {
        put(box, h("h2", u("choose")), st.questions.map((q) => h("button.card.link.try-pick", { onclick: () => { setA("mains:pick", q.id); drawM(); } },
          h("div.small.muted", `${q.source.label} · ${q.marks} marks · ${q.words} words`), h("span", L(q.q)))));
        return;
      }
      const q = st.questions.find((x) => x.id === pick) ?? st.questions[0];
      const shown = getA("mains:shown:" + q.id, false);
      const plan = h("textarea", { rows: 7, placeholder: u("planHolder"), "aria-label": u("yourPlan"), oninput: (e) => { setA("mains:plan:" + q.id, e.target.value); show.disabled = e.target.value.trim().length < 20; } });
      plan.value = getA("mains:plan:" + q.id, "");
      const show = h("button.primary", { disabled: plan.value.trim().length < 20, onclick: () => { setA("mains:shown:" + q.id, true); drawM(); } }, u("showOurs"));
      const sk = q.skeleton;
      const ticks = getA("mains:check:" + q.id, {});
      put(box,
        h("div.card",
          h("div.small.muted", `${q.source.label} · ${q.marks} marks · ${q.words} words`),
          h("p.try-stem", L(q.q)),
          h("p.small", h("strong", u("directive") + ": "), L(q.directive)),
          h("button.ghost.small", { onclick: () => { setA("mains:pick", null); drawM(); } }, "↺ " + u("choose"))),
        h("label.small", u("yourPlan")), plan,
        !shown && h("div.row", show, h("button", { onclick: () => { setA("mains:shown:" + q.id, true); drawM(); } }, u("onPaper"))),
        shown && h("div.card.soft",
          h("h3", { style: { marginTop: 0 } }, u("ours")),
          h("p", h("strong", u("intro") + ": "), L(sk.intro)),
          h("ol", sk.points.map((x) => h("li", L(x)))),
          h("p", h("strong", u("wayForward") + ": "), L(sk.wayForward)),
          h("p.small", h("strong", u("mistake") + ": "), L(q.commonMistake))),
        shown && h("div", h("p", h("strong", u("checkYours"))), h("ul.try-ticks", st.selfCheck.map((c, i) => h("li", h("label",
          h("input", { type: "checkbox", checked: !!ticks[i], onchange: (e) => { const t = getA("mains:check:" + q.id, {}); t[i] = e.target.checked; setA("mains:check:" + q.id, t); } }), " ", L(c)))))),
        shown && h("h2", L(st.conclusions.title)),
        shown && st.conclusions.pairs.map((pr, n) => betterPick(pr, `mains:concl:${n}`)));
    };
    drawM();
    return [head(st), pause(st), h("p.muted", L(st.lead)), box];
  },

  keep(st) {
    const box = h("div");
    const drawK = () => {
      const kept = getA("keep:done");
      put(box,
        h("ol.try-cards", st.cards.map((c) => h("li", L(c.q)))),
        !kept && h("button.primary", { onclick: () => { setA("keep:done", keepCards(st)); drawK(); } }, u("keepBtn")),
        kept && h("div.card.soft", { role: "status" },
          h("p", h("strong", u("kept") + " "), u("firstBack", kept.due)),
          h("p", u("mapMet")),
          h("p.small.muted", C.profile() ? u("keepMember") : u("keepVisitor")),
          C.profile() && h("div.row", h("a.btn", { href: "#review" }, u("openReview")), h("a.btn", { href: "#map" }, u("openMap")))));
    };
    drawK();
    return [head(st), h("p.muted", L(st.lead)), box];
  },

  finish(st) {
    const d = cur.data;
    return [
      h("h1", { tabindex: "-1" }, L(st.title)),
      pause(st),
      h("div.card", h("h3", { style: { marginTop: 0 } }, u("canDo")), h("ul", d.canDo.map((x) => h("li", L(x))))),
      h("p", L(st.next)),
      C.profile()
        ? h("div.row", h("a.btn.primary", { href: "#review" }, u("openReview")), h("a.btn", { href: "#map" }, u("openMap")))
        : h("div.row", h("a.btn.primary", { href: "#" }, u("join")), h("a.btn", { href: "#shelf" }, u("another"))),
      h("div.row", { style: { marginTop: "12px" } }, h("button.ghost", { onclick: () => go(steps().length - 2) }, "← " + u("back"))),
    ];
  },
};

/** "Spot the better conclusion": two answers, pick one, then why. */
function betterPick(pr, k) {
  const box = h("div.card");
  const drawB = () => {
    const pick = getA(k);
    put(box, h("p.small.muted", L(pr.q)), h("p.small", u("whichBetter")),
      ["a", "b"].map((side, i) => h("button.opt" + (pick == null ? "" : i === pr.better ? ".right" : i === pick ? ".wrong" : ""),
        { disabled: pick != null, onclick: () => { setA(k, i); drawB(); } }, h("span.try-letter", side.toUpperCase() + ") "), L(pr[side]), pick != null && i === pr.better ? " ✓" : "")),
      pick != null && h("p.try-why", { role: "status" }, h("strong", (pick === pr.better ? u("right") : u("notQuite")) + " "), L(pr.why)));
  };
  drawB();
  return box;
}

/**
 * Into the app's own review queue (store "reviews", the shape app.js uses) and the syllabus map ("map"). Every card starts
 * as a fresh FSRS card marked Good today, so its first return is a few days out. The map note is the reader's own recall.
 */
function keepCards(st) {
  const day = C.today();
  const all = C.store.get("reviews", {}) ?? {};
  const topic = cur.data.title.en;
  const mcqIn = (c, l) => (c.q[l] ? { question: c.q[l], options: c.options.map((o) => o[l] ?? o.en), answerIndex: c.answer, explanation: c.why[l] ?? c.why.en } : null);
  let due = null;
  for (const c of st.cards) {
    const id = `${cur.id}:${c.id}`;
    const f = all[id]?.f ? all[id].f : F.review(null, F.GOOD, day);
    all[id] = { q: { id, topic, en: mcqIn(c, "en"), hi: langs().includes("hi") ? mcqIn(c, "hi") : null }, f };
    due = !due || f.due < due ? f.due : due;
  }
  C.store.set("reviews", all);
  const m = C.store.get("map", {}) ?? {};
  m[cur.data.node] = MP.meet(m[cur.data.node], day, (getA("recall:note", "") || "").slice(0, 2000));
  C.store.set("map", m);
  return { on: day, due: new Date(due + "T12:00:00").toLocaleDateString(lang() === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long" }) };
}

function injectStyles() {
  if (document.getElementById("try-css")) return;
  document.head.append(h("style", { id: "try-css" }, `
.try { max-width: 760px; }
.try h1:focus { outline: none; }
.try-top { margin-bottom: 6px; }
.try .dots { margin: 4px 0 14px; }
.try-draft { border-color: var(--brand); font-size: 14px; }
.try-reader p { line-height: 1.7; margin: 0 0 1em; }
.try-stem { white-space: pre-line; font-weight: 600; }
.try-opts { display: grid; gap: 8px; }
.try-opts .opt, .try .opt { text-align: left; width: 100%; }
.try-letter { opacity: .7; }
.try .opt:disabled { opacity: 1; cursor: default; }
.try .opt.right { font-weight: 600; }
.try-opts:has(.right) .opt:not(.right):not(.wrong) { opacity: .6; }
.try-why { margin-top: 10px; }
.try-sure { margin: 6px 0 10px; }
.try-sure .row { margin-top: 6px; }
.try-pool { min-height: 40px; }
.try-buckets { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-top: 10px; }
.try-bucket ul { list-style: none; padding: 0; margin: 8px 0 0; }
.try-bucket li { padding: 6px 0; border-top: 1px solid var(--line, #0001); }
.try-bucket > button { width: 100%; }
.try-ok { }
.try-no { font-weight: 600; }
.try-ticks { list-style: none; padding: 0; }
.try-ticks li { margin: 8px 0; }
.try-ticks input { margin-right: 6px; }
.try-pick { display: block; width: 100%; text-align: left; margin-bottom: 10px; }
.try-cards li { margin: 6px 0; }
.try-nav { margin-top: 18px; }
.try textarea { width: 100%; }
@media print { .try-nav, .try-top, .try .dots { display: none; } }
`));
}
