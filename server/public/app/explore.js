// Prep → Learn and play (every approved engine item, playable on the web), the Plus tools (weekly Chai test,
// monthly compilation, mock insights with an error log, revise everything you missed) and the upgrade screen.
//
// Learn and play is free, like every practice type (community-first spec §7). Plus tools carry a small "Plus" tag and
// give a real taste before asking. The upgrade screen lives in Prep only, follows the same never-list as offers
// (no prices in pause, result-day mode, after a distress check or late at night) and sends people to Me → Plus,
// which owns payments (Cashfree or test mode). The four Plus tools are gated by the member's plan from /plus/status,
// whether or not the plus flag is on (a plan can be granted from admin after an offline payment); everything else
// stays open. Previews stay generous, and only the offer copy goes quiet in quiet times, never the gate.

import { plusSalesPage } from "./plus-page.js";

let C = null;
/** app.js hands over its helpers once at start, so this file shares one store, one language and one renderer. */
export function init(ctx) { C = ctx; injectStyles(); }

const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);
const T = (v) => C.bi(v);
const L = (v) => (v && typeof v === "object" ? (v[C.lang()] ?? v.en ?? []) : []);

// --- Subjects and families -----------------------------------------------------------------------

const SUBJECTS = [["pol", "Polity"], ["his", "Modern history"], ["anc", "Ancient and medieval"], ["art", "Art and culture"], ["geo", "Geography"],
  ["env", "Environment"], ["eco", "Economy"], ["sci", "Science and tech"], ["ir", "World and India"], ["soc", "Society"], ["eth", "Ethics"],
  ["mains", "Answer writing"], ["ess", "Essay"], ["csat", "CSAT"]];
const SUBJECT_NAME = Object.fromEntries(SUBJECTS);
/** Subject from the id's prefix (pol-, geo-, ...). Older items without one go by a few words in the title. */
function subjectOf(it) {
  const id = String(it.data?.id ?? "");
  const p = id.split("-")[0];
  if (SUBJECT_NAME[p]) return p;
  const t = (T(it.data?.title) + " " + id).toLowerCase();
  if (/constitution|article|parliament|preamble|governor|president|court|amendment|citizenship|election|schedule|federal|defection|bill/.test(t)) return "pol";
  if (/monsoon|river|cyclone|lake|strait|map|geograph|soil|climate|nino/.test(t)) return "geo";
  if (/mughal|harappa|vedic|maurya|gupta|ancient|medieval/.test(t)) return "anc";
  if (/ethic|dilemma|integrity|virtue/.test(t)) return "eth";
  if (/answer|directive|essay|mains/.test(t)) return "mains";
  if (/scheme|gdp|inflation|bank|tax|economy|budget/.test(t)) return "eco";
  if (/forest|tiger|wildlife|biodiversity|pollution|stubble|environment/.test(t)) return "env";
  if (/1857|congress|gandhi|freedom|reform|british|colonial/.test(t)) return "his";
  return "more";
}
const FAMILIES = [
  ["choose", "Quick questions", "Pick one. A wrong answer gets an explanation, never a buzzer."],
  ["reveal", "Flip cards", "Read the front, say it, turn it over."],
  ["match", "Match", "Tap one on the left, then its partner."],
  ["order", "Put in order", "Tap them in order, then check."],
  ["sort", "Sort it", "Each one goes in a bucket."],
  ["cloze", "Fill the gap", "Tap a gap, then the word."],
  ["compare", "Side by side", "Two things, row by row."],
  ["steps", "Step through", "One step at a time. Answer skeletons, stories and dilemmas."],
  ["hub", "Link web", "One topic, linked across papers."],
  ["picture", "Picture stories", "The Hidden Why: a picture, a pattern, a name for it."],
];
const KIND_NAME = {
  "trap-spotter": "Trap spotter", "better-answer": "Better answer", "odd-one-out": "Odd one out", "two-truths": "Two truths and a lie", "who-am-i": "Who am I?",
  "assertion-reason": "Assertion and reason", "how-many-correct": "How many are correct?", "bucket-sort": "Sort into buckets", "union-state-list": "Union, State or Concurrent",
  "fact-or-opinion": "Fact or opinion", "rank-it": "Rank it", "timeline-shuffle": "Timeline", "pair-up": "Pair up", "committee-match": "Committee match", flashcards: "Flashcards",
  mnemonic: "Mnemonic", "acronym-unpack": "Acronym", "landmark-case": "Landmark case", "scheme-snapshot": "Scheme snapshot", "index-card": "Index card", "word-bank": "Word bank",
  "directive-word": "Directive words", "two-levels": "Two levels", "story-beats": "Story", "ethics-dilemma": "Ethics dilemma", "answer-skeleton": "Answer skeleton", versus: "Versus",
  "before-after": "Before and after", "link-web": "Link web", "fill-the-gap": "Fill the gap", "hidden-why": "The Hidden Why",
};
const playable = () => (C.data.library?.items ?? []).filter((i) => i.data?.play?.engine);
const sizeOf = (p) => (p.rounds?.length ?? p.items?.length ?? p.pairs?.length ?? p.cards?.length ?? p.beats?.length ?? p.choices?.length ?? p.rows?.length ?? p.spokes?.length ?? p.frames?.length ?? p.answers?.length ?? 0);
const unitOf = (p) => ({ choose: "question", sort: "item", order: "item", match: "pair", reveal: "card", steps: "step", compare: "row", hub: "link", cloze: "gap", picture: "frame" }[p.engine] ?? "part");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const done = () => C.store.get("learnDone", {});
const markLearnt = (id, score) => { const d = done(); d[id] = { day: C.today(), score }; C.store.set("learnDone", d); };

// --- Plus: who has it ------------------------------------------------------------------------------

let plusCache = null;
/** /plus/status for this member, fetched once a session. Open only with a plan, flag or no flag. */
async function plusStatus() {
  if (plusCache) return plusCache;
  const me = C.profile()?.memberId;
  const st = await C.getJson(`/plus/status?member=${encodeURIComponent(me ?? "")}`);
  plusCache = st ? { ...st, open: !!st.plan } : { open: false, offline: true };
  setTimeout(() => { plusCache = null; }, 5 * 60_000);
  return plusCache;
}
export function forgetPlus() { plusCache = null; }
/** The quiet card that says a tool is part of Plus, with the taste above it. Never a padlock on anything free. */
const plusNote = (what) => offerQuiet()
  ? h("div.card.soft.plus-note", h("div.row.between", h("strong", what), h("span.tag", "Plus")),
    h("p.small", { style: { margin: "6px 0" } }, "That was the preview. This is a Plus tool."), h("div.row", h("a.btn", { href: "#learn" }, "Back")))
  : h("div.card.soft.plus-note", h("div.row.between", h("strong", what), h("span.tag", "Plus")),
    h("p.small", { style: { margin: "6px 0" } }, "That was the preview. This is a Plus tool: the rest opens with Plus, along with every mock paper, full mock insights and the monthly compilation."),
    h("div.row", h("a.btn.primary", { href: "#upgrade" }, "See what Plus adds"), h("a.btn", { href: "#learn" }, "Not now")));
/** Offers follow the never-list: not in pause, result-day mode, after a distress check, or late at night. */
function offerQuiet() {
  if (C.paused()) return "paused";
  if (C.resultMode()) return "result";
  if (C.careRecently()) return "care";
  const n = new Date(), hm = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  if (hm >= "22:30" || hm < "06:00") return "late";
  return null;
}

// --- Learn and play: the shelf ---------------------------------------------------------------------

