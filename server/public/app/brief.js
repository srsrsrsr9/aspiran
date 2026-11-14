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

// --- Printable sheets ("printable") and audio lectures ("audio-lecture") ------------------------------

const SUBJECT = { polity: "Polity", economy: "Economy", geography: "Geography", environment: "Environment", culture: "Art and culture", history: "History", ethics: "Ethics", csat: "CSAT", security: "Internal security", science: "Science" };
const subjectName = (s) => SUBJECT[s] ?? String(s ?? "More").replace(/^./, (c) => c.toUpperCase());
/** Items grouped by subject, subjects in SUBJECT's order. */
function bySubject(items) {
  const order = Object.keys(SUBJECT);
  const subs = [...new Set(items.map((d) => d.subject))].sort((a, b) => ((order.indexOf(a) + 1) || 99) - ((order.indexOf(b) + 1) || 99));
  return subs.map((s) => [s, items.filter((d) => d.subject === s)]);
}

function sheetBlock(b) {
  const cap = b.caption && h("strong", b.caption);
  if (b.type === "table") return h("div.sheet-block", cap, h("table.sheet", b.head?.length && h("tr", b.head.map((c) => h("th", c))), (b.rows ?? []).map((r) => h("tr", r.map((c) => h("td", c))))));
  if (b.type === "timeline") return h("div.sheet-block", cap, h("table.sheet", (b.items ?? []).map((x) => h("tr", h("th", x.when), h("td", x.what)))));
  if (b.type === "list") return h("div.sheet-block", cap, h("ul", (b.items ?? []).map((x) => h("li", x))));
  if (b.type === "compare") return h("div.sheet-block", cap, h("div.grid2", [b.left, b.right].filter(Boolean).map((s) => h("div", h("strong", s.title), h("ul", (s.points ?? []).map((p) => h("li", p)))))));
  if (b.type === "note") return h("p.sheet-note", b.text);
  return null;
}

export function viewSheets(arg) {
  const all = lib("printable").sort((a, b) => String(T(a)?.title).localeCompare(String(T(b)?.title)));
  if (!all.length) return empty("Printable sheets", "One-page sheets");
  const d = arg && all.find((x) => x.id === arg);
  if (d) {
    const s = T(d) ?? {};
    return h("div.col.sheet-page", h("div.row.between.no-print", back("#sheets", "Printable sheets"), h("button.primary", { onclick: () => window.print() }, "Print")),
      h("div.small.muted", [subjectName(d.subject), d.paper].filter(Boolean).join(" · ")),
      h("h1", s.title), s.subtitle && h("p.muted", s.subtitle),
      (s.blocks ?? []).map(sheetBlock),
      s.remember?.length && h("div.card.soft", h("strong", "Remember"), h("ul", s.remember.map((x) => h("li", x)))),
      h("p.small.muted.no-print", "One page, made to be printed and pinned up. Cover it, say what you remember, then check."));
  }
  return h("div.col", back("#practice", "Practice"), h("h1", "Printable sheets"),
    h("p.muted", `${all.length} one-page sheets: tables, timelines and lists to print, pin up and test yourself from.`),
    bySubject(all).map(([sub, items]) => h("div", h("h2", subjectName(sub)),
      items.map((x) => h("a.card.link", { href: "#sheets/" + x.id }, h("div.row.between",
        h("div", h("strong", T(x)?.title), T(x)?.subtitle && h("div.small.muted", T(x).subtitle)), h("span", "→")))))));
}

/** Plays the recorded parts one after another from a single player. Nothing starts until the person presses play. */
function partsPlayer(urls) {
  let k = 0;
  const label = h("span.small.muted");
  const audio = h("audio", { controls: true, preload: "none", style: { width: "100%" } });
  const load = (i) => { k = i; audio.src = urls[k]; label.textContent = urls.length > 1 ? `Part ${k + 1} of ${urls.length}` : ""; };
  audio.addEventListener("ended", () => { if (k + 1 < urls.length) { load(k + 1); audio.play().catch(() => {}); } else label.textContent = "The end."; });
  addEventListener("hashchange", () => audio.pause(), { once: true });
  load(0);
  return h("div", audio, label);
}

