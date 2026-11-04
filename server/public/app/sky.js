// "Your sky": the syllabus map drawn as constellations, one per paper, one star per topic. A topic not started is a
// faint ring; Met is a small star, Can recall a bright one, Can use a bright star with a soft glow. A line joins two
// neighbouring topics once both are lit. No percentages and no comparison with anyone: it's your own sky.
// Built for a phone first: each constellation is a full-width band that stacks, and the whole band is the tap target
// (stars are too small to tap). Still: nothing moves, so reduced motion needs nothing extra.
// The Android copy is ui/SkyMap.kt; keep the two in step.

const NS = "http://www.w3.org/2000/svg";
const PER_ROW = 9;
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  kids.forEach((c) => c && e.append(c));
  return e;
};
/** A steady number from a topic id, so a star stays where it is on every visit and every device. */
const jitter = (id) => {
  let x = 2166136261;
  for (const c of String(id)) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  x ^= x >>> 15; x = Math.imul(x, 2246822507); x ^= x >>> 13; x = Math.imul(x, 3266489909); x ^= x >>> 16;
  return ((x >>> 0) % 10000) / 10000 - 0.5;
};

/** Star positions in a 100-wide box: rows of up to PER_ROW, snaking left to right then back, with a little drift. */
export function layout(ids) {
  const rows = Math.max(1, Math.ceil(ids.length / PER_ROW));
  const per = Math.ceil(ids.length / rows);
  const pts = ids.map((id, i) => {
    const r = Math.floor(i / per), k = i % per, n = Math.min(per, ids.length - r * per);
    const t = n === 1 ? 0.5 : k / (n - 1);
    const x = 8 + 84 * (r % 2 ? 1 - t : t) + jitter(id + "x") * 4;
    const y = 12 + r * 22 + jitter(id) * 12 + Math.sin(t * Math.PI * 2 + r) * 3;
    return { id, x, y };
  });
  return { pts, height: 24 + (rows - 1) * 22 };
}

function star(p, st) {
  if (st === "none") return el("circle", { cx: p.x, cy: p.y, r: 1.3, class: "sky-ring" });
  if (st === "met") return el("circle", { cx: p.x, cy: p.y, r: 1.4, class: "sky-met" });
  if (st === "recall") return el("circle", { cx: p.x, cy: p.y, r: 1.9, class: "sky-lit" });
  // Can use: a four-pointed star over a soft glow.
  const s = 2.9, w = 0.7;
  const d = `M${p.x} ${p.y - s} L${p.x + w} ${p.y - w} L${p.x + s} ${p.y} L${p.x + w} ${p.y + w} L${p.x} ${p.y + s} L${p.x - w} ${p.y + w} L${p.x - s} ${p.y} L${p.x - w} ${p.y - w} Z`;
  return el("g", {}, el("circle", { cx: p.x, cy: p.y, r: 4.2, class: "sky-glow" }), el("path", { d, class: "sky-lit" }));
}

/**
 * One constellation. `topics` are [{ id, name }], `stateOf(id)` gives none | met | recall | use.
 * Returns an <svg> sized to its width; the caller wraps it in a link or button.
 */
export function constellation(topics, stateOf, label) {
  const { pts, height } = layout(topics.map((t) => t.id));
  const lit = (st) => st !== "none";
  const states = pts.map((p) => stateOf(p.id));
  const svg = el("svg", { viewBox: `0 0 100 ${height}`, class: "sky-svg", role: "img", "aria-label": label, preserveAspectRatio: "xMidYMid meet" });
  // Background dust: a few faint specks, the same for this paper every time.
  const seed = topics.map((t) => t.id).join("");
  for (let i = 0; i < 14; i++) svg.append(el("circle", { cx: 50 + jitter(seed + i) * 100, cy: height / 2 + jitter(i + seed) * height, r: 0.25 + (jitter("r" + i + seed) + 0.5) * 0.3, class: "sky-dust" }));
  pts.slice(1).forEach((p, i) => {
    const a = pts[i];
    svg.append(el("line", { x1: a.x, y1: a.y, x2: p.x, y2: p.y, class: lit(states[i]) && lit(states[i + 1]) ? "sky-line on" : "sky-line" }));
  });
  pts.forEach((p, i) => svg.append(star(p, states[i])));
  return svg;
}

/** Counts in words, never a percentage: "4 of 9 lit · 1 can use". */
export function countLine(topics, stateOf) {
  const s = topics.map((t) => stateOf(t.id));
  const lit = s.filter((x) => x !== "none").length, use = s.filter((x) => x === "use").length, recall = s.filter((x) => x === "recall").length;
  if (!lit) return `${topics.length} stars, none lit yet`;
  return [`${lit} of ${topics.length} lit`, recall && `${recall} can recall`, use && `${use} can use`].filter(Boolean).join(" · ");
}

/** The key, drawn with the same marks. */
export function legend() {
  const items = [["none", "Not started"], ["met", "Met"], ["recall", "Can recall"], ["use", "Can use"]];
  const wrap = document.createElement("div");
  wrap.className = "sky-key";
  for (const [st, name] of items) {
    const svg = el("svg", { viewBox: "0 0 12 12", width: 14, height: 14, "aria-hidden": "true" }, star({ x: 6, y: 6 }, st));
    const span = document.createElement("span");
    span.append(svg, " " + name);
    wrap.append(span);
  }
  return wrap;
}
