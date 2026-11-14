// "Try it yourself" (#tryit, #tryit/<id>): short hands-on pieces that go with the Syllabus in a minute videos.
// 60 pieces, 5 per paper, 10 of each of six kinds, all played by the one engine below:
//   decide      You decide: a situation, two or three options, the why for each. One round at a time.
//   order       Put in order: move items up and down, then check against the right order (with notes).
//   sort        Sort: put each item in a bucket, then check.
//   match       Match: pick the partner for each item on the left, then check.
//   statements  Statements: mark each true or false, then check, with the why.
//   dial        Dial: estimate a number on a half-dial (a slider underneath does the same), then see the answer.
// Content kind "interactive" (schema aspiran/syllabus-interactive@1, content/interactives/), from /library for members
// and from /library/shelf for visitors (only the 12 marked free).
//
// Same rules as the rest of Prep: no sound, nothing moves (so reduced motion has nothing to stop), no timer, no score
// kept or shown, every piece ends with what to keep and its sources. Whether a piece was tried stays on this device.

let C = null;
/** app.js hands over its helpers once at start. */
export function init(ctx) { C = ctx; }

const h = (...a) => C.h(...a);
const put = (...a) => C.put(...a);
const T = (v) => C.bi(v);
const L = (en, hi) => (C.lang() === "hi" ? hi : en);
const all = () => C.libraryOf("interactive").map((i) => i.data).filter((d) => d?.id && d.type)
  .sort((a, b) => String(a.week).localeCompare(String(b.week)) || (a.episodeN ?? 0) - (b.episodeN ?? 0));
const seed = (s) => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) & 0x7fffffff; return x || 1; };
const done = () => C.store.get("tryitDone", {});
const markDone = (id) => { const d = done(); d[id] = C.today(); C.store.set("tryitDone", d); };

/** The piece for a video, if there is one (brief.js shows "Try it yourself" under the video). */
export function forEpisode(week, episode) { return all().find((d) => d.week === week && d.episode === episode) ?? null; }
/** How many pieces a paper (a "2000-NN" week) has. */
export const countFor = (week) => all().filter((d) => d.week === week).length;
export const typeName = (d) => T(d.typeName) || d.type;
export const tried = (id) => !!done()[id];

export function viewTryIt(arg) {
  const items = all();
  if (arg) {
    const d = items.find((x) => x.id === arg);
    if (!d) return h("div.col", h("a", { href: "#tryit" }, "← " + L("Try it yourself", "ख़ुद करके देखें")),
      h("p", C.signedIn?.() ? L("That one isn't here yet.", "यह अभी यहाँ नहीं है।") : L("This one opens when you sign in.", "यह साइन इन करने पर खुलेगा।")));
    return piece(d, items);
  }
  const back = C.signedIn?.() ? h("a", { href: "#watch" }, "← " + L("Videos", "वीडियो")) : h("a", { href: "#shelf" }, "← " + L("Free Shelf", "मुफ़्त शेल्फ़"));
  if (!items.length) return h("div.col", back, h("h1", L("Try it yourself", "ख़ुद करके देखें")), h("p", L("These open once they're approved.", "ये स्वीकृत होने पर खुलेंगे।")));
  const papers = [...new Set(items.map((d) => d.week))];
  const tick = done();
  return h("div.col", back, h("h1", L("Try it yourself", "ख़ुद करके देखें")),
    h("p.muted", L("Short hands-on pieces that go with the Syllabus in a minute videos: decide, order, sort, match, judge statements, or set a dial. A few minutes each; nothing is scored.",
      "'एक मिनट में सिलेबस' वीडियो के साथ छोटे अभ्यास: तय कीजिए, क्रम लगाइए, छाँटिए, मिलाइए, कथन परखिए, या डायल घुमाइए। हर एक कुछ मिनट का; कोई अंक नहीं।")),
    papers.map((w) => {
      const list = items.filter((d) => d.week === w);
      return h("div", h("h2", T(list[0].paper) || w),
        list.map((d) => h("a.card.link", { href: "#tryit/" + d.id }, h("div.row.between",
          h("div", h("strong", T(d.title)), h("div.small.muted", [typeName(d), `${L("after video", "वीडियो")} ${d.episodeN}`, tick[d.id] && L("tried", "किया")].filter(Boolean).join(" · "))),
          h("span", "→")))));
    }));
}

