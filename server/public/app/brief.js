// Prep screens for the owner's content batches (content kinds from scripts/import-brief.mjs): Mains answer skeletons
// ("mains-skeleton"), GS4 cases with thinkers and terms ("gs4-case", "gs4-glossary"), weekly CSAT sets ("csat-week"),
// walk scripts ("walk-script"), welcome-back days ("restart-day") and the order to study an optional in
// ("optional-priority"). Approved items only, like everything from /library. Free, like every practice type.
//
// Same rules as the rest of Prep: no clock, no score kept anywhere but this device, every piece ends, and nothing
// here speaks about feelings, ranks or results beyond the one line a welcome-back day carries.

let C = null;
/** app.js hands over its helpers once at start. */
export function init(ctx) { C = ctx; }

const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);
const T = (v) => C.bi(v);
const lib = (k) => C.libraryOf(k).map((i) => i.data);
const back = (href, label) => h("a", { href }, "← " + label);
const empty = (title, what) => h("div.col", back("#practice", "Practice"), h("h1", title), h("p", `${what} appear here once an English and a Hindi editor approve them.`));
const PAPER = { gs1: "GS1", gs2: "GS2", gs3: "GS3", gs4: "GS4" };

// --- Mains answer skeletons ----------------------------------------------------------------------------

/** "csm-2025-gs1-q01" → { paper: "csm-2025-gs1", n: "1" }, and the question text from the approved past papers. */
function pyqOf(id) {
  const m = String(id ?? "").match(/^(.+)-q0*(\d+)$/);
  if (!m) return null;
  const paper = lib("pyq").find((p) => p.id === m[1]);
  const q = paper?.questions?.find((x) => String(x.n) === m[2]);
  return { paper: m[1], n: m[2], year: paper?.year ?? m[1].match(/\d{4}/)?.[0], code: PAPER[m[1].split("-").pop()] ?? "", text: q ? (T(q)?.q ?? "") : "" };
}

export function viewSkeletons(arg) {
  const all = lib("mains-skeleton");
  if (!all.length) return empty("Answer skeletons", "Answer skeletons");
  const items = all.map((d) => ({ d, p: pyqOf(d.pyqId) })).sort((a, b) => String(a.d.pyqId).localeCompare(String(b.d.pyqId), undefined, { numeric: true }));
  if (arg) {
    const it = items.find((x) => x.d.id === arg);
    if (!it) return h("div.col", back("#skeletons", "Answer skeletons"), h("p", "That one isn't here."));
    const { d, p } = it;
    const k = items.indexOf(it), next = items[k + 1];
    const reveal = h("div.col");
    const show = () => put(reveal,
      h("div.card.soft", h("strong", "What the word asks"), h("p", T(d.directive))),
      h("div.card", h("strong", "Open with"), h("p", T(d.intro))),
      h("div.card", h("strong", "Headings for the body"), h("ol", (d.headings ?? []).map((x) => h("li", T(x))))),
      h("div.card", h("strong", "Close with"), h("p", T(d.wayForward))),
      d.commonMistake && h("div.card.soft", h("strong", "The common slip"), h("p", T(d.commonMistake))),
      h("p.small.muted", "A skeleton, not a model answer: your examples and your words make it yours."),
      h("div.row", next ? h("a.btn.primary", { href: "#skeletons/" + next.d.id }, "Next question") : h("a.btn", { href: "#skeletons" }, "All questions"),
        h("a.btn", { href: "#mains" }, "Write one in Mains answer")));
    return h("div.col", back("#skeletons", "Answer skeletons"),
      h("div.small.muted", [p?.year && `Mains ${p.year}`, p?.code, p && `Q${p.n}`, `${d.marks} marks`, `${d.words} words`].filter(Boolean).join(" · ")),
      h("h1", { style: { fontSize: "22px" } }, p?.text || "Past Mains question"),
      C.pauseLine("pyq-first"),
      h("div.card.soft", h("strong", "Before you look"), h("p", "Spend two minutes on paper: what does the question word ask, and which three or four headings would you use? Then compare.")),
      reveal, !reveal.childNodes.length && h("button.primary", { onclick: (e) => { e.target.remove(); show(); } }, "Show the skeleton"));
  }
  const papers = [...new Set(items.map((x) => x.p?.code || "Other"))].sort();
  return h("div.col", back("#practice", "Practice"), h("h1", "Answer skeletons"),
    h("p.muted", `${items.length} real Mains questions, each with a way in: what the question word asks, an opening, headings, a close and the slip most people make. Try your own outline first.`),
    papers.map((code) => h("div", h("h2", code === "Other" ? "More" : `${code}`),
      items.filter((x) => (x.p?.code || "Other") === code).map(({ d, p }) => h("a.card.link", { href: "#skeletons/" + d.id },
        h("div.row.between", h("div", h("strong", p?.text ? (p.text.length > 120 ? p.text.slice(0, 118) + "…" : p.text) : `Question ${p?.n ?? ""}`),
          h("div.small.muted", [p?.year && `Mains ${p.year}`, `${d.marks} marks`, `${d.words} words`].filter(Boolean).join(" · "))), h("span", "→")))))));
}

