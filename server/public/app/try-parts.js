// The richer steps of "Try one topic" (try.js): explainer videos, the GST Council vote simulator, the Governor's desk,
// an essay in three snaps (sample handwritten pages with margin notes, plus "try your own" that stays on the device),
// news cards tied to the static syllabus, a tour of the rest of the app, and the feedback parts (one-tap questions and
// the end survey). try.js hands over its helpers in `K` once: h, put, L (pick the reading language), u (UI strings),
// getA/setA (this path's saved answers), mcq (one question), lang, send (feedback), draw.
//
// Every part follows the same rules as the rest of the path: nothing autoplays and sound starts only on a tap; captions
// are on; no timers; scores stay private; the visitor's photo never leaves their device; AI is never pretended.

let K = null;
export function init(k) { K = k; }
const h = (...a) => K.h(...a);
const put = (...a) => K.put(...a);
const L = (v) => K.L(v);

// --- Explainer video -------------------------------------------------------------------------------------------------
// 50-second clips from the cinematic current-affairs line. No autoplay; on metered data or Data Saver not even the
// poster is fetched until a tap. Captions are on by default and the full transcript is one tap away (sound off by
// default is a product rule, and a third of our readers study in shared rooms).

const metered = () => !!(navigator.connection && (navigator.connection.saveData || /cellular|2g|3g/.test(navigator.connection.type ?? navigator.connection.effectiveType ?? "")));

export function video(st) {
  const v = st.video;
  const box = h("div.try-video");
  const showPlayer = () => {
    const el = h("video", { controls: true, playsinline: true, preload: "metadata", poster: v.poster, width: 360, height: 640, "aria-label": L(v.title) },
      h("source", { src: v.mp4, type: "video/mp4" }),
      v.vtt && h("track", { kind: "captions", src: v.vtt, srclang: "en", label: "English", default: true }));
    el.addEventListener("play", () => K.setA(st.id + ":played", true), { once: true });
    put(box, el);
  };
  if (metered() && !K.getA(st.id + ":played")) {
    put(box, h("button.try-video-tap", { onclick: showPlayer },
      h("span", "▶"), h("span", `${L(v.title)} · ${v.seconds} s · about ${v.mb} MB`), h("span.small.muted", K.u("videoData"))));
  } else showPlayer();
  return [
    K.head(st), K.joke(st), h("p.muted", L(st.lead)),
    box,
    h("details.try-transcript", h("summary", K.u("transcript")), h("p", L(v.transcript))),
    h("p.small.muted", L(v.voiceNote)),
    st.questions?.length && h("h2", K.u("yourTurn")),
    (st.questions ?? []).map((q, n) => h("div.card", K.mcq(q, `${st.id}:${n}`))),
  ];
}

// --- GST Council vote simulator ------------------------------------------------------------------------------------
// Article 279A(9): a decision needs at least three-fourths of the weighted votes of members present and voting; the
// Union's vote is one-third of the votes cast, all the states together two-thirds, shared equally among those voting.
// The learner moves two controls and discovers the two facts Prelims asks about: the Centre has a veto, and the states
// have one only together. Discovery beats being told (a generation-effect bet), and the numbers make it stick.