export function viewTalks(arg) {
  const all = lib("audio-lecture").sort((a, b) => String(T(a)?.title).localeCompare(String(T(b)?.title)));
  if (!all.length) return empty("Audio lectures", "Audio lectures");
  const heard = C.store.get("talksHeard", {});
  const d = arg && all.find((x) => x.id === arg);
  if (d) {
    const lang = C.lang() === "hi" && d.hi ? "hi" : "en";
    const s = d[lang] ?? d.en, chapters = s.chapters ?? [];
    const rec = d.recording?.[lang];
    const listen = rec?.length
      ? h("div.card", h("strong", "Listen"), h("p.small.muted", "Recorded voice. Earphones in, or play it on a walk."), partsPlayer(rec))
      : h("div.card", h("div.row.between", h("strong", "Listen"), C.readAloud(chapters.map((c) => c.title + ".\n" + c.script).join("\n"), lang)),
        h("p.small.muted", "Not recorded yet, so the device voice reads it."));
    const results = [];
    const done = h("div");
    const check = (s.check ?? []).map((q, i) => h("div.card", C.mcqBlock({ question: `${i + 1}. ${q.q}`, options: q.options ?? [], answerIndex: Number(q.answerIndex), explanation: q.why }, (ok) => {
      results[i] = ok;
      if (results.filter((x) => x !== undefined).length === s.check.length) {
        const all2 = C.store.get("talksHeard", {}); all2[d.id] = C.today(); C.store.set("talksHeard", all2);
        put(done, h("div.card", h("strong", "That's the talk."), h("p", "Say the three ideas you'd keep, aloud, once. Then stop here for today or pick another."), h("a.btn", { href: "#talks" }, "All talks")));
      }
    })));
    return h("div.col", back("#talks", "Audio lectures"),
      h("div.small.muted", [subjectName(d.subject), d.paper, d.minutes && `about ${d.minutes} min`].filter(Boolean).join(" · ")),
      h("h1", s.title), s.summary && h("p", s.summary), listen,
      h("details.card", h("summary", h("strong", "Read along"), h("span.small.muted", ` · ${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`)),
        chapters.map((c) => h("div", h("h3", c.title), h("p", { style: { whiteSpace: "pre-line", fontFamily: "var(--read-font)" } }, c.script)))),
      check.length && h("h2", "Three quick checks"), check.length && h("p.small.muted", "After you've listened. Nothing is scored."), check, done);
  }
  return h("div.col", back("#practice", "Practice"), h("h1", "Audio lectures"),
    h("p.muted", `${all.length} talks of 10 to 15 minutes, in chapters, each ending with three quick checks. For a walk, the bus or the kitchen.`),
    bySubject(all).map(([sub, items]) => h("div", h("h2", subjectName(sub)),
      items.map((x) => h("a.card.link", { href: "#talks/" + x.id }, h("div.row.between",
        h("div", h("strong", T(x)?.title), h("div.small.muted", [x.minutes && `${x.minutes} min`, x.recording?.[C.lang() === "hi" ? "hi" : "en"]?.length ? "recorded" : "device voice", heard[x.id] && "heard"].filter(Boolean).join(" · "))), h("span", "→")))))));
}

// --- Short videos: weekly current affairs and "Syllabus in a minute" (GET /ca, /ca?series=, /ca/<week>; ca.ts) ---
// Never autoplays and starts muted (sound is the member's choice); captions on; on mobile data nothing is fetched
// until play. Scenes that aren't free stay in Plus (the phone app unlocks them); the web shows their poster only.

