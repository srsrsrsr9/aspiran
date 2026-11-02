// The Plus sales page (Prep → Plus for members without Plus). One long scroll: a dark hero, the story,
// what Plus does (one block per value), real tastes, what stays free, the price, questions.
// It builds its own look on purpose (dark, warm, big type) and keeps to the app's rules: real numbers
// only, no testimonials, no countdowns, no scarcity, no promises about results; motion only when the
// device allows it; the offer goes quiet in result mode, pause, after care and late at night.

const WA = "919876656573";
// The special offer next to the one price: some aspirants can try Plus free. The number is selectable text and a link.
const offerText = (C) => C.lang() === "hi"
  ? ["विशेष ऑफ़र: योग्य उम्मीदवार Plus मुफ़्त आज़मा सकते हैं। ज़्यादा जानने के लिए हमें WhatsApp करें: ", "98766 56573"]
  : ["Special offer: eligible candidates can try Plus free. WhatsApp us to know more: ", "98766 56573"];
function offerLine(C, h) {
  const [lead, num] = offerText(C);
  const msg = C.lang() === "hi" ? "नमस्ते, मुझे Plus के मुफ़्त ऑफ़र के बारे में जानना है।" : "Hi, I'd like to know about the free Plus offer.";
  return h("p.pp-offer", lead, h("a", { href: `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, target: "_blank", rel: "noopener" }, num));
}

export function plusSalesPage(C, d) {
  // d: { h, T, plusStatus, offerQuiet, mcqRun, insightsBody, SAMPLE_HIST, SAMPLE_MISSES, weekQs, playable }
  const { h } = d;
  injectCss();
  const mocks = C.libraryOf("mock");
  const mockQs = mocks.reduce((a, m) => a + (m.data.questions?.length ?? 0), 0);
  const csat = mocks.filter((m) => m.id.includes("csat")).length;
  const games = d.playable().length;
  const reads = C.libraryOf("read").length;
  const week = d.weekQs();
  const hist = C.store.get("mockHistory", []);
  const quiet = d.offerQuiet();

  const priceEls = [];   // filled once /plus/status answers
  const ctaEls = [];
  const priceText = (p) => `₹${Number(p).toLocaleString("en-IN")}`;
  const price = h("span", "₹9,999");
  priceEls.push(price);

  const buy = (label, cls = "") => {
    const a = h(`a.pp-btn${cls}`, { href: "#plus" }, h("span", label), arrow());
    ctaEls.push(a);
    return a;
  };
  const quietLine = quiet && h("p.pp-quiet", quiet === "late"
    ? "It's late. Everything here will still be here in the morning. Sleep is part of the plan."
    : "Not today. Plus will be here whenever you want it.");

  d.plusStatus().then((st) => {
    const pay = st?.payments ?? {};
    const live = pay.provider === "cashfree" && C.plusOn();
    const p = live ? pay.amountInr : st?.prices?.yearly?.inr ?? 9999;
    priceEls.forEach((el) => (el.textContent = priceText(p)));
    for (const a of ctaEls) {
      if (live) a.href = "#plus";
      else { a.href = `https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like to get Aspiran Plus.")}`; a.target = "_blank"; a.rel = "noopener"; }
      a.addEventListener("click", () => C.post("/plus/impression", { surface: "prep", moment: "upgrade", action: "accepted", memberId: C.profile()?.memberId }));
    }
    if (!quiet) C.post("/plus/impression", { surface: "prep", moment: "upgrade", memberId: C.profile()?.memberId });
  });

  // ---- 1. Hero -------------------------------------------------------------------------------------
  const hero = h("section.pp-hero",
    h("div.pp-orb.o1"), h("div.pp-orb.o2"), h("div.pp-orb.o3"), h("div.pp-grain"),
    h("div.pp-hero-in",
      h("div.pp-copy",
        h("p.pp-eyebrow.rv", h("span.pp-dot"), "Aspiran Plus"),
        h("h1.pp-h1.rv", "You've done the reading. ", h("span.pp-grad", "Now see what you actually know.")),
        h("p.pp-lead.rv", "Plus turns every mock you take into a map of where your marks are slipping away, and gives you the tools to win them back, week after week, until the day of the exam."),
        quiet ? quietLine : h("div.pp-ctas.rv", buy("Get Plus for the year"), h("a.pp-btn.ghost", { href: "#pp-try" }, "Try a question first")),
        !quiet && h("p.pp-fine.rv", price, " a year. One payment, doesn't renew by itself."),
        !quiet && offerLine(C, h)),
      h("div.pp-stage.rv", mockCard(h))),
    h("div.pp-scrollhint", h("span")));

  // ---- 2. The story (Sugarman: one idea, short lines, keep them sliding) -----------------------------
  const story = h("section.pp-story",
    h("div.pp-narrow",
      h("p.pp-kicker.rv", "A strange thing about Prelims"),
      h("p.pp-big.rv", "Most aspirants take mock after mock and look at exactly one thing."),
      h("p.pp-big.rv.dim", "The score."),
      h("p.rv", "It goes up a little. It goes down a little. They feel good, or they feel awful, and they move on to the next paper."),
      h("p.rv", "Meanwhile the same three or four topics quietly take marks from them in every single paper. A tricky polity pair. Statement questions in economy. One kind of trap they fall for every time."),
      h("p.rv", "Not because they didn't study. Because nobody ever showed them the pattern."),
      h("p.pp-big.rv", "Plus shows you the pattern.", h("br"), h("span.pp-grad", "Then it helps you fix it."))));

  // ---- 3. Numbers band (real counts from the library) -------------------------------------------------
  const nums = h("section.pp-nums",
    num(mocks.length, "full mock papers", csat ? `incl. ${csat} CSAT` : "Prelims format"),
    num(mockQs, "exam-format questions", "+2 / −0.66, like the real thing"),
    num(games, "practice games", "free for everyone"),
    num(reads, "long reads", "free for everyone"));

  // ---- 3b. Inside the app: the whole product, shown working (real content where we have it) ---------
  const lib = C.data.library?.items ?? [];
  const kinds = new Set(lib.filter((i) => i.data?.play?.engine || !["mock", "read"].includes(i.kind)).map((i) => i.kind));
  const inside = h("section.pp-inside",
    h("div.pp-narrow", h("p.pp-kicker.rv", "Inside Aspiran"),
      h("h2.pp-h2.rv", "Not another PDF dump. ", h("span.pp-grad", "A whole way of preparing.")),
      h("p.pp-sub.rv", "Stories you can swipe. Games that teach. News every morning. Mocks that explain themselves. A study buddy who answers back. All in one place, built around how UPSC actually tests you.")),
    h("div.pp-bento",
      h("div.pp-tile.t-story.rv", tileHead("Swipe-sized stories", "Big topics, broken into ideas you can read in a minute each. Swipe, and the next idea arrives. Then it gives you recall questions."), storyStack(h, C, d.T)),
      h("div.pp-tile.t-play.rv", tileHead(`${kinds.size} ways to play`, "Fact or opinion. Find the lie. Timeline shuffle. Trap spotter. Every game is built on a real exam format. Try this one:"), playTaste(h, C, d.T), marquee(h, [...kinds])),
      h("div.pp-tile.t-chai.rv", tileHead("Chai, every morning", "The day's news that matters for UPSC, checked and cut down to cards. Five minutes with your tea, and then three questions to lock it in."), chaiVis(h)),
      h("div.pp-tile.t-eval.rv", tileHead("Mocks that explain themselves", "Every answer reviewed: what you picked, what was right, and the trap that caught you. Plus your score range, so one lucky paper doesn't fool you."), evalVis(h, mocks, d.T)),
      h("div.pp-tile.t-chotu.rv", tileHead("Talk it through with Chotu", "Stuck at midnight? Ask Chotu directly, argue a point, get it explained in simpler words, in English or Hindi."), chotuVis(h))),
    h("div.pp-narrow.pp-bridge", h("p.pp-big.rv", "All of that is yours, free.", h("br"), h("span.pp-grad", "Plus is what turns it into results you can measure."))));

  // ---- 4. What Plus does: one block per value --------------------------------------------------------
  const feat = (n, title, body, visual, flip) => h(`section.pp-feat${flip ? ".flip" : ""}`,
    h("div.pp-feat-copy.rv", h("p.pp-num", n), h("h2.pp-h2", title), ...body.map((t) => h("p", t))),
    h("div.pp-feat-vis.rv", visual));
  const features = h("div.pp-feats",
    feat("01", "Every mock paper. Not one a month.",
      [`Free members get one full paper a month. Plus opens all ${mocks.length || "of them"}, ${mockQs || "hundreds of"} questions across polity, history, geography, economy, environment, science, IR, art and culture, society and CSAT.`,
        "Real Prelims formats: statement pairs, how-many-correct, assertion and reason, match the list. Negative marking, so your guessing habits show up too."],
      paperStack(h)),
    feat("02", "Find the marks you're losing.",
      ["After every paper, Plus breaks your result down by subject and topic. Not \"62 out of 100\". It shows something like \"Economy: 4 of 9, and 3 of those 5 misses were statement questions.\"",
        "That one line is worth more than ten more papers taken blind."],
      bars(h), true),
    feat("03", "Watch yourself get better.",
      ["Your trend across papers, drawn as a line, not a feeling. You'll know if last month's revision worked, and you'll know which subject is holding the line back."],
      trend(h)),
    feat("04", "An error log that remembers for you.",
      ["Every question you miss, in any mock or practice set, goes into one log, grouped by topic.",
        "Free members revise two a day. Plus lets you revise all of them, any time, so the same question never costs you twice."],
      errorStack(h), true),
    feat("05", "The week's current affairs, as one test.",
      ["Every Sunday, the week's checked Chai cards become a single Prelims-style test. Seven days of news, tested in one sitting, while it's still fresh."],
      weekStrip(h)),
    feat("06", "A monthly compilation you can print.",
      ["Thirty days of current affairs, grouped by topic, with the questions under each. Print it, carry it, revise it on the metro. It's built from what you actually read."],
      compileVis(h), true),
    feat("07", "Feedback on every answer you write.",
      ["Free members get three answer reviews a week. Plus removes the limit and goes deeper on structure, examples and the demand of the question, so Mains practice turns into Mains improvement."],
      feedbackVis(h)),
    feat("08", "Chotu, 100 conversations a day.",
      ["Your study buddy in the cloud, for doubts at midnight and explanations in simpler words. Free members get 15 turns a day. Plus gives you 100."],
      chotuVis(h), true));

  // ---- 5. Try it -----------------------------------------------------------------------------------
  const paper = mocks.find((m) => !hist.some((r) => r.id === m.id)) ?? mocks[0];
  const pq = paper ? paper.data.questions.slice(0, 3).map((q, k) => ({ ...q, id: `${paper.id}#${k}` })) : [];
  const tryIt = h("section.pp-try", { id: "pp-try" },
    h("div.pp-narrow",
      h("p.pp-kicker.rv", "Don't take our word for it"),
      h("h2.pp-h2.rv", "Try three questions from a real Plus paper."),
      paper && h("p.pp-sub.rv", `From "${d.T(paper.data.title)}". Take your time; there's no clock.`)),
    h("div.pp-try-grid",
      paper && h("div.pp-panel.rv", d.mcqRun(pq, { title: "Mock taste", onDone: (r, n) => h("p", h("strong", `${r} of ${n}. `), `The full paper has ${paper.data.questions.length} questions, and Plus shows you exactly where each miss came from.`) })),
      h("div.pp-panel.rv", h("p.pp-panel-t", hist.length ? "Your latest paper, the Plus way" : "What your insights look like (sample)"),
        d.insightsBody(hist.length ? hist.slice(-1) : d.SAMPLE_HIST, hist.length ? C.store.get("misses", []).slice(-1) : d.SAMPLE_MISSES, !hist.length))));

  // ---- 6. What stays free --------------------------------------------------------------------------
  const free = h("section.pp-free",
    h("div.pp-narrow", h("p.pp-kicker.rv", "No catch"), h("h2.pp-h2.rv", "Everything free stays free. Always."),
      h("p.pp-sub.rv", "Plus adds depth. It never locks what you already have.")),
    h("div.pp-free-grid", ["Your pod and the Adda", "Daily Chai and Today's 3", `${games} practice games`, `${reads} long reads`, "Prelims practice bank", "Focus blocks and Calm", "One full mock a month", "Chotu, 15 turns a day"]
      .map((t) => h("div.pp-chip.rv", tick(), t))));

  // ---- 7. Side by side -----------------------------------------------------------------------------
  const rows = [
    ["Full mock papers", "1 a month", `All ${mocks.length || ""}`.trim()],
    ["Mock insights: breakdown, trend, error log", "Latest paper", "Every paper"],
    ["Revise my misses", "2 a day", "All, any time"],
    ["Weekly Chai test", "3-question taste", "Every week"],
    ["Monthly compilation", "One topic", "Every topic, printable"],
    ["Answer feedback", "3 a week", "Unlimited, deeper"],
    ["Chotu cloud turns", "15 a day", "100 a day"],
    ["Pod, Adda, Chai, games, long reads", "✓", "✓"],
  ];
  const table = h("section.pp-table.rv",
    h("div.pp-trow.head", h("div", ""), h("div", "Free"), h("div.plus", "Plus")),
    rows.map(([a, f, p]) => h("div.pp-trow", h("div", a), h("div.f", f), h("div.plus", p))));

  // ---- 8. Price ------------------------------------------------------------------------------------
  const priceBig = h("span", "₹9,999"); priceEls.push(priceBig);
  const perDay = h("span", "about ₹28");
  const priceCard = h("section.pp-price",
    h("div.pp-pricecard.rv",
      h("p.pp-kicker", "One year of Plus"),
      h("div.pp-bigprice", priceBig),
      h("p.pp-perday", "That's ", perDay, " a day, for a whole year of Plus."),
      !quiet && offerLine(C, h),
      h("ul.pp-terms", ["One payment for twelve months", "It doesn't renew by itself, ever", "Changed your mind? Refund within 7 days", "For every 10 paid seats, one aspirant who can't pay gets Plus free, chosen by pod leads"].map((t) => h("li", tick(), t))),
      quiet ? quietLine : buy("Get Plus for the year", ".wide"),
      !quiet && h("p.pp-wa", "Prefer UPI or another way? ", h("a", { href: `https://wa.me/${WA}?text=${encodeURIComponent("Hi, I'd like to pay for Aspiran Plus another way.")}`, target: "_blank", rel: "noopener" }, "WhatsApp us on 98766 56573"), " and we'll upgrade your account as soon as payment arrives.")));
  d.plusStatus().then((st) => {
    const pay = st?.payments ?? {};
    const p = pay.provider === "cashfree" && C.plusOn() ? pay.amountInr : st?.prices?.yearly?.inr ?? 9999;
    perDay.textContent = `about ₹${Math.round(p / 365)}`;
  });

  // ---- 9. Questions --------------------------------------------------------------------------------
  const faq = h("section.pp-faq",
    h("div.pp-narrow", h("h2.pp-h2.rv", "Questions people ask"),
      [["What happens to my free features?", "Nothing. Your pod, Chai, practice, games, long reads and one mock a month stay free whether or not you ever buy Plus."],
        ["Will it charge me again next year?", "No. It's one payment for twelve months. When the year ends, Plus simply stops until you decide to buy it again."],
        ["What if it isn't for me?", "Write to us within 7 days of paying and we'll refund you. The full refund policy is on the Refunds page."],
        ["Is my data private?", "Your notes, journal and answers stay on your device. Plus doesn't change that. Your score history is used only to draw your own insights."],
        ["Can I pay by UPI or cash?", "Yes. WhatsApp us on 98766 56573 and we'll upgrade your account as soon as the payment arrives."],
        ["Does Plus guarantee a better score?", "No one honest can promise that. What Plus does is show you exactly where your marks are going and give you the tools to work on it. The work is still yours."]]
        .map(([q, a]) => h("details.pp-q.rv", h("summary", q, h("span.pp-plus")), h("p", a))),
      h("p.pp-fine", h("a", { href: "/legal/refunds.html" }, "Refund policy"), " · ", h("a", { href: "/legal/terms.html" }, "Terms"))));

  // ---- 10. Close -----------------------------------------------------------------------------------
  const close = h("section.pp-close",
    h("div.pp-orb.o2"), h("div.pp-grain"),
    h("div.pp-narrow",
      h("p.pp-big.rv", "The exam doesn't grade effort.", h("br"), h("span.pp-grad", "It grades what you know on the day.")),
      h("p.pp-sub.rv", "Plus is how you find out what that is, while there's still time to change it."),
      quiet ? quietLine : h("div.pp-ctas.center.rv", buy("Get Plus for the year")),
      h("p.pp-fine.rv", "No streaks. No countdowns. Plus is only ever offered here, in Prep.")));

  const root = h("div.pp", hero, story, nums, inside, features, tryIt, free, table, priceCard, faq, close);
  requestAnimationFrame(() => animate(root));
  return root;
}