export function viewLearn(arg) {
  if (arg) return player(decodeURIComponent(arg));
  const items = playable();
  const f = C.store.get("learnFilter", { subject: "", family: "" });
  const setF = (k, v) => { C.store.set("learnFilter", { ...f, [k]: f[k] === v ? "" : v }); C.render(); };
  const subjects = SUBJECTS.filter(([k]) => items.some((i) => subjectOf(i) === k));
  if (items.some((i) => subjectOf(i) === "more")) subjects.push(["more", "More"]);
  const shown = items.filter((i) => (!f.subject || subjectOf(i) === f.subject) && (!f.family || i.data.play.engine === f.family));
  const d = done();
  const tile = (it) => {
    const p = it.data.play, n = sizeOf(p), mine = d[it.id];
    return h("a.card.link.learn-tile", { href: "#learn/" + encodeURIComponent(it.id) },
      h("div.small.muted", `${KIND_NAME[it.kind] ?? it.kind} · ${SUBJECT_NAME[subjectOf(it)] ?? "More"}`),
      h("strong", T(it.data.title) || "Untitled"),
      h("div.small.muted", plural(n, unitOf(p)) + (mine ? ` · done ${mine.day}${mine.score ? `, ${mine.score}` : ""}` : "")));
  };
  const byFamily = FAMILIES.map(([fam, name, lead]) => [fam, name, lead, shown.filter((i) => i.data.play.engine === fam)]).filter((x) => x[3].length);
  const total = items.reduce((a, i) => a + sizeOf(i.data.play), 0);
  return h("div.col",
    h("h1", "Learn and play"),
    h("p.muted", items.length
      ? `${plural(items.length, "piece")}, ${total} questions and cards in all. Free, no card needed. Every piece plays to an end.`
      : "Pieces appear here once an editor approves them on the desk."),
    toolsStrip(),
    items.length > 0 && h("div.chips", { style: { marginBottom: "6px" } },
      subjects.map(([k, name]) => h("button.chip", { "aria-pressed": String(f.subject === k), onclick: () => setF("subject", k) }, name))),
    items.length > 0 && h("div.chips", FAMILIES.filter(([fam]) => items.some((i) => i.data.play.engine === fam))
      .map(([fam, name]) => h("button.chip", { "aria-pressed": String(f.family === fam), onclick: () => setF("family", fam) }, name))),
    byFamily.map(([, name, lead, list]) => h("section",
      h("h2", name, h("span.small.muted", { style: { fontWeight: 400, marginLeft: "8px" } }, String(list.length))),
      h("p.small.muted", { style: { marginTop: 0 } }, lead),
      h("div.learn-grid", list.map(tile)))),
    items.length > 0 && shown.length === 0 && h("p", "Nothing matches both filters. Tap a chip again to clear it."));
}

/** The four Plus tools, as a strip on Learn and Practice. */
export function toolsStrip() {
  const tools = [["#ptest", "Weekly Chai test", "This week's Chai questions as one test"], ["#insights", "Mock insights", "Subject breakdown, trend and error log"],
    ["#revise", "Revise my misses", "Every question you got wrong, in one go"], ["#pcompile", "Monthly compilation", "The month's Chai questions by topic"]];
  return h("div.tools-strip", tools.map(([href, name, lead]) => h("a.card.link.tool", { href },
    h("div.row.between", h("strong", name), h("span.tag", "Plus")), h("div.small.muted", lead))));
}

// --- Players, one per engine --------------------------------------------------------------------------

function player(id) {
  const it = playable().find((x) => x.id === id);
  if (!it) return h("div.col", h("p", "That piece isn't available."), h("a.btn", { href: "#learn" }, "Learn and play"));
  const p = it.data.play;
  const body = h("div");
  const finish = (score) => {
    markLearnt(id, score);
    put(body, h("div.card", h("h2", { style: { marginTop: 0 } }, "Done."), score && h("p", score),
      h("div.row", h("button", { onclick: () => { put(body, PLAYERS[p.engine]?.(p, finish) ?? h("p", "This kind can't play on the web yet.")); } }, "Play again"),
        h("a.btn.primary", { href: "#learn" }, "Back to Learn and play"), nextPiece(it))));
  };
  put(body, PLAYERS[p.engine]?.(p, finish) ?? h("p", "This kind can't play on the web yet."));
  const checked = it.data.review?.en;
  return h("div.col",
    h("a.small", { href: "#learn" }, "← Learn and play"),
    h("div.small.muted", `${KIND_NAME[it.kind] ?? it.kind} · ${SUBJECT_NAME[subjectOf(it)] ?? "More"}`),
    h("h1", { style: { marginTop: "4px" } }, T(it.data.title)),
    body,
    h("p.small.muted", checked?.checkedBy ? `Checked by ${checked.checkedBy}, ${checked.checkedOn} ✓` : "", it.data.sources ? ` Sources: ${T(it.data.sources)}` : ""));
}
function nextPiece(it) {
  const list = playable().filter((x) => x.id !== it.id && subjectOf(x) === subjectOf(it) && !done()[x.id]);
  const n = list[0];
  return n ? h("a.btn", { href: "#learn/" + encodeURIComponent(n.id) }, "Next: " + T(n.data.title)) : null;
}

const pre = (text, tag = "p") => h(tag, { style: { whiteSpace: "pre-line" } }, text);
const counter = (i, n) => h("div.small.muted", `${i + 1} of ${n}`);

