// Prep → Learn and play (every approved engine item, playable on the web), the Plus tools (weekly Chai test,
// monthly compilation, mock insights with an error log, revise everything you missed) and the upgrade screen.
//
// Learn and play is free, like every practice type (community-first spec §7). Plus tools carry a small "Plus" tag and
// give a real taste before asking. The upgrade screen lives in Prep only, follows the same never-list as offers
// (no prices in pause, result-day mode, after a distress check or late at night) and sends people to Me → Plus,
// which owns payments (Cashfree or test mode). With the plus flag off, every tool here is simply open.

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
/** /plus/status for this member, fetched once a session. Plus off means everything is open. */
async function plusStatus() {
  if (!C.plusOn()) return { open: true };
  if (plusCache) return plusCache;
  const me = C.profile()?.memberId;
  const st = await C.getJson(`/plus/status?member=${encodeURIComponent(me ?? "")}`);
  plusCache = st ? { ...st, open: !!st.plan } : { open: false, offline: true };
  setTimeout(() => { plusCache = null; }, 5 * 60_000);
  return plusCache;
}
export function forgetPlus() { plusCache = null; }
/** The quiet card that says a tool is part of Plus, with the taste above it. Never a padlock on anything free. */
const plusNote = (what) => h("div.card.soft.plus-note", h("div.row.between", h("strong", what), h("span.tag", "Plus")),
  h("p.small", { style: { margin: "6px 0" } }, "That was a taste. The rest is part of Plus, along with every mock paper, mock insights and the monthly compilation."),
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
    h("div.row.between", h("strong", name), C.plusOn() ? h("span.tag", "Plus") : null), h("div.small.muted", lead))));
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
      h("div.card", C.mcqBlock(C.mcqOf(q), (ok) => { if (ok) { right++; C.store.set("misses", C.store.get("misses", []).filter((m) => m.id !== q.id)); } else C.addMiss(q); next.disabled = false; })), next);
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
    put(box, h("p.small.muted", `This week's test has ${plural(qs.length, "question")}. Here are the first two.`),
      mcqRun(qs, { limit: 2, title: "Taste", onDone: () => plusNote("The weekly Chai test") }));
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
      mcqRun(qs, { limit: 2, title: "Taste", onDone: () => plusNote("Revise everything you missed") }));
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

// --- The upgrade screen -------------------------------------------------------------------------------