// --- GS4: cases, thinkers and terms ------------------------------------------------------------------

export function viewCases(arg) {
  const cases = lib("gs4-case").sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const gl = lib("gs4-glossary");
  const thinkers = gl.flatMap((g) => g.thinkers ?? []), terms = gl.flatMap((g) => g.terms ?? []);
  if (!cases.length && !gl.length) return empty("Ethics cases", "GS4 cases, thinkers and terms");
  const tabs = h("div.chips", [["", `Cases (${cases.length})`], ["thinkers", `Thinkers (${thinkers.length})`], ["terms", `Terms (${terms.length})`]]
    .map(([k, l]) => h("a.chip", { href: "#cases" + (k ? "/" + k : ""), "aria-pressed": String((arg || "") === k || (k === "" && /^b05/.test(arg ?? ""))) }, l)));
  const head = (sub) => [back(arg && !["thinkers", "terms"].includes(arg) ? "#cases" : "#practice", arg && !["thinkers", "terms"].includes(arg) ? "Ethics cases" : "Practice"), h("h1", "Ethics (GS4)"), tabs, sub && h("p.muted", sub)];

  if (arg === "thinkers") return h("div.col", ...head("Who said what, and when an idea helps in an answer. One line of a thinker, used well, lifts a case answer."),
    thinkers.map((t) => h("details.card", h("summary", h("strong", T(t.name)), h("div.small", T(t.idea))),
      t.quote && h("p", { style: { fontStyle: "italic" } }, T(t.quote)), t.useWhen && h("p", h("strong", "Use it when: "), T(t.useWhen)),
      t.misuse && h("p.small.muted", h("strong", "Don't: "), T(t.misuse)))));
  if (arg === "terms") return h("div.col", ...head("The GS4 words, in English and Hindi, each with an example and the word it's often confused with."),
    terms.map((t) => h("details.card", h("summary", h("strong", t.term?.en), " · ", h("span", { lang: "hi" }, t.term?.hi), h("div.small", T(t.meaning))),
      t.example && h("p", h("strong", "Example: "), T(t.example)), t.confusedWith && h("p.small.muted", h("strong", "Not the same as: "), T(t.confusedWith)))));

  const c = arg && cases.find((x) => x.id === arg);
  if (c) {
    const key = "case:" + c.id;
    const mine = C.store.get(key, "");
    const ta = h("textarea", { rows: 6, placeholder: "Your options and your choice, in a few lines. This stays on this device.", value: mine, oninput: (e) => C.store.set(key, e.target.value) });
    const reveal = h("div.col");
    const ci = c.circle ?? {};
    const show = () => put(reveal,
      ci.stakeholders?.length && h("div.card", h("strong", "Who has a stake"), h("ul", ci.stakeholders.map((s) => h("li", h("strong", T(s.who) + ": "), T(s.stake))))),
      ci.inTension && h("div.card.soft", h("strong", "What pulls against what"), h("p", T(ci.inTension))),
      ci.options?.length && h("div.card", h("strong", "The options"), h("ol", ci.options.map((o) => h("li", T(o))))),
      ci.choice && h("div.card", h("strong", "One sound choice"), h("p", T(ci.choice))),
      c.seasoning?.length && h("div.card.soft", h("strong", "Words and ideas that fit"), h("ul", c.seasoning.map((s) => h("li", T(s))))),
      h("p.small.muted", "Other choices can be just as sound if you weigh the same people and say why."));
    const k = cases.indexOf(c), next = cases[k + 1];
    return h("div.col", ...head(), h("div.small.muted", `Case ${k + 1} of ${cases.length}${c.tension ? " · " + T(c.tension) : ""}`),
      h("div.card", h("p", { style: { whiteSpace: "pre-line", fontFamily: "var(--read-font)" } }, T(c.case)), h("p", h("strong", T(c.question)))),
      h("label.small", "Your answer first"), ta,
      reveal, h("button.primary", { onclick: (e) => { e.target.remove(); show(); } }, "Compare with the guide"),
      next && h("a.btn", { href: "#cases/" + next.id }, "Next case"));
  }
  return h("div.col", ...head("Case studies in the GS4 style. Read the case, write your options and your choice, then compare with a guide that maps who has a stake and why."),
    cases.map((x, i) => h("a.card.link", { href: "#cases/" + x.id }, h("div.row.between",
      h("div", h("strong", T(x.tension) || `Case ${i + 1}`), h("div.small.muted", [`Case ${i + 1}`, x.setting, C.store.get("case:" + x.id) && "written"].filter(Boolean).join(" · "))), h("span", "→")))));
}