const PLAYERS = {
  choose(p, finish) {
    let i = 0, right = 0;
    const box = h("div");
    const draw = () => {
      if (i >= p.rounds.length) return finish(`${right} of ${p.rounds.length} right.`);
      const r = p.rounds[i], opts = L(r.options);
      let picked = null;
      const tags = (r.tags ?? []).map(T);
      const clues = L(r.clues);
      const next = h("button.primary", { disabled: true, onclick: () => { i++; draw(); } }, i + 1 < p.rounds.length ? "Next" : "Finish");
      const opt = h("div");
      const drawOpts = () => put(opt, opts.map((o, k) => h("button.opt" + (picked == null ? "" : k === r.answer ? ".right" : k === picked ? ".wrong" : ""),
        { disabled: picked != null, onclick: () => { picked = k; if (k === r.answer) right++; next.disabled = false; drawOpts(); } },
        o, picked != null && tags[k] ? h("span.tag", tags[k]) : null)),
        picked != null && h("p", (picked === r.answer ? "✓ Right. " : "○ Not quite. ") + T(r.why)));
      drawOpts();
      put(box, counter(i, p.rounds.length), h("div.card", pre(T(r.prompt)), clues.length > 0 && h("ol", clues.map((c) => h("li", c))), opt), next);
    };
    draw();
    return box;
  },

  sort(p, finish) {
    const buckets = L(p.buckets);
    const items = C.shuffle(p.items.map((x, k) => ({ ...x, k })), Date.now() % 9973);
    let i = 0, right = 0;
    const box = h("div");
    const draw = () => {
      if (i >= items.length) return finish(`${right} of ${items.length} in the right bucket.`);
      const it = items[i];
      let picked = null;
      const next = h("button.primary", { disabled: true, onclick: () => { i++; draw(); } }, i + 1 < items.length ? "Next" : "Finish");
      const opt = h("div");
      const drawOpts = () => put(opt, h("div.row.wrap", buckets.map((b, k) => h("button" + (picked == null ? "" : k === it.bucket ? ".opt.right" : k === picked ? ".opt.wrong" : ""),
        { disabled: picked != null, style: { flex: "1 1 30%" }, onclick: () => { picked = k; if (k === it.bucket) right++; next.disabled = false; drawOpts(); } }, b))),
        picked != null && h("p", (picked === it.bucket ? "✓ " : `○ It goes in ${buckets[it.bucket]}. `) + T(it.why)));
      drawOpts();
      put(box, counter(i, items.length), h("div.card", h("p.sort-item", h("strong", T(it.text))), opt), next);
    };
    draw();
    return box;
  },

  order(p, finish) {
    const n = p.items.length;
    const pool = C.shuffle(p.items.map((x, k) => ({ ...x, k })), Date.now() % 7919);
    let seq = [], checked = false;
    const box = h("div");
    const draw = () => {
      const right = checked ? seq.filter((x, pos) => x.k === pos).length : 0;
      put(box, h("p", T(p.prompt)),
        h("div.card", h("div.small.muted", "Your order"), seq.length === 0 && h("p.small.muted", "Tap the items below, first one first."),
          h("ol", seq.map((x, pos) => h("li.order-row" + (checked ? (x.k === pos ? ".right" : ".wrong") : ""), T(x.label), checked && h("span.small.muted", "  " + T(x.value)))))),
        !checked && h("div", pool.filter((x) => !seq.includes(x)).map((x) => h("button.opt", { onclick: () => { seq.push(x); draw(); } }, T(x.label)))),
        h("div.row", !checked && seq.length > 0 && h("button", { onclick: () => { seq.pop(); draw(); } }, "Undo"),
          !checked && seq.length === n && h("button.primary", { onclick: () => { checked = true; draw(); } }, "Check"),
          checked && right < n && h("button", { onclick: () => { seq = []; checked = false; draw(); } }, "Try again")),
        checked && h("div.card.soft", h("strong", right === n ? "All in order." : `${right} of ${n} in the right place. The right order:`),
          right < n && h("ol", p.items.map((x) => h("li", T(x.label), h("span.small.muted", "  " + T(x.value))))),
          p.takeaway && h("p", T(p.takeaway))),
        checked && h("button.primary", { onclick: () => finish(`${right} of ${n} in place.`) }, "Finish"));
    };
    draw();
    return box;
  },

  match(p, finish) {
    const n = p.pairs.length;
    const left = p.pairs.map((x, k) => ({ text: T(x.left), k }));
    const right = C.shuffle(p.pairs.map((x, k) => ({ text: T(x.right), k })), Date.now() % 6151);
    let sel = null, matched = new Set(), tries = 0, miss = null;
    const box = h("div");
    const draw = () => {
      put(box, h("div.match-grid",
        h("div", h("div.small.muted", T(p.left)), left.map((x) => h("button.opt" + (matched.has(x.k) ? ".right" : ""),
          { disabled: matched.has(x.k), "aria-pressed": String(sel === x.k), onclick: () => { sel = x.k; miss = null; draw(); } }, x.text))),
        h("div", h("div.small.muted", T(p.right)), right.map((x) => h("button.opt" + (matched.has(x.k) ? ".right" : miss === x.k ? ".wrong" : ""),
          { disabled: matched.has(x.k) || sel == null, onclick: () => { tries++; if (x.k === sel) { matched.add(x.k); sel = null; miss = null; } else miss = x.k; draw(); } }, x.text)))),
        h("p.small.muted", sel == null ? "Tap one on the left." : miss != null ? "Not that one. Try another." : "Now tap its partner."),
        matched.size === n && h("button.primary", { onclick: () => finish(`All ${n} matched in ${tries} tries.`) }, "Finish"));
    };
    draw();
    return box;
  },

  reveal(p, finish) {
    const cards = p.cards;
    let i = -1, flipped = false, knew = 0;
    const box = h("div");
    const draw = () => {
      if (i === -1 && p.intro) return put(box, h("div.card.flip", pre(T(p.intro), "h2")), h("button.primary", { onclick: () => { i = 0; draw(); } }, "Start"));
      if (i === -1) i = 0;
      if (i >= cards.length) {
        return put(box, p.outro && h("div.card.soft", pre(T(p.outro))), h("button.primary", { onclick: () => finish(`You knew ${knew} of ${cards.length}.`) }, "Finish"));
      }
      const c = cards[i];
      put(box, counter(i, cards.length),
        h("button.card.flip", { "aria-live": "polite", onclick: () => { flipped = !flipped; draw(); } },
          h("div.small.muted", flipped ? "Back" : "Front · tap to turn over"), pre(flipped ? T(c.back) : T(c.front), flipped ? "p" : "h2")),
        flipped ? h("div.row", h("button", { onclick: () => { i++; flipped = false; draw(); } }, "Not yet"),
          h("button.primary", { onclick: () => { knew++; i++; flipped = false; draw(); } }, "I knew it"))
          : h("div.row", i > 0 && h("button.ghost", { onclick: () => { i--; draw(); } }, "← Back"), h("button.primary", { onclick: () => { flipped = true; draw(); } }, "Turn over")));
    };
    draw();
    return box;
  },

  steps(p, finish) {
    const box = h("div");
    if (p.choices?.length) {
      let chosen = null, all = false;
      const draw = () => put(box, h("div.card", pre(T(p.intro)), h("p", h("strong", T(p.question)))),
        h("p.small.muted", "There's no right answer here. Pick what you would do, then see what follows."),
        p.choices.map((c, k) => h("div", h("button.opt" + (chosen === k ? "[aria-pressed=true]" : ""), { "aria-pressed": String(chosen === k), disabled: chosen != null && !all,
          onclick: () => { chosen = k; draw(); } }, T(c.label)),
        (chosen === k || all) && h("div.card.soft", h("p", { style: { margin: 0 } }, T(c.outcome)), h("p.small.muted", { style: { margin: "6px 0 0" } }, "Values: " + T(c.values))))),
        chosen != null && !all && h("button", { onclick: () => { all = true; draw(); } }, "See the other choices"),
        all && p.outro && h("div.card", h("strong", "To think about"), h("p", T(p.outro))),
        all && h("button.primary", { onclick: () => finish("") }, "Finish"));
      draw();
      return box;
    }
    let i = 0;
    const draw = () => {
      const b = p.beats[i];
      put(box, p.intro && h("div.card.soft", pre(T(p.intro))), counter(i, p.beats.length),
        h("div.card", h("div.small.muted", T(b.head)), pre(T(b.text))),
        i === p.beats.length - 1 && p.outro && h("div.card.soft", pre(T(p.outro))),
        h("div.row", i > 0 && h("button.ghost", { onclick: () => { i--; draw(); } }, "← Back"),
          i < p.beats.length - 1 ? h("button.primary", { onclick: () => { i++; draw(); } }, "Next") : h("button.primary", { onclick: () => finish("") }, "Finish")));
    };
    draw();
    return box;
  },

  compare(p, finish) {
    return h("div", p.heading && pre(T(p.heading), "h2"),
      h("div.compare", h("table", h("thead", h("tr", h("th", ""), h("th", T(p.a)), h("th", T(p.b)))),
        h("tbody", p.rows.map((r) => h("tr", h("th", T(r.label)), h("td", T(r.a)), h("td", T(r.b))))))),
      p.takeaway && h("div.card.soft", T(p.takeaway)),
      h("button.primary", { onclick: () => finish("") }, "Got it"));
  },

  hub(p, finish) {
    return h("div", h("div.card.hub-center", h("h2", { style: { margin: 0 } }, T(p.center))),
      h("div.learn-grid", p.spokes.map((s) => h("div.card", h("strong", T(s.label)), h("p.small", { style: { margin: "4px 0 0" } }, T(s.link))))),
      p.question && h("div.card.soft", h("strong", "Try this: "), T(p.question)),
      h("button.primary", { onclick: () => finish("") }, "Done"));
  },

  cloze(p, finish) {
    const bank = L(p.bank);
    const parts = String(T(p.text)).split(/\[\[(\d+)\]\]/);
    const fill = {};
    let gap = null, checked = false;
    const box = h("div");
    const draw = () => {
      let right = 0;
      const text = parts.map((s, k) => {
        if (k % 2 === 0) return s;
        const g = Number(s) - 1, w = fill[g];
        const ok = checked && w === p.answers[g];
        if (ok) right++;
        return h("button.gap" + (checked ? (ok ? ".right" : ".wrong") : gap === g ? ".on" : ""), { disabled: checked, onclick: () => { gap = g; draw(); } },
          w != null ? bank[w] : `(${g + 1})`);
      });
      put(box, h("div.card", h("p.cloze", text)),
        !checked && h("div.chips", bank.map((w, k) => h("button.chip", { disabled: gap == null, onclick: () => { fill[gap] = k; gap = null; draw(); } }, w))),
        !checked && h("p.small.muted", gap == null ? "Tap a gap first." : `Now pick the word for gap ${gap + 1}.`),
        !checked && Object.keys(fill).length === p.answers.length && h("button.primary", { onclick: () => { checked = true; draw(); } }, "Check"),
        checked && h("div.card.soft", h("strong", `${right} of ${p.answers.length} right. `),
          right < p.answers.length && h("span", "Right words: " + p.answers.map((a, k) => `${k + 1}. ${bank[a]}`).join(", ") + ". "), T(p.why)),
        checked && h("button.primary", { onclick: () => finish(`${right} of ${p.answers.length} gaps.`) }, "Finish"));
    };
    draw();
    return box;
  },

  picture(p, finish) {
    let i = 0;
    const box = h("div");
    const draw = () => {
      if (i < p.frames.length) {
        return put(box, p.image && h("img.hidden-why", { src: p.image, alt: "" }), counter(i, p.frames.length), h("div.card", h("p", T(p.frames[i].text))),
          h("div.row", i > 0 && h("button.ghost", { onclick: () => { i--; draw(); } }, "← Back"), h("button.primary", { onclick: () => { i++; draw(); } }, "Next")));
      }
      put(box, h("div.card", h("div.small.muted", "It has a name"), h("h2", { style: { margin: "4px 0" } }, T(p.named)), h("p", T(p.sayItSmart))),
        h("div.card.soft", h("strong", "Careful: "), T(p.careful)),
        p.followUp?.q && h("details.card", h("summary", T(p.followUp.q)), h("p", T(p.followUp.hint))),
        p.useItIn?.length > 0 && h("div.card", h("strong", "Use it in"), h("ul", p.useItIn.map((u) => h("li", h("strong", T(u.paper) + ": "), T(u.text))))),
        h("button.primary", { onclick: () => finish("") }, "Finish"));
    };
    draw();
    return box;
  },
};