export function simGst(st) {
  const box = h("div");
  const total = st.states ?? 31;
  const state = () => K.getA(st.id + ":s", { centre: true, yes: 18, present: total });
  const done = () => K.getA(st.id + ":found", {});
  const drawS = () => {
    const s = state();
    const present = Math.max(1, Math.min(total, s.present)), yes = Math.min(s.yes, present);
    const share = (s.centre ? 1 / 3 : 0) + (2 / 3) * (yes / present);
    const pass = share >= 0.75 - 1e-9;
    const pct = (x) => (Math.round(x * 1000) / 10).toLocaleString(K.lang() === "hi" ? "hi-IN" : "en-IN") + "%";
    const found = done();
    // The challenges check themselves as the learner plays.
    const hits = {
      veto: !s.centre && yes === present,
      fewest: present === total && s.centre && pass && Math.ceil(0.625 * present - 1e-9) === yes,
      block: present === total && s.centre && !pass && yes === Math.ceil(0.625 * present - 1e-9) - 1,
    };
    let changed = false;
    for (const [k, v] of Object.entries(hits)) if (v && !found[k]) { found[k] = true; changed = true; }
    if (changed) K.setA(st.id + ":found", found);
    const set = (patch) => { K.setA(st.id + ":s", { ...s, ...patch }); drawS(); };
    const stepper = (label, value, min, max, key) => h("div.try-stepper",
      h("span.small", label),
      h("div.row", h("button", { "aria-label": "−", disabled: value <= min, onclick: () => set({ [key]: value - 1 }) }, "−"),
        h("strong", { "aria-live": "polite" }, String(value)),
        h("button", { "aria-label": "+", disabled: value >= max, onclick: () => set({ [key]: value + 1 }) }, "+"),
        h("button.ghost.small", { onclick: () => set({ [key]: key === "yes" ? (value === max ? 0 : max) : total }) }, value === max ? K.u("none") : K.u("all"))));
    put(box,
      h("div.card.try-sim",
        h("div.row.between", h("span", h("strong", L(st.labels.centre))),
          h("div.chips", [true, false].map((v) => h("button.chip", { "aria-pressed": String(s.centre === v), onclick: () => set({ centre: v }) }, v ? K.u("yes") : K.u("no"))))),
        stepper(L(st.labels.present), present, 1, total, "present"),
        stepper(L(st.labels.yes), yes, 0, present, "yes"),
        h("div.try-meter", { role: "img", "aria-label": `${pct(share)} of weighted votes, ${pass ? "passes" : "fails"}` },
          h("i.c", { style: { width: (s.centre ? 100 / 3 : 0) + "%" } }),
          h("i.s", { style: { width: (200 / 3) * (yes / present) + "%" } }),
          h("b", { style: { left: "75%" } })),
        h("div.row.between.small", h("span", `${L(st.labels.centreShort)} ${s.centre ? pct(1 / 3) : "0%"} + ${L(st.labels.statesShort)} ${pct((2 / 3) * (yes / present))} = ${pct(share)}`),
          h("span", "75%")),
        h("p.try-verdict" + (pass ? ".ok" : ".no"), { role: "status" }, pass ? L(st.labels.pass) : L(st.labels.fail))),
      h("h3", L(st.challengeTitle)),
      h("ol.try-challenges", st.challenges.map((c) => h("li" + (found[c.id] ? ".done" : ""), found[c.id] ? "✓ " : "", L(c.ask),
        found[c.id] && h("div.small", L(c.aha))))),
      Object.keys(found).length >= st.challenges.length && h("div.card.soft", h("p", h("strong", L(st.ahaTitle) + " "), L(st.aha))));
  };
  drawS();
  return [K.head(st), K.joke(st), h("p.muted", L(st.lead)), box, (st.questions ?? []).map((q, n) => h("div.card", K.mcq(q, `${st.id}:q${n}`)))];
}

// --- The Governor's desk -------------------------------------------------------------------------------------------
// Four bills land on the desk; the learner is the Governor and picks what to do. Each choice gets the constitutional
// consequence, right or wrong, in the Governor's own position. Deciding as the actor (not reading about the actor)
// is the transfer the Mains question on Governors needs. No score: four calls, each explained.

export function simGovernor(st) {
  const box = h("div");
  const drawG = () => {
    const at = Math.min(K.getA(st.id + ":at", 0), st.rounds.length);
    if (at >= st.rounds.length) {
      put(box, h("div.card.soft", h("p", L(st.wrap))),
        h("button.ghost", { onclick: () => { K.setA(st.id + ":at", 0); st.rounds.forEach((_, i) => K.setA(`${st.id}:${i}`, null)); drawG(); } }, K.u("again")));
      return;
    }
    const r = st.rounds[at], pick = K.getA(`${st.id}:${at}`);
    put(box,
      h("div.small.muted", K.u("billN", at + 1, st.rounds.length)),
      h("div.card.try-bill",
        h("div.try-stamp", L(r.stamp)),
        h("p.try-stem", L(r.bill)),
        r.note && h("p.small.muted", L(r.note))),
      h("p", h("strong", L(st.ask))),
      h("div.try-opts", r.options.map((o, i) => h("button.opt" + (pick == null ? "" : i === pick ? (o.ok ? ".right" : ".wrong") : o.ok ? ".right" : ""),
        { disabled: pick != null, onclick: () => { K.setA(`${st.id}:${at}`, i); drawG(); } }, L(o.label), pick != null && o.ok ? " ✓" : "", pick === i ? h("span.try-flag", ` · ${K.u("yourPick")}`) : ""))),
      pick != null && h("div.try-why", { role: "status" }, h("p", h("strong", (r.options[pick].ok ? K.u("right") : K.u("notQuite")) + " "), L(r.options[pick].result)),
        r.law && h("p.small.muted", L(r.law))),
      pick != null && h("button.primary", { onclick: () => { K.setA(st.id + ":at", at + 1); drawG(); } }, at + 1 < st.rounds.length ? K.u("nextBill") : K.u("done")));
  };
  drawG();
  return [K.head(st), K.joke(st), h("p.muted", L(st.lead)), box];
}