// --- CSAT: one set a week ----------------------------------------------------------------------------

export function viewCsat(arg) {
  const weeks = lib("csat-week").sort((a, b) => a.id.localeCompare(b.id));
  if (!weeks.length) return empty("CSAT weekly", "CSAT sets");
  const w = weeks.find((x) => x.id === arg);
  if (!w) {
    const done = C.store.get("csatDone", {});
    return h("div.col", back("#practice", "Practice"), h("h1", "CSAT, one set a week"),
      h("p.muted", "Ten mixed questions (numbers, reasoning, a table) and one passage with three questions. About 30 minutes. Every answer has a worked why."),
      weeks.map((x, i) => h("a.card.link", { href: "#csat/" + x.id }, h("div.row.between",
        h("div", h("strong", `Week ${i + 1}`), h("div.small.muted", done[x.id] ? `Done · ${done[x.id].right} of ${done[x.id].n} right` : `${(x.page1?.length ?? 0) + (x.page2?.questions?.length ?? 0)} questions`)), h("span", "→")))));
  }
  const lang = C.lang() === "hi" ? "hi" : "en";
  const key = Object.fromEntries((w.key ?? []).map((k) => [String(k.n), k]));
  const results = {};
  const finish = h("div");
  const table = (rows) => rows?.length && h("table.small", { style: { borderCollapse: "collapse", margin: "8px 0" } },
    rows.map((r, i) => h("tr", r.map((c) => h(i ? "td" : "th", { style: { border: "1px solid var(--line, #ccc)", padding: "4px 8px", textAlign: "left" } }, String(c).split(" / ")[lang === "hi" ? 1 : 0] ?? c)))));
  const q = (x) => {
    const k = key[String(x.n)];
    const mcq = { question: `${x.n}. ${T(x.q)}`, options: (x.options?.[lang] ?? x.options?.en ?? []), answerIndex: k?.answer, explanation: T(k?.why) };
    return h("div.card", table(x.table), C.mcqBlock(mcq, (ok) => {
      results[x.n] = ok;
      const n = (w.page1?.length ?? 0) + (w.page2?.questions?.length ?? 0), got = Object.keys(results).length;
      if (got === n) {
        const right = Object.values(results).filter(Boolean).length;
        const all = C.store.get("csatDone", {}); all[w.id] = { right, n, day: C.today() }; C.store.set("csatDone", all);
        put(finish, h("div.card", h("h2", { style: { marginTop: 0 } }, "Set done."), h("p", `${right} of ${n} right. CSAT needs 66 of 200 to qualify; this is practice for the habit, not a mark.`),
          h("a.btn", { href: "#csat" }, "All weeks")));
      }
    }));
  };
  return h("div.col", back("#csat", "CSAT weekly"), h("h1", `CSAT · week ${weeks.indexOf(w) + 1}`),
    h("p.muted", "Work each one on paper first. Wrong answers show the working; nothing is timed."),
    h("h2", "Part 1. Ten questions"), (w.page1 ?? []).map(q),
    w.page2 && h("h2", "Part 2. A passage"),
    w.page2 && h("div.card.soft", h("p", { style: { whiteSpace: "pre-line", fontFamily: "var(--read-font)" } }, T(w.page2.passage))),
    (w.page2?.questions ?? []).map(q), finish);
}