// --- Plus tools ---------------------------------------------------------------------------------------

/** A run of MCQs with the app's own question block. `limit` cuts it short for a taste. */
function mcqRun(qs, { limit = Infinity, onDone, title } = {}) {
  const box = h("div.mcqrun");
  let i = 0, right = 0;
  const n = Math.min(qs.length, limit);
  const draw = () => {
    if (i >= n) return put(box, onDone ? onDone(right, n) : h("div.card", h("strong", `${right} of ${n} right.`)));
    const q = qs[i];
    const next = h("button.primary", { disabled: true, onclick: () => { i++; draw(); } }, i + 1 < n ? "Next" : "Finish");
    put(box, h("div.small.muted", `${title ? title + " · " : ""}${i + 1} of ${n}${q.topic ? " · " + q.topic : ""}`),
      h("div.card", C.mcqBlock(C.mcqOf(q), (ok) => { if (ok) { right++; C.gotRight(q); } else C.addMiss(q); next.disabled = false; })), next);
  };
  draw();
  return box;
}
const weekQs = () => {
  const from = C.addDays(C.today(), -7);
  const cards = (C.data.questions?.fromCards ?? []).filter((q) => q.en && q.day >= from);
  return cards;
};
const monthQs = () => {
  const from = C.addDays(C.today(), -30);
  return (C.data.questions?.fromCards ?? []).filter((q) => q.en && q.day >= from);
};

export function viewWeeklyTest() {
  const qs = weekQs();
  const box = h("div", h("p.muted", "Loading…"));
  plusStatus().then((st) => {
    if (!qs.length) return put(box, h("p", "No Chai questions from the last 7 days yet. They come with each day's checked cards."));
    if (st.open) return put(box, mcqRun(qs, { title: "Weekly Chai test", onDone: (r, n) => h("div.card", h("h2", { style: { marginTop: 0 } }, `${r} of ${n} right.`), h("p.muted", "Wrong ones come back in Prelims practice and in Revise my misses."), h("a.btn", { href: "#practice" }, "Back to Practice")) }));
    put(box, h("p.small.muted", `This week's test has ${plural(qs.length, "question")}. Here are the first ${Math.min(3, qs.length) === 1 ? "one" : Math.min(3, qs.length) === 2 ? "two" : "three"}.`),
      mcqRun(qs, { limit: 3, title: "Preview", onDone: () => plusNote("The weekly Chai test") }));
  });
  return h("div.col", h("h1", "Weekly Chai test"), h("p.muted", "Every Exam Corner question from the last 7 days of Chai, as one test. Checked by an editor, like the cards."), box);
}

export function viewCompilation() {
  const qs = monthQs();
  const box = h("div", h("p.muted", "Loading…"));
  plusStatus().then((st) => {
    if (!qs.length) return put(box, h("p", "Nothing from the last 30 days yet."));
    const groups = {};
    qs.forEach((q) => (groups[q.topic || "Other"] ??= []).push(q));
    const topics = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    const section = ([topic, list]) => h("section.card", h("h2", { style: { marginTop: 0 } }, topic, h("span.small.muted", { style: { fontWeight: 400, marginLeft: "8px" } }, String(list.length))),
      list.map((q) => { const m = C.mcqOf(q); return h("div.compile-q", h("div.small.muted", q.day), h("p", { style: { margin: "4px 0" } }, h("strong", m.question)),
        h("p.small", { style: { margin: 0 } }, "Answer: " + m.options[m.answerIndex]), m.explanation && h("p.small.muted", { style: { margin: "2px 0 0" } }, m.explanation)); }));
    if (st.open) return put(box, h("div.row.no-print", h("button", { onclick: () => print() }, "Print or save as PDF")), topics.map(section));
    put(box, h("p.small.muted", `${plural(qs.length, "question")} across ${plural(topics.length, "topic")}. Here's the first topic.`), section(topics[0]), plusNote("The monthly compilation"));
  });
  return h("div.col", h("h1", "Monthly compilation"), h("p.muted", "The last 30 days of Chai questions, grouped by topic, with answers and explanations. Print it for revision."), box);
}

export function viewRevise() {
  const misses = C.store.get("misses", []).filter((q) => q.en);
  const box = h("div", h("p.muted", "Loading…"));
  plusStatus().then((st) => {
    if (!misses.length) return put(box, h("p", "Nothing to revise: you haven't missed a question here yet."), h("a.btn", { href: "#prelims" }, "Prelims practice"));
    const qs = C.shuffle(misses, Date.now() % 4999);
    if (st.open) return put(box, mcqRun(qs, { title: "Revision", onDone: (r, n) => h("div.card", h("h2", { style: { marginTop: 0 } }, `${r} of ${n} right this time.`), h("p.muted", "Right ones leave the list. The rest stay for next time."), h("a.btn", { href: "#practice" }, "Back to Practice")) }));
    put(box, h("p.small.muted", `${plural(misses.length, "question")} waiting. Free: two come back in each day's Prelims practice. Here are two now.`),
      mcqRun(qs, { limit: 2, title: "Preview", onDone: () => plusNote("Revise everything you missed") }));
  });
  return h("div.col", h("h1", "Revise my misses"), h("p.muted", "Every question you got wrong in practice and mocks, in one go, until it sticks."), box);
}

/** Subject breakdown across every paper, the trend of the last ten, and the error log. */
function insightsBody(hist, misses, sample = false) {
  const topics = {};
  hist.forEach((r) => Object.entries(r.topics ?? {}).forEach(([t, v]) => { const x = (topics[t] ??= { right: 0, wrong: 0, skipped: 0 }); x.right += v.right; x.wrong += v.wrong; x.skipped += v.skipped; }));
  const rows = Object.entries(topics).map(([t, v]) => ({ t, ...v, n: v.right + v.wrong + v.skipped, acc: v.right + v.wrong ? Math.round((v.right / (v.right + v.wrong)) * 100) : 0 }))
    .sort((a, b) => a.acc - b.acc);
  const last = hist.slice(-10);
  const W = 300, H = 90, pad = 8;
  const pts = last.map((r, k) => [pad + (last.length === 1 ? (W - 2 * pad) / 2 : (k * (W - 2 * pad)) / (last.length - 1)), H - pad - (r.pct / 100) * (H - 2 * pad)]);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "trend"); svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Score trend: " + last.map((r) => r.pct + "%").join(", "));
  const line = document.createElementNS(ns, "polyline");
  line.setAttribute("points", pts.map((p) => p.join(",")).join(" ")); line.setAttribute("fill", "none"); line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-width", "2");
  svg.append(line);
  pts.forEach(([x, y]) => { const c = document.createElementNS(ns, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "3"); c.setAttribute("fill", "currentColor"); svg.append(c); });
  const byTopic = {};
  misses.forEach((q) => (byTopic[q.topic || "Other"] ??= []).push(q));
  return h("div",
    sample && h("p.small", h("span.tag", "Sample"), " Made-up numbers to show the layout. Yours appear after your first paper."),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Subject breakdown"),
      h("table.breakdown", h("thead", h("tr", h("th", "Topic"), h("th", "Right"), h("th", "Wrong"), h("th", "Left"), h("th", "Accuracy"))),
        h("tbody", rows.map((r) => h("tr", h("td", r.t), h("td", String(r.right)), h("td", String(r.wrong)), h("td", String(r.skipped)),
          h("td", h("div.acc", h("i", { style: { width: r.acc + "%" } })), ` ${r.acc}%`))))),
      rows.length > 0 && h("p.small.muted", `Weakest first. Start with ${rows[0].t}.`)),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Trend"), last.length > 1 ? svg : h("p.small.muted", "Your trend line starts after the second paper."),
      last.length > 0 && h("div.row.between.small.muted", h("span", last[0].day), h("span", last.at(-1).day))),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Error log"),
      misses.length === 0 ? h("p.small.muted", "No wrong answers logged yet.") : h("div",
        h("p.small.muted", `${plural(misses.length, "question")} you got wrong, by topic.`),
        Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length).map(([t, list]) => h("details",
          h("summary", `${t} (${list.length})`),
          list.slice(-20).reverse().map((q) => { const m = C.mcqOf(q); return h("div.compile-q", h("p", { style: { margin: "6px 0 2px" } }, h("strong", m.question)),
            h("p.small", { style: { margin: 0 } }, "Answer: " + m.options[m.answerIndex]), m.explanation && h("p.small.muted", { style: { margin: "2px 0 0" } }, m.explanation)); }))),
        !sample && h("a.btn", { href: "#revise" }, "Revise these now"))));
}
const SAMPLE_HIST = [
  { day: "Week 1", pct: 38, topics: { "Modern history": { right: 6, wrong: 4, skipped: 2 }, Economy: { right: 3, wrong: 5, skipped: 3 }, Environment: { right: 5, wrong: 2, skipped: 1 } } },
  { day: "Week 2", pct: 44, topics: { "Modern history": { right: 7, wrong: 3, skipped: 1 }, Economy: { right: 4, wrong: 4, skipped: 2 } } },
  { day: "Week 3", pct: 41, topics: { Geography: { right: 6, wrong: 3, skipped: 2 }, Economy: { right: 4, wrong: 3, skipped: 3 } } },
  { day: "Week 4", pct: 52, topics: { Polity: { right: 9, wrong: 2, skipped: 1 }, Environment: { right: 6, wrong: 3, skipped: 0 } } },
];
const SAMPLE_MISSES = [{ id: "s1", topic: "Economy", en: { question: "Which body decides the repo rate in India?", options: ["Finance Commission", "Monetary Policy Committee", "NITI Aayog", "SEBI"], answerIndex: 1, explanation: "The RBI's Monetary Policy Committee sets the policy repo rate." } }];