// ---- Visuals (SVG/CSS, drawn here so they work offline and in both themes) -------------------------

const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}, kids = []) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };
const arrow = () => svg("svg", { viewBox: "0 0 20 20", class: "pp-arrow", "aria-hidden": "true" }, [svg("path", { d: "M4 10h11M11 5l5 5-5 5", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" })]);
const tick = () => svg("svg", { viewBox: "0 0 20 20", class: "pp-tick", "aria-hidden": "true" }, [svg("path", { d: "M4 10.5l4 4 8-9", fill: "none", stroke: "currentColor", "stroke-width": "2.4", "stroke-linecap": "round", "stroke-linejoin": "round" })]);

function num(n, label, sub) {
  const el = document.createElement("div"); el.className = "pp-n rv";
  el.innerHTML = `<div class="pp-n-v" data-to="${n}">0</div><div class="pp-n-l"></div><div class="pp-n-s"></div>`;
  el.querySelector(".pp-n-l").textContent = label; el.querySelector(".pp-n-s").textContent = sub;
  return el;
}

function mockCard(h) {
  const ring = svg("svg", { viewBox: "0 0 120 120", class: "pp-ring" }, [
    svg("circle", { cx: 60, cy: 60, r: 50, class: "bg" }),
    svg("circle", { cx: 60, cy: 60, r: 50, class: "fg", "stroke-dasharray": "314", "stroke-dashoffset": "314" })]);
  const rows = [["Polity", 82], ["Economy", 44], ["Geography", 71], ["Environment", 58], ["History", 76]];
  return h("div.pp-device",
    h("div.pp-device-top", h("span"), h("span"), h("span")),
    h("div.pp-device-body",
      h("p.pp-dev-t", "Sectional mock · Result"),
      h("div.pp-dev-row", h("div.pp-ringwrap", ring, h("div.pp-ring-n", h("b", "128"), h("small", "of 200"))),
        h("div.pp-dev-side", h("p", h("b", "Range 118 to 136")), h("p.dim", "3 traps caught you twice"), h("p.dim", "Economy needs you most"))),
      h("div.pp-dev-bars", rows.map(([s, v]) => h("div.pp-dev-bar", h("span", s), h("i", h("em", { style: `--w:${v + "%"}` })), h("small", v + "%")))),
      h("div.pp-dev-chip", "Revise 7 misses from this paper →")),
    h("div.pp-float.f1", "+2 / −0.66"), h("div.pp-float.f2", "Statement questions: 3 of 5 missed"));
}
function paperStack(h) {
  const t = ["Polity and governance", "Modern history", "CSAT reasoning", "Economy", "Environment"];
  return h("div.pp-papers", t.map((x, i) => h("div.pp-paper", { style: `--i:${i}` }, h("b", x), h("span", "25 questions · sectional"), h("i"), h("i"), h("i.short"))));
}
function bars(h) {
  const r = [["Polity", 9, 8], ["Economy", 9, 4], ["Geography", 8, 6], ["Science", 7, 5], ["Environment", 8, 4]];
  return h("div.pp-vis-card", h("p.pp-vis-t", "Your paper, by subject"),
    r.map(([s, n, c]) => h("div.pp-vbar", h("span", s), h("i", h("em", { class: c / n < 0.55 ? "low" : "", style: `--w:${Math.round((c / n) * 100)}%` })), h("b", `${c}/${n}`))),
    h("p.pp-vis-note", "Economy and Environment: 9 marks on the table."));
}
function trend(h) {
  const path = svg("path", { d: "M10 92 C 60 88, 80 70, 120 72 S 190 50, 230 46 S 300 30, 330 22", class: "pp-line", pathLength: "1" });
  const area = svg("path", { d: "M10 92 C 60 88, 80 70, 120 72 S 190 50, 230 46 S 300 30, 330 22 L330 110 L10 110 Z", class: "pp-area" });
  const dots = [[10, 92], [120, 72], [230, 46], [330, 22]].map(([x, y]) => svg("circle", { cx: x, cy: y, r: 5, class: "pp-pt" }));
  return h("div.pp-vis-card", h("p.pp-vis-t", "Your trend across papers"),
    svg("svg", { viewBox: "0 0 340 115", class: "pp-trend" }, [svg("defs", {}, [svg("linearGradient", { id: "ppg", x1: 0, x2: 0, y1: 0, y2: 1 }, [svg("stop", { offset: "0", "stop-color": "#FFB547", "stop-opacity": ".45" }), svg("stop", { offset: "1", "stop-color": "#FFB547", "stop-opacity": "0" })])]), area, path, ...dots]),
    h("div.pp-trend-x", h("span", "Paper 1"), h("span", "Paper 2"), h("span", "Paper 3"), h("span", "Paper 4")));
}
function errorStack(h) {
  const q = [["Economy", "Which body sets the policy repo rate?"], ["Polity", "Consider the following pairs: Article — Subject…"], ["Environment", "How many of the above are Ramsar sites?"]];
  return h("div.pp-errs", q.map(([t, x], i) => h("div.pp-err", { style: `--i:${i}` }, h("span.pp-tag", t), h("p", x), h("small", "Missed twice · revise now"))));
}
function weekStrip(h) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return h("div.pp-vis-card", h("p.pp-vis-t", "This week's Chai test"),
    h("div.pp-week", days.map((x, i) => h("div.pp-day", { style: `--i:${i}` }, h("b", x), h("span", "Chai")))),
    h("div.pp-week-out", h("b", "Sunday"), " · 7 days of news, one test"));
}
function compileVis(h) {
  return h("div.pp-compile", h("div.pp-sheet.back"), h("div.pp-sheet.mid"),
    h("div.pp-sheet.front", h("b", "October compilation"), h("small", "Economy · Polity · Environment · IR"), h("i"), h("i"), h("i.short"), h("i"), h("i.short"), h("span.pp-print", "Print")));
}
function feedbackVis(h) {
  return h("div.pp-vis-card.pp-fb", h("p.pp-vis-t", "Answer feedback"),
    h("p.pp-fb-q", "\"Discuss the role of SHGs in financial inclusion.\" (150 words)"),
    h("div.pp-fb-l", h("span.ok", "Structure"), h("i", h("em", { style: `--w:${"80%"}` }))),
    h("div.pp-fb-l", h("span.ok", "Examples"), h("i", h("em", { style: `--w:${"55%"}` }))),
    h("div.pp-fb-l", h("span.ok", "Demand of the question"), h("i", h("em", { style: `--w:${"68%"}` }))),
    h("p.pp-fb-tip", "Add one data point on SHG–bank linkage, and end with a way forward."));
}
const tileHead = (t, sub) => { const d = document.createElement("div"); d.className = "pp-tile-h"; const b = document.createElement("h3"); b.textContent = t; const p = document.createElement("p"); p.textContent = sub; d.append(b, p); return d; };
const firstWords = (t, n) => { const parts = t.replace(/\n+/g, " ").split(/(?<=\.)\s/); let out = ""; for (const p of parts) { if (out && (out + " " + p).length > n) break; out = out ? out + " " + p : p; } return out; };
function storyStack(h, C, T) {
  const reads = C.libraryOf("read");
  const r = reads.find((x) => (x.data.sections?.en ?? []).length >= 4) ?? reads[0];
  const secs = (r?.data.sections?.en ?? []).slice(0, 5);
  const cards = secs.length ? secs.map((s) => [s.heading, firstWords(String(s.body), 360)]) : [["One idea at a time", "Each card holds a single idea."]];
  const stack = h("div.pp-stories");
  const title = r ? T(r.data.title) : "Long read";
  cards.forEach(([hd, body], i) => stack.append(h("div.pp-story-card", { style: `--n:${i}` }, h("small", `${title} · ${i + 1}/${cards.length}`), h("b", hd), h("p", body), h("span.pp-swipe", "Swipe →"))));
  let top = 0;
  const go = () => { const els = stack.children; for (let i = 0; i < els.length; i++) { const q = (i - top + els.length) % els.length; els[i].style.setProperty("--p", q); els[i].style.opacity = q > 2 ? "0" : ""; els[i].classList.toggle("gone", els.length > 1 && q === els.length - 1); } top = (top + 1) % els.length; };
  go();
  stack.addEventListener("click", go);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) { const t = setInterval(() => { if (!stack.isConnected) return clearInterval(t); if (stack.closest(".in")) go(); }, 2600); }
  return stack;
}
function playTaste(h, C, T) {
  const g = C.libraryOf("fact-or-opinion")[0] ?? (C.data.library?.items ?? []).find((i) => i.kind === "fact-or-opinion");
  const items = (g?.data.items ?? []).filter((x) => x.en?.text);
  if (!items.length) return null;
  let k = 0;
  const box = h("div.pp-fo");
  const show = () => {
    const it = items[k % items.length];
    const pick = (kind) => {
      const ok = kind === it.kind;
      box.replaceChildren(h("p.pp-fo-q", it.en.text), h(`p.pp-fo-r${ok ? ".ok" : ".no"}`, ok ? "Right. " : `It's ${it.kind === "fact" ? "a fact" : "an opinion"}. `, it.en.why ?? ""),
        h("button.pp-fo-b.next", { onclick: () => { k++; show(); } }, "Another one"));
    };
    box.replaceChildren(h("p.pp-fo-q", it.en.text), h("div.pp-fo-row", h("button.pp-fo-b", { onclick: () => pick("fact") }, "Fact"), h("button.pp-fo-b", { onclick: () => pick("opinion") }, "Opinion")));
  };
  show();
  return box;
}
const KIND_NAMES = { flashcards: "Flashcards", "answer-skeleton": "Answer skeleton", "pair-up": "Pair up", "ethics-dilemma": "Ethics dilemma", "timeline-shuffle": "Timeline shuffle", "assertion-reason": "Assertion and reason", "bucket-sort": "Bucket sort", "how-many-correct": "How many correct", "index-card": "Index card", "landmark-case": "Landmark case", "link-web": "Link web", "odd-one-out": "Odd one out", "scheme-snapshot": "Scheme snapshot", "trap-spotter": "Trap spotter", "two-levels": "Two levels", "two-truths": "Find the lie", versus: "Versus", "before-after": "Before and after", "better-answer": "Better answer", "committee-match": "Committee match", "fill-the-gap": "Fill the gap", "story-beats": "Story beats", "who-am-i": "Who am I", "acronym-unpack": "Acronym unpack", "fact-or-opinion": "Fact or opinion", mnemonic: "Mnemonic", "rank-it": "Rank it", "union-state-list": "Union, State, Concurrent", "word-bank": "Word bank", "directive-word": "Directive words" };
function marquee(h, kinds) {
  const names = kinds.map((k) => KIND_NAMES[k] ?? k.replace(/-/g, " "));
  const row = h("div.pp-mq-row", [...names, ...names].map((n) => h("span", n)));
  return h("div.pp-mq", row);
}
function chaiVis(h) {
  const c = [["Polity", "2 min"], ["Economy", "1 min"], ["Environment", "1 min"], ["International relations", "2 min"]];
  return h("div.pp-chai", h("div.pp-chai-top", h("b", "Today's Chai"), h("span", "Checked · 5 min")),
    c.map(([t, m], i) => h("div.pp-chai-c", { style: `--i:${i}` }, h("span.pp-tag", t), h("i"), h("i.short"), h("small", m))),
    h("div.pp-chai-q", "Then: Today's 3 questions →"));
}
function evalVis(h, mocks, T) {
  const q = mocks.flatMap((m) => m.data.questions ?? []).find((x) => x.en?.explanation && x.en.options?.length === 4 && x.en.question.length < 140);
  if (!q) return null;
  const right = q.en.answerIndex, wrong = (right + 2) % 4;
  return h("div.pp-eval",
    h("p.pp-eval-q", q.en.question),
    q.en.options.map((o, i) => h(`div.pp-eval-o${i === right ? ".right" : i === wrong ? ".wrong" : ""}`, { style: `--i:${i}` }, h("span", o), i === right ? h("em", "Correct") : i === wrong ? h("em", "Your pick") : null)),
    h("p.pp-eval-why", h("b", "Why: "), q.en.explanation));
}

function chotuVis(h) {
  return h("div.pp-chat",
    h("div.pp-msg.me", "Explain the difference between repo and reverse repo, simply?"),
    h("div.pp-msg", "Think of the RBI as the bank's bank. Repo is the rate at which banks borrow from it…"),
    h("div.pp-msg.me", "And why does that move inflation?"),
    h("div.pp-typing", h("i"), h("i"), h("i")));
}

// ---- Motion -----------------------------------------------------------------------------------------

function animate(root) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
  const els = root.querySelectorAll(".rv, .pp-feat-vis, .pp-hero, .pp-nums");
  if (still) { els.forEach((e) => e.classList.add("in")); root.querySelectorAll(".pp-n-v").forEach((e) => (e.textContent = Number(e.dataset.to).toLocaleString("en-IN"))); root.classList.add("still"); return; }
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    const e = en.target; e.classList.add("in"); io.unobserve(e);
    e.querySelectorAll?.(".pp-n-v").forEach(countUp);
  }), { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  els.forEach((e) => io.observe(e));
  // Hero device: subtle tilt following the pointer.
  const dev = root.querySelector(".pp-device"), stage = root.querySelector(".pp-hero");
  stage?.addEventListener("pointermove", (ev) => {
    const r = stage.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
    dev.style.transform = `perspective(1200px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`;
  });
  stage?.addEventListener("pointerleave", () => (dev.style.transform = ""));
}
function countUp(el) {
  const to = Number(el.dataset.to) || 0, t0 = performance.now(), dur = 1400;
  const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString("en-IN"); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

// ---- Styles -----------------------------------------------------------------------------------------

function injectCss() {
  if (document.getElementById("pp-css")) return;
  const s = document.createElement("style"); s.id = "pp-css";
  s.textContent = `
.pp{container-type:inline-size;--k:#0E0A07;--k2:#17110C;--k3:#221911;--cream:#FFF4E6;--dim:#C9B8A6;--sun:#FFB547;--saf:#FF7A1A;--rose:#FF4F6D;--mint:#3DDC97;--line2:rgba(255,236,214,.12);
  margin:-12px -16px 0;color:var(--cream);background:var(--k);font-family:var(--ui-font);overflow:hidden;border-radius:0 0 28px 28px;-webkit-font-smoothing:antialiased}
main:has(.pp){min-width:0}.pp *{min-width:0}.pp-panel{overflow-x:auto}
.pp section{position:relative;padding:96px 28px}
.pp .pp-narrow{max-width:720px;margin:0 auto}
.pp p{line-height:1.65;font-size:18px;color:var(--dim);margin:0 0 18px}
.pp a{color:var(--sun)}
.pp-grad{background:linear-gradient(92deg,#FFD08A 0%,#FFB547 35%,#FF7A1A 70%,#FF4F6D 100%);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% 100%;animation:ppShift 8s ease-in-out infinite alternate}
@keyframes ppShift{to{background-position:100% 0}}
.pp-h1{font-size:clamp(38px,5.6cqi,72px);line-height:1.02;letter-spacing:-.035em;font-weight:800;color:var(--cream);margin:0 0 24px}
.pp-h2{font-size:clamp(28px,4cqi,50px);line-height:1.06;letter-spacing:-.03em;font-weight:800;color:var(--cream);margin:0 0 20px}
.pp-big{font-size:clamp(26px,3.4vw,40px)!important;line-height:1.2!important;letter-spacing:-.02em;font-weight:700;color:var(--cream)!important}
.pp-big.dim{color:var(--sun)!important}
.pp-lead{font-size:clamp(18px,1.6vw,21px)!important;max-width:560px;color:#E4D4C3!important}
.pp-sub{font-size:19px!important}
.pp-kicker,.pp-eyebrow{font-size:13px!important;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--sun)!important;margin-bottom:16px!important}
.pp-eyebrow{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid var(--line2);border-radius:99px;background:rgba(255,181,71,.06)}
.pp-dot{width:8px;height:8px;border-radius:50%;background:var(--sun);box-shadow:0 0 0 0 rgba(255,181,71,.7);animation:ppPulse 2.2s infinite}
@keyframes ppPulse{70%{box-shadow:0 0 0 10px rgba(255,181,71,0)}100%{box-shadow:0 0 0 0 rgba(255,181,71,0)}}
.pp-fine{font-size:14px!important;color:#9C8B7B!important}
.pp-fine span{color:var(--cream);font-weight:700}
.pp-quiet{font-size:18px!important;color:var(--cream)!important;padding:16px 20px;border:1px solid var(--line2);border-radius:16px;background:rgba(255,255,255,.03);max-width:520px}
/* buttons */
.pp-ctas{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0 18px}.pp-ctas.center{justify-content:center}
.pp-btn{position:relative;display:inline-flex;align-items:center;gap:10px;padding:17px 28px;border-radius:99px;font-weight:700;font-size:17px;text-decoration:none;color:#1A0E03!important;
  background:linear-gradient(135deg,#FFD08A,#FFB547 40%,#FF7A1A);box-shadow:0 10px 40px -8px rgba(255,122,26,.65),inset 0 1px 0 rgba(255,255,255,.5);overflow:hidden;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
.pp-btn::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:ppSheen 3.6s 1.2s infinite}
@keyframes ppSheen{0%{transform:translateX(-120%)}35%,100%{transform:translateX(120%)}}
.pp-btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 16px 50px -8px rgba(255,122,26,.8)}
.pp-btn .pp-arrow{width:18px;height:18px;transition:transform .25s}.pp-btn:hover .pp-arrow{transform:translateX(4px)}
.pp-btn.ghost{background:transparent;color:var(--cream)!important;box-shadow:inset 0 0 0 1.5px rgba(255,236,214,.3)}.pp-btn.ghost::after{display:none}
.pp-btn.wide{width:100%;justify-content:center;box-sizing:border-box;margin-top:8px}
/* hero */
.pp-hero{min-height:min(92vh,860px);display:flex;flex-direction:column;justify-content:center;padding-top:72px!important;background:radial-gradient(120% 80% at 80% 10%,#2A1608 0%,var(--k) 55%)}
.pp-hero-in{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;max-width:1180px;margin:0 auto;width:100%;position:relative;z-index:2}
.pp-orb{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;pointer-events:none;z-index:0}
.pp-orb.o1{width:520px;height:520px;background:#FF7A1A;top:-180px;right:-120px;animation:ppFloat 14s ease-in-out infinite alternate}
.pp-orb.o2{width:420px;height:420px;background:#FF4F6D;bottom:-200px;left:-140px;opacity:.35;animation:ppFloat 18s ease-in-out infinite alternate-reverse}
.pp-orb.o3{width:300px;height:300px;background:#FFB547;top:40%;left:45%;opacity:.25;animation:ppFloat 11s ease-in-out infinite alternate}
@keyframes ppFloat{to{transform:translate(40px,30px) scale(1.12)}}
.pp-grain{position:absolute;inset:0;z-index:1;opacity:.06;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.pp-scrollhint{position:absolute;bottom:26px;left:50%;width:24px;height:38px;border:2px solid rgba(255,236,214,.3);border-radius:14px;transform:translateX(-50%);z-index:2}
.pp-scrollhint span{position:absolute;left:50%;top:7px;width:4px;height:8px;margin-left:-2px;border-radius:2px;background:var(--sun);animation:ppScroll 1.8s infinite}
@keyframes ppScroll{to{transform:translateY(12px);opacity:0}}
/* hero device */
.pp-stage{position:relative}
.pp-device{position:relative;background:linear-gradient(180deg,#22180F,#150F0A);border:1px solid var(--line2);border-radius:28px;padding:14px;box-shadow:0 40px 120px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.02),0 0 80px -20px rgba(255,122,26,.35);transition:transform .4s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}
.pp-device-top{display:flex;gap:6px;padding:4px 6px 12px}.pp-device-top span{width:10px;height:10px;border-radius:50%;background:#3A2C20}
.pp-device-body{background:#0F0B08;border-radius:18px;padding:22px}
.pp-dev-t{font-size:12px!important;letter-spacing:.14em;text-transform:uppercase;color:#9C8B7B!important;margin-bottom:14px!important}
.pp-dev-row{display:flex;gap:20px;align-items:center;margin-bottom:18px}
.pp-ringwrap{position:relative;width:120px;height:120px;flex:none}
.pp-ring{width:120px;height:120px;transform:rotate(-90deg)}.pp-ring circle{fill:none;stroke-width:10;stroke-linecap:round}
.pp-ring .bg{stroke:#2A2018}.pp-ring .fg{stroke:url(#none);stroke:var(--sun);transition:stroke-dashoffset 1.8s cubic-bezier(.2,.8,.2,1) .5s;filter:drop-shadow(0 0 8px rgba(255,181,71,.6))}
.in .pp-ring .fg,.pp-hero.in .pp-ring .fg{stroke-dashoffset:113}
.pp-ring-n{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.pp-ring-n b{font-size:32px;color:var(--cream);letter-spacing:-.02em}.pp-ring-n small{font-size:12px;color:#9C8B7B}
.pp-dev-side p{margin:0 0 6px!important;font-size:15px!important;color:var(--cream)!important}.pp-dev-side .dim{color:#9C8B7B!important}
.pp-dev-bar{display:grid;grid-template-columns:96px 1fr 40px;gap:10px;align-items:center;font-size:13px;color:var(--dim);margin:9px 0}
.pp-dev-bar i,.pp-vbar i,.pp-fb-l i{display:block;height:8px;border-radius:8px;background:#261C14;overflow:hidden}
.pp-dev-bar em,.pp-vbar em,.pp-fb-l em{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,#FFB547,#FF7A1A);transition:width 1.4s cubic-bezier(.2,.8,.2,1) .8s}
.in .pp-dev-bar em,.in .pp-vbar em,.in .pp-fb-l em{width:var(--w)}
.pp-vbar em.low{background:linear-gradient(90deg,#FF7A1A,#FF4F6D)}
.pp-dev-bar small{text-align:right;color:var(--cream)}
.pp-dev-chip{margin-top:16px;padding:12px 14px;border-radius:12px;background:rgba(255,181,71,.1);color:var(--sun);font-weight:600;font-size:14px}
.pp-float{position:absolute;padding:10px 14px;border-radius:14px;background:rgba(30,22,15,.85);backdrop-filter:blur(10px);border:1px solid var(--line2);font-size:13px;font-weight:600;color:var(--cream);box-shadow:0 20px 50px -10px rgba(0,0,0,.6);animation:ppBob 5s ease-in-out infinite}
.pp-float.f1{top:-18px;right:24px}.pp-float.f2{bottom:-22px;left:-26px;color:var(--sun);animation-delay:-2.5s}
@keyframes ppBob{50%{transform:translateY(-10px)}}
/* story */
.pp-story{background:var(--k2)}
/* numbers */
.pp-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line2);padding:0!important;border-top:1px solid var(--line2);border-bottom:1px solid var(--line2)}
.pp-n{background:var(--k);padding:44px 24px;text-align:center}
.pp-n-v{font-size:clamp(44px,5.4vw,72px);font-weight:800;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#FFF4E6,#FFB547);-webkit-background-clip:text;background-clip:text;color:transparent}
.pp-n-l{margin-top:10px;color:var(--cream);font-weight:600}.pp-n-s{font-size:13px;color:#9C8B7B;margin-top:4px}
/* inside / bento */
.pp-inside{background:linear-gradient(180deg,var(--k),#140D08 40%,var(--k))}
.pp-bento{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;max-width:1180px;margin:44px auto 0}
.pp-tile{position:relative;border-radius:28px;padding:28px;background:linear-gradient(180deg,#1E1610,#120D09);border:1px solid var(--line2);overflow:hidden;display:flex;flex-direction:column;gap:18px;box-shadow:0 30px 80px -40px rgba(0,0,0,.9)}
.pp-tile::before{content:"";position:absolute;width:260px;height:260px;border-radius:50%;filter:blur(60px);opacity:.28;top:-120px;right:-80px;pointer-events:none}
.t-story{grid-column:span 3;grid-row:span 2}.t-story::before{background:#FF7A1A}
.t-play{grid-column:span 3}.t-play::before{background:#3DDC97}
.t-chai{grid-column:span 3}.t-chai::before{background:#FFB547}
.t-eval{grid-column:span 3}.t-eval::before{background:#FF4F6D}
.t-chotu{grid-column:span 3}.t-chotu::before{background:#8A7CFF}
.pp-tile-h h3{margin:0 0 8px;font-size:24px;letter-spacing:-.02em;color:var(--cream)}
.pp-tile-h p{font-size:15px!important;margin:0!important;line-height:1.55!important}
.pp-stories{position:relative;flex:1;min-height:340px;cursor:pointer;perspective:1000px}
.pp-story-card{--p:0;position:absolute;inset:0 0 44px 0;min-height:300px;padding:26px;border-radius:22px;background:linear-gradient(160deg,#FFF4E6,#F5DFC6);color:#221A14;box-shadow:0 30px 60px -20px rgba(0,0,0,.8);display:flex;flex-direction:column;gap:10px;
  transform:translateY(calc(var(--p) * 16px)) scale(calc(1 - var(--p) * .05));opacity:calc(1 - var(--p) * .28);z-index:calc(10 - var(--p));transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}
.pp-story-card.gone{transform:translateX(-125%) rotate(-14deg)!important;opacity:0!important;z-index:20}
.pp-story-card small{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8D4F01;font-weight:700}
.pp-story-card b{font-size:clamp(24px,3cqi,32px);line-height:1.15;letter-spacing:-.02em}
.pp-story-card p{color:#4A3A2C!important;font-size:17px!important;line-height:1.6!important;margin:0!important;display:-webkit-box;-webkit-line-clamp:11;-webkit-box-orient:vertical;overflow:hidden}
.pp-swipe{margin-top:auto;font-size:13px;font-weight:700;color:#8D4F01}
.pp-fo{padding:20px;border-radius:18px;background:#0F0B08;border:1px solid var(--line2)}
.pp-fo-q{color:var(--cream)!important;font-size:16px!important;margin:0 0 14px!important}
.pp-fo-row{display:flex;gap:10px}
.pp-fo-b{flex:1;padding:12px 16px;border-radius:12px;border:1.5px solid rgba(61,220,151,.45);background:rgba(61,220,151,.08);color:var(--cream);font-weight:700;font-size:15px;cursor:pointer;transition:transform .15s,background .2s}
.pp-fo-b:hover{background:rgba(61,220,151,.18);transform:translateY(-1px)}.pp-fo-b.next{flex:none}
.pp-fo-r{font-size:15px!important;margin:0 0 12px!important}.pp-fo-r.ok{color:var(--mint)!important}.pp-fo-r.no{color:#FF8FA2!important}
.pp-mq{overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.pp-mq-row{display:flex;gap:8px;width:max-content;animation:ppMq 40s linear infinite}
.pp-mq-row span{padding:7px 12px;border-radius:99px;border:1px solid var(--line2);font-size:13px;color:var(--dim);white-space:nowrap}
@keyframes ppMq{to{transform:translateX(-50%)}}
.pp-chai{display:flex;flex-direction:column;gap:8px}
.pp-chai-top{display:flex;justify-content:space-between;color:var(--cream);font-size:14px}.pp-chai-top span{color:#9C8B7B}
.pp-chai-c{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:12px;row-gap:6px;align-items:center;padding:12px 14px;border-radius:14px;background:#1A130D;border:1px solid var(--line2);opacity:0;transform:translateY(14px);transition:all .6s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i) * 150ms)}
.pp-chai-c .pp-tag{grid-row:span 2}.pp-chai-c i{display:block;height:6px;border-radius:4px;background:#33261B}.pp-chai-c i.short{width:60%;grid-column:2}.pp-chai-c small{grid-row:1;grid-column:3;color:#9C8B7B;font-size:12px}
.in .pp-chai-c{opacity:1;transform:none}
.pp-chai-q{padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,#FFB547,#FF7A1A);color:#1A0E03;font-weight:700;font-size:14px}
.pp-eval-q{color:var(--cream)!important;font-size:16px!important;margin:0 0 10px!important}
.pp-eval-o{display:flex;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:12px;border:1px solid var(--line2);margin:6px 0;font-size:14px;color:var(--dim);transition:all .5s;transition-delay:calc(.6s + var(--i) * 100ms)}
.pp-eval-o em{font-style:normal;font-weight:700;font-size:12px}
.in .pp-eval-o.right{border-color:rgba(61,220,151,.6);background:rgba(61,220,151,.1);color:var(--cream)}.pp-eval-o.right em{color:var(--mint)}
.in .pp-eval-o.wrong{border-color:rgba(255,79,109,.6);background:rgba(255,79,109,.1);color:var(--cream)}.pp-eval-o.wrong em{color:#FF8FA2}
.pp-eval-why{font-size:14px!important;margin:12px 0 0!important;padding:12px 14px;border-radius:12px;background:#0F0B08;opacity:0;transition:opacity .6s 1.4s}.in .pp-eval-why{opacity:1}.pp-eval-why b{color:var(--sun)}
.pp-bridge{margin-top:72px!important;text-align:center}
/* features */
.pp-feats{max-width:1180px;margin:0 auto}
.pp-feat{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;padding:56px 28px!important}
.pp-feat.flip .pp-feat-copy{order:2}
.pp-num{font-size:14px!important;font-weight:800;letter-spacing:.2em;color:var(--saf)!important;margin-bottom:12px!important}
.pp-feat-vis{display:flex;justify-content:center}
.pp-vis-card{width:100%;max-width:440px;padding:26px;border-radius:24px;background:linear-gradient(180deg,#1E1610,#140F0B);border:1px solid var(--line2);box-shadow:0 30px 80px -30px rgba(0,0,0,.8)}
.pp-vis-t{font-size:13px!important;letter-spacing:.12em;text-transform:uppercase;color:#9C8B7B!important;margin-bottom:16px!important}
.pp-vis-note{margin:16px 0 0!important;font-size:15px!important;color:var(--sun)!important;font-weight:600}
.pp-vbar{display:grid;grid-template-columns:100px 1fr 40px;gap:12px;align-items:center;margin:12px 0;font-size:14px;color:var(--dim)}.pp-vbar b{color:var(--cream);text-align:right}
.pp-trend{width:100%;height:auto;overflow:visible}
.pp-line{fill:none;stroke:#FFB547;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2s cubic-bezier(.4,0,.2,1) .3s;filter:drop-shadow(0 0 10px rgba(255,181,71,.6))}
.pp-area{fill:url(#ppg);opacity:0;transition:opacity 1s 1.6s}.pp-pt{fill:#0E0A07;stroke:#FFB547;stroke-width:3;opacity:0;transition:opacity .4s 2s}
.in .pp-line{stroke-dashoffset:0}.in .pp-area{opacity:1}.in .pp-pt{opacity:1}
.pp-trend-x{display:flex;justify-content:space-between;font-size:12px;color:#9C8B7B;margin-top:8px}
.pp-papers{position:relative;width:100%;max-width:420px;height:340px}
.pp-paper{position:absolute;left:0;right:0;top:calc(var(--i) * 52px);padding:20px 22px;border-radius:18px;background:linear-gradient(180deg,#241A12,#18120D);border:1px solid var(--line2);box-shadow:0 20px 50px -20px rgba(0,0,0,.8);transform:translateY(40px) scale(.96);opacity:0;transition:all .7s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i) * 110ms)}
.in .pp-paper{transform:none;opacity:1}
.pp-paper b{display:block;color:var(--cream);font-size:16px}.pp-paper span{font-size:12px;color:#9C8B7B}.pp-paper i{display:block;height:6px;border-radius:4px;background:#2E2319;margin-top:10px}.pp-paper i.short{width:60%}
.pp-paper:last-child{border-color:rgba(255,181,71,.4)}
.pp-errs{position:relative;width:100%;max-width:420px}
.pp-err{padding:18px 20px;border-radius:18px;background:#1C150F;border:1px solid var(--line2);margin-bottom:12px;transform:translateX(calc(var(--i) * 18px + 40px));opacity:0;transition:all .7s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i) * 140ms)}
.in .pp-err{transform:translateX(calc(var(--i) * 18px));opacity:1}
.pp-err p{margin:8px 0!important;font-size:15px!important;color:var(--cream)!important}.pp-err small{color:var(--rose);font-weight:600}
.pp-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:6px;background:rgba(255,181,71,.12);color:var(--sun)}
.pp-week{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
.pp-day{aspect-ratio:1/1.3;border-radius:14px;background:#211810;border:1px solid var(--line2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:all .5s;transition-delay:calc(var(--i) * 120ms)}
.pp-day b{color:var(--cream)}.pp-day span{font-size:10px;color:#9C8B7B}
.in .pp-day{background:linear-gradient(180deg,rgba(255,181,71,.25),rgba(255,122,26,.08));border-color:rgba(255,181,71,.45)}
.pp-week-out{margin-top:16px;padding:14px;border-radius:14px;background:linear-gradient(135deg,#FFB547,#FF7A1A);color:#1A0E03;font-size:15px;text-align:center}
.pp-compile{position:relative;width:320px;height:360px}
.pp-sheet{position:absolute;inset:0;border-radius:16px;background:#F7EBDD;box-shadow:0 30px 60px -20px rgba(0,0,0,.7);transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.pp-sheet.back{transform:rotate(-8deg);background:#CDBBA7}.pp-sheet.mid{transform:rotate(-3deg);background:#E6D6C4}
.in .pp-sheet.back{transform:rotate(-14deg) translateX(-30px)}.in .pp-sheet.mid{transform:rotate(-6deg) translateX(-12px)}.in .pp-sheet.front{transform:rotate(3deg)}
.pp-sheet.front{padding:28px;color:#2A1A0C;display:flex;flex-direction:column;gap:10px}
.pp-sheet.front b{font-size:22px;font-family:var(--head-font,inherit)}.pp-sheet.front small{color:#7A6250}
.pp-sheet.front i{display:block;height:7px;border-radius:4px;background:#DCC8B3}.pp-sheet.front i.short{width:65%}
.pp-print{margin-top:auto;align-self:flex-start;padding:8px 14px;border-radius:99px;background:#2A1A0C;color:#FFF4E6;font-size:13px;font-weight:700}
.pp-fb-q{font-size:15px!important;color:var(--cream)!important;font-style:italic}
.pp-fb-l{display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:center;margin:12px 0;font-size:14px;color:var(--dim)}
.pp-fb-tip{margin:16px 0 0!important;padding:12px 14px;border-radius:12px;background:rgba(61,220,151,.1);color:var(--mint)!important;font-size:14px!important}
.pp-chat{width:100%;max-width:420px;display:flex;flex-direction:column;gap:10px}
.pp-msg{max-width:82%;padding:14px 16px;border-radius:20px 20px 20px 6px;background:#211810;border:1px solid var(--line2);color:var(--cream);font-size:15px;opacity:0;transform:translateY(16px);transition:all .6s}
.pp-msg.me{align-self:flex-end;border-radius:20px 20px 6px 20px;background:linear-gradient(135deg,#FFB547,#FF7A1A);color:#1A0E03;border:0}
.in .pp-msg{opacity:1;transform:none}.in .pp-msg:nth-child(2){transition-delay:.5s}.in .pp-msg:nth-child(3){transition-delay:1s}
.pp-typing{display:flex;gap:5px;padding:14px 16px;border-radius:20px;background:#211810;width:fit-content;opacity:0;transition:opacity .4s 1.6s}.in .pp-typing{opacity:1}
.pp-typing i{width:7px;height:7px;border-radius:50%;background:#9C8B7B;animation:ppDots 1.2s infinite}.pp-typing i:nth-child(2){animation-delay:.15s}.pp-typing i:nth-child(3){animation-delay:.3s}
@keyframes ppDots{30%{transform:translateY(-5px);background:var(--sun)}}
/* try */
.pp-try{background:var(--k2)}
.pp-try-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;align-items:start;max-width:1180px;margin:36px auto 0}
.pp-panel{padding:26px;border-radius:24px;background:var(--cream);color:#221A14;box-shadow:0 30px 80px -30px rgba(0,0,0,.8)}
.pp-panel p{color:#3D2F24}.pp-panel-t{font-weight:700;color:#221A14!important;font-size:16px!important}
.pp-panel .card{background:#fff;border-color:#E8DDD3;color:#221A14}
.pp-panel table.breakdown th,.pp-panel table.breakdown td{color:#221A14}
/* free */
.pp-free-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:1180px;margin:32px auto 0}
.pp-chip{display:flex;gap:10px;align-items:center;padding:18px;border-radius:16px;background:var(--k2);border:1px solid var(--line2);color:var(--cream);font-weight:600;font-size:15px}
.pp-tick{width:20px;height:20px;flex:none;color:var(--mint)}
/* table */
.pp-table{max-width:900px;margin:0 auto;padding:0 28px 96px!important}
.pp-trow{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:12px;padding:16px 18px;border-bottom:1px solid var(--line2);font-size:15px;color:var(--dim)}
.pp-trow.head{font-weight:800;color:var(--cream);font-size:14px;letter-spacing:.08em;text-transform:uppercase;border-bottom-color:rgba(255,181,71,.4)}
.pp-trow div:first-child{color:var(--cream)}.pp-trow .plus{color:var(--sun);font-weight:700}.pp-trow .f{color:#9C8B7B}
/* price */
.pp-price{padding-top:40px!important}
.pp-pricecard{position:relative;max-width:520px;margin:0 auto;padding:44px 38px;border-radius:32px;background:linear-gradient(180deg,#1E1610,#120D09);text-align:left;isolation:isolate}
.pp-pricecard::before{content:"";position:absolute;inset:-1.5px;border-radius:33px;padding:1.5px;background:conic-gradient(from var(--a,0deg),#FFB547,#FF7A1A,#FF4F6D,#FFB547);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;z-index:-1;animation:ppSpin 6s linear infinite}
@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes ppSpin{to{--a:360deg}}
.pp-pricecard::after{content:"";position:absolute;inset:0;border-radius:32px;box-shadow:0 0 120px -20px rgba(255,122,26,.45);z-index:-2}
.pp-bigprice{font-size:clamp(64px,9vw,96px);font-weight:800;letter-spacing:-.05em;line-height:1;color:var(--cream);margin:6px 0 10px}
.pp-perday{font-size:17px!important;color:#E4D4C3!important}.pp-perday span{color:var(--sun);font-weight:700}
.pp-terms{list-style:none;padding:0;margin:22px 0}.pp-terms li{display:flex;gap:10px;align-items:flex-start;margin:12px 0;color:var(--cream);font-size:15px}
.pp-wa{font-size:14px!important;margin:18px 0 0!important;text-align:center}
.pp-offer{font-size:15px;font-weight:600;color:#FFD08A;margin:12px 0 0;user-select:text}
.pp-offer a{color:#FFB547;font-weight:800;white-space:nowrap}
/* faq */
.pp-q{border-bottom:1px solid var(--line2);padding:6px 0}
.pp-q summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0;font-size:19px;font-weight:700;color:var(--cream)}
.pp-q summary::-webkit-details-marker{display:none}
.pp-plus{position:relative;width:18px;height:18px;flex:none}.pp-plus::before,.pp-plus::after{content:"";position:absolute;left:0;right:0;top:8px;height:2px;background:var(--sun);transition:transform .3s}.pp-plus::after{transform:rotate(90deg)}
.pp-q[open] .pp-plus::after{transform:rotate(0)}
.pp-q p{font-size:17px!important;padding-right:30px}
/* close */
.pp-close{text-align:center;padding:120px 28px!important;background:radial-gradient(80% 70% at 50% 100%,#2A1608,var(--k))}
.pp-close .pp-narrow{position:relative;z-index:2}
/* reveal */
.pp .rv{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.2,.8,.2,1),transform .9s cubic-bezier(.2,.8,.2,1)}
.pp .rv.in,.pp.still .rv{opacity:1;transform:none}
.pp-hero .rv:nth-child(2){transition-delay:.08s}.pp-hero .rv:nth-child(3){transition-delay:.16s}.pp-hero .rv:nth-child(4){transition-delay:.24s}.pp-hero .rv:nth-child(5){transition-delay:.32s}
.pp-stage.rv{transition-delay:.2s;transform:translateY(40px) scale(.96)}
/* small screens */
@media (max-width:900px){.pp-bento{grid-template-columns:1fr}.pp-tile{grid-column:auto!important;grid-row:auto!important}.pp-hero-in,.pp-feat,.pp-try-grid{grid-template-columns:1fr;gap:36px}.pp-feat.flip .pp-feat-copy{order:0}.pp-nums{grid-template-columns:1fr 1fr}.pp-free-grid{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.pp section{padding:64px 18px}.pp-feat{padding:56px 18px!important}.pp-hero{min-height:auto;padding-top:48px!important}.pp-float.f2{left:4px}.pp-float.f1{right:4px}
  .pp-free-grid{grid-template-columns:1fr 1fr;gap:8px}.pp-chip{padding:14px 12px;font-size:14px}.pp-panel{padding:18px 14px}
  .pp-err{transform:translateX(calc(var(--i) * 8px + 30px))!important}.in .pp-err{transform:translateX(calc(var(--i) * 8px))!important}.pp-errs{padding-right:16px}.pp-trow{grid-template-columns:1.3fr 1fr 1fr;font-size:13px;padding:14px 8px}.pp-pricecard{padding:34px 22px}.pp-compile{width:260px;height:300px}.pp-dev-bar{grid-template-columns:80px 1fr 36px}
  .pp-fb-l{grid-template-columns:110px 1fr}.pp-btn{padding:16px 22px}.pp-scrollhint{display:none}.pp{margin:-12px -12px 0}}
@media (prefers-reduced-motion:reduce){.pp-chai-c,.pp-eval-why{opacity:1;transform:none}.pp-mq-row{flex-wrap:wrap;width:auto}.pp *,.pp *::before,.pp *::after{animation:none!important;transition:none!important}.pp .rv{opacity:1;transform:none}
  .pp-ring .fg{stroke-dashoffset:113}.pp-dev-bar em,.pp-vbar em,.pp-fb-l em{width:var(--w)}.pp-line{stroke-dashoffset:0}.pp-area,.pp-pt,.pp-msg,.pp-typing,.pp-paper,.pp-err{opacity:1;transform:none}}
`;
  document.head.append(s);
}