export function viewUpgrade() {
  const mocks = C.libraryOf("mock");
  const mockQs = mocks.reduce((a, m) => a + (m.data.questions?.length ?? 0), 0);
  const pieces = playable();
  const reads = C.libraryOf("read");
  const week = weekQs(), misses = C.store.get("misses", []).filter((q) => q.en);
  const hist = C.store.get("mockHistory", []);
  const cta = h("div");
  const quiet = offerQuiet();

  plusStatus().then((st) => {
    if (st.open && !C.plusOn()) return put(cta, h("div.card.soft", h("strong", "Plus isn't switched on yet, so every tool on this page is open to you, free.")));
    if (st.open) return put(cta, h("div.card.soft", h("strong", "You have Plus"), st.plan?.endsAt ? h("span", ` until ${new Date(st.plan.endsAt).toLocaleDateString()}.`) : null,
      h("div.row", { style: { marginTop: "8px" } }, h("a.btn", { href: "#ptest" }, "Weekly test"), h("a.btn", { href: "#insights" }, "Insights"), h("a.btn", { href: "#plus" }, "Manage Plus"))));
    if (quiet) return put(cta, h("div.card.soft", h("p", { style: { margin: 0 } }, quiet === "late" ? "It's late. Plus can wait till morning; everything above works now." : "Not today. Plus will be here whenever you want it.")));
    const pay = st.payments ?? {};
    const real = pay.provider === "cashfree";
    const price = real ? pay.amountInr : st.prices?.yearly?.inr;
    C.post("/plus/impression", { surface: "prep", moment: "upgrade", memberId: C.profile()?.memberId });
    put(cta, h("div.card.upgrade-cta",
      h("div.row.between", h("strong", "Plus for a year"), !real ? h("span.tag", "TEST MODE") : pay.mode === "sandbox" ? h("span.tag", "SANDBOX") : null),
      price != null && h("div.bignum", `₹${price}`),
      real && pay.founding && h("p.small.muted", { style: { margin: 0 } }, `Founding price, usually ₹${pay.yearlyInr}. ${pay.foundingLeft} of ${pay.foundingSeats} founding places left.`),
      h("p.small", `One payment. It doesn't renew by itself. Refunds within ${st.refundWindowDays ?? 7} days.`),
      h("div.row", h("a.btn.primary", { href: "#plus", onclick: () => C.post("/plus/impression", { surface: "prep", moment: "upgrade", action: "accepted" }) }, "Get Plus"),
        h("a.btn", { href: "#learn", onclick: () => C.post("/plus/impression", { surface: "prep", moment: "upgrade", action: "not_now" }) }, "Not now")),
      st.trial && !st.trial.used && h("p.small.muted", st.trial.unlocked ? `Or start a ${st.trial.days}-day trial in Me → Plus.` : st.trial.why),
      h("p.small.muted", "1 free Plus seat for every 10 paid, chosen by pod leads.")));
  });

  // Taste 1: three questions from a mock paper.
  const paper = mocks.find((m) => !hist.some((r) => r.id === m.id)) ?? mocks[0];
  const pq = paper ? paper.data.questions.slice(0, 3).map((q, k) => ({ ...q, id: `${paper.id}#${k}` })) : [];
  // Taste 2: two from this week's Chai test (or the starter bank when the week is empty).
  const wq = (week.length ? week : (C.data.questions?.bank ?? []).filter((q) => q.en)).slice(0, 2);

  const taste = (title, lead, body) => h("div.card.taste", h("div.row.between", h("strong", title), h("span.tag", "Plus")), h("p.small.muted", { style: { margin: "4px 0 8px" } }, lead), body);
  return h("div.col",
    h("h1", "What Plus adds to Prep"),
    h("p.muted", "Everything you use today stays free: the Adda, your pod, Chotu's Talk, Chai, daily practice, Learn and play, long reads and one full mock a month. Plus is for going deeper in the months before the exam."),
    h("div.stat-row",
      stat(mocks.length, "mock papers", `${mockQs} questions`),
      stat(week.length, "this week's test", "Chai questions"),
      stat(misses.length, "in your error log", "questions to revise"),
      stat(pieces.length + reads.length, "free pieces", "Learn and play and long reads")),
    paper && taste("Try three questions from a mock", `From "${T(paper.data.title)}". Real Prelims formats, +2 / −0.66.`,
      mcqRun(pq, { title: "Mock taste", onDone: (r, n) => h("p", h("strong", `${r} of ${n}. `), `The full paper has ${paper.data.questions.length} questions, with a result, your range and a review of every answer.`) })),
    wq.length > 0 && taste("This week's Chai test", week.length ? `${plural(week.length, "question")} from the last 7 days. Two to try.` : "Two to try. The weekly test fills up with each day's checked Chai cards.",
      mcqRun(wq, { title: "Weekly test taste" })),
    taste("Mock insights", hist.length ? "Your own latest paper, by topic." : "A sample, so you can see the layout.",
      insightsBody(hist.length ? hist.slice(-1) : SAMPLE_HIST, hist.length ? misses.slice(-1) : SAMPLE_MISSES, !hist.length)),
    h("div.card", h("h3", { style: { marginTop: 0 } }, "Free and Plus, side by side"),
      h("table.breakdown.compare-plans", h("thead", h("tr", h("th", ""), h("th", "Free"), h("th", "Plus"))),
        h("tbody", PLAN_ROWS.map(([what, free, plus]) => h("tr", h("th", what), h("td", free), h("td", plus)))))),
    cta,
    h("p.small.muted", "No streaks, no countdowns, no promises about results. Plus is only ever offered here in Prep."));
}
const stat = (n, label, sub) => h("div.stat", h("div.stat-n", String(n)), h("div", label), h("div.small.muted", sub));
const PLAN_ROWS = [
  ["Adda, pod, Commons, Calm", "Always", "Always"],
  ["Daily Chai and Today's 3", "Always", "Always"],
  ["Prelims practice and Learn and play", "Always", "Always"],
  ["Long reads", "Always", "Always"],
  ["Full mock papers", "1 a month", "All of them"],
  ["Mock insights: breakdown, trend, error log", "Latest paper", "Every paper"],
  ["Weekly Chai test", "A taste", "Every week"],
  ["Monthly compilation", "One topic", "Every topic, printable"],
  ["Revise my misses", "2 a day in practice", "All of them, any time"],
  ["Answer feedback", "3 a week", "Unlimited, deeper"],
  ["Cloud Chotu turns", "15 a day", "100 a day"],
];

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
  @media (max-width: 520px) { .match-grid { gap: 6px; } .match-grid .opt { padding: 10px; font-size: 14px; } }
  @media print { nav, .subrail, .mobilebar, .no-print, .plus-note { display: none !important; } .card { break-inside: avoid; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
  `;
  document.head.append(s);
}