export function viewInsights() {
  const hist = C.store.get("mockHistory", []), misses = C.store.get("misses", []).filter((q) => q.en);
  const box = h("div", h("p.muted", "Loading…"));
  plusStatus().then((st) => {
    if (st.open) return put(box, hist.length ? insightsBody(hist, misses) : [h("p", "Take a mock paper and your breakdown and trend appear here. Until then, this is how it looks:"), insightsBody(SAMPLE_HIST, SAMPLE_MISSES, true)], h("a.btn", { href: "#mock" }, "Mock papers"));
    // The taste: your own numbers from the latest paper, or the sample. The error log shows its count and first topic.
    put(box, hist.length ? insightsBody(hist.slice(-1), misses.slice(-1)) : insightsBody(SAMPLE_HIST, SAMPLE_MISSES, true),
      hist.length > 0 && h("p.small.muted", `That's your latest paper only. Plus covers all ${plural(hist.length, "paper")} and ${plural(misses.length, "logged question")}.`),
      plusNote("Mock insights"));
  });
  return h("div.col", h("h1", "Mock insights"), h("p.muted", "Where your marks come from and where they leak: by topic, over time, and every question you got wrong. Kept in this browser, never on the server."), box);
}

// --- The Plus tab: a sales page for members without Plus, their tools for members with it ----------------

export function viewUpgrade() {
  const deps = { h, T, plusStatus, offerQuiet, mcqRun, insightsBody, SAMPLE_HIST, SAMPLE_MISSES, weekQs, playable };
  const box = h("div.sales", plusSalesPage(C, deps));
  plusStatus().then((st) => { if (st.open) put(box, plusHub(st)); });
  return box;
}

