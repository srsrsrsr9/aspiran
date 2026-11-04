// The syllabus as a creeper garden. One vine per paper rises from the earth (the Adda) into the sky (Prep); every topic
// is a branch and every line of UPSC's syllabus a leaf. A leaf starts as a pale outline and lights up with its topic:
// Met is a light green leaf, Can recall a deep green one, Can use deep green with a marigold flower at the branch tip.
// At night the lit leaves glow. The whole syllabus is on one screen on purpose: the breadth is the point.
// No percentages, no comparison with anyone. The vines grow in once per visit (under a second and a half) unless
// reduced motion is on; after that nothing moves. The Android copy is ui/VineGarden.kt; keep the two in step.

import { LINES } from "./syllabus-lines.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  kids.forEach((c) => c && e.append(c));
  return e;
};
/** A steady number in [-0.5, 0.5) from a string, so every leaf sits in the same place on every visit and device. */
export const jitter = (id) => {
  let x = 2166136261;
  for (const c of String(id)) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
  x ^= x >>> 15; x = Math.imul(x, 2246822507); x ^= x >>> 13; x = Math.imul(x, 3266489909); x ^= x >>> 16;
  return ((x >>> 0) % 10000) / 10000 - 0.5;
};
const r2 = (n) => Math.round(n * 100) / 100;

// --- The model: vines of branches of leaves ---------------------------------------------------------------

/**
 * Papers into vines. A common paper is a vine whose branches are its topics and whose leaves are the topic's syllabus
 * lines (all lit together with the topic). The optional's two papers make one vine, and the two qualifying language
 * papers another; there each branch is a paper and each leaf a topic with its own state.
 * `stateOf(nodeId)` gives none | met | recall | use.
 */
export function vinesOf(papers, nodeId, stateOf, hasOptional) {
  const common = papers.filter((p) => !p.forOptional && LINES[nodeId(p, 0)]);
  const vines = common.map((p) => ({
    id: p.id, label: p.short, name: p.name, lead: p.lead,
    branches: p.topics.map((name, i) => {
      const node = nodeId(p, i), st = stateOf(node);
      return { node, label: name, state: st, leaves: LINES[node].map((line) => ({ line, node, state: st })) };
    }),
  }));
  const group = (id, label, name, lead, ps) => ps.length && vines.push({
    id, label, name, lead,
    branches: ps.map((p) => ({ node: null, label: p.name, paper: p.id, state: null,
      leaves: p.topics.map((name, i) => ({ line: name, node: nodeId(p, i), state: stateOf(nodeId(p, i)) })) })),
  });
  group("optional", "Optional", "Your optional", "Two papers of 250 marks each, in the subject you choose.", papers.filter((p) => p.forOptional));
  if (!hasOptional) vines.push({ id: "optional", label: "Optional", name: "Your optional", lead: "Tell us your optional and its two papers grow here.", seedling: true, branches: [] });
  group("qualifying", "Lang", "Qualifying language papers", "Paper A (an Indian language) and Paper B (English). Qualifying, 25% to pass.", papers.filter((p) => p.id === "lang" || p.id === "english"));
  return vines;
}

export const countsOf = (vines) => {
  const c = { papers: 0, topics: 0, lines: 0, lit: 0 };
  for (const v of vines) for (const b of v.branches) {
    c.topics += b.paper ? 0 : 1;
    for (const l of b.leaves) { c.lines++; if (l.state && l.state !== "none") c.lit++; if (b.paper) c.topics++; }
  }
  c.papers = vines.filter((v) => !v.seedling).reduce((n, v) => n + (v.branches[0]?.paper ? v.branches.length : 1), 0);
  return c;
};

// --- Drawing ----------------------------------------------------------------------------------------------

/** A leaf as an almond from its base at (0,0), pointing along +x. */
const leafPath = (L) => `M0 0Q${r2(L * 0.45)} ${r2(-L * 0.42)} ${r2(L)} 0Q${r2(L * 0.45)} ${r2(L * 0.42)} 0 0Z`;
const vein = (L) => `M${r2(L * 0.12)} 0L${r2(L * 0.8)} 0`;

/** A point and its direction on a cubic Bézier. */
function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
  const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return { x, y, a: Math.atan2(dy, dx) * 180 / Math.PI };
}

/** A small curl at the tip of a branch, the way a creeper's tendril ends. */
const curl = (x, y, side, s) => `M${r2(x)} ${r2(y)}c${r2(side * s * 0.9)} ${r2(-s * 0.2)} ${r2(side * s * 1.2)} ${r2(-s * 1.1)} ${r2(side * s * 0.5)} ${r2(-s * 1.2)}c${r2(-side * s * 0.45)} 0 ${r2(-side * s * 0.5)} ${r2(s * 0.5)} ${r2(-side * s * 0.15)} ${r2(s * 0.55)}`;