// --- Essay in three snaps --------------------------------------------------------------------------------------------
// Skeleton, outline, essay: each a photo of paper, each compared with a guide. The pages here are samples our team
// wrote by hand-style to show what feedback looks like at each level (labelled, never passed off as an aspirant's).
// "Try yours": the visitor's photo is shown next to the checklist on their own device and is never uploaded; marking
// by AI is for members and says so.

let fontsAsked = false;
function handFont() {
  if (fontsAsked) return; fontsAsked = true;
  document.head.append(h("link", { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap" }));
}

function page(snap, show) {
  return h("figure.try-page", { "aria-label": L(snap.alt) },
    h("div.try-paper", snap.lines.map((ln, i) => {
      const note = (snap.notes ?? []).find((n) => n.line === i && show.includes(n.level ?? "S"));
      const o = typeof ln === "object" ? ln : {}; // plain strings are lines too (and "".strike is a String method!)
      return h("div.try-line" + (o.strike ? ".strike" : "") + (o.indent ? ".indent" : ""),
        h("span.hand", L(ln.t ?? ln)),
        note && h("span.try-margin" + (note.kind === "good" ? ".good" : ""), h("b", (note.level ?? "S") + " "), L(note.text).replace(/^[SCE] · /, "")));
    })),
    h("figcaption.small.muted", L(snap.caption)));
}

export function essay(st) {
  handFont();
  const box = h("div");
  const drawE = () => {
    const lvl = Math.min(K.getA(st.id + ":lvl", 0), st.snaps.length);
    const tabs = h("div.chips", { role: "tablist" }, st.snaps.map((s, i) => h("button.chip", { role: "tab", "aria-selected": String(i === lvl), "aria-pressed": String(i === lvl), onclick: () => { K.setA(st.id + ":lvl", i); drawE(); } }, `${i + 1}. ${L(s.name)}`)),
      h("button.chip", { role: "tab", "aria-pressed": String(lvl === st.snaps.length), onclick: () => { K.setA(st.id + ":lvl", st.snaps.length); drawE(); } }, K.u("tryYours")));
    if (lvl === st.snaps.length) { put(box, tabs, tryYours(st)); return; }
    const s = st.snaps[lvl];
    const show = K.getA(st.id + ":show", ["S", "C", "E"]);
    const filter = h("div.chips", h("span.small.muted", K.u("filter") + ":"), ["S", "C", "E"].map((x) => h("button.chip", { "aria-pressed": String(show.includes(x)),
      onclick: () => { K.setA(st.id + ":show", show.includes(x) ? show.filter((y) => y !== x) : [...show, x]); drawE(); } }, `${x} · ${K.u("levels")[x]}`)));
    put(box, tabs,
      h("p", h("strong", L(s.name) + ": "), L(s.what)),
      filter,
      page(s, show),
      h("div.card.soft", h("h3", { style: { marginTop: 0 } }, K.u("evaluator")), h("ul", s.watch.map((w) => h("li", L(w))))),
      s.flaws && h("p.small", h("strong", K.u("usualSlip") + " "), L(s.flaws)),
      lvl + 1 < st.snaps.length ? h("button.primary", { onclick: () => { K.setA(st.id + ":lvl", lvl + 1); drawE(); } }, K.u("nextSnap", L(st.snaps[lvl + 1].name)))
        : h("button.primary", { onclick: () => { K.setA(st.id + ":lvl", st.snaps.length); drawE(); } }, K.u("tryYours")));
  };
  drawE();
  return [K.head(st), K.joke(st), h("p.muted", L(st.lead)), h("div.card", h("div.small.muted", L(st.topicLabel)), h("p.try-stem", L(st.topic))), box];
}

function tryYours(st) {
  const img = h("div.try-mine");
  const ticks = K.getA(st.id + ":mine", {});
  const input = h("input", { type: "file", accept: "image/*", capture: "environment", "aria-label": K.u("snapPhoto"), onchange: (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    put(img, h("img", { src: URL.createObjectURL(f), alt: K.u("yourPage") }));
  } });
  return [
    h("p", L(st.yours)),
    h("label.btn.primary.try-file", input, "📷 " + K.u("snapPhoto")),
    h("p.small.muted", K.u("staysHere")),
    img,
    h("p", h("strong", K.u("checkYours"))),
    h("ul.try-ticks", st.selfCheck.map((c, i) => h("li", h("label", h("input", { type: "checkbox", checked: !!ticks[i], onchange: (e) => { const t = K.getA(st.id + ":mine", {}); t[i] = e.target.checked; K.setA(st.id + ":mine", t); } }), " ", L(c))))),
    h("p.small.muted", L(st.members)),
  ];
}

// --- News cards (Chai) -----------------------------------------------------------------------------------------------
// Current affairs only earn their place by hooking onto something static. Each card names that hook first, then asks
// one question. Four cards and done: depth beats volume.

export function news(st) {
  const box = h("div");
  const drawN = () => {
    const i = Math.min(K.getA(st.id + ":i", 0), st.cards.length - 1), c = st.cards[i];
    put(box,
      h("div.row.between.small.muted", h("span", K.u("cardN", i + 1, st.cards.length)), h("span", L(c.date))),
      h("article.card.try-chai",
        h("div.chips", h("span.chip", "📌 " + L(c.hook))),
        h("h2", { style: { marginTop: "6px" } }, L(c.headline)),
        L(c.body).split(/\n\n+/).map((p) => h("p", p)),
        h("p.small", h("strong", K.u("staticLink") + " "), L(c.static)),
        h("details", h("summary", K.u("examCorner")),
          K.mcq(c.mcq, `${st.id}:${i}`),
          h("p", h("strong", "Mains: "), L(c.mains))),
        h("p.small.muted", K.u("sources") + " " + (c.sources ?? []).join(" · "))),
      h("div.row.between",
        h("button", { disabled: i === 0, onclick: () => { K.setA(st.id + ":i", i - 1); drawN(); } }, "← " + K.u("prevCard")),
        i + 1 < st.cards.length ? h("button.primary", { onclick: () => { K.setA(st.id + ":i", i + 1); drawN(); } }, K.u("nextCard") + " →") : h("span.small.muted", L(st.enough))));
  };
  drawN();
  return [K.head(st), K.joke(st), h("p.muted", L(st.lead)), box];
}

// --- The rest of the app ------------------------------------------------------------------------------------------
// Honest about what is built and what is coming: each card says which.

export function tour(st) {
  return [K.head(st), K.joke(st), h("p.muted", L(st.lead)),
    h("div.try-tour", st.cards.map((c) => h("div.card",
      h("div.row.between", h("strong", c.icon + " " + L(c.title)), h("span.tag", L(c.status))),
      h("p", L(c.line)),
      c.sample && h("div.try-sample", L(c.sample)))))];
}

// --- Feedback ------------------------------------------------------------------------------------------------------
// One-tap questions sit at the end of a few steps, never in the middle of thinking, and can be skipped by doing
// nothing. Each says what we'll do with the answer. The end survey is six questions, all optional.

export function ask(st) {
  const a = st.ask;
  if (!a) return null;
  const k = "ask:" + a.id;
  const box = h("div.card.try-ask");
  const drawA = () => {
    const mine = K.getA(k);
    put(box,
      h("div.row.between", h("span.small.muted", K.u("quickOne")), mine != null && h("span.small", "✓ " + K.u("thanks"))),
      h("p", h("strong", L(a.q))),
      h("div.chips", a.chips.map((c) => h("button.chip", { "aria-pressed": String(mine === c.id), onclick: () => { K.setA(k, c.id); K.send(a.id, c.id); drawA(); } }, L(c.label)))),
      mine != null && a.why && h("p.small.muted", L(a.why)));
  };
  drawA();
  return box;
}

export function survey(st, { embedded = false } = {}) {
  const box = h("div");
  const drawV = () => {
    const sent = K.getA("survey:sent");
    put(box,
      st.questions.map((q) => surveyQ(q)),
      h("div.card",
        h("h3", { style: { marginTop: 0 } }, L(st.contact.title)),
        h("p.small", L(st.contact.lead)),
        contactForm(st)),
      !sent ? h("button.primary", { onclick: () => { K.setA("survey:sent", true); flushText(st); drawV(); summaryInto(st); } }, L(st.send))
        : h("div.card.soft", { role: "status" }, h("p", L(st.thanks)), h("div.try-summary")),
      h("p.small.muted", L(st.privacy), " ", h("button.ghost.small", { onclick: async () => { if (!confirm(L(st.forgetAsk))) return; await K.forget(); drawV(); } }, L(st.forget))));
    if (sent) summaryInto(st);
  };
  drawV();
  return [embedded ? h("h2", L(st.title)) : K.head(st), K.joke(st), h("p.muted", L(st.lead)), box];
}

function surveyQ(q) {
  const k = "survey:" + q.id;
  const mine = K.getA(k, q.kind === "multi" ? [] : null);
  const card = h("div.card.try-q");
  const redraw = () => card.replaceWith(surveyQ(q));
  if (q.kind === "text") {
    const ta = h("textarea", { rows: 3, placeholder: L(q.placeholder ?? ""), "aria-label": L(q.q), oninput: (e) => K.setA(k, e.target.value) });
    ta.value = mine ?? "";
    ta.addEventListener("change", () => ta.value.trim() && K.send(q.id, null, ta.value.trim()));
    put(card, h("p", h("strong", L(q.q))), q.hint && h("p.small.muted", L(q.hint)), ta);
    return card;
  }
  const pickOne = (id) => {
    let v;
    if (q.kind === "multi") { const cur = new Set(mine ?? []); cur.has(id) ? cur.delete(id) : (q.max && cur.size >= q.max) ? null : cur.add(id); v = [...cur]; }
    else v = mine === id ? null : id;
    K.setA(k, v); if (v != null && (!Array.isArray(v) || v.length)) K.send(q.id, v); redraw();
  };
  put(card, h("p", h("strong", L(q.q))), q.hint && h("p.small.muted", L(q.hint)),
    h("div.chips", q.options.map((o) => h("button.chip", { "aria-pressed": String(q.kind === "multi" ? (mine ?? []).includes(o.id) : mine === o.id), onclick: () => pickOne(o.id) }, L(o.label)))));
  return card;
}

function flushText(st) {
  for (const q of st.questions) if (q.kind === "text") { const v = K.getA("survey:" + q.id); if (v?.trim()) K.send(q.id, null, v.trim()); }
}

function contactForm(st) {
  const sent = K.getA("contact:sent");
  if (sent) return h("p.small", "✓ " + L(st.contact.saved));
  const input = h("input", { type: "text", inputmode: "email", autocomplete: "email", placeholder: L(st.contact.placeholder), "aria-label": L(st.contact.placeholder) });
  const consent = h("input", { type: "checkbox", id: "try-consent" });
  const msg = h("p.small", { role: "status" });
  const hp = h("input", { type: "text", name: "company", tabindex: "-1", autocomplete: "off", style: { position: "absolute", left: "-9999px" }, "aria-hidden": "true" });
  return h("div", input, hp,
    h("label.small", { for: "try-consent", style: { display: "block", margin: "8px 0" } }, consent, " ", L(st.contact.consent)),
    h("button", { onclick: async () => {
      if (!input.value.trim()) return;
      if (!consent.checked) { msg.textContent = L(st.contact.tick); return; }
      const r = await K.contact(input.value.trim(), L(st.contact.consent), hp.value);
      if (r?.ok) { K.setA("contact:sent", true); msg.textContent = L(st.contact.saved); } else msg.textContent = r?.error ?? K.u("offline");
    } }, L(st.contact.button)), msg);
}

/** What others said (chip questions only, once enough people answered), so people see they were heard. */
async function summaryInto(st) {
  const el = document.querySelector(".try-summary");
  if (!el || el.dataset.done) return;
  el.dataset.done = "1";
  const [d, up] = await Promise.all([
    fetch("/try/summary?path=" + encodeURIComponent(K.pathId())).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch("/try/updates?path=" + encodeURIComponent(K.pathId())).then((r) => (r.ok ? r.json() : null)).catch(() => null)]);
  // "You asked, we did": written by the team, newest first. Shown only when there's something real to show.
  if (up?.updates?.length) el.before(h("div.try-did", h("h3", L(st.didTitle)), h("ul", up.updates.map((x) => h("li", L(x), h("span.small.muted", ` · ${x.on}`))))));
  const qs = st.questions.filter((q) => q.kind !== "text" && d?.questions?.[q.id]);
  if (!qs.length) { put(el, h("p.small.muted", L(st.summaryEmpty))); return; }
  put(el, h("h3", L(st.summaryTitle)), qs.map((q) => {
    const s = d.questions[q.id];
    const top = Object.entries(s.answers).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return h("div.small", h("strong", L(q.q)), h("ul", top.map(([id, n]) => h("li", `${L(q.options.find((o) => o.id === id)?.label ?? id)}: ${Math.round((100 * n) / s.total)}%`))));
  }), h("p.small.muted", K.u("ofN", d.minShown)));
}

export const CSS = `
.try-video { display: flex; justify-content: center; margin: 8px 0; }
.try-video video { width: 100%; max-width: 360px; height: auto; aspect-ratio: 9 / 16; background: #111; border-radius: 14px; }
.try-video-tap { display: grid; gap: 6px; place-items: center; width: 100%; max-width: 360px; aspect-ratio: 9 / 16; border-radius: 14px; background: #1d1a17; color: #fff; }
.try-video-tap > span:first-child { font-size: 42px; }
.try-transcript p { white-space: pre-line; }
.try-sim .row { align-items: center; }
.try-stepper { margin: 12px 0; }
.try-stepper .row { gap: 10px; margin-top: 4px; }
.try-stepper strong { min-width: 2.2em; text-align: center; font-size: 20px; }
.try-stepper button { min-width: 44px; min-height: 44px; }
.try-meter { position: relative; height: 22px; border-radius: 11px; background: var(--line, #e7e3dc); overflow: hidden; display: flex; margin: 14px 0 6px; }
.try-meter i { display: block; height: 100%; }
.try-meter i.c { background: #8a4b12; }
.try-meter i.s { background: #c98a12; }
.try-meter b { position: absolute; top: -2px; bottom: -2px; width: 3px; background: currentColor; }
.try-verdict { font-weight: 700; }
.try-verdict.ok::before { content: "✓ "; }
.try-verdict.no::before { content: "✕ "; }
.try-challenges li { margin: 8px 0; }
.try-challenges li.done { font-weight: 600; }
.try-challenges li.done .small { font-weight: 400; }
.try-bill { position: relative; background: #fffaf0; color: #2a2118; border: 1px solid #e6d9bf; }
.try-stamp { display: inline-block; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; border: 2px solid #9b2c2c; color: #9b2c2c; padding: 2px 8px; border-radius: 4px; transform: rotate(-2deg); }
.try-page { margin: 12px 0; }
.try-paper { background: #fffdf6; color: #1f2a44; border: 1px solid #e3dccb; border-radius: 6px; padding: 14px 14px 18px 46px; position: relative;
  background-image: linear-gradient(to right, transparent 34px, #f2b8b8 34px, #f2b8b8 35px, transparent 35px), repeating-linear-gradient(#fffdf6 0 29px, #cfdcec 29px 30px);
  box-shadow: 0 1px 0 #0001, 0 6px 14px -10px #0004; }
.try-line { min-height: 30px; line-height: 30px; position: relative; }
.try-line.indent { padding-left: 1.4em; }
.try-line.strike .hand { text-decoration: line-through; text-decoration-color: #b33; }
.try-line .hand { font-family: "Kalam", "Segoe Print", "Bradley Hand", cursive; font-size: 17px; }
.try-margin { display: block; font-family: "Kalam", cursive; font-size: 14px; line-height: 1.35; color: #b42318; margin: 0 0 6px; padding-left: 8px; border-left: 2px solid #b42318; }
.try-margin.good { color: #1b7a43; border-color: #1b7a43; }
.try-mine img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
.try-file { position: relative; overflow: hidden; display: inline-block; }
.try-file input { position: absolute; inset: 0; opacity: 0; }
.try-chai h2 { font-size: 20px; }
.try-tour { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.try-sample { font-size: 14px; background: var(--soft, #f4f1ea); border-radius: 10px; padding: 8px 10px; white-space: pre-line; }
.try-ask { border-style: dashed; }
.try-why-note summary { cursor: pointer; }
.try-why-note { margin: 14px 0; }
.try-joke { font-style: italic; }
@media (prefers-color-scheme: dark) { .try-paper, .try-bill { filter: brightness(.92); } }
`;