// --- Walk scripts ------------------------------------------------------------------------------------

export function walkScripts() {
  const all = lib("walk-script").sort((a, b) => T(a.topic).localeCompare(T(b.topic)));
  if (!all.length) return null;
  return h("div", h("h2", "Guided walks"), h("p.small.muted", "One topic, one question, about six minutes. The device voice reads it; you answer aloud."),
    all.map((d) => h("a.card.link", { href: "#walk/" + d.id }, h("div.row.between", h("div", h("strong", T(d.topic)), h("div.small.muted", `${d.minutes ?? 6} min`)), h("span", "→")))));
}
export function viewWalkScript(id) {
  const d = lib("walk-script").find((x) => x.id === id);
  if (!d) return h("div.col", back("#walk", "Walk mode"), h("p", "That walk isn't here."));
  const text = T(d.script);
  return h("div.col", back("#walk", "Walk mode"), h("h1", T(d.topic)), h("p.small.muted", `About ${d.minutes ?? 6} minutes · earphones in`),
    h("div.card", h("div.row.between", h("strong", "Listen"), C.readAloud(text, C.lang())),
      h("div", { style: { whiteSpace: "pre-wrap", fontFamily: "var(--read-font)", marginTop: "8px" } }, text)),
    d.pronounce?.length && h("div.card.soft", h("strong", "Say it right"), h("ul", d.pronounce.map((p) => h("li", h("strong", p.term), " · ", p.say)))),
    h("p.small.muted", "When it ends, say your answer aloud once, then walk on. Nothing is recorded."));
}

// --- Welcome back --------------------------------------------------------------------------------------

/** One restart day for a gap ("about-3-days", "about-2-weeks", "about-1-month") or after a hard mock. Picked by the day. */
function restartFor(when) {
  const all = lib("restart-day").filter((d) => d.when === when);
  if (!all.length) return null;
  return all[Number(C.today().replace(/-/g, "")) % all.length];
}
/** The card on Today after a gap of 3 days or more. Shown on the day you come back; × hides it. */
export function welcomeBack(gapDays) {
  if (!gapDays || gapDays < 3 || C.store.get("welcomeBackSeen") === C.today()) return null;
  const d = restartFor(gapDays >= 25 ? "about-1-month" : gapDays >= 10 ? "about-2-weeks" : "about-3-days");
  if (!d) return null;
  const box = h("div.card.soft",
    h("div.row.between", h("strong", T(d.headline)), h("button.ghost", { "aria-label": "Hide", onclick: () => { C.store.set("welcomeBackSeen", C.today()); box.remove(); } }, "×")),
    h("p", T(d.body)), d.firstStep && h("p", h("strong", "First step: "), T(d.firstStep)), d.pauseLineKey && C.pauseLine(d.pauseLineKey));
  return box;
}
/** A quiet line on the mock result page when a paper went badly (under 40% of the marks). */
export function afterHardMock(r) {
  if (!r || r.id === "quick" || !(r.max > 0) || r.score / r.max >= 0.4) return null;
  const d = restartFor("bad-mock-or-result");
  return d && h("div.card.soft", h("strong", T(d.headline)), h("p", T(d.body)), d.firstStep && h("p", h("strong", "First step: "), T(d.firstStep)));
}

// --- Optional: the order to study in -------------------------------------------------------------------

/** The approved priority list for an optional, as a block on its subject page. Links to topics that are in the app. */
export function optionalOrder(subject, haveIds) {
  const p = lib("optional-priority").find((x) => x.optional === subject);
  if (!p?.nodes?.length) return null;
  const rows = [...p.nodes].sort((a, b) => a.rank - b.rank);
  return h("details.card", h("summary", h("strong", `Where to start: ${rows.length} topics in order`), h("div.small.muted", "The topics asked most often, and why each matters.")),
    h("ol", rows.map((n) => h("li", { style: { margin: "8px 0" } },
      haveIds.has(n.id) ? h("a", { href: `#optional/${subject}/${n.id}` }, T(n.title)) : h("span", T(n.title)),
      h("span.small.muted", ` · Paper ${n.paper}`), n.why && h("div.small", T(n.why))))));
}