// --- One piece ---------------------------------------------------------------------------------------------

function piece(d, items) {
  const box = h("div");
  const same = items.filter((x) => x.week === d.week);
  const next = same[same.indexOf(d) + 1] ?? null;
  const ending = () => {
    markDone(d.id);
    return h("div.card.soft",
      h("strong", L("What to keep", "याद रखने की बात")), h("p", T(d.takeaway)),
      h("p.small.muted", L("Sources: ", "स्रोत: ") + (d.sources ?? []).join("; ")),
      h("div.row",
        C.signedIn?.() && h("a.btn", { href: "#watch/" + d.week }, L("Back to the videos", "वीडियो पर लौटें")),
        next ? h("a.btn.primary", { href: "#tryit/" + next.id }, L("Next: ", "अगला: ") + T(next.title)) : h("a.btn", { href: "#tryit" }, L("All pieces", "सभी अभ्यास")),
        h("button.ghost", { onclick: () => { put(box, engine(d, box, ending)); box.scrollIntoView?.({ block: "start" }); } }, L("Do it again", "फिर से करें"))),
      h("p.small.muted", L("That's the piece. Stop here, or pick another.", "बस इतना ही। यहीं रुकिए, या कोई और चुनिए।")));
  };
  put(box, engine(d, box, ending));
  return h("div.col",
    h("a", { href: "#tryit" }, "← " + L("Try it yourself", "ख़ुद करके देखें")),
    h("div.small.muted", [T(d.paper), typeName(d), d.episodeTitle && `${L("after video", "वीडियो")} ${d.episodeN}: ${d.episodeTitle}`].filter(Boolean).join(" · ")),
    h("h1", { style: { fontSize: "24px" } }, T(d.title)),
    h("p", T(d.prompt)),
    box);
}

function engine(d, box, ending) {
  const f = { decide, order, sort, match, statements, dial }[d.type];
  if (!f) return h("p", L("This kind of piece needs a newer version of the app.", "इस तरह के अभ्यास के लिए ऐप का नया संस्करण चाहिए।"));
  const out = h("div");
  f(d, out, () => out.append(ending()));
  return out;
}

const why = (v) => v && T(v) && h("div.small", T(v));
const mark = (ok) => h("strong", { "aria-hidden": "true", style: { marginRight: "6px" } }, ok ? "✓" : "✗");
const checkBtn = (ready, onclick) => h("button.primary", { disabled: !ready, onclick }, L("Check", "जाँचिए"));

// You decide: one round at a time.
function decide(d, out, finish) {
  const rounds = d.rounds ?? [];
  const play = (k) => {
    const r = rounds[k];
    const opts = h("div");
    const after = h("div");
    const card = h("div.card", rounds.length > 1 && h("div.small.muted", `${k + 1} / ${rounds.length}`), h("p", h("strong", T(r.situation))), opts, after);
    const choose = (i) => {
      [...opts.children].forEach((b, j) => {
        b.disabled = true;
        if (r.options[j].best) b.classList.add("right");
        else if (j === i) b.classList.add("wrong");
      });
      const picked = r.options[i], best = r.options.find((o) => o.best);
      put(after,
        h("p", mark(picked.best), picked.best ? L("A strong choice. ", "अच्छा चुनाव। ") : L("Not the strongest. ", "सबसे अच्छा नहीं। "), T(picked.why)),
        !picked.best && h("p", h("strong", L("Stronger: ", "बेहतर: ")), T(best.text), " ", T(best.why)),
        k + 1 < rounds.length ? h("button.primary", { onclick: (e) => { e.target.remove(); play(k + 1); } }, L("Next", "अगला")) : null);
      if (k + 1 >= rounds.length) finish();
    };
    r.options.forEach((o, i) => opts.append(h("button.opt", { onclick: () => choose(i) }, T(o.text))));
    out.append(card);
  };
  play(0);
}

