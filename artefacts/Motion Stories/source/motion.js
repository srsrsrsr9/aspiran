// UPSC Pods motion engine (upsc-pods/motion@1).
// A story is a list of beats; each beat names a shot from the library below, a line of voice-over and some data.
// Timing comes from timing.json (ElevenLabs word timestamps), so every move can be cued to a spoken word.
// Everything is a pure function of time: MOTION.seek(t) draws the frame at t seconds. The renderer calls it
// frame by frame; the preview calls it from requestAnimationFrame. No CSS transitions or animations are used.
(function () {
  const W = 1080, H = 1920, T = 0.42; // T: transition length between shots
  const C = { paper: "#FFF8F3", surface: "#FFFDFB", ink: "#201B17", muted: "#6B5E54", line: "#EADDD2", chai: "#8D4F01",
    chaiSoft: "#FFDCC0", teal: "#14696B", tealSoft: "#D5ECEB", mari: "#C98A0B", grey: "#8A8079", rat: "#7D736C", ratDark: "#5E554F", pink: "#E7A9A0" };

  // ---- maths -------------------------------------------------------------------------------------------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    lin: p => p,
    in: p => p * p * p,
    out: p => 1 - Math.pow(1 - p, 3),
    io: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    spring: p => (p >= 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(11 * p))
  };
  // tween(t, t0, dur, from, to, ease): value at t of a move that starts at t0
  const tw = (t, t0, d, a, b, e = E.io) => lerp(a, b, e(clamp((t - t0) / d)));
  // kf(t, [[t, v, ease], ...]): piecewise keyframes; ease applies to the segment ending at that key
  const kf = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1, e = E.io] = keys[i];
      return lerp(v0, v1, e((t - t0) / (t1 - t0)));
    }
    return keys[keys.length - 1][1];
  };
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };

  // ---- dom helpers -------------------------------------------------------------------------------------
  const el = (tag, css = "", html = "", parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css;
    if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  const put = (e, { x = 0, y = 0, s = 1, r = 0, o = 1, sx = 1, blur = 0 } = {}) => {
    e.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(${s * sx},${s})`;
    e.style.opacity = o; e.style.filter = blur > 0.3 ? `blur(${blur}px)` : "";
  };
  const abs = "position:absolute;left:0;top:0;transform-origin:50% 50%;will-change:transform,opacity;";
  // No quotes in these: they go inside style="..." attributes.
  const SERIF = `Martel,Georgia,serif`, SANS = `Mukta,Inter,system-ui,sans-serif`;

  // ---- sprites -----------------------------------------------------------------------------------------
  // Side-view rat facing right, 240x120 box. Legs are separate groups so a run cycle can swing them.
  const ratSVG = (tail = true, fill = C.rat) => `<svg width="240" height="120" viewBox="-40 0 240 120" style="overflow:visible">
    ${tail ? `<path class="tail" d="M42 72 C 12 70, 2 98, -34 86" fill="none" stroke="${C.pink}" stroke-width="7" stroke-linecap="round"/>` : `<circle cx="38" cy="70" r="5" fill="${C.pink}"/>`}
    <g class="legB"><rect x="66" y="84" width="13" height="24" rx="6" fill="${C.ratDark}"/><rect x="118" y="84" width="13" height="24" rx="6" fill="${C.ratDark}"/></g>
    <ellipse cx="96" cy="64" rx="60" ry="34" fill="${fill}"/>
    <path d="M136 38 Q 182 48 194 68 Q 172 82 136 84 Z" fill="${fill}"/>
    <g class="legA"><rect x="80" y="86" width="13" height="24" rx="6" fill="${fill}"/><rect x="132" y="84" width="13" height="24" rx="6" fill="${fill}"/></g>
    <circle cx="140" cy="34" r="15" fill="${C.chaiSoft}" stroke="${fill}" stroke-width="6"/>
    <circle cx="166" cy="58" r="4.5" fill="${C.ink}"/><circle cx="194" cy="68" r="5" fill="${C.pink}"/>
    <path d="M186 72 l22 -6 M186 74 l22 4" stroke="${C.ink}" stroke-width="2" opacity=".5" stroke-linecap="round"/></svg>`;
  function rat(parent, { tail = true, scale = 1, flip = false } = {}) {
    const e = el("div", abs + "width:240px;height:120px;transform-origin:50% 100%;", ratSVG(tail), parent);
    const legA = e.querySelector(".legA"), legB = e.querySelector(".legB");
    return {
      e,
      draw({ x, y, s = 1, o = 1, run = null, r = 0 }) {
        // run: phase in cycles; drives legs and a small body bob
        let bob = 0;
        if (run != null) { const a = Math.sin(run * Math.PI * 2); bob = -Math.abs(a) * 8;
          legA.setAttribute("transform", `rotate(${a * 28} 100 86)`); legB.setAttribute("transform", `rotate(${-a * 28} 100 86)`); }
        put(e, { x: x - 120, y: y - 120 + bob * s * scale, s: s * scale, o, r, sx: flip ? -1 : 1 });
      }
    };
  }
  const coinSVG = (label = "1¢") => `<svg width="160" height="160" viewBox="0 0 160 160"><circle cx="80" cy="80" r="74" fill="${C.mari}"/>
    <circle cx="80" cy="80" r="58" fill="none" stroke="#FFE7A8" stroke-width="5" stroke-dasharray="6 9"/>
    <text x="80" y="98" text-anchor="middle" font-family="Martel,serif" font-weight="800" font-size="50" fill="#FFF8F3">${label}</text></svg>`;

  // A line drawing that draws on: pass an SVG with paths that have class "draw".
  function drawable(parent, svg, css) {
    const e = el("div", abs + css, svg, parent);
    const paths = [...e.querySelectorAll(".draw")].map(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; return [p, L]; });
    return { e, draw(p) { paths.forEach(([q, L]) => (q.style.strokeDashoffset = L * (1 - clamp(p)))); } };
  }
  const chip = (parent, text, bg, fg, size = 46) =>
    el("div", abs + `white-space:nowrap;font:600 ${size}px ${SANS};padding:${size * 0.32}px ${size * 0.7}px;border-radius:999px;background:${bg};color:${fg};box-shadow:0 10px 30px rgba(32,27,23,.12)`, text, parent);

  // ---- shot library ------------------------------------------------------------------------------------
  // Each shot: build(layer, cam, beat, cue) -> { draw(lt), sfx: [[localTime, id, gain]] , bg, enter }
  // layer: full-frame div (HUD lives here, not moved by the camera). cam: world div moved by camera().
  // cue(word): local start time of the first spoken word that begins with `word` (falls back to 0).
  const camera = (cam, { x = 540, y = 960, s = 1, r = 0 }) => {
    // Point (x, y) of the world sits at the frame centre, zoomed by s.
    cam.style.transform = `translate(${W / 2}px,${H / 2}px) rotate(${r}deg) scale(${s}) translate(${-x}px,${-y}px)`;
  };
  const SHOTS = {};

  SHOTS.hook = (layer, cam, b, cue, dur) => {
    const d = b.data, tMore = cue(d.accent || "more"); let strike;
    const lines = d.lines.map((txt, i) => {
      const row = el("div", abs + `width:${W}px;top:${300 + i * 170}px;text-align:center;font:800 104px/1.15 ${SERIF};color:${C.ink};letter-spacing:-1px`, "", layer);
      const box = el("div", "display:inline-block;position:relative", "", row);
      if (!i) strike = el("div", `position:absolute;left:0;right:0;top:52%;height:12px;border-radius:6px;background:${C.chai};transform-origin:0 50%;transform:scaleX(0)`, "", box);
      return [...txt.split(" ")].map(w => el("span", `display:inline-block;margin:0 16px;will-change:transform;${w.toLowerCase().startsWith(d.accent) ? `color:${C.chai}` : ""}`, w, box));
    });
    const hero = rat(cam, { scale: 1.6 });
    const R = rng(7), crowd = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 + 0.3;
      return { r: rat(cam, { scale: 0.75 + R() * 0.35, flip: R() > 0.5 }), x: 540 + Math.cos(a) * (300 + R() * 90), y: 1080 + Math.sin(a) * (210 + R() * 60), d: R() * 0.35 }; });
    return {
      sfx: [[0.15, "whoosh", 0.5], [tMore, "snap", 0.6], [tMore + 0.18, "domino", 0.5]],
      draw(t) {
        camera(cam, { x: 540, y: 1000, s: tw(t, 0, dur, 1, 1.07, E.lin) });
        lines[0].forEach((w, i) => put(w, { y: tw(t, 0.1 + i * 0.12, 0.5, 60, 0, E.back), o: tw(t, 0.1 + i * 0.12, 0.3, 0, 1) }));
        lines[1].forEach((w, i) => put(w, { y: tw(t, tMore - 0.35 + i * 0.12, 0.5, 60, 0, E.back), o: tw(t, tMore - 0.35 + i * 0.12, 0.3, 0, 1) }));
        strike.style.transform = `scaleX(${tw(t, tMore - 0.5, 0.35, 0, 1, E.out)})`;
        hero.draw({ x: 540, y: 1100, s: tw(t, 0.35, 0.6, 0, 1, E.back), r: Math.sin(t * 5) * 2 });
        crowd.forEach(c => { const p = clamp((t - tMore - c.d) / 0.55);
          c.r.draw({ x: lerp(540, c.x, E.back(p)), y: lerp(1080, c.y, E.back(p)), s: E.out(p), o: p > 0 ? 1 : 0, run: t * 2.2 + c.d * 3 }); });
      }
    };
  };

  SHOTS.pin = (layer, cam, b, cue, dur) => {
    const d = b.data, P = { x: 700, y: 760 };
    // Abstract dot-map: a globe of dots, denser over two land masses.
    const R = rng(11); let dots = "";
    for (let i = 0; i < 900; i++) { const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 640, x = 540 + Math.cos(a) * rr, y = 900 + Math.sin(a) * rr;
      const land = Math.hypot(x - 690, y - 720) < 260 || Math.hypot(x - 380, y - 1080) < 210 || Math.hypot(x - 780, y - 1180) < 120;
      if (land) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(5 + R() * 4).toFixed(1)}" fill="${C.teal}" opacity="${(0.35 + R() * 0.45).toFixed(2)}"/>`; }
    el("div", abs, `<svg width="1080" height="1920"><circle cx="540" cy="900" r="660" fill="${C.tealSoft}"/>
      <circle cx="540" cy="900" r="660" fill="none" stroke="${C.teal}" stroke-opacity=".25" stroke-width="3"/>
      <ellipse cx="540" cy="900" rx="660" ry="230" fill="none" stroke="${C.teal}" stroke-opacity=".15" stroke-width="3"/>
      <ellipse cx="540" cy="900" rx="250" ry="660" fill="none" stroke="${C.teal}" stroke-opacity=".15" stroke-width="3"/>${dots}</svg>`, cam);
    const ring = el("div", abs + `width:120px;height:120px;border-radius:50%;border:5px solid ${C.chai}`, "", cam);
    const pin = el("div", abs + "width:90px;height:120px;transform-origin:50% 100%", `<svg width="90" height="120" viewBox="0 0 90 120"><path d="M45 118 C 20 80 4 62 4 42 A 41 41 0 1 1 86 42 C 86 62 70 80 45 118 Z" fill="${C.chai}"/><circle cx="45" cy="42" r="15" fill="${C.paper}"/></svg>`, cam);
    const card = el("div", abs + `top:250px;left:90px;font:800 130px/1 ${SERIF};color:${C.ink}`, `${d.place}<div style="font:600 64px ${SANS};color:${C.chai};margin-top:22px;letter-spacing:4px">${d.year}</div>`, layer);
    const chips = d.chips.map((c, i) => ({ e: chip(layer, c.text, i ? C.chai : C.ink, C.paper, 50), t: cue(c.at), y: 1180 + i * 130 }));
    const tPin = 0.55;
    return {
      sfx: [[tPin + 0.25, "tap", 0.6], ...chips.map(c => [c.t, "nudge", 0.5])],
      draw(t) {
        const s = kf(t, [[0, 0.62], [1.9, 2.3, E.io], [dur, 2.45, E.lin]]);
        const fx = kf(t, [[0, 540], [1.9, P.x]]), fy = kf(t, [[0, 900], [1.9, P.y + 40]]);
        camera(cam, { x: fx, y: fy, s, r: tw(t, 0, dur, -4, 0) });
        put(pin, { x: P.x - 45, y: P.y - 120 + tw(t, tPin, 0.55, -500, 0, E.back), o: t > tPin ? 1 : 0 });
        const rp = ((t - tPin - 0.3) % 1.4) / 1.4; put(ring, { x: P.x - 60, y: P.y - 60, s: t > tPin + 0.3 ? 0.4 + rp * 1.6 : 0, o: 1 - rp });
        put(card, { x: tw(t, 0.25, 0.6, -60, 0, E.out), o: tw(t, 0.25, 0.4, 0, 1) });
        chips.forEach(c => put(c.e, { x: 90 + tw(t, c.t - 0.1, 0.5, -500, 0, E.back), y: c.y }));
      }
    };
  };

  SHOTS.exchange = (layer, cam, b, cue, dur) => {
    const d = b.data, tBring = cue("bring"), tTail = cue(d.at || "tail");
    // World is 1900 wide: the tail on the left, the bounty office on the right.
    el("div", abs + `top:1240px;left:-400px;width:2900px;height:10px;background:${C.line}`, "", cam);
    const booth = el("div", abs + "width:520px;height:700px", `<svg width="520" height="700" viewBox="0 0 520 700">
      <rect x="20" y="150" width="480" height="550" rx="18" fill="${C.surface}" stroke="${C.ink}" stroke-width="8"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 65} 150 L${i * 65 + 65} 150 L${i * 65 + 65} 210 Q${i * 65 + 32} 250 ${i * 65} 210 Z" fill="${i % 2 ? C.paper : C.chai}" stroke="${C.ink}" stroke-width="6"/>`).join("")}
      <rect x="0" y="90" width="520" height="70" rx="14" fill="${C.ink}"/>
      <rect x="110" y="300" width="300" height="200" rx="14" fill="${C.tealSoft}" stroke="${C.ink}" stroke-width="8"/>
      <rect x="80" y="500" width="360" height="26" rx="8" fill="${C.ink}"/></svg>
      <div style="position:absolute;top:100px;width:520px;text-align:center;font:700 40px ${SANS};color:${C.paper};letter-spacing:5px;text-transform:uppercase">${d.office}</div>`, cam);
    put(booth, { x: 1180, y: 540 });
    const tail = drawable(cam, `<svg width="760" height="300" viewBox="0 0 760 300" style="overflow:visible"><path class="draw" d="M30 200 C 180 40, 330 300, 470 150 S 700 120, 740 60" fill="none" stroke="${C.pink}" stroke-width="30" stroke-linecap="round"/></svg>`, "width:760px;height:300px");
    const coin = el("div", abs + "width:160px;height:160px", coinSVG(), cam);
    const kicker = el("div", abs + `top:300px;left:90px;font:800 104px/1.1 ${SERIF};color:${C.ink}`, `The proof?<div style="font:600 54px ${SANS};color:${C.muted};margin-top:14px">Not the rat. Just its tail.</div>`, layer);
    return {
      sfx: [[0.1, "scrape", 0.45], [tBring, "whoosh", 0.45], [tTail + 0.25, "chime", 0.5]],
      draw(t) {
        camera(cam, { x: kf(t, [[0, 640], [tBring, 760, E.lin], [tTail + 0.2, 1380]]), y: 980, s: kf(t, [[0, 1.0], [tTail + 0.2, 0.92]]) });
        tail.draw(tw(t, 0.05, 0.9, 0, 1, E.out));
        const p = clamp((t - tBring) / (tTail + 0.15 - tBring));
        put(tail.e, { x: lerp(100, 1100, E.io(p)), y: 640 - Math.sin(p * Math.PI) * 160, s: lerp(1, 0.38, E.io(p)), r: lerp(0, -12, p), o: p < 1 ? 1 : 0 });
        const q = clamp((t - tTail - 0.2) / 0.7);
        put(coin, { x: 1360, y: lerp(880, 520, E.back(q)), s: q > 0 ? 1 : 0, sx: Math.cos(q * Math.PI * 4), o: q > 0 ? 1 : 0 });
        put(kicker, { y: tw(t, 0, 0.5, 40, 0, E.out), o: tw(t, 0, 0.4, 0, 1) });
      }
    };
  };

  SHOTS.run = (layer, cam, b, cue, dur) => {
    const d = b.data, tLabel = cue(d.at || "without");
    const R = rng(23);
    const skyline = (n, hMin, hMax, col, y0) => { let s = ""; let x = -200;
      for (let i = 0; i < n; i++) { const w = 120 + R() * 160, h = hMin + R() * (hMax - hMin);
        s += `<rect x="${x.toFixed(0)}" y="${(y0 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" rx="10" fill="${col}"/>`;
        if (R() > 0.5) s += `<path d="M${x.toFixed(0)} ${(y0 - h).toFixed(0)} l${(w / 2).toFixed(0)} -60 l${(w / 2).toFixed(0)} 60 Z" fill="${col}"/>`;
        x += w + 20 + R() * 40; }
      return `<svg width="4200" height="1920" style="overflow:visible">${s}</svg>`; };
    const far = el("div", abs, skyline(22, 300, 640, C.tealSoft, 1240), cam);
    const mid = el("div", abs, skyline(20, 160, 420, C.line, 1240), cam);
    el("div", abs + `top:1240px;left:-400px;width:5200px;height:700px;background:${C.surface}`, "", cam);
    const sun = el("div", abs + `width:220px;height:220px;border-radius:50%;background:${C.chaiSoft}`, "", cam);
    const rats = Array.from({ length: 6 }, (_, i) => ({ r: rat(cam, { tail: false, scale: 0.9 + R() * 0.4 }), lane: 1240 + (i % 3) * 18, x0: -200 - i * 230 - R() * 80, v: 560 + R() * 120, ph: R() }));
    const tag = chip(layer, d.label, C.chai, C.paper, 56);
    const arrow = el("div", abs + "width:160px;height:140px", `<svg width="160" height="140" viewBox="0 0 160 140"><path d="M20 10 C 30 80, 80 110, 130 120" fill="none" stroke="${C.chai}" stroke-width="8" stroke-linecap="round"/><path d="M104 104 L134 122 L112 140" fill="none" stroke="${C.chai}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`, layer);
    return {
      sfx: [[0.1, "whoosh", 0.4], [tLabel, "tap", 0.55]],
      draw(t) {
        const camX = 540 + t * 470; camera(cam, { x: camX, y: 1000, s: 1.08 });
        put(far, { x: camX * 0.55 - 300 }); put(mid, { x: camX * 0.25 - 200 }); put(sun, { x: camX * 0.9 + 40, y: 420 });
        let lead = null;
        rats.forEach(k => { const x = k.x0 + t * (k.v + 470) + 300; k.r.draw({ x, y: k.lane, s: 1, run: t * 3.2 + k.ph }); if (!lead || x > lead.x) lead = { x, y: k.lane }; });
        // Label rides with the leading rat, pointing at where its tail should be.
        const sx = (lead.x - camX) * 1.08 + W / 2, sy = (lead.y - 1000) * 1.08 + H / 2;
        const p = clamp((t - tLabel) / 0.45);
        put(tag, { x: sx - 380, y: sy - 380 + (1 - E.back(p)) * 60, o: p > 0 ? 1 : 0, s: lerp(0.6, 1, E.back(p)) });
        put(arrow, { x: sx - 250, y: sy - 260, o: tw(t, tLabel + 0.15, 0.3, 0, 1) });
      }
    };
  };

  SHOTS.multiply = (layer, cam, b, cue, dur) => {
    const d = b.data, tFence = cue(d.fenceAt || "farming");
    const N = 64, cols = 8, gx = 120, gy = 100, ox = 540 - ((cols - 1) * gx) / 2, oy = 760;
    const R = rng(5), rats = Array.from({ length: N }, (_, i) => ({ r: rat(cam, { scale: 0.42, flip: R() > 0.5 }),
      x: ox + (i % cols) * gx + (R() - 0.5) * 30, y: oy + Math.floor(i / cols) * gy + (R() - 0.5) * 20, ph: R() }));
    const fence = drawable(cam, `<svg width="1080" height="1100" viewBox="0 0 1080 1100" style="overflow:visible">
      <rect class="draw" x="60" y="60" width="960" height="900" rx="24" fill="none" stroke="${C.chai}" stroke-width="14" stroke-dasharray="1"/>
      ${Array.from({ length: 9 }, (_, i) => `<path class="draw" d="M${60 + i * 120} 40 v60 M${60 + i * 120} 920 v60" stroke="${C.chai}" stroke-width="18" stroke-linecap="round"/>`).join("")}</svg>`, "width:1080px;height:1100px");
    put(fence.e, { y: 560 });
    const counter = el("div", abs + `top:230px;width:${W}px;text-align:center;font:800 190px/1 ${SERIF};color:${C.chai}`, "1", layer);
    const unit = el("div", abs + `top:440px;width:${W}px;text-align:center;font:600 54px ${SANS};color:${C.muted};letter-spacing:6px;text-transform:uppercase`, d.counterLabel, layer);
    const steps = 7, t0 = 0.3, t1 = Math.max(t0 + 1.5, tFence - 0.2), at = k => lerp(t0, t1, k / (steps - 1));
    const born = i => at(i === 0 ? 0 : Math.floor(Math.log2(i)) + 1);
    return {
      sfx: [...Array.from({ length: steps - 1 }, (_, k) => [at(k + 1), "tick", 0.55]), [tFence, "stamp", 0.45]],
      draw(t) {
        const shown = Math.pow(2, Math.floor(clamp((t - t0) / (t1 - t0)) * (steps - 1) + 1e-6));
        counter.textContent = t < t0 ? "1" : String(shown);
        put(counter, { s: 1 + 0.12 * Math.max(0, 1 - ((t - t0) % ((t1 - t0) / (steps - 1))) * 6) });
        camera(cam, { x: kf(t, [[0, rats[0].x], [t1, 540]]), y: kf(t, [[0, rats[0].y - 40], [t1, 1020]]), s: kf(t, [[0, 3.0], [t1, 0.98, E.out], [dur, 0.94, E.lin]]) });
        rats.forEach((k, i) => { const p = clamp((t - born(i) - (i % 5) * 0.03) / 0.4);
          k.r.draw({ x: k.x, y: k.y, s: E.back(p), o: p > 0 ? 1 : 0, run: Math.sin(t * 2 + k.ph * 6) * 0.15 + k.ph }); });
        fence.draw(tw(t, tFence - 0.1, 0.7, 0, 1, E.out));
        put(unit, { o: 1 });
      }
    };
  };

  SHOTS.named = (layer, cam, b, cue, dur) => {
    const d = b.data, tName = cue(d.at || "Cobra"), tLine = [cue("A"), cue("what"), cue("not")];
    layer.style.background = C.chai;
    const cobra = drawable(layer, `<svg width="420" height="420" viewBox="0 0 420 420" style="overflow:visible">
      <path class="draw" d="M70 380 C 260 400, 360 330, 250 270 S 80 200, 190 140 S 300 70, 250 40" fill="none" stroke="${C.mari}" stroke-width="26" stroke-linecap="round"/>
      <circle class="eye" cx="252" cy="34" r="0" fill="${C.paper}"/></svg>`, "width:420px;height:420px");
    put(cobra.e, { x: 330, y: 220 });
    const eye = cobra.e.querySelector(".eye");
    const kicker = el("div", abs + `top:700px;width:${W}px;text-align:center;font:700 44px ${SANS};color:${C.chaiSoft};letter-spacing:12px;text-transform:uppercase`, d.kicker, layer);
    const name = el("div", abs + `top:770px;width:${W}px;text-align:center;font:800 150px/1.1 ${SERIF};color:${C.paper}`, d.name, layer);
    const rows = d.line.map((txt, i) => el("div", abs + `top:${1040 + i * 92}px;width:${W}px;text-align:center;font:500 66px ${SANS};color:${C.paper}`,
      txt.replace(/(pays)/, `<b style="color:#FFD27A">$1</b>`).replace(/(hopes)/, `<b style="color:#FFD27A">$1</b>`), layer));
    return {
      enter: "circle",
      sfx: [[tName + 0.05, "stamp", 0.7], [tLine[0], "page", 0.35]],
      draw(t) {
        cobra.draw(tw(t, 0.15, 1.1, 0, 1, E.out)); eye.setAttribute("r", tw(t, 1.1, 0.3, 0, 9, E.back));
        put(cobra.e, { x: 330, y: 220 + Math.sin(t * 2.2) * 8 });
        put(kicker, { o: tw(t, 0.4, 0.4, 0, 1), y: tw(t, 0.4, 0.5, 20, 0, E.out) });
        const p = clamp((t - tName) / 0.5), shake = p > 0 && p < 1 ? Math.sin(p * 40) * (1 - p) * 10 : 0;
        put(name, { s: p > 0 ? lerp(1.7, 1, E.back(p)) : 0, r: lerp(-6, -2, p) + shake * 0.2, x: shake, o: p > 0 ? 1 : 0 });
        rows.forEach((r, i) => put(r, { y: tw(t, tLine[i] - 0.1, 0.5, 40, 0, E.out), o: tw(t, tLine[i] - 0.1, 0.35, 0, 1) }));
      }
    };
  };

  SHOTS.outro = (layer, cam, b, cue, dur) => {
    const d = b.data, tc = [cue("Use"), cue("G-S-four"), cue("essay")], tBrand = cue("More");
    const kicker = el("div", abs + `top:330px;left:90px;font:800 104px ${SERIF};color:${C.ink}`, "Use it in", layer);
    const chips = d.chips.map((c, i) => chip(layer, c, [C.tealSoft, C.chaiSoft, C.surface][i], [C.teal, C.chai, C.ink][i], 54));
    const brand = el("div", abs + `top:1090px;left:90px;width:900px;padding:44px 50px;border-radius:40px;background:${C.ink};color:${C.paper}`,
      `<div style="font:800 82px/1.1 ${SERIF}">${d.brand}</div><div style="font:500 46px ${SANS};color:${C.chaiSoft};margin-top:12px">${d.series} · new every week</div>`, layer);
    const mini = rat(layer, { scale: 0.7 });
    return {
      sfx: tc.map(t => [t, "tap", 0.45]),
      draw(t) {
        put(kicker, { o: tw(t, 0, 0.4, 0, 1), y: tw(t, 0, 0.5, 30, 0, E.out) });
        chips.forEach((c, i) => put(c, { x: 90 + tw(t, tc[i] - 0.05, 0.55, 700, 0, E.back), y: 520 + i * 150, o: tw(t, tc[i] - 0.05, 0.2, 0, 1) }));
        put(brand, { y: tw(t, tBrand - 0.1, 0.6, 120, 0, E.back), o: tw(t, tBrand - 0.1, 0.3, 0, 1) });
        const q = clamp((t - tBrand - 0.4) / 1.6);
        mini.draw({ x: lerp(-150, 880, E.io(q)), y: 1080, s: 1, run: t * 3, o: q > 0 && q < 1 ? 1 : 0 });
      }
    };
  };

  // ---- captions (karaoke style, chunks of up to 5 words) ---------------------------------------------
  function captions(root) {
    const box = el("div", abs + `top:1560px;left:70px;width:940px;display:flex;justify-content:center;transform-origin:50% 50%`, "", root);
    const inner = el("div", `max-width:940px;text-align:center;padding:22px 36px;border-radius:30px;background:rgba(32,27,23,.84);font:700 60px/1.3 ${SANS};color:${C.paper}`, "", box);
    let shownKey = "";
    return (chunk, t) => {
      if (!chunk) { box.style.opacity = 0; return; }
      const key = chunk.key;
      if (key !== shownKey) { inner.innerHTML = chunk.words.map(w => `<span>${w.d}</span>`).join(" "); shownKey = key; }
      const spans = inner.children;
      chunk.words.forEach((w, i) => { spans[i].style.color = t >= w.t0 ? (t < w.t1 + 0.05 ? "#FFD27A" : C.paper) : "rgba(255,248,243,.45)"; });
      put(box, { o: 1, s: tw(t, chunk.t0, 0.25, 0.9, 1, E.back), y: tw(t, chunk.t0, 0.25, 16, 0, E.out) });
    };
  }

  // ---- timeline ----------------------------------------------------------------------------------------
  // opts: { captions: false } leaves captions out of the picture (the app draws them from the VTT); { root } is the content folder URL.
  async function load(storyUrl, timingUrl, opts = {}) {
    const [story, timing] = await Promise.all([fetch(storyUrl).then(r => r.json()), fetch(timingUrl).then(r => r.json())]);
    return build(story, timing, opts);
  }
  function build(story, timing, opts = {}) {
    kit.root = opts.root || "../../";
    kit.tone = story.tone || "NEUTRAL";
    const stage = document.getElementById("stage");
    stage.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${C.paper};transform-origin:0 0`;
    const LEAD = 0.25, TAIL = { hook: 0.5, named: 1.2, outro: 1.8, quiz: 1.6, quote: 1.0 };
    const disp = story.display || {};
    let t = 0;
    const beats = story.beats.map((b, i) => {
      const tm = timing.beats[i], start = t, voAt = start + LEAD, dur = LEAD + tm.seconds + (TAIL[b.shot] ?? 0.65);
      t += dur;
      const norm = s => s.toLowerCase().replace(/[^a-z0-9-]/g, "");
      const cue = w => { const hit = tm.words.find(x => norm(x.w).startsWith(norm(w))); return LEAD + (hit ? hit.t0 : 0); };
      // caption chunks in global time
      const words = tm.words.map(x => ({ d: disp[x.w] || x.w, t0: voAt + x.t0, t1: voAt + x.t1, end: /[.,?!]$|\.\.\.$/.test(x.w) }));
      const chunks = []; let cur = [];
      words.forEach((w, k) => { cur.push(w); if (cur.length >= 5 || (w.end && cur.length >= 2) || k === words.length - 1) { chunks.push(cur); cur = []; } });
      const layer = el("div", abs + `width:${W}px;height:${H}px;overflow:hidden;background:${C.paper}`, "", stage);
      const cam = el("div", abs + "transform-origin:0 0", "", layer);
      layer.appendChild(cam); // keep the camera world under the HUD
      layer.insertBefore(cam, layer.firstChild);
      const shot = (SHOTS[b.shot] || SHOTS.hook)(layer, cam, b, cue, dur);
      return { b, i, start, end: start + dur, dur, voAt, file: tm.file, shot, layer,
        chunks: chunks.map((c, k) => ({ key: i + ":" + k, words: c, t0: c[0].t0, t1: c[c.length - 1].t1 })) };
    });
    const total = t;
    const bars = el("div", abs + `top:70px;left:70px;width:940px;height:10px;display:flex;gap:12px;z-index:5`, "", stage);
    const barFills = beats.map(() => el("div", "flex:1;border-radius:5px;background:rgba(32,27,23,.14);overflow:hidden",
      `<div style="height:100%;width:0;background:${C.ink};border-radius:5px"></div>`, bars).firstChild);
    const capLayer = el("div", abs + `width:${W}px;height:${H}px;z-index:6;pointer-events:none`, "", stage);
    const cap = opts.captions === false ? () => {} : captions(capLayer);

    // Audio plan for the renderer and the preview: voice, effects, music.
    const audio = { vo: beats.map(x => ({ file: x.file, at: x.voAt })), sfx: [], music: story.music, total };
    beats.forEach(x => (x.shot.sfx || []).forEach(([lt, id, g]) => audio.sfx.push({ id, at: +(x.start + lt).toFixed(3), gain: g })));
    audio.sfx.push(...beats.slice(1).map(x => ({ id: x.shot.enter === "circle" ? "chime" : "whoosh", at: x.start - 0.12, gain: x.shot.enter === "circle" ? 0.35 : 0.3 })));

    function seek(time) {
      beats.forEach(x => {
        const vis = time >= x.start - (x.i ? 0 : 1) && time < x.end + T;
        x.layer.style.display = vis ? "block" : "none";
        if (!vis) return;
        const lt = time - x.start, pin = clamp(lt / T), pout = clamp((time - x.end) / T);
        x.shot.draw(Math.max(0, lt));
        x.layer.style.zIndex = pout > 0 ? 1 : 2;
        if (x.shot.enter === "circle" && x.i) {
          x.layer.style.clipPath = pin < 1 ? `circle(${(E.io(pin) * 1200).toFixed(1)}px at 540px 960px)` : "";
          put(x.layer, { o: 1 - pout * 0 });
        } else {
          // whip: in from below, out to the top with motion blur
          const y = x.i ? (1 - E.out(pin)) * 520 : 0, yo = -E.in(pout) * 620;
          put(x.layer, { y: y + yo, blur: (x.i ? (1 - pin) * 24 * (pin > 0 ? 1 : 0) : 0) + pout * 28, o: 1 });
        }
      });
      // a circle-wipe incoming shot covers the outgoing one; keep the outgoing one still underneath
      beats.forEach((x, k) => { const nx = beats[k + 1]; if (nx && nx.shot.enter === "circle" && time >= x.end) put(x.layer, { o: 1 }); });
      const cur = beats.find(x => time >= x.start && time < x.end) || beats[beats.length - 1];
      barFills.forEach((f, k) => (f.style.width = (k < cur.i ? 100 : k > cur.i ? 0 : clamp((time - cur.start) / cur.dur) * 100) + "%"));
      const ch = cur.chunks.find((c, k) => time >= c.t0 - 0.05 && (time < (cur.chunks[k + 1]?.t0 ?? c.t1 + 0.5) - 0.05));
      cap(ch, time);
    }
    seek(0);
    const cues = beats.flatMap(x => x.chunks.map(c => ({ t0: c.t0, t1: c.t1, text: c.words.map(w => w.d).join(" ") })));
    return { seek, total, audio, beats, cues, W, H, fps: story.format?.fps || 30, tone: story.tone || "NEUTRAL" };
  }
  // kit: the helpers shot packs use (see shots-ca.js). root is the content folder URL, set by build().
  const kit = { W, H, T, C, E, clamp, lerp, tw, kf, rng, el, put, abs, SERIF, SANS, chip, drawable, camera, rat, coinSVG, root: "../../" };
  window.MotionEngine = { load, build, SHOTS, E, tw, kf, kit };
})();