/** A marigold flower for a topic you can use. */
function bloom(x, y, s) {
  const g = el("g", { class: "vine-bloom", transform: `translate(${r2(x)} ${r2(y)})` });
  for (let k = 0; k < 5; k++) g.append(el("ellipse", { cx: 0, cy: r2(-s * 0.55), rx: r2(s * 0.38), ry: r2(s * 0.55), transform: `rotate(${k * 72})` }));
  g.append(el("circle", { r: r2(s * 0.32), class: "vine-bloom-eye" }));
  return g;
}

/**
 * One branch: from the stem at (x, y) out to one side, rising a little, with its leaves alternating above and below.
 * Returns the SVG group. `o` holds the sizes: leaf length, leaf step along the branch, and the longest reach.
 */
function branch(b, x, y, side, o, seed, delay) {
  const n = Math.max(1, b.leaves.length);
  const len = Math.min(o.reach, o.base + n * o.step / 2);
  const rise = len * (0.32 + jitter(seed + "r") * 0.12) * (o.flat ?? 1);
  const p0 = [x, y], p3 = [x + side * len, y - rise];
  const p1 = [x + side * len * 0.35, y + o.leaf * 0.25], p2 = [p3[0] - side * len * 0.2, p3[1] + rise * 0.35];
  const g = el("g", { class: "vine-branch" + (b.state && b.state !== "none" ? " lit" : ""), style: delay != null ? `--d:${r2(delay)}s` : null });
  g.append(el("path", { class: "vine-twig", d: `M${r2(p0[0])} ${r2(p0[1])}C${r2(p1[0])} ${r2(p1[1])} ${r2(p2[0])} ${r2(p2[1])} ${r2(p3[0])} ${r2(p3[1])}`, "stroke-width": r2(o.twig), pathLength: 1 }));
  g.append(el("path", { class: "vine-twig vine-curl", d: curl(p3[0], p3[1], side, o.leaf * 0.55), "stroke-width": r2(o.twig * 0.7), pathLength: 1 }));
  b.leaves.forEach((lf, j) => {
    const t = (o.from ?? 0.16) + (0.96 - (o.from ?? 0.16)) * (j + 0.5) / n;
    const p = bez(p0, p1, p2, p3, t);
    const up = j % 2 ? 1 : -1;
    const ang = p.a + up * (38 + jitter(seed + j) * 18);
    const L = o.leaf * (0.82 + (jitter(seed + "s" + j) + 0.5) * 0.3);
    const st = lf.state ?? "none";
    const leaf = el("g", { class: `vine-leaf ${st}`, transform: `translate(${r2(p.x)} ${r2(p.y)}) rotate(${r2(ang)})`, "data-line": lf.line, "data-node": lf.node ?? "" });
    leaf.append(el("path", { d: leafPath(L) }), st !== "none" ? el("path", { class: "vine-vein", d: vein(L), "stroke-width": r2(o.twig * 0.45) }) : null);
    g.append(leaf);
  });
  const blooming = b.state === "use" || (b.paper && b.leaves.some((l) => l.state === "use"));
  if (blooming) g.append(bloom(p3[0] + side * o.leaf * 0.2, p3[1] - o.leaf * 0.5, o.leaf * 0.75));
  return g;
}

/** A gently swaying stem from the ground up to `top`, as a path. */
function stem(x0, ground, top, sway, seed) {
  const pts = [];
  const ph = jitter(seed) * 6, per = 26 + jitter(seed + "p") * 8;
  for (let y = ground; y >= top; y -= 3) pts.push([x0 + Math.sin((ground - y) / per + ph) * sway, y]);
  pts.push([x0 + Math.sin((ground - top) / per + ph) * sway, top]);
  return { d: "M" + pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join("L"), at: (y) => x0 + Math.sin((ground - y) / per + ph) * sway };
}

let grownOnce = false;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The whole garden on one screen: every vine side by side on a strip of earth, under the sky.
 * `onVine(id)` is called when a vine is tapped. `height` is the tallest vine's height in a 400-wide box.
 */