// Put in order: up and down buttons (work with a keyboard and a screen reader), then one check.
function order(d, out, finish) {
  const right = d.items.map((x, i) => ({ ...x, k: i }));
  let now = C.shuffle(right, seed(d.id));
  if (now.every((x, i) => x.k === i)) now = now.slice().reverse();
  const list = h("ol", { style: { paddingLeft: "0", listStyle: "none" } });
  const draw = () => put(list, now.map((x, i) => h("li.card", { style: { margin: "8px 0", padding: "10px 12px" } }, h("div.row.between",
    h("span", h("span.small.muted", `${i + 1}. `), T(x.text)),
    h("span.row", { style: { gap: "4px" } },
      h("button", { disabled: i === 0, "aria-label": L("Move up", "ऊपर ले जाएँ"), onclick: () => { [now[i - 1], now[i]] = [now[i], now[i - 1]]; draw(); list.children[i - 1]?.querySelector("button")?.focus(); } }, "↑"),
      h("button", { disabled: i === now.length - 1, "aria-label": L("Move down", "नीचे ले जाएँ"), onclick: () => { [now[i + 1], now[i]] = [now[i], now[i + 1]]; draw(); list.children[i + 1]?.querySelectorAll("button")[1]?.focus(); } }, "↓"))))));
  draw();
  const go = checkBtn(true, () => {
    go.remove();
    put(list, now.map((x, i) => h("li.card", { class: "card " + (x.k === i ? "" : ""), style: { margin: "8px 0", padding: "10px 12px", background: x.k === i ? "var(--ok)" : "var(--bad)", color: x.k === i ? "var(--okink)" : "var(--badink)" } },
      mark(x.k === i), T(x.text), x.k !== i && h("span.small", ` (${L("belongs at", "सही जगह")} ${x.k + 1})`))));
    out.append(h("div.card", h("strong", L("The right order", "सही क्रम")),
      h("ol", right.map((x) => h("li", T(x.text), x.note && h("span.small.muted", " · " + T(x.note)))))));
    finish();
  });
  out.append(d.ends && h("div.small.muted", `↑ ${T(d.ends)} · ↓ ${T(d.ends2)}`), list, go);
}

// Sort: a row of bucket buttons under each item.
function sort(d, out, finish) {
  const items = C.shuffle(d.items.map((x, i) => ({ ...x, k: i })), seed(d.id));
  const pick = {};
  const rows = h("div");
  let go;
  const draw = () => put(rows, items.map((x) => h("div.card", { style: { margin: "8px 0", padding: "10px 12px" } },
    h("div", T(x.text)),
    h("div.chips", { style: { marginTop: "6px" } }, d.buckets.map((b, j) => h("button.chip", { "aria-pressed": String(pick[x.k] === j),
      onclick: () => { pick[x.k] = j; draw(); go.disabled = Object.keys(pick).length < items.length; } }, T(b)))))));
  go = checkBtn(false, () => {
    go.remove();
    put(rows, items.map((x) => {
      const ok = pick[x.k] === x.bucket;
      return h("div.card", { style: { margin: "8px 0", padding: "10px 12px", background: ok ? "var(--ok)" : "var(--bad)", color: ok ? "var(--okink)" : "var(--badink)" } },
        h("div", mark(ok), T(x.text)), h("div.small", "→ " + T(d.buckets[x.bucket])), why(x.why));
    }));
    finish();
  });
  draw();
  out.append(rows, go);
}

