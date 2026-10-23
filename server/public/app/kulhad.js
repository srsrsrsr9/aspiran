// Chotu: a small terracotta kulhad with two dot eyes. No mouth, no arms. The steam shows the tone.
// Always shown with the "Chotu · AI" label next to it.

const STEAM = {
  warm: ["M22 14 q-4 -6 0 -11", "M32 13 q4 -6 0 -12", "M42 14 q-4 -6 0 -11"],
  calm: ["M27 14 q-3 -5 0 -10", "M37 14 q3 -5 0 -10"],
  night: ["M32 14 q-2 -4 0 -8"],
  thinking: ["M24 14 q-4 -6 0 -11", "M32 13 q4 -6 0 -12", "M40 14 q-4 -6 0 -11"],
  quiet: [],
};

/** Returns an <svg> element. tone: warm | calm | night | thinking | quiet. */
/** [color] tints the cup (the pod friends each have their own); the default is Chotu's terracotta. */
export function kulhad(tone = "calm", size = 48, color = null) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("width", size); svg.setAttribute("height", size);
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("kulhad", "tone-" + tone);
  const el = (name, attrs) => { const e = document.createElementNS(ns, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); svg.append(e); return e; };
  for (const d of STEAM[tone] ?? STEAM.calm) el("path", { d, fill: "none", stroke: "var(--steam, #B9AA9C)", "stroke-width": 2.4, "stroke-linecap": "round", class: "steam", opacity: tone === "night" ? 0.45 : 0.8 });
  // The cup: wider at the rim, narrow at the base, as a kulhad is.
  el("path", { d: "M12 20 L52 20 L46 56 Q32 60 18 56 Z", fill: color ?? "#B5562B" });
  el("path", { d: "M12 20 L52 20 L51 25 L13 25 Z", fill: color ?? "#9A4321", opacity: color ? 0.8 : 1 });
  el("ellipse", { cx: 32, cy: 20, rx: 20, ry: 3.2, fill: "#7A3418" });
  el("path", { d: "M18 30 Q20 44 22 52", fill: "none", stroke: "#CF7448", "stroke-width": 2, "stroke-linecap": "round", opacity: 0.6 });
  el("circle", { cx: 26, cy: 36, r: 2.6, fill: "#2A1A10" });
  el("circle", { cx: 38, cy: 36, r: 2.6, fill: "#2A1A10" });
  return svg;
}

/** The tone for a moment: quiet in care or result mode, night after 23:30, otherwise warm in the day and calm in the evening. */
export function toneNow({ care = false, result = false, thinking = false } = {}) {
  if (care || result) return "quiet";
  if (thinking) return "thinking";
  const d = new Date(), hm = d.getHours() * 60 + d.getMinutes();
  if (hm >= 23 * 60 + 30 || hm < 6 * 60) return "night";
  return hm < 18 * 60 ? "warm" : "calm";
}