export function garden(vines, { onVine, height = 430, label = "The whole syllabus as a creeper garden" } = {}) {
  const W = 400, N = vines.length, slot = W / N, top = 26, groundH = 36;
  const sizes = vines.map((v) => v.branches.reduce((s, b) => s + 7 + b.leaves.length * 0.8, 0));
  const unit = height / Math.max(...sizes, 1);
  const ground = top + height + 10, H = ground + groundH;
  const animate = !grownOnce && !reduced();
  grownOnce = true;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "vine-garden" + (animate ? " grow" : ""), role: "img", "aria-label": label });
  // Sky: a few still stars (they show at night) and a soft horizon.
  for (let i = 0; i < 26; i++) svg.append(el("circle", { class: "vine-star", cx: r2(W / 2 + jitter("st" + i) * W), cy: r2(top + (jitter("sy" + i) + 0.5) * height * 0.8), r: r2(0.5 + (jitter("sr" + i) + 0.5) * 0.7) }));
  svg.append(el("rect", { class: "vine-ground", x: 0, y: ground - 2, width: W, height: groundH + 2 }));
  svg.append(el("path", { class: "vine-horizon", d: `M0 ${ground - 2}Q${W / 2} ${ground - 9} ${W} ${ground - 2}` }));
  vines.forEach((v, i) => {
    const x0 = slot * (i + 0.5);
    const g = el("g", { class: "vine" + (v.seedling ? " seedling" : ""), "data-vine": v.id, tabindex: 0, role: "button", "aria-label": `${v.name}: open its creeper` });
    g.append(el("rect", { class: "vine-hit", x: r2(slot * i), y: 0, width: r2(slot), height: H }));
    if (v.seedling) {
      const s = el("g", { transform: `translate(${r2(x0)} ${ground - 2})` });
      s.append(el("path", { class: "vine-stem", d: "M0 0C1 -6 -1 -10 0 -16", "stroke-width": 1.4, pathLength: 1 }));
      s.append(el("g", { class: "vine-leaf none", transform: "translate(0 -12) rotate(-140)" }, el("path", { d: leafPath(6) })));
      s.append(el("g", { class: "vine-leaf none", transform: "translate(0 -15) rotate(-40)" }, el("path", { d: leafPath(6) })));
      g.append(s);
    } else {
      const total = sizes[i] * unit;
      const st = stem(x0, ground - 2, ground - 2 - total - 6, Math.min(5, slot * 0.1), v.id);
      // A thinner second stem twines round the first, the way a creeper climbs.
      const tw = stem(x0, ground - 2, ground - 2 - total * 0.92, Math.min(5, slot * 0.1) + 3, v.id + "t");
      g.append(el("path", { class: "vine-stem vine-twine", d: tw.d, "stroke-width": 1.3, pathLength: 1 }));
      g.append(el("path", { class: "vine-stem", d: st.d, "stroke-width": 2.8, pathLength: 1 }));
      let y = ground - 8;
      const o = { leaf: 13, step: 5, base: 10, reach: slot * 1.15, twig: 1.3, flat: 1.6, from: 0.06 };
      v.branches.forEach((b, k) => {
        y -= (7 + b.leaves.length * 0.8) * unit * 0.5;
        const side = (k + (jitter(v.id) > 0 ? 1 : 0)) % 2 ? -1 : 1;
        g.append(branch(b, st.at(y), y, side, o, v.id + k, animate ? 0.25 + ((ground - y) / height) * 0.9 : null));
        y -= (7 + b.leaves.length * 0.8) * unit * 0.5;
      });
    }
    g.append(el("text", { class: "vine-label", x: r2(x0), y: ground + 20, "text-anchor": "middle" }, document.createTextNode(v.label)));
    const go = () => onVine?.(v.id);
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    svg.append(g);
  });
  return svg;
}

/**
 * One topic as a full-width branch, sprouting from the stem on the left, for the paper's own page.
 * Tapping a leaf calls `onLeaf(index)`.
 */
export function topicBranch(b, seed, { onLeaf } = {}) {
  const n = Math.max(1, b.leaves.length);
  const o = { leaf: Math.min(26, 300 / n + 6), step: Math.min(40, 330 / n * 2), base: 80, reach: 352, twig: 2.2, flat: 0.28 };
  const len = Math.min(o.reach, o.base + n * o.step / 2);
  const W = 400, H = Math.round(len * 0.44 * o.flat + o.leaf * 1.6 + 14);
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "vine-topic", role: "img", "aria-label": `${b.label}: ${n} line${n === 1 ? "" : "s"}` });
  const g = branch(b, 14, H - o.leaf * 0.7 - 4, 1, o, seed, null);
  svg.append(g);
  g.querySelectorAll(".vine-leaf").forEach((leaf, i) => {
    leaf.setAttribute("tabindex", "0");
    leaf.setAttribute("role", "button");
    leaf.setAttribute("aria-label", b.leaves[i].line);
    const go = () => onLeaf?.(i);
    leaf.addEventListener("click", go);
    leaf.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  return svg;
}

/** The key, drawn with the same leaves. */
export function legend() {
  const wrap = document.createElement("div");
  wrap.className = "vine-key";
  for (const [st, name] of [["none", "Not started"], ["met", "Met"], ["recall", "Can recall"], ["use", "Can use"]]) {
    const svg = el("svg", { viewBox: "-2 -9 22 18", width: 22, height: 18, "aria-hidden": "true" },
      el("g", { class: `vine-leaf ${st}`, transform: "rotate(-20)" }, el("path", { d: leafPath(16) })),
      st === "use" ? bloom(15, -4, 6) : null);
    const span = document.createElement("span");
    span.append(svg, " " + name);
    wrap.append(span);
  }
  return wrap;
}