// Match: a drop-down of partners for each item on the left.
function match(d, out, finish) {
  const lefts = C.shuffle(d.pairs.map((p, i) => ({ ...p, k: i })), seed(d.id));
  const rights = C.shuffle(d.pairs.map((p, i) => ({ text: p.b, k: i })), seed(d.id) + 3);
  const pick = {};
  const rows = h("div");
  let go;
  rows.append(...lefts.map((p) => h("div.card", { style: { margin: "8px 0", padding: "10px 12px" } },
    h("label", h("div", h("strong", T(p.a))),
      h("select", { style: { marginTop: "6px" }, onchange: (e) => { pick[p.k] = e.target.value === "" ? undefined : Number(e.target.value); go.disabled = lefts.some((x) => pick[x.k] == null); } },
        h("option", { value: "" }, L("Choose…", "चुनिए…")), rights.map((r) => h("option", { value: String(r.k) }, T(r.text))))))));
  go = checkBtn(false, () => {
    go.remove();
    put(rows, lefts.map((p) => {
      const ok = pick[p.k] === p.k;
      return h("div.card", { style: { margin: "8px 0", padding: "10px 12px", background: ok ? "var(--ok)" : "var(--bad)", color: ok ? "var(--okink)" : "var(--badink)" } },
        h("div", mark(ok), h("strong", T(p.a))), h("div", "→ " + T(p.b)),
        !ok && pick[p.k] != null && h("div.small", L("You picked: ", "आपने चुना: ") + T(d.pairs[pick[p.k]].b)));
    }));
    finish();
  });
  out.append(d.left && h("div.small.muted", `${T(d.left)} → ${T(d.right)}`), rows, go);
}

// Statements: true or false for each, then one check.
function statements(d, out, finish) {
  const pick = {};
  const rows = h("div");
  let go;
  const draw = () => put(rows, d.statements.map((s, i) => h("div.card", { style: { margin: "8px 0", padding: "10px 12px" } },
    h("p", { style: { margin: "0 0 6px" } }, `${i + 1}. `, T(s.text)),
    h("div.chips", [[true, L("True", "सही")], [false, L("False", "ग़लत")]].map(([v, label]) =>
      h("button.chip", { "aria-pressed": String(pick[i] === v), onclick: () => { pick[i] = v; draw(); go.disabled = Object.keys(pick).length < d.statements.length; } }, label))))));
  go = checkBtn(false, () => {
    go.remove();
    put(rows, d.statements.map((s, i) => {
      const ok = pick[i] === s.answer;
      return h("div.card", { style: { margin: "8px 0", padding: "10px 12px", background: ok ? "var(--ok)" : "var(--bad)", color: ok ? "var(--okink)" : "var(--badink)" } },
        h("p", { style: { margin: "0 0 4px" } }, mark(ok), `${i + 1}. `, T(s.text)),
        h("div.small", h("strong", s.answer ? L("True. ", "सही। ") : L("False. ", "ग़लत। ")), T(s.why)));
    }));
    finish();
  });
  draw();
  out.append(rows, go);
}