/** For members who have Plus: their four tools, up front. */
function plusHub(st) {
  const ends = st.plan?.endsAt ? new Date(st.plan.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
  return h("div.col",
    h("section.sales-hero.member",
      h("div.sales-eyebrow", "UPSC Pods Plus"),
      h("h1", T({ en: "Your Plus tools", hi: "आपके Plus टूल" })),
      h("p.sales-sub", ends ? T({ en: `Plus is yours until ${ends}. Everything below is open.`, hi: `${ends} तक Plus आपका है। नीचे सब कुछ खुला है।` })
        : T({ en: "Everything below is open.", hi: "नीचे सब कुछ खुला है।" }))),
    toolsStrip(),
    h("a.card.link", { href: "#mock" }, h("div.row.between", h("div", h("strong", "Every mock paper"), h("div.small.muted", "Full-length and sectional, with a review of every answer.")), h("span", "→"))),
    C.plusOn() && h("p.small", h("a", { href: "#plus" }, "Manage Plus and receipts →")));
}

/** A slim card at the top of Today's 3 and Practice for members without Plus. Hidden in quiet times. */
export function plusBanner() {
  const box = h("div");
  if (offerQuiet()) return box;
  plusStatus().then((st) => {
    if (st.open || offerQuiet()) return;
    put(box, h("a.plus-banner", { href: "#upgrade" },
      h("span.pb-glow", { "aria-hidden": "true" }),
      h("div.grow",
        h("span.pb-eyebrow", "UPSC Pods Plus"),
        h("strong", T({ en: "Your mistakes are the cheapest marks you'll ever win back.", hi: "आपकी गलतियाँ, सबसे सस्ते अंक जो आप वापस पा सकते हैं।" })),
        h("div.small", T({ en: "Every mock, analysed. Every miss, back until it sticks.", hi: "हर मॉक का विश्लेषण। हर गलती, याद होने तक वापस।" }))),
      h("span.pb-go", T({ en: "See Plus", hi: "Plus देखें" }), " →")));
  });
  return box;
}

// --- Styles (scoped to these screens) ------------------------------------------------------------------

function injectStyles() {
  if (document.getElementById("explore-css")) return;
  const s = document.createElement("style");
  s.id = "explore-css";
  s.textContent = `
  .learn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0 12px; }
  .learn-tile strong { display: block; margin: 2px 0; }
  .tools-strip { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0 12px; margin-bottom: 8px; }
  .tools-strip .tool { padding: 12px 14px; }
  .row.wrap { flex-wrap: wrap; gap: 8px; }
  .match-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .match-grid .opt { min-height: 48px; }
  button.card.flip { display: block; width: 100%; text-align: left; min-height: 160px; cursor: pointer; }
  button.card.flip h2 { margin: 8px 0 0; }
  .order-row.right { color: var(--okink); } .order-row.wrong { color: var(--badink); }
  .cloze { line-height: 2.2; }
  button.gap { padding: 2px 10px; margin: 0 2px; border-style: dashed; }
  button.gap.on { border-color: var(--brand); background: var(--soft); }
  button.gap.right { background: var(--ok); color: var(--okink); border-style: solid; }
  button.gap.wrong { background: var(--bad); color: var(--badink); border-style: solid; }
  .compare { overflow-x: auto; }
  .compare table, table.breakdown { width: 100%; border-collapse: collapse; font-size: 15px; }
  .compare th, .compare td, table.breakdown th, table.breakdown td { border-bottom: 1px solid var(--line); padding: 8px 6px; text-align: left; vertical-align: top; }
  .hub-center { text-align: center; background: var(--soft); }
  img.hidden-why { display: block; max-width: 320px; width: 100%; margin: 0 auto 8px; border-radius: 12px; }
  .acc { display: inline-block; width: 60px; height: 6px; background: var(--line); border-radius: 3px; vertical-align: middle; overflow: hidden; }
  .acc i { display: block; height: 100%; background: var(--brand); }
  svg.trend { width: 100%; max-width: 420px; height: 100px; color: var(--brand); }
  .mcqrun p strong { white-space: pre-line; }
  .compile-q p strong { white-space: pre-line; }
  .compile-q { border-top: 1px solid var(--line); padding: 6px 0; }
  .stat-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin: 12px 0; }
  .stat { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; }
  .stat-n { font-size: 32px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .taste { border-color: var(--brand); }
  .upgrade-cta .bignum { font-size: 44px; }
  .compare-plans td, .compare-plans th { font-size: 14px; }
  .plus-banner { display: flex; gap: 14px; align-items: center; text-decoration: none; color: inherit; border: 1px solid var(--brand); border-radius: 18px; padding: 14px 16px; margin-bottom: 12px;
    background: linear-gradient(120deg, var(--soft), var(--card)); }
  .plus-banner strong { display: block; font-size: 17px; margin-bottom: 2px; }
  .plus-banner .btn { white-space: nowrap; display: inline-block; border-radius: 999px; padding: 8px 18px; background: var(--brand); color: var(--brand-ink); font-weight: 600; }
  .sales-tastes .taste .card { overflow-x: auto; }
  .sales-tastes table.breakdown { min-width: 340px; }
  .sales { max-width: 860px; min-width: 0; }
  .sales .col, .sales-benefits > *, .sales-tastes > *, .sales-benefit > div { min-width: 0; }
  .sales-compare .compare { overflow-x: auto; }
  .sales .taste p strong, .sales .taste .card { overflow-wrap: anywhere; }
  .sales-hero { border-radius: 24px; padding: 32px 28px; margin-bottom: 8px; background: linear-gradient(140deg, var(--soft) 0%, var(--card) 70%); border: 1px solid var(--line); }
  .sales-hero h1 { font-size: clamp(30px, 5.4vw, 46px); line-height: 1.08; letter-spacing: -0.02em; margin: 6px 0 12px; max-width: 18ch; }
  .sales-hero.member h1 { max-width: none; }
  .sales-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand); }
  .sales-sub { font-size: 18px; line-height: 1.5; max-width: 60ch; margin: 0 0 20px; color: var(--ink); }
  .sales-price .sales-amount { font-size: 34px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .sales-price .sales-amount span { font-size: 17px; font-weight: 500; color: var(--muted); }
  .sales-price.big .sales-amount { font-size: 40px; }
  .sales-actions { gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  a.btn.sales-go { font-size: 17px; padding: 12px 28px; }
  .sales-quiet { font-size: 16px; color: var(--muted); margin: 0; }
  .sales-h2 { font-size: 26px; letter-spacing: -0.01em; margin: 28px 0 6px; }
  .sales-benefits { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 12px; margin: 16px 0 4px; }
  .sales-benefit { display: flex; gap: 14px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 18px; }
  .sales-benefit h3 { margin: 0 0 6px; font-size: 18px; }
  .sales-benefit p { margin: 0 0 6px; line-height: 1.5; }
  svg.sales-icon { flex: none; width: 40px; height: 40px; padding: 8px; border-radius: 12px; background: var(--soft); color: var(--brand); box-sizing: border-box; }
  .sales-tastes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 12px; align-items: start; }
  .sales-tastes .taste { margin: 0; }
  .sales-tastes .taste:last-child { grid-column: 1 / -1; }
  .sales-tastes .taste .compare, .sales-tastes table.breakdown { overflow-x: auto; }
  .sales-compare { margin-top: 24px; }
  .sales-compare .plus-col { background: var(--soft); }
  .sales-yes { display: inline-flex; align-items: center; gap: 4px; color: var(--okink); }
  svg.sales-tick { width: 16px; height: 16px; }
  .sales-close { margin-top: 24px; border-radius: 24px; padding: 28px; border: 2px solid var(--brand); background: var(--card); }
  .sales-faqs { margin-top: 8px; }
  details.sales-faq { border-bottom: 1px solid var(--line); padding: 12px 2px; }
  details.sales-faq summary { cursor: pointer; font-weight: 600; font-size: 16px; }
  details.sales-faq > div, details.sales-faq > p { margin: 8px 0 0; line-height: 1.5; }
  @media (max-width: 520px) {
    .sales-hero { padding: 24px 18px; border-radius: 20px; }
    .sales-sub { font-size: 16px; }
    .sales-close { padding: 20px 16px; }
    .sales-tastes { grid-template-columns: 1fr; }
    .plus-banner { flex-direction: column; align-items: flex-start; }
    .compare-plans th, .compare-plans td { font-size: 13px; padding: 6px 4px; }
  }

  /* Plus sales page. Night-study palette: deep ink, lamp gold, saffron and rose. The dark stages stay dark in both themes. */
  .px { --n0: #070B16; --n1: #0E1528; --n2: #18213A; --gold: #FFC56B; --saf: #FF8A3D; --rose: #FF5E7E; --sky: #6FB7FF; --mint: #5BE3B0;
    --tx: #F6F1E8; --tx2: #AEB6C8; --grad: linear-gradient(95deg, #FFD58A 0%, #FF9A4D 45%, #FF5E7E 100%); min-width: 0; }
  .px * { min-width: 0; }
  .px-grad { background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .px-hero { position: relative; overflow: hidden; isolation: isolate; border-radius: 32px; padding: 48px 40px 40px; color: var(--tx);
    background: radial-gradient(120% 90% at 85% 10%, #26305A 0%, var(--n1) 45%, var(--n0) 100%);
    display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 32px; align-items: center; box-shadow: 0 30px 80px -30px rgba(10, 14, 30, .55); }
  .px-aurora { position: absolute; inset: -30%; z-index: -1; pointer-events: none;
    background: radial-gradient(35% 30% at 20% 30%, rgba(255, 154, 77, .38), transparent 70%), radial-gradient(30% 28% at 80% 70%, rgba(255, 94, 126, .30), transparent 70%),
      radial-gradient(28% 26% at 60% 15%, rgba(111, 183, 255, .25), transparent 70%); filter: blur(10px); }
  .px-eyebrow { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; padding: 5px 12px; border-radius: 999px;
    color: var(--gold); background: rgba(255, 197, 107, .1); border: 1px solid rgba(255, 197, 107, .35); }
  .px-hero h1 { font-size: clamp(34px, 5.2vw, 56px); line-height: 1.02; letter-spacing: -.035em; font-weight: 800; margin: 18px 0 16px;
    background: linear-gradient(180deg, #FFFFFF 30%, #FFE2B8 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .px-lede { font-size: 19px; line-height: 1.5; color: var(--tx2); margin: 0 0 22px; max-width: 46ch; }
  .px-price { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
  .px-price b { font-size: 40px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .px-price span { color: var(--tx2); font-size: 16px; }
  .px-ctas { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  a.px-go { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; font-weight: 800; font-size: 18px; padding: 15px 34px; border-radius: 999px;
    color: #2A1300; background: var(--grad); box-shadow: 0 10px 30px -8px rgba(255, 120, 70, .7), inset 0 1px 0 rgba(255, 255, 255, .5); transition: transform .2s, box-shadow .2s; }
  a.px-go:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -8px rgba(255, 120, 70, .85), inset 0 1px 0 rgba(255, 255, 255, .5); }
  a.px-ghost { color: var(--tx); text-decoration: none; font-weight: 600; padding: 14px 18px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, .22); }
  a.px-ghost:hover { background: rgba(255, 255, 255, .08); }
  .px-quiet { color: var(--tx2); font-size: 16px; margin: 0; }

  /* The product shot. */
  .px-shot { position: relative; padding: 18px 8px; }
  .px-screen { border-radius: 20px; background: linear-gradient(180deg, rgba(255, 255, 255, .09), rgba(255, 255, 255, .03)); border: 1px solid rgba(255, 255, 255, .14);
    box-shadow: 0 40px 80px -20px rgba(0, 0, 0, .6), inset 0 1px 0 rgba(255, 255, 255, .12); backdrop-filter: blur(8px); overflow: hidden; transform: perspective(1200px) rotateY(-9deg) rotateX(4deg); }
  .px-chrome { display: flex; gap: 6px; align-items: center; padding: 10px 14px; border-bottom: 1px solid rgba(255, 255, 255, .08); font-size: 12px; color: var(--tx2); }
  .px-chrome i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255, 255, 255, .22); }
  .px-chrome span { margin-left: 8px; }
  .px-screen-body { padding: 16px 18px 18px; }
  .px-k { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--tx2); margin-bottom: 10px; }
  .px-bar { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 10px; align-items: center; font-size: 13px; margin: 7px 0; }
  .px-bar span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .px-bar b { height: 10px; border-radius: 6px; background: rgba(255, 255, 255, .08); overflow: hidden; }
  .px-bar i { display: block; height: 100%; width: var(--w); border-radius: 6px; background: linear-gradient(90deg, var(--rose), var(--saf) 55%, var(--gold)); }
  .px-bar:last-child i, .px-bar:nth-last-child(2) i { background: linear-gradient(90deg, #FF4D6D, #FF7A59); }
  svg.px-trend { width: 100%; height: 70px; display: block; }
  .px-float { position: absolute; font-size: 13px; padding: 9px 14px; border-radius: 14px; color: var(--tx); white-space: nowrap;
    background: rgba(20, 28, 52, .82); border: 1px solid rgba(255, 255, 255, .16); backdrop-filter: blur(10px); box-shadow: 0 14px 30px -10px rgba(0, 0, 0, .6); }
  .px-float b { color: var(--gold); }
  .px-float.f1 { left: -18px; bottom: 6px; }
  .px-float.f2 { right: -6px; top: 0; color: var(--mint); }

  /* The story: one reader, one evening. */
  .px-story { max-width: 640px; margin: 64px auto 24px; padding: 0 8px; font-family: var(--read-font); font-size: 21px; line-height: 1.6; }
  .px-story p { margin: 0 0 18px; }
  .px-story-1 { font-family: var(--ui-font); font-size: clamp(26px, 4vw, 34px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
  .px-story-turn { font-family: var(--ui-font); font-size: clamp(24px, 3.6vw, 30px); font-weight: 800; letter-spacing: -.02em; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }

  /* Big real numbers. */
  .px-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr)); gap: 12px; margin: 24px 0 56px; }
  .px-stats > div { border-radius: 22px; padding: 22px 20px; background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px; }
  .px-stats b { font-size: 48px; line-height: 1; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: 4px; }
  .px-stats span { font-weight: 600; }
  .px-stats i { font-style: normal; font-size: 13px; color: var(--muted); }
  .px-h2 { font-size: clamp(28px, 4.4vw, 44px); line-height: 1.06; letter-spacing: -.03em; font-weight: 800; margin: 8px 0 22px; }
  .px-kicker { font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--saf); }

  /* The seven features: alternating stages, each with its own colour and drawing. */
  .px-feature { --acc: var(--saf); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; align-items: center; border-radius: 28px; padding: 36px;
    margin: 0 0 16px; background: var(--card); border: 1px solid var(--line); overflow: hidden; position: relative; }
  .px-feature.flip .px-vis { order: -1; }
  .px-feature .px-kicker { color: var(--acc); }
  .px-feature h3 { font-size: clamp(24px, 3.2vw, 32px); line-height: 1.1; letter-spacing: -.025em; font-weight: 800; margin: 8px 0 12px; }
  .px-feature p { font-size: 17px; line-height: 1.55; margin: 0 0 10px; color: var(--muted); }
  .px-feature p.px-fact { display: inline-block; font-size: 14px; font-weight: 700; color: var(--ink); padding: 6px 12px; border-radius: 999px; background: color-mix(in srgb, var(--acc) 16%, transparent); margin-top: 6px; }
  .px-vis { position: relative; min-height: 240px; display: grid; place-items: center; border-radius: 22px; padding: 22px; color: var(--tx);
    background: radial-gradient(90% 90% at 30% 20%, color-mix(in srgb, var(--acc) 38%, var(--n1)) 0%, var(--n1) 60%, var(--n0) 100%); }
  .f-papers { --acc: var(--gold); } .f-insights { --acc: var(--rose); } .f-loop { --acc: var(--mint); } .f-chai { --acc: var(--saf); }
  .f-feedback { --acc: var(--sky); } .f-chotu { --acc: #C49BFF; } .f-seats { --acc: var(--gold); }
  .px-feature.f-dark { background: var(--n1); color: var(--tx); }

  .v-papers { position: relative; width: min(100%, 300px); height: 210px; }
  .v-paper { position: absolute; inset: 0; border-radius: 16px; padding: 16px; background: #FBF7F0; color: #1C1A17; box-shadow: 0 20px 40px -12px rgba(0, 0, 0, .55);
    transform: translate(calc(var(--k) * 14px - 14px), calc(var(--k) * -12px + 12px)) rotate(calc(var(--k) * 4deg - 4deg)); }
  .v-paper-top { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin-bottom: 12px; }
  .v-paper-top span { color: #8A5A00; font-weight: 700; }
  .v-line { height: 8px; border-radius: 4px; background: rgba(0, 0, 0, .1); margin: 8px 0; }
  .v-opts { display: flex; gap: 8px; margin-top: 16px; }
  .v-opts span { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; border: 1.5px solid rgba(0, 0, 0, .2); }
  .v-opts span.on { background: #1E8A5A; border-color: #1E8A5A; color: #fff; }
  .v-insights { width: min(100%, 320px); color: var(--tx); }
  .v-loop { display: flex; gap: 18px; align-items: center; justify-content: center; flex-wrap: wrap; }
  .v-ring { position: relative; width: 130px; height: 130px; color: var(--tx); }
  .v-ring svg { width: 100%; height: 100%; }
  .v-ring-arc { stroke-dasharray: 1; stroke-dashoffset: .25; }
  .v-ring-n { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
  .v-ring-n b { font-size: 34px; font-weight: 800; line-height: 1; }
  .v-ring-n span { font-size: 11px; color: var(--tx2); max-width: 80px; }
  .v-cards { display: flex; flex-direction: column; gap: 8px; }
  .v-card { display: flex; gap: 8px; align-items: center; font-size: 13px; padding: 9px 12px; border-radius: 12px; background: rgba(255, 255, 255, .08); border: 1px solid rgba(255, 255, 255, .12); white-space: nowrap; }
  .v-tag { font-size: 11px; font-weight: 700; color: var(--mint); }
  .v-chai { display: grid; gap: 10px; justify-items: center; width: min(100%, 320px); }
  .v-days { display: flex; gap: 6px; }
  .v-days span { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: rgba(255, 138, 61, .2); border: 1px solid rgba(255, 138, 61, .5); }
  .v-arrow { color: var(--tx2); font-size: 20px; }
  .v-test, .v-print { width: 100%; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; font-size: 13px; color: var(--tx2); }
  .v-test { background: var(--grad); color: #2A1300; } .v-test span { color: #4A2A10; }
  .v-test b, .v-print b { font-size: 15px; } .v-print b { color: var(--tx); }
  .v-print { background: rgba(255, 255, 255, .07); border: 1px dashed rgba(255, 255, 255, .25); }
  .v-answer { position: relative; width: min(100%, 320px); border-radius: 16px; padding: 16px 16px 20px; background: #FBF7F0; color: #1C1A17; box-shadow: 0 20px 40px -12px rgba(0, 0, 0, .55); }
  .v-q { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
  .v-answer .v-line.mark { background: linear-gradient(90deg, rgba(111, 183, 255, .55), rgba(111, 183, 255, .25)); }
  .v-note { position: absolute; font-size: 12px; font-weight: 600; padding: 6px 10px; border-radius: 10px; background: #1F3E66; color: #fff; white-space: nowrap; box-shadow: 0 10px 20px -6px rgba(0, 0, 0, .5); }
  .v-note.n1 { right: -10px; top: 48px; } .v-note.n2 { left: -10px; bottom: -12px; background: #1E6B4E; }
  .v-chotu { text-align: center; }
  .v-big { display: flex; gap: 14px; align-items: baseline; justify-content: center; }
  .v-big s { font-size: 34px; color: var(--tx2); text-decoration-thickness: 3px; text-decoration-color: var(--rose); }
  .v-big b { font-size: 84px; line-height: 1; font-weight: 800; letter-spacing: -.04em; background: linear-gradient(95deg, #E7D3FF, #C49BFF 50%, #6FB7FF); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .v-sub { color: var(--tx2); font-size: 13px; margin-bottom: 14px; }
  .v-bubbles { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
  .v-bubbles span { font-size: 13px; padding: 8px 12px; border-radius: 14px 14px 14px 4px; background: rgba(255, 255, 255, .1); }
  .v-bubbles span.me { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: rgba(196, 155, 255, .3); }
  .v-seats { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: center; }
  .v-dots { display: grid; grid-template-columns: repeat(5, 22px); gap: 8px; }
  .v-dots i, .v-seat i { width: 22px; height: 22px; border-radius: 50%; background: rgba(255, 255, 255, .25); }
  .v-seat { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--gold); }
  .v-seat i { width: 54px; height: 54px; background: radial-gradient(circle at 35% 30%, #FFF1C9, var(--gold) 45%, var(--saf)); box-shadow: 0 0 40px rgba(255, 197, 107, .7); }

  .px-try { margin: 56px 0 24px; }
  .px-value { margin: 56px 0 16px; }
  .px-value-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 12px; }
  .px-value-grid > div { border-radius: 20px; padding: 20px; background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; }
  .px-value-grid b { font-size: 19px; } .px-value-grid span { color: var(--muted); line-height: 1.5; }

  .px-close { position: relative; overflow: hidden; isolation: isolate; text-align: center; border-radius: 32px; padding: 64px 28px 48px; margin: 32px 0 16px; color: var(--tx);
    background: radial-gradient(120% 100% at 50% 0%, #2A2048 0%, var(--n1) 50%, var(--n0) 100%); }
  .px-close h2 { font-size: clamp(30px, 5vw, 52px); line-height: 1.05; letter-spacing: -.035em; font-weight: 800; margin: 0 0 22px; color: #fff; }
  .px-close .px-price { justify-content: center; margin-bottom: 6px; }
  .px-close .px-ctas { justify-content: center; margin-top: 14px; }
  .px-note { color: var(--tx2); font-size: 14px; margin: 6px 0; }
  .px-wa { margin-top: 18px; color: var(--tx2); } .px-wa a { color: var(--gold); }

  .px .sales-compare { border-radius: 28px; padding: 28px; margin-top: 16px; }
  .px .sales-compare h2 { font-size: clamp(24px, 3.4vw, 32px); letter-spacing: -.025em; font-weight: 800; }
  .px .compare-plans thead th.plus-col { background: linear-gradient(95deg, #FFD58A 0%, #FF9A4D 45%, #FF5E7E 100%); color: #2A1300; border-radius: 12px 12px 0 0; }
  .px .compare-plans td.plus-col { background: color-mix(in srgb, #FF9A4D 10%, var(--card)); }
  .px .compare-plans td, .px .compare-plans th { padding: 11px 10px; }
  .px .sales-faqs { margin-top: 40px; } .px .sales-faqs h2 { font-size: clamp(24px, 3.4vw, 32px); letter-spacing: -.025em; font-weight: 800; }
  .px details.sales-faq summary { font-size: 17px; padding: 4px 0; }
  .px-value .px-h2 { margin-bottom: 18px !important; }
  /* Motion: only when the reader allows it. Everything is visible without it. */
  @media (prefers-reduced-motion: no-preference) {
    .px-aurora { animation: px-drift 18s ease-in-out infinite alternate; }
    .px-float.f1 { animation: px-bob 6s ease-in-out infinite; } .px-float.f2 { animation: px-bob 7s ease-in-out -3s infinite; }
    .px-bar i { animation: px-grow 1.2s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--d) + .3s); }
    svg.px-trend path { stroke-dasharray: 1; animation: px-draw 2s .6s cubic-bezier(.4, 0, .2, 1) both; }
    .px-hero-copy > * { animation: px-up .9s cubic-bezier(.2, .8, .2, 1) both; }
    .px-hero-copy > :nth-child(2) { animation-delay: .08s; } .px-hero-copy > :nth-child(3) { animation-delay: .16s; }
    .px-hero-copy > :nth-child(4) { animation-delay: .24s; } .px-hero-copy > :nth-child(5) { animation-delay: .32s; }
    .px-shot { animation: px-up 1.1s .2s cubic-bezier(.2, .8, .2, 1) both; }
    .anim .rv { opacity: 0; transform: translateY(36px) scale(.985); transition: opacity .9s cubic-bezier(.2, .8, .2, 1), transform .9s cubic-bezier(.2, .8, .2, 1); }
    .anim .rv.in { opacity: 1; transform: none; }
    .anim .rv:not(.in) .px-bar i, .anim .rv:not(.in) .v-paper, .anim .rv:not(.in) .v-ring-arc, .anim .rv:not(.in) .v-days span, .anim .rv:not(.in) .v-dots i, .anim .rv:not(.in) .v-note { animation-play-state: paused; }
    .v-paper { animation: px-fan 1.1s cubic-bezier(.2, .8, .2, 1) both; animation-delay: calc(var(--k) * 120ms + .2s); }
    .v-ring-arc { animation: px-ring 1.6s .3s cubic-bezier(.4, 0, .2, 1) both; }
    .v-ring svg { animation: px-spin 14s linear infinite; }
    .v-card { animation: px-cycle 6s ease-in-out infinite; animation-delay: calc(var(--k) * -2s); }
    .v-days span { animation: px-pop .5s cubic-bezier(.2, .8, .2, 1.4) both; animation-delay: calc(var(--k) * 90ms + .2s); }
    .v-dots i { animation: px-fill 4s ease-in-out infinite; animation-delay: calc(var(--k) * 150ms); }
    .v-seat i { animation: px-glow 4s ease-in-out infinite; }
    .v-note { animation: px-pop .6s cubic-bezier(.2, .8, .2, 1.4) both; } .v-note.n1 { animation-delay: .5s; } .v-note.n2 { animation-delay: .9s; }
    .plus-banner .pb-glow { animation: px-drift 12s ease-in-out infinite alternate; }
  }
  @keyframes px-drift { from { transform: translate(-4%, -3%) rotate(0deg); } to { transform: translate(4%, 3%) rotate(8deg); } }
  @keyframes px-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes px-grow { from { width: 0; } }
  @keyframes px-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes px-up { from { opacity: 0; transform: translateY(28px); } }
  @keyframes px-fan { from { opacity: 0; transform: translate(0, 40px) rotate(0deg); } }
  @keyframes px-ring { from { stroke-dashoffset: 1; } }
  @keyframes px-spin { to { transform: rotate(360deg); } }
  @keyframes px-cycle { 0%, 100% { transform: translateX(0); opacity: 1; } 45% { transform: translateX(10px); opacity: .55; } }
  @keyframes px-pop { from { opacity: 0; transform: scale(.6); } }
  @keyframes px-fill { 0%, 100% { background: rgba(255, 255, 255, .25); } 50% { background: var(--gold); } }
  @keyframes px-glow { 0%, 100% { box-shadow: 0 0 30px rgba(255, 197, 107, .5); } 50% { box-shadow: 0 0 60px rgba(255, 197, 107, .95); } }

  /* The banner on Today's 3 and Practice. */
  .plus-banner { position: relative; overflow: hidden; isolation: isolate; display: flex; gap: 16px; align-items: center; text-decoration: none; color: #F6F1E8; border: 0; border-radius: 22px;
    padding: 18px 20px; margin-bottom: 14px; background: radial-gradient(120% 140% at 90% 0%, #2A3260 0%, #0E1528 55%, #070B16 100%); box-shadow: 0 18px 40px -20px rgba(10, 14, 30, .7); }
  .plus-banner .pb-glow { position: absolute; inset: -40%; z-index: -1; background: radial-gradient(30% 40% at 15% 60%, rgba(255, 154, 77, .35), transparent 70%), radial-gradient(30% 40% at 85% 30%, rgba(255, 94, 126, .3), transparent 70%); }
  .plus-banner .pb-eyebrow { display: block; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #FFC56B; margin-bottom: 4px; }
  .plus-banner strong { display: block; font-size: 18px; line-height: 1.25; letter-spacing: -.01em; margin-bottom: 4px; color: #fff; }
  .plus-banner .small { color: #AEB6C8; }
  .plus-banner .pb-go { white-space: nowrap; font-weight: 800; padding: 11px 20px; border-radius: 999px; color: #2A1300; background: linear-gradient(95deg, #FFD58A 0%, #FF9A4D 45%, #FF5E7E 100%); }

  @media (max-width: 760px) {
    .px-hero { grid-template-columns: minmax(0, 1fr); padding: 32px 22px 24px; border-radius: 26px; gap: 8px; }
    .px-screen { transform: none; }
    .px-float.f1 { left: 4px; } .px-float.f2 { right: 4px; }
    .px-feature { grid-template-columns: minmax(0, 1fr); padding: 22px; gap: 18px; border-radius: 24px; }
    .px-feature.flip .px-vis { order: 0; }
    .px-vis { min-height: 210px; padding: 18px 14px; }
    .px-story { font-size: 19px; margin-top: 44px; }
    .px-close { padding: 44px 18px 32px; border-radius: 26px; }
    .px-stats b { font-size: 38px; }
  }
  @media (max-width: 520px) {
    .px-lede { font-size: 17px; }
    a.px-go { width: 100%; }
    .px-ctas { flex-direction: column; align-items: stretch; } .px-ghost { text-align: center; }
    .px-bar { grid-template-columns: 90px minmax(0, 1fr); }
    .v-note.n1 { right: 4px; } .v-note.n2 { left: 4px; }
    .plus-banner { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 520px) { .match-grid { gap: 6px; } .match-grid .opt { padding: 10px; font-size: 14px; } }
  @media print { nav, .subrail, .mobilebar, .no-print, .plus-note { display: none !important; } .card { break-inside: avoid; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `;
  document.head.append(s);
}