const SERIES = "syllabus-in-a-minute";
/** "2026-45" (ISO week) → "2–8 Nov". */
function weekDates(w) {
  const [y, n] = w.split("-").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const mon = new Date(jan4.getTime() + ((n - 1) * 7 - ((jan4.getUTCDay() + 6) % 7)) * 864e5);
  const sun = new Date(mon.getTime() + 6 * 864e5);
  const f = (d, m) => d.toLocaleDateString("en-IN", { day: "numeric", ...(m ? { month: "short" } : {}), timeZone: "UTC" });
  return `${f(mon, mon.getUTCMonth() !== sun.getUTCMonth())}–${f(sun, true)}`;
}
const metered = () => { const c = navigator.connection; return !!(c && (c.saveData || c.type === "cellular")); };
const getJson = (p) => fetch(p, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

export function viewWatch(arg) {
  const box = h("div.col", back("#practice", "Practice"), h("p.muted", "Loading…"));
  const hi = C.lang() === "hi";
  if (arg) {
    getJson(`/ca/${encodeURIComponent(arg)}`).then((w) => {
      if (!w) return put(box, back("#watch", "Videos"), h("p", "This set isn't available. Check your connection and try again."));
      const title = w.series ? (hi && w.titleHi) || w.title : `Current affairs, ${weekDates(w.week)}`;
      const seen = C.store.get("videosSeen", {});
      put(box, back("#watch", "Videos"), h("h1", title),
        h("p.small.muted", `${w.episodes.length} short videos, under a minute each. Two AI voices. Sound starts off; captions are on.`),
        w.episodes.map((e) => {
          const src = w.base + e.mp4;
          const media = e.free
            ? h("video", { controls: true, muted: true, playsinline: true, preload: metered() ? "none" : "metadata", poster: w.base + e.poster,
                style: { width: "100%", maxHeight: "70vh", borderRadius: "12px", background: "#000" },
                onended: () => { const s = C.store.get("videosSeen", {}); s[w.week + "/" + e.id] = C.today(); C.store.set("videosSeen", s); } },
                h("source", { src, type: "video/mp4" }), h("track", { kind: "captions", src: w.base + e.vtt, srclang: "en", label: "English", default: true }))
            : h("div", h("img", { src: w.base + e.poster, alt: "", style: { width: "100%", maxHeight: "50vh", objectFit: "cover", borderRadius: "12px", filter: "blur(6px)" } }),
                h("p.small", "This one is in Plus, in the Android app. ", h("a", { href: "#upgrade" }, "See Plus →")));
          const quiz = (e.quiz ?? []).map((q) => C.mcqBlock({ question: q.q, options: q.options, answerIndex: q.answerIndex, explanation: q.why }, () => {}));
          return h("div.card", h("strong", `${e.n}. ${e.title}`), seen[w.week + "/" + e.id] && h("span.small.muted", " · watched"), media,
            quiz.length && e.free && h("details", h("summary", "One question"), quiz),
            e.sources?.length && h("p.small.muted", "Sources: " + e.sources.map((s) => (typeof s === "string" ? s : s.name)).join("; ")));
        }),
        h("p.small.muted", "That's the set. Stop here, or pick another."), h("a.btn", { href: "#watch" }, "All videos"));
    });
    return box;
  }
  Promise.all([getJson("/ca"), getJson(`/ca?series=${SERIES}`)]).then(([ca, syl]) => {
    const weeks = ca?.weeks ?? [], papers = syl?.weeks ?? [];
    if (!weeks.length && !papers.length) return put(box, back("#practice", "Practice"), h("h1", "Videos"), h("p", "No videos yet, or you're offline."));
    const row = (href, poster, strong, small) => h("a.card.link", { href }, h("div.row.between",
      h("div.row", { style: { gap: "12px", alignItems: "center" } }, h("img", { src: poster, alt: "", loading: "lazy", style: { width: "48px", height: "85px", objectFit: "cover", borderRadius: "8px" } }),
        h("div", h("strong", strong), h("div.small.muted", small))), h("span", "→")));
    const mins = (s) => `${Math.max(1, Math.round(s / 60))} min`;
    put(box, back("#practice", "Practice"), h("h1", "Videos"),
      h("p.muted", "Short videos, under a minute each, with one question after. Nothing plays until you press play."),
      weeks.length > 0 && h("h2", "Current affairs, week by week"),
      weeks.map((w) => row("#watch/" + w.week, w.poster, weekDates(w.week), `${w.scenes} videos · ${mins(w.seconds)}${w.free < w.scenes ? ` · ${w.free} free` : ""}`)),
      papers.length > 0 && h("h2", "Syllabus in a minute"),
      papers.length > 0 && h("p.small.muted", "One video for every topic in the UPSC syllabus, paper by paper."),
      papers.map((w) => row("#watch/" + w.week, w.poster, (hi && w.titleHi) || w.title, `${w.scenes} videos · ${mins(w.seconds)}`)));
  });
  return box;
}