// Dial: a half-circle gauge drawn in SVG, set with the slider under it (or the − and + buttons). Nothing animates.
function dial(d, out, finish) {
  const { min, max, step, answer } = d;
  const near = d.near ?? 0;
  const dp = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  const fmt = (v) => Number(v).toLocaleString(C.lang() === "hi" ? "hi-IN" : "en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  let v = d.start ?? min;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 220 124");
  svg.setAttribute("role", "img");
  Object.assign(svg.style, { width: "100%", maxWidth: "360px", display: "block", margin: "0 auto" });
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, x] of Object.entries(attrs)) e.setAttribute(k, x); svg.append(e); return e; };
  const pt = (val, r) => { const a = Math.PI * (1 - (val - min) / (max - min)); return [110 + r * Math.cos(a), 112 - r * Math.sin(a)]; };
  el("path", { d: "M 14 112 A 96 96 0 0 1 206 112", fill: "none", stroke: "var(--line)", "stroke-width": "14", "stroke-linecap": "round" });
  for (let i = 0; i <= 10; i++) { const val = min + (max - min) * i / 10; const [x1, y1] = pt(val, 80); const [x2, y2] = pt(val, i % 5 ? 86 : 90); el("line", { x1, y1, x2, y2, stroke: "var(--muted)", "stroke-width": "1.5" }); }
  const lo = el("text", { x: "14", y: "123", "font-size": "10", fill: "var(--muted)", "text-anchor": "start" }); lo.textContent = fmt(min);
  const hiT = el("text", { x: "206", y: "123", "font-size": "10", fill: "var(--muted)", "text-anchor": "end" }); hiT.textContent = fmt(max);
  const ansLine = el("line", { x1: "110", y1: "112", x2: "110", y2: "112", stroke: "var(--okink)", "stroke-width": "4", "stroke-linecap": "round", visibility: "hidden" });
  const needle = el("line", { x1: "110", y1: "112", x2: "110", y2: "30", stroke: "var(--brand)", "stroke-width": "4", "stroke-linecap": "round" });
  el("circle", { cx: "110", cy: "112", r: "7", fill: "var(--brand)" });
  const readout = h("div", { style: { textAlign: "center", fontSize: "28px", fontWeight: "700" }, "aria-live": "polite" });
  const unit = T(d.unit);
  const slider = h("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(v), "aria-label": T(d.title) + (unit ? ` (${unit})` : ""),
    style: { width: "100%" }, oninput: (e) => set(Number(e.target.value)) });
  const set = (x) => {
    v = Math.min(max, Math.max(min, Math.round((x - min) / step) * step + min));
    v = Number(v.toFixed(dp));
    slider.value = String(v);
    const [nx, ny] = pt(v, 82);
    needle.setAttribute("x2", nx); needle.setAttribute("y2", ny);
    put(readout, fmt(v), unit && h("span.small.muted", { style: { fontSize: "14px", fontWeight: "400" } }, " " + unit));
    svg.setAttribute("aria-label", `${fmt(v)} ${unit}`);
  };
  set(v);
  const nudge = (k) => h("button", { "aria-label": k < 0 ? L("Less", "कम") : L("More", "ज़्यादा"), onclick: () => set(v + k * step) }, k < 0 ? "−" : "+");
  const controls = h("div.row", { style: { justifyContent: "center" } }, nudge(-1), h("div", { style: { flex: "1", minWidth: "160px" } }, slider), nudge(1));
  const go = h("button.primary", { onclick: () => {
    go.remove(); controls.remove();
    const [ax, ay] = pt(answer, 92);
    ansLine.setAttribute("x2", ax); ansLine.setAttribute("y2", ay); ansLine.setAttribute("visibility", "visible");
    const off = Math.abs(v - answer);
    const closeEnough = off <= near + 1e-9;
    const close = off <= (max - min) * 0.1;
    out.append(h("div.card", { style: { background: closeEnough ? "var(--ok)" : "var(--card)", color: closeEnough ? "var(--okink)" : "inherit" } },
      h("p", h("strong", closeEnough ? L("Spot on. ", "बिल्कुल सही। ") : close ? L("Close. ", "क़रीब। ") : L("Not quite. ", "पूरी तरह नहीं। ")),
        L(`You set ${fmt(v)}; the answer is ${fmt(answer)}`, `आपने ${fmt(v)} चुना; उत्तर ${fmt(answer)} है`), unit ? ` ${unit}.` : "."),
      h("p", T(d.explain)),
      h("p.small.muted", L("The green line marks the answer.", "हरी रेखा उत्तर दिखाती है।"))));
    finish();
  } }, L("Lock it in", "पक्का करें"));
  out.append(h("div.card", svg, readout, controls), go);
}
