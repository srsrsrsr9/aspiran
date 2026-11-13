// Aspiran trailer: every frame is a pure function of time. FILM.seek(t) draws the frame at t seconds.
// The page reads its size from the window: 1920x1080 for the master, 1080x1920 for the vertical cut. Each scene
// lays itself out for both (L(landscape, portrait)), so the vertical cut is re-framed, not letterboxed.
(function () {
  const W = innerWidth, H = innerHeight, V = H > W, L = (a, b) => (V ? b : a);
  const TL = window.TL, CH = window.CH, at = TL.at, end = TL.end;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, p) => a + (b - a) * p;
  const E = { lin: p => p, in: p => p * p * p, out: p => 1 - Math.pow(1 - p, 3), io: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    expo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)), back: p => { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    spring: p => (p >= 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(11 * p)) };
  const tw = (t, t0, d, a, b, e = E.io) => lerp(a, b, e(clamp((t - t0) / d)));
  const win = (t, t0, t1, fi = .3, fo = .3) => Math.min(clamp((t - t0) / fi), clamp((t1 - t) / fo)); // 0..1 inside a window
  const rng = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  // time of the first spoken word in line `id` that starts with `w` (from speech-to-text word times)
  const wt = (id, w) => { const l = TL.lines.find(x => x.id === id); const k = l.words.find(x => x.w.toLowerCase().replace(/[^\p{L}\d]/gu, "").startsWith(w.toLowerCase())); return k ? k.t0 : l.t0; };
  const talking = (t, ids) => { for (const id of ids) { const l = TL.lines.find(x => x.id === id); if (l && t >= l.t0 && t <= l.t1) { const k = l.words.find(w => t >= w.t0 && t <= w.t1); return k ? .35 + .65 * Math.abs(Math.sin((t - k.t0) * 22)) : 0; } } return 0; };

  const el = (tag, css = "", html = "", parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
  const ABS = "position:absolute;left:0;top:0;transform-origin:50% 50%;";
  const put = (e, { x = 0, y = 0, s = 1, r = 0, o = 1, blur = 0, sx = 1, ry = 0, rx = 0 } = {}) => {
    e.style.transform = `translate(${x}px,${y}px)${ry || rx ? ` perspective(1600px) rotateY(${ry}deg) rotateX(${rx}deg)` : ""} rotate(${r}deg) scale(${s * sx},${s})`;
    e.style.opacity = o; e.style.filter = blur > .25 ? `blur(${blur.toFixed(1)}px)` : "";
  };
  // a box of size w x h centred at (x, y)
  const box = (parent, w, h, html = "", css = "") => { const e = el("div", ABS + `width:${w}px;height:${h}px;` + css, html, parent); e._w = w; e._h = h; return e; };
  const at2 = (e, x, y, o = {}) => put(e, { ...o, x: x - e._w / 2, y: y - e._h / 2 });
  const setHTML = (e, html) => { if (e._html !== html) { e.innerHTML = html; e._html = html; } };

  const C = { void: "#06070F", deep: "#0B0E1C", ink: "#EEEAF6", muted: "#A3A8C6", saffron: "#F0A04B", saffronHi: "#FFC27A", chai: "#C8693A", cyan: "#7FE3F0",
    paper: "#F7F2EA", pink: "#E07A6A" };
  const SERIF = "Martel, Georgia, serif", SANS = "Mukta, system-ui, sans-serif", MONO = "Plex, monospace", DISPLAY = "Yatra, Martel, serif";

  const stage = el("div", `position:fixed;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;background:${C.void}`, "", document.body);

  // ---------------------------------------------------------------- shared pieces
  // Camera: layers with depth; x/y pan in px at depth 1, z zoom at depth 1.
  function camera(root, depths) {
    const layers = depths.map(d => { const e = el("div", `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;`, "", root); e._d = d; return e; });
    layers.set = ({ x = 0, y = 0, z = 1, r = 0, fx = W / 2, fy = H / 2 }, blurs = []) => layers.forEach((e, i) => {
      const d = e._d, s = 1 + (z - 1) * d;
      e.style.transform = `translate(${fx}px,${fy}px) rotate(${r * d}deg) scale(${s}) translate(${-fx - x * d}px,${-fy - y * d}px)`;
      const b = blurs[i] || 0; e.style.filter = b > .25 ? `blur(${b.toFixed(1)}px)` : "";
    });
    return layers;
  }
  function hud(parent, text, css = "") {
    // with no css: a centred label placed by at2 (wraps in the vertical cut); with css: placed by that css
    const c = css === "", w = W - L(160, 120), h = L(34, 76);
    const e = el("div", ABS + `font:600 ${L(22, 25)}px/1.45 ${MONO};letter-spacing:.14em;color:${C.cyan};text-transform:uppercase;white-space:${c && V ? "normal" : "nowrap"};text-shadow:0 0 18px rgba(127,227,240,.45);` + (c ? `width:${w}px;height:${h}px;text-align:center;` : "") + css, "", parent);
    if (c) { e._w = w; e._h = h; } e._text = text; return e;
  }
  const typeOn = (e, t, t0, cps = 38) => { const n = Math.floor(clamp((t - t0) * cps, 0, e._text.length)); setHTML(e, e._text.slice(0, n) + (n < e._text.length && n > 0 ? "▍" : "")); };

  // Stars on a canvas (static per scene, drifted by camera)
  function stars(parent, n, seed, a = .7) {
    const c = el("canvas", ABS, "", parent); c.width = W * 1.3; c.height = H * 1.3; c.style.left = -W * .15 + "px"; c.style.top = -H * .15 + "px";
    const g = c.getContext("2d"), r = rng(seed);
    for (let i = 0; i < n; i++) { const s = r() < .08 ? 2.2 : r() < .4 ? 1.4 : .9; g.fillStyle = `rgba(238,234,246,${(a * (.35 + r() * .65)).toFixed(2)})`; g.beginPath(); g.arc(r() * c.width, r() * c.height, s, 0, 7); g.fill(); }
    return c;
  }
  const skyGlow = (parent) => el("div", ABS + `width:${W}px;height:${H}px;background:radial-gradient(ellipse at 85% 10%, #1A1840 0%, transparent 55%),radial-gradient(ellipse at 0% 60%, #10203A 0%, transparent 55%),${C.void}`, "", parent);

  // ---------------------------------------------------------------- the night garden (9 vines, 59 topics, 297 leaves)
  const PAPERS = [7, 5, 6, 7, 8, 7, 6, 6, 7]; // 59 topics
  function Garden(parent) {
    const c = el("canvas", ABS, "", parent); c.width = W; c.height = H; const g = c.getContext("2d");
    const r = rng(42), vines = [], leaves = [];
    let topic = 0;
    PAPERS.forEach((nt, i) => {
      const bx = (i + .5) / PAPERS.length + (r() - .5) * .04, h = .55 + r() * .3, sway = (r() - .5) * .12, ph = r() * 6;
      const pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([bx + Math.sin(u * 3 + ph) * .025 + sway * u * u, 1.02 - u * h]); }
      vines.push(pts);
      for (let tpc = 0; tpc < nt; tpc++, topic++) {
        const u = .18 + .78 * (tpc + r() * .5) / nt, idx = Math.round(u * 30), [vx, vy] = pts[idx], side = tpc % 2 ? 1 : -1;
        const n = topic < 2 ? 6 : 5; // 59*5 + 2 = 297
        for (let l = 0; l < n; l++) {
          const a = -Math.PI / 2 + side * (.5 + l * .32) + (r() - .5) * .3, d = .012 + l * .007;
          leaves.push({ x: vx + Math.cos(a) * d * (V ? 1.6 : 1), y: vy + Math.sin(a) * d * (V ? .8 : 1.4) - .004 * l, a: a + (r() - .5) * .4, s: .7 + r() * .5,
            met: r(), rec: .25 + r() * .75, use: .45 + r() * .55, topic, vx, vy, tw: r() * 6 });
        }
      }
    });
    leaves.forEach(l => { l.rec = Math.max(l.rec, l.met + .08); l.use = Math.max(l.use, l.rec + .08); });
    const base = L(1, 1.05);
    // draw: lit 0..1 sweeps leaves through met -> recall -> use; cam {x,y,z}; alpha; t for twinkle
    function draw({ lit = 0, x = 0, y = 0, z = 1, alpha = 1, t = 0, gw = L(W * .95, W * 1.15), gh = L(H * 1.05, H * .78) }) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); if (alpha <= 0) return; g.globalAlpha = alpha;
      g.translate(W / 2, H); g.scale(z, z); g.translate(-W / 2 - x, -H - y);
      const ox = (W - gw) / 2, oy = H - gh * 1.02, P = ([u, v]) => [ox + u * gw, oy + v * gh];
      g.lineCap = "round";
      vines.forEach(pts => { g.strokeStyle = "#4D6E4C"; g.lineWidth = 3.2 * base; g.beginPath(); pts.forEach((p, k) => { const [px, py] = P(p); k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); });
      const ls = 15 * base * (V ? 1.1 : 1);
      leaves.forEach(l => {
        const [px, py] = P([l.x, l.y]), [vx, vy] = P([l.vx, l.vy]);
        g.strokeStyle = "#5A7F57"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(vx, vy); g.quadraticCurveTo((vx + px) / 2, py + 6, px, py); g.stroke();
        const st = lit > l.use ? 3 : lit > l.rec ? 2 : lit > l.met ? 1 : 0;
        const flash = st ? clamp(1 - (lit - [0, l.met, l.rec, l.use][st]) * 14) : 0;
        g.save(); g.translate(px, py); g.rotate(l.a); g.scale(l.s * ls / 44 * 2.2 * (1 + flash * .35), l.s * ls / 44 * 2.2 * (1 + flash * .35));
        if (st) { g.shadowColor = "rgba(155,227,140,.85)"; g.shadowBlur = 10 + st * 6 + flash * 30; }
        g.fillStyle = ["rgba(96,112,150,.38)", "#6DB36F", "#9BE38C", "#C6FFA6"][st];
        g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(14, -10, 34, -8, 44, 0); g.bezierCurveTo(34, 8, 14, 10, 0, 0); g.fill();
        if (!st) { g.strokeStyle = "#56658A"; g.lineWidth = 1; g.stroke(); }
        if (st === 3) { g.translate(42, 0); g.shadowColor = "rgba(240,160,75,.9)"; g.shadowBlur = 14 + flash * 30; g.fillStyle = "#F0A04B";
          const fs = 1.5 + flash; for (let k = 0; k < 5; k++) { g.save(); g.rotate(k * 1.2566); g.beginPath(); g.ellipse(0, -3.3 * fs, 2.3 * fs, 3.3 * fs, 0, 0, 7); g.fill(); g.restore(); }
          g.fillStyle = "#FFE0A8"; g.beginPath(); g.arc(0, 0, 1.9 * fs, 0, 7); g.fill(); }
        g.restore();
      });
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    }
    return { c, draw, leaves };
  }

  // ---------------------------------------------------------------- props as SVG
  const lineBars = (x, y, w, n, gap, col, seed) => { const r = rng(seed); let s = ""; for (let i = 0; i < n; i++) s += `<rect x="${x}" y="${y + i * gap}" width="${w * (.7 + r() * .3)}" height="7" rx="3.5" fill="${col}"/>`; return s; };
  const BOOK = (hl = 0, numHl = 0, fade = 0) => {
    // open book 600x380; hl 0..1 highlights lines; numHl highlights the page number; fade dissolves the ink
    const ink = `rgba(42,27,18,${(1 - fade) * .8})`, r = rng(7); let hls = "";
    const rows = [[52, 120, 220], [52, 146, 200], [52, 172, 214], [52, 198, 190], [52, 224, 210], [52, 250, 170], [52, 276, 205], [52, 302, 160],
      [330, 150, 220], [330, 176, 210], [330, 202, 200], [330, 228, 214], [330, 254, 190], [330, 280, 214], [330, 306, 150]];
    rows.forEach(([x, y, w], i) => { const p = clamp(hl * rows.length - i); if (p > 0) hls += `<rect x="${x - 4}" y="${y - 7}" width="${w * p + 8}" height="20" rx="4" fill="#F0A04B" opacity="${.55 * (1 - fade)}"/>`; });
    return `<svg viewBox="0 0 600 380" width="100%" height="100%" style="overflow:visible">
      <path d="M8 20 Q150 0 296 22 L296 372 Q150 352 8 372Z" fill="#EFE6D8"/><path d="M592 20 Q450 0 304 22 L304 372 Q450 352 592 372Z" fill="#F5EDE1"/>
      <path d="M296 22 L304 22 L304 372 L296 372Z" fill="#CDBFAE"/><path d="M8 372 Q150 352 296 372 L304 372 Q450 352 592 372 L592 380 L8 380Z" fill="#D9CBB8"/>
      ${hls}
      <text x="52" y="78" font-family="${SERIF}" font-weight="700" font-size="30" fill="${ink}">Federalism</text>
      <text x="330" y="88" font-family="${SERIF}" font-weight="700" font-size="17" fill="${ink}">Seventh Schedule</text>
      <text x="330" y="112" font-family="${SERIF}" font-size="13" fill="${ink}">Union · State · Concurrent lists</text>
      <g opacity="${1 - fade}">${lineBars(52, 116, 220, 8, 26, "rgba(42,27,18,.42)", 3)}${lineBars(330, 146, 220, 7, 26, "rgba(42,27,18,.42)", 5)}</g>
      ${numHl ? `<rect x="532" y="334" width="${36 * numHl}" height="22" rx="4" fill="#F0A04B" opacity=".75"/>` : ""}
      <text x="550" y="351" text-anchor="middle" font-family="${SERIF}" font-size="16" fill="${ink}">42</text></svg>`;
  };
  const MAG = (month) => `<svg viewBox="0 0 420 120" width="100%" height="100%"><rect x="0" y="8" width="420" height="112" rx="6" fill="#E9E1D3"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M6 ${30 + i * 10} H414" stroke="#CFC3B0" stroke-width="2"/>`).join("")}
    <rect x="0" y="0" width="420" height="26" rx="5" fill="${month === "NOVEMBER" ? "#7D2E2A" : month === "DECEMBER" ? "#264C6E" : "#3F5E35"}"/>
    <text x="14" y="19" font-family="${MONO}" font-weight="600" font-size="14" letter-spacing="2" fill="#FFF6EA">MONTHLY CURRENT AFFAIRS · ${month}</text>
    <text x="406" y="19" text-anchor="end" font-family="${MONO}" font-weight="600" font-size="14" fill="#FFE0A8">300 PAGES</text></svg>`;
  const FLAME = (s = 1) => `<svg viewBox="-20 -40 40 44" width="${40 * s}" height="${44 * s}"><path d="M0 0C-14 -10 -8 -26 0 -38C3 -26 16 -20 10 -4C7 2 3 2 0 0Z" fill="#F0A04B"/><path d="M0 -4C-6 -9 -4 -18 0 -22C2 -16 7 -12 4 -5Z" fill="#FFE0A8"/></svg>`;
  const NOTE = (title, body, icon) => `<div style="display:flex;gap:16px;align-items:center;padding:18px 22px;border-radius:22px;background:rgba(40,36,48,.92);border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 50px rgba(0,0,0,.5);font-family:${SANS};color:#F3EEF6;width:100%;box-sizing:border-box">
    <div style="width:54px;height:54px;border-radius:14px;background:#3B2E3E;display:grid;place-items:center;flex:none">${icon}</div>
    <div><div style="font:700 ${L(25, 30)}px/1.2 ${SANS}">${title}</div><div style="font:400 ${L(21, 25)}px/1.3 ${SANS};opacity:.8">${body}</div></div></div>`;

  // ---------------------------------------------------------------- the room (desk scenes)
  function Room(root, { door = false } = {}) {
    const cam = camera(root, [.25, .55, 1, 1.15]);
    const [bg, mid, fg, near] = cam;
    const wall = el("div", ABS + `width:${W * 1.6}px;height:${H * 1.6}px;left:${-W * .3}px;top:${-H * .3}px;background:linear-gradient(180deg,#1C130D 0%,#140D08 70%)`, "", bg);
    // a window with night sky
    const winW = L(360, 380), winH = L(300, 330), winX = L(W * .70, W * .10), winY = L(H * .12, H * .1);
    const win = el("div", ABS + `left:${winX}px;top:${winY}px;width:${winW}px;height:${winH}px;border-radius:10px;overflow:hidden;border:10px solid #2A1B12;background:radial-gradient(circle at 70% 25%,#1A1840,#06070F 70%)`, "", bg);
    stars(win, 50, 3, .9).style.cssText += ";width:" + winW * 1.3 + "px";
    el("div", ABS + `left:${winW * .62}px;top:${winH * .16}px;width:44px;height:44px;border-radius:50%;background:#F3E8DA;box-shadow:0 0 40px rgba(243,232,218,.6)`, "", win);
    el("div", ABS + `left:${winW / 2 - 5}px;top:0;width:10px;height:${winH}px;background:#2A1B12`, "", win);
    // the door (Jeetu comes through it)
    const doorX = L(W * .86, W * .62), doorW = L(230, 300), doorH = L(H * .7, H * .4), doorY = L(H * .02, H * .14);
    const doorFrame = el("div", ABS + `left:${doorX}px;top:${doorY}px;width:${doorW}px;height:${doorH}px;background:#0C0805;border:12px solid #2A1B12;overflow:hidden`, "", bg);
    const doorLight = el("div", ABS + `width:${doorW}px;height:${doorH}px;background:linear-gradient(90deg,#FFD9A0,#F0A04B 60%,#C8693A);opacity:0`, "", doorFrame);
    const doorLeaf = el("div", ABS + `width:${doorW}px;height:${doorH}px;background:linear-gradient(90deg,#3A2716,#2C1C10);transform-origin:100% 50%`, "", doorFrame);
    const spill = el("div", ABS + `left:${doorX - doorW * 1.5}px;top:${doorY}px;width:${doorW * 4}px;height:${H * 1.2}px;background:radial-gradient(ellipse at 62% 30%,rgba(255,200,130,.35),transparent 60%);opacity:0`, "", bg);
    const silhouette = box(bg, doorW * .9, doorH * .8, `<svg viewBox="0 0 200 300" width="100%" height="100%"><circle cx="100" cy="70" r="40" fill="#120A05"/><path d="M30 300 Q30 140 100 120 Q170 140 170 300Z" fill="#120A05"/></svg>`);
    // lamp glow
    const lampX = L(W * .2, W * .2), lampY = L(H * .2, H * .32);
    const glow = el("div", ABS + `left:${lampX - W}px;top:${lampY - H * .3}px;width:${W * 2}px;height:${H * 1.6}px;background:radial-gradient(ellipse at 50% 22%,rgba(255,190,110,.42),rgba(240,160,75,.12) 35%,transparent 62%);mix-blend-mode:screen`, "", mid);
    const lamp = box(mid, 260, 220, `<svg viewBox="0 0 260 220" width="100%" height="100%"><path d="M120 210 L150 70" stroke="#2A1B12" stroke-width="12"/><path d="M60 80 L200 40 L210 80 Q140 120 70 120Z" fill="#3B2716"/><ellipse cx="140" cy="102" rx="66" ry="14" fill="#FFE0A8"/><rect x="80" y="200" width="100" height="14" rx="7" fill="#2A1B12"/></svg>`);
    at2(lamp, lampX, lampY - 40);
    // desk
    const deskY = L(H * .66, H * .56);
    const desk = el("div", ABS + `left:${-W * .3}px;top:${deskY}px;width:${W * 1.6}px;height:${H}px;background:linear-gradient(180deg,#4A321D 0%,#3B2716 8%,#2A1B12 60%);box-shadow:0 -6px 0 #5C3E24 inset`, "", fg);
    el("div", ABS + `width:100%;height:100%;background:repeating-linear-gradient(176deg,transparent 0 46px,rgba(0,0,0,.12) 46px 49px)`, "", desk);
    // characters and things
    const hero = box(mid, 380, 437); const heroAt = [L(W * .23, W * .30), L(H * .48, H * .44)];
    const jeetu = box(mid, 440, 540); const jeetuAt = [L(W * .76, W * .72), L(H * .44, H * .41)];
    const book = box(fg, 600, 380); const bookAt = [L(W * .50, W * .5), L(H * .80, H * .66)];
    const chotu = box(fg, 200, 230); const chotuAt = [L(W * .78, W * .80), L(H * .70, H * .555)];
    const tumbler = box(fg, 70, 120, `<svg viewBox="0 0 70 120" width="100%" height="100%"><defs><linearGradient id="st2" x1="0" x2="1"><stop offset="0" stop-color="#8E979F"/><stop offset=".35" stop-color="#E4E9ED"/><stop offset="1" stop-color="#6E767E"/></linearGradient></defs><path d="M2 6 H68 L62 112 Q61 118 54 118 H16 Q9 118 8 112Z" fill="url(#st2)"/><ellipse cx="35" cy="6" rx="33" ry="6" fill="#DDE3E8"/></svg>`);
    const deskShade = el("div", ABS + `width:${W}px;height:${H}px;background:radial-gradient(ellipse at 30% 30%,transparent 30%,rgba(6,4,2,.75) 95%)`, "", near);
    return { cam, wall, win, doorLight, doorLeaf, spill, silhouette, doorX, doorW, doorY, doorH, glow, lamp, desk, hero, heroAt, jeetu, jeetuAt, book, bookAt, chotu, chotuAt, tumbler, deskShade, deskY };
  }

  // ---------------------------------------------------------------- phone with a real screen
  function Phone(parent, src, h = L(780, 1000)) {
    const w = h * 390 / 844, e = box(parent, w + 24, h + 24, `<div style="position:absolute;inset:0;border-radius:${h * .07}px;background:#0B0B10;box-shadow:0 40px 120px rgba(0,0,0,.65),0 0 0 2px rgba(170,180,255,.18),0 0 80px rgba(240,160,75,.15)"></div>
      <div class="scr" style="position:absolute;left:12px;top:12px;width:${w}px;height:${h}px;border-radius:${h * .06}px;overflow:hidden;background:#17100B">
        <img src="${src}" style="width:100%;display:block"><img class="b" style="position:absolute;left:0;top:0;width:100%;opacity:0">
        <div class="hl" style="position:absolute;left:0;width:100%;height:0;background:rgba(240,160,75,.28);mix-blend-mode:screen;box-shadow:0 0 0 3px rgba(240,160,75,.7) inset;border-radius:10px;opacity:0"></div>
        <div class="sh" style="position:absolute;inset:-50%;background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.16) 48%,rgba(255,255,255,.04) 53%,transparent 58%)"></div></div>`);
    e._sh = e.querySelector(".sh"); e._b = e.querySelector(".b"); e._hl = e.querySelector(".hl"); e._sw = w; e._shh = h;
    e.sweep = p => { e._sh.style.transform = `translateX(${lerp(-60, 60, p)}%)`; };
    e.swap = (src2, p) => { if (e._b.getAttribute("src") !== src2) e._b.src = src2; e._b.style.opacity = p; };
    e.mark = (y0, y1, p) => { const k = e._shh / 1688; e._hl.style.top = y0 * k + "px"; e._hl.style.height = (y1 - y0) * k + "px"; e._hl.style.opacity = p; }; // y in source pixels (2x)
    return e;
  }

  // ---------------------------------------------------------------- scenes
  const scenes = [];
  const Scene = (t0, t1, build, draw, { fi = .2, fo = .2 } = {}) => { const root = el("div", ABS + `width:${W}px;height:${H}px;overflow:hidden;display:none`, "", stage); const s = { t0, t1, root, fi, fo }; s.k = build(root, s); s.draw = draw; scenes.push(s); return s; };

  // A. COLD OPEN: October, page 42, the sixth reading -------------------------------------------
  const A1 = end.c02 + 1.05;
  Scene(0, A1, root => {
    const R = Room(root); const h = hud(root, "OCTOBER · PAGE 42 · READING NO. 6", `left:${L(120, 80)}px;top:${L(110, 300)}px`);
    const hand = box(R.cam[2], 360, 120, `<svg viewBox="0 0 360 120" width="100%" height="100%"><path d="M0 70 Q120 40 250 56 L270 80 Q130 96 0 110Z" fill="#B97A56"/><path d="M0 70 Q60 60 110 62 L110 106 Q50 106 0 110Z" fill="#2E6E6A"/><rect x="232" y="46" width="120" height="22" rx="8" fill="#F0A04B" transform="rotate(-24 240 60)"/><rect x="330" y="10" width="26" height="22" rx="4" fill="#C8693A" transform="rotate(-24 240 60)"/></svg>`);
    return { R, h, hand };
  }, function (t) {
    const { R, h, hand } = this.k, on = tw(t, .35, .25, 0, 1, E.out) * (t < .55 ? (Math.sin(t * 90) > 0 ? 1 : .4) : 1);
    R.glow.style.opacity = on; R.deskShade.style.opacity = .6 + (1 - on) * .4; this.root.style.filter = `brightness(${.15 + on * .85})`;
    const hl = clamp((t - .7) / 3.0), numHl = tw(t, at.c02 + .2, .3, 0, 1, E.out);
    setHTML(R.book, BOOK(hl, numHl));
    const talkH = talking(t, ["h01"]), talkC = talking(t, ["c01", "c02"]);
    setHTML(R.hero, CH.hero({ brow: "tired", mouth: talkH ? "talk" : "flat", talk: talkH, look: [6, 10], eyes: (t % 3.1 < .12) ? 1 : 0 }));
    setHTML(R.chotu, CH.chotu({ mouth: talkC ? (t > at.c02 ? "flat" : "o") : "smirk", look: t > at.c02 ? [-6, 4] : [-6, 2], eyes: t > at.c02 && t < end.c02 ? .45 : 0, ph: t }));
    at2(R.hero, R.heroAt[0], R.heroAt[1] + Math.sin(t * 1.3) * 3);
    at2(R.chotu, R.chotuAt[0], R.chotuAt[1] - Math.abs(Math.sin(t * 5)) * (talkC ? 6 : 0), { s: L(1, 1.15) });
    at2(R.book, R.bookAt[0], R.bookAt[1], { r: -1.5, s: L(1, 1.3) });
    const hx = lerp(R.bookAt[0] - L(320, 260), R.bookAt[0] + L(60, 120), (hl * 15) % 1 * .6 + .2), hy = R.bookAt[1] - L(100, 120) + Math.floor(hl * 8) % 8 * L(12, 14);
    at2(hand, hx, hy, { o: t < at.c02 ? 1 : tw(t, at.c02, .3, 1, 0), r: Math.sin(t * 14) * 2 });
    R.tumbler.style.display = "none"; R.jeetu.style.display = "none"; R.silhouette.style.opacity = 0;
    // camera: slow push in; rack to hero on her line; whip to the page number on Chotu's punchline
    const fBook = [R.bookAt[0], R.bookAt[1]], fHero = [R.heroAt[0], R.heroAt[1] - 40], fNum = [R.bookAt[0] + L(250, 325), R.bookAt[1] + L(150, 190)], fChotu = R.chotuAt;
    let f = fBook, z = tw(t, 0, 4, 1.02, 1.1, E.lin), blurs = [0, 0, 0, 0];
    if (t > at.h01 - .2 && t < at.c02 - .1) { const p = tw(t, at.h01 - .2, .5, 0, 1); f = [lerp(fBook[0], fHero[0], p), lerp(fBook[1], fHero[1], p)]; z = lerp(1.1, 1.28, p); blurs = [0, 0, 6 * p, 8 * p]; }
    if (t >= at.c02 - .1) { const p = tw(t, at.c02 - .1, .35, 0, 1), q = tw(t, wt("c02", "page") - .05, .22, 0, 1, E.expo);
      f = [lerp(lerp(fHero[0], fChotu[0], p), fNum[0], q), lerp(lerp(fHero[1], fChotu[1], p), fNum[1], q)]; z = lerp(lerp(1.28, 1.3, p), L(2.6, 2.4), q); blurs = [3 * (1 - q), 3 * (1 - q), 0, 0]; }
    R.cam.set({ x: f[0] - W / 2, y: f[1] - H / 2, z, fx: W / 2, fy: H / 2 }, blurs);
    typeOn(h, t, .9); h.style.opacity = win(t, .9, A1 - .2);
  }, { fi: 0, fo: .05 });

  // B. MONTAGE: the magazines, the streak, the 73% -------------------------------------------
  const B0 = A1, B1 = at.n03 - .55;
  Scene(B0, B1, root => {
    const R = Room(root); const months = ["NOVEMBER", "DECEMBER", "JANUARY"].map(m => box(R.cam[2], L(620, 700), L(177, 200), MAG(m)));
    const n1 = box(root, L(620, 900), 110, NOTE("Day 47 streak!", "Don't break it now. Study 4 more topics.", FLAME(1.2)));
    const n2 = box(root, L(620, 900), 110, NOTE("Only 2 seats left at this price", "Offer ends in 09:59", `<span style="font:700 30px ${SANS};color:#F0A04B">%</span>`));
    const n3 = box(root, L(620, 900), 110, NOTE("Day 48. Don't lose it!", "Your streak misses you.", FLAME(1.2)));
    const pop = box(root, L(560, 760), L(380, 500), `<div style="width:100%;height:100%;box-sizing:border-box;border-radius:30px;background:linear-gradient(160deg,#2B2440,#1A1630);border:2px solid rgba(255,255,255,.15);box-shadow:0 30px 90px rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:${SANS};color:#fff">
      <div style="font:600 ${L(22, 28)}px ${MONO};letter-spacing:.12em;opacity:.75">YOUR SELECTION CHANCE</div>
      <div class="pct" style="font:800 ${L(150, 200)}px/1 ${SERIF};background:linear-gradient(#FFE38A,#F0A04B);-webkit-background-clip:text;color:transparent">73%</div>
      <div style="font:400 ${L(22, 28)}px ${SANS};opacity:.7">✦ calculated by our advanced system ✦</div></div>`);
    const h = hud(root, "", `left:${L(120, 80)}px;top:${L(110, 300)}px`);
    return { R, months, n1, n2, n3, pop, h };
  }, function (t) {
    const { R, months, n1, n2, n3, pop, h } = this.k, l = t - B0;
    const drops = [B0 + .05, B0 + .5, B0 + .95];
    setHTML(R.book, BOOK(1, 1)); R.jeetu.style.display = "none"; R.tumbler.style.display = "none"; R.silhouette.style.opacity = 0; R.glow.style.opacity = 1;
    months.forEach((m, i) => { const p = tw(t, drops[i], .22, 0, 1, E.in), sq = t > drops[i] + .22 ? 1 - .12 * Math.exp(-(t - drops[i] - .22) * 12) * Math.cos((t - drops[i]) * 30) : 1;
      at2(m, R.bookAt[0] + (i - 1) * 14, lerp(-400, R.bookAt[1] - L(40, 60) - i * L(70, 80), p), { r: (i - 1) * 3, s: L(1, 1.05), o: t > drops[i] - .3 ? 1 : 0 }); m.style.transform += ` scaleY(${sq})`; });
    const mi = t < drops[1] ? 0 : t < drops[2] ? 1 : 2; h._text = ["NOVEMBER", "DECEMBER", "JANUARY"][mi] + " · 300 PAGES EACH"; setHTML(h, h._text);
    const look = t > at.c04 - .6 ? [6, -6] : [0, -10];
    const tc = talking(t, ["c04"]);
    setHTML(R.chotu, CH.chotu({ mouth: tc ? "o" : (t > end.c04 ? "flat" : "o"), wide: t < at.c04 ? .8 : .2, look, eyes: t > wt("c04", "says") ? .4 : 0, steam: t < at.c04 ? "up" : "curl", ph: t }));
    at2(R.chotu, R.chotuAt[0] + L(0, -40), R.chotuAt[1] - (tc ? Math.abs(Math.sin(t * 6)) * 6 : 0), { s: L(1.1, 1.2) });
    setHTML(R.hero, CH.hero({ brow: "worried", mouth: "flat", look: [8, -8] })); at2(R.hero, R.heroAt[0], R.heroAt[1]);
    at2(R.book, R.bookAt[0], R.bookAt[1], { s: L(1, 1.3) });
    // notifications slide in from the top; the pop-up springs in the middle
    const nx = L(W - 360 - 40, W / 2), ny = L(150, 380);
    at2(n1, nx, ny + tw(t, B0 + 1.2, .35, -300, 0, E.back), { o: win(t, B0 + 1.2, B1, .1, .2) });
    at2(n2, nx, ny + 130 + tw(t, B0 + 1.6, .35, -300, 0, E.back), { o: win(t, B0 + 1.6, B1, .1, .2) });
    const pS = tw(t, at.c04 - .95, .45, 0, 1, E.back), wob = t > wt("c04", "horoscope") ? Math.sin(t * 30) * 3 * Math.exp(-(t - wt("c04", "horoscope")) * 3) : 0;
    at2(pop, L(W * .52, W / 2), L(H * .42, H * .40), { s: pS * L(1, 1), r: wob, o: pS > 0 ? win(t, at.c04 - .95, B1, .05, .2) : 0 });
    at2(n3, nx, ny + 260 + tw(t, end.c04 + .1, .3, -300, 0, E.back), { o: win(t, end.c04 + .1, B1, .1, .2), r: Math.sin(t * 40) * 1.5 });
    // camera: up the tower of magazines, then a nervous spin out at the end
    const shake = drops.reduce((s, d) => s + (t > d + .2 && t < d + .5 ? Math.sin(t * 90) * 10 * (1 - (t - d - .2) / .3) : 0), 0);
    const spin = tw(t, end.c04 + .15, B1 - end.c04 - .15, 0, 1, E.in);
    R.cam.set({ x: L(0, 30), y: lerp(L(40, 80), L(-60, -40), tw(t, B0, 1.4, 0, 1)) + shake, z: lerp(1.12, 1.18, l / 4) + spin * .5, r: spin * 8 }, [0, 0, 0, 0]);
    this.root.style.filter = spin > .01 ? `blur(${spin * 6}px) brightness(${1 - spin * .6})` : "";
  }, { fi: 0, fo: .05 });

  // C. THE LEAK: March, the blank, the words blowing away, Ebbinghaus, Jeetu's voice ---------------------
  const C0 = B1, C1 = at.c05 - .05;
  Scene(C0, C1, root => {
    const cam = camera(root, [.3, 1, 1.2]);
    skyGlow(cam[0]); stars(cam[0], 140, 9, .5);
    const march = box(cam[1], 1200, 260, `<div style="font:400 ${L(220, 230)}px/1 ${DISPLAY};color:#EEEAF6;text-align:center;letter-spacing:.02em;text-shadow:0 0 60px rgba(127,227,240,.35)">March</div>`);
    const q = box(cam[1], L(1000, 900), L(250, 330), `<div style="width:100%;height:100%;box-sizing:border-box;padding:${L(36, 40)}px;border-radius:14px;background:#EAE7EF;color:#161A2E;font:700 ${L(36, 40)}px/1.4 ${SERIF};box-shadow:0 30px 80px rgba(0,0,0,.6)">
      <div style="font:600 ${L(20, 24)}px ${MONO};letter-spacing:.12em;color:#565C78;margin-bottom:10px">QUESTION 14</div>Which Schedule of the Constitution divides powers between the Union and the States?</div>`);
    const hero = box(cam[1], 380, 437);
    const page = box(cam[1], 600, 380); const dust = el("canvas", ABS, "", cam[2]); dust.width = W; dust.height = H;
    const curve = box(cam[1], L(1400, 900), L(620, 700), ""); const h1 = hud(cam[1], "EBBINGHAUS · 1885 · THE FORGETTING CURVE", "");
    const door = el("div", ABS + `left:${L(W * .78, W * .66)}px;top:0;width:${L(W * .22, W * .34)}px;height:${H}px;background:linear-gradient(90deg,rgba(255,200,130,.0),rgba(255,200,130,.38));opacity:0;mix-blend-mode:screen`, "", root);
    const shadow = el("div", ABS + `left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse at ${L(70, 60)}% 70%,rgba(0,0,0,.5),transparent 50%);opacity:0`, "", root);
    return { cam, march, q, hero, page, dust, curve, h1, door, shadow };
  }, function (t) {
    const k = this.k, d = k.dust.getContext("2d");
    // 1: MARCH title + the question + panic
    const s1 = win(t, at.n03 - .1, at.n04 + .2, .4, .35);
    at2(k.march, W / 2, L(H * .22, H * .2) + tw(t, at.n03, 3, 20, -10, E.lin), { o: s1, s: tw(t, at.n03, 3, 1.06, 1, E.out) });
    const qp = tw(t, wt("n03", "march") - .1, .5, 0, 1, E.out);
    at2(k.q, W / 2, L(H * .55, H * .45) + (1 - qp) * 60, { o: s1 * qp, r: -1 });
    setHTML(k.hero, CH.hero({ brow: "worried", mouth: talking(t, ["h02"]) ? "talk" : "o", sweat: tw(t, at.n03 + 1.2, .6, 0, 1), look: [Math.sin(t * 7) * 6, -4] }));
    at2(k.hero, L(W * .82, W * .5), L(H * .78, H * .78), { o: s1 * tw(t, at.n03 + .8, .4, 0, 1), s: L(.8, 1) });
    // 2: the October page loses its words
    const s2 = win(t, at.n04 - .3, at.j01 - 1.0, .4, .35), fade = tw(t, wt("n04", "gone") - .3, 1.6, 0, 1, E.io);
    setHTML(k.page, BOOK(1, 1, fade)); at2(k.page, W / 2, H * .48, { o: s2, s: L(1.25, 1.45) + (t - at.n04) * .02, r: -2 });
    d.clearRect(0, 0, W, H);
    if (s2 > 0 && fade > 0) { const r = rng(11); for (let i = 0; i < 900; i++) { const sx = W / 2 + (r() - .5) * 600 * L(1.25, 1.45), sy = H * .48 + (r() - .5) * 300 * L(1.25, 1.45), st = r() * .7, p = clamp((fade - st) / .5);
      if (p <= 0) continue; const x = sx + p * (240 + r() * 600) + Math.sin(p * 6 + i) * 30, y = sy - p * (120 + r() * 300); d.fillStyle = `rgba(${r() < .5 ? "240,160,75" : "238,234,246"},${(1 - p) * .9 * s2})`; d.fillRect(x, y, 3, 3); } }
    // 3: the forgetting curve draws, then the door light and Jeetu's voice
    const s3 = win(t, at.j01 - 1.25, C1 + 1, .3, .3), draw = tw(t, at.j01 - 1.1, 1.6, 0, 1, E.io);
    const cw = k.curve._w, chh = k.curve._h, pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([60 + u * (cw - 100), 40 + (chh - 120) * (1 - Math.exp(-u * 5.5) * .92)]); }
    const n = Math.max(2, Math.round(draw * 60)), path = pts.slice(0, n).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const glowC = tw(t, wt("j01", "forgetting"), .5, 0, 1);
    setHTML(k.curve, `<svg viewBox="0 0 ${cw} ${chh}" width="100%" height="100%" style="overflow:visible"><path d="M60 20 V${chh - 70} H${cw - 20}" fill="none" stroke="rgba(170,180,255,.35)" stroke-width="3"/>
      <text x="70" y="22" font-family="${MONO}" font-size="${L(20, 24)}" fill="#A3A8C6" letter-spacing="2">WHAT YOU REMEMBER</text><text x="${cw - 20}" y="${chh - 34}" text-anchor="end" font-family="${MONO}" font-size="${L(20, 24)}" fill="#A3A8C6" letter-spacing="2">OCTOBER → MARCH</text>
      <path d="${path}" fill="none" stroke="#7FE3F0" stroke-width="${7 + glowC * 3}" stroke-linecap="round" style="filter:drop-shadow(0 0 ${10 + glowC * 20}px rgba(127,227,240,.9))"/></svg>`);
    at2(k.curve, W / 2, H * .5, { o: s3 * (1 - tw(t, end.j01 - .2, .4, 0, .6)), s: tw(t, at.j01 - 1.2, 6, .96, 1.04, E.lin) });
    at2(k.h1, W / 2, L(H * .14, H * .22), { o: s3 }); typeOn(k.h1, t, at.j01 - .9, 50);
    const dl = tw(t, wt("j01", "beta") - .2, 1.2, 0, 1); k.door.style.opacity = dl; k.shadow.style.opacity = dl * .8;
    k.cam.set({ x: 0, y: 0, z: tw(t, C0, C1 - C0, 1, 1.08, E.lin) });
  }, { fi: .05, fo: .15 });

  // D. JEETU'S ENTRANCE ------------------------------------------------------------------
  const D0 = C1, D1 = at.j04 - .35;
  Scene(D0, D1, root => {
    const R = Room(root, { door: true }); const card = el("div", ABS, "", root);
    const name = el("div", ABS + `font:400 ${L(110, 120)}px/1 ${DISPLAY};color:#FFE0A8;text-shadow:0 0 40px rgba(240,160,75,.6);white-space:nowrap`, "Jeetu", card);
    const role = hud(card, "THE MENTOR · HAS SEEN IT ALL", `top:${L(130, 140)}px;color:#FFC27A;text-shadow:0 0 18px rgba(240,160,75,.5)`);
    return { R, card, role };
  }, function (t) {
    const { R, card, role } = this.k;
    setHTML(R.book, BOOK(1, 1)); at2(R.book, R.bookAt[0], R.bookAt[1], { s: L(1, 1.3) }); R.glow.style.opacity = .85;
    setHTML(R.hero, CH.hero({ brow: "up", mouth: "o", look: [14, -6] })); at2(R.hero, R.heroAt[0], R.heroAt[1]);
    const tc = talking(t, ["c05"]), straight = t > at.c05 + .1;
    setHTML(R.chotu, CH.chotu({ mouth: tc ? "o" : "flat", wide: 1, look: [10, -4], steam: straight ? "up" : "curl", ph: t, eyes: t > wt("c05", "act") ? .1 : 0 }));
    const slide = tw(t, wt("c05", "act"), .3, 0, 1, E.back);
    at2(R.chotu, R.chotuAt[0] - slide * L(260, 180), R.chotuAt[1] + (tc ? Math.sin(t * 40) * 2 : 0), { s: L(1, 1.15) });
    // door opens, light floods, silhouette steps in, then Jeetu is lit
    const open = tw(t, at.c05 + .2, 1.4, 0, 1, E.io); R.doorLeaf.style.transform = `perspective(800px) rotateY(${-open * 70}deg)`; R.doorLight.style.opacity = open; R.spill.style.opacity = open;
    const walk = tw(t, end.c05 - .2, 1.3, 0, 1, E.out);
    at2(R.silhouette, R.doorX + R.doorW / 2 + 12, R.doorY + R.doorH * .55, { o: open * (1 - tw(t, end.c05 + .9, .4, 0, 1)), s: lerp(.8, 1.1, walk) });
    const lit = tw(t, end.c05 + .6, .9, 0, 1);
    R.jeetu.style.display = ""; setHTML(R.jeetu, CH.jeetu({ glint: tw(t, end.c05 + 1.3, .25, 0, 1) * (1 - tw(t, end.c05 + 1.6, .4, 0, 1)), smile: .3, brow: tw(t, end.c05 + 1.6, .3, 0, 1) }));
    at2(R.jeetu, R.jeetuAt[0] + (1 - walk) * L(160, 60), R.jeetuAt[1], { o: lit, s: L(1, .95) });
    R.jeetu.style.filter = `brightness(${.2 + lit * .8}) drop-shadow(0 0 ${30 * lit}px rgba(255,190,110,.35))`;
    R.tumbler.style.display = "none";
    // camera: from the startled pair, a slow push on Jeetu
    const p = tw(t, end.c05 - .2, 1.6, 0, 1, E.io), f0 = [W / 2, H * .55], f1 = [R.jeetuAt[0], R.jeetuAt[1] - 60];
    R.cam.set({ x: lerp(f0[0], f1[0], p) - W / 2, y: lerp(f0[1], f1[1], p) - H / 2, z: lerp(1.05, L(1.55, 1.5), p) + (t - D0) * .01 }, [p * 4, p * 3, p * 5, p * 6]);
    const cp = tw(t, end.c05 + 1.1, .4, 0, 1, E.out);
    put(card, { x: L(W * .08, W * .1), y: L(H * .14, H * .14) + (1 - cp) * 30, o: cp * win(t, D0, D1, .1, .15) }); typeOn(role, t, end.c05 + 1.2, 45);
  }, { fi: .08, fo: .3 });

  // shared night backdrop for the method scenes (one garden, half-lit, drifting)
  function NightBack(root, lit = .25) { const cam = camera(root, [.2, .6, 1, 1.3]); skyGlow(cam[0]); stars(cam[0], 160, 21, .6); const G = Garden(cam[1]); return { cam, G, lit }; }

  // E1. ANSWER FIRST. THEN LOOK. (real first-run screen) --------------------------------------
  const E10 = D1, E11 = at.c06 - .25;
  Scene(E10, E11, root => {
    const N = NightBack(root); const ph = Phone(N.cam[2], "screens/first-run.png"); ph._b.src = "screens/first-run-answered.png";
    const h = hud(N.cam[2], "ROEDIGER & KARPICKE · 2006 · RETRIEVAL PRACTICE", ""); const jb = box(N.cam[3], 440, 540);
    return { N, ph, h, jb };
  }, function (t) {
    const { N, ph, h, jb } = this.k, l = t - E10;
    N.G.draw({ lit: .12, t, alpha: .9, y: -l * 8 });
    const look = wt("j04", "look"), ry = tw(t, E10, 2.6, L(-24, -14), L(-8, -4), E.out);
    at2(ph, L(W * .58, W * .5), L(H * .52, H * .44) + Math.sin(l * 1.4) * 8, { ry, rx: 4, s: tw(t, E10, 3, .9, 1.02, E.out) });
    ph.sweep(clamp((l - .3) / 1.6)); ph.swap("screens/first-run-answered.png", tw(t, look - .05, .35, 0, 1));
    ph.mark(320, 650, tw(t, at.j04 + .1, .4, 0, 1) * (1 - tw(t, look - .1, .3, 0, 1)));
    setHTML(jb, CH.jeetu({ talk: talking(t, ["j04"]), smile: .45, brow: t > look ? .6 : 0, tumbler: false }));
    at2(jb, L(W * .2, W * .78), L(H * .72, H * .86), { s: L(1, .7), o: tw(t, E10, .5, 0, 1) });
    at2(h, L(W * .58, W / 2), L(H * .11, H * .16), { o: tw(t, E10 + .3, .3, 0, 1) }); typeOn(h, t, E10 + .3, 50);
    N.cam.set({ x: Math.sin(l * .5) * 20, y: 0, z: tw(t, E10, E11 - E10, 1.0, 1.06, E.lin) }, [0, 2, 0, 3]);
  }, { fi: .35, fo: .2 });

  // E2. HOW SURE ARE YOU? (and the real "−⅓ for a wrong answer" line) -----------------------------
  const E20 = E11, E21 = at.n05 - .2;
  Scene(E20, E21, root => {
    const N = NightBack(root);
    const card = box(N.cam[2], L(760, 860), L(440, 500), `<div style="width:100%;height:100%;box-sizing:border-box;padding:${L(44, 50)}px;border-radius:24px;background:rgba(18,22,42,.9);border:1px solid rgba(170,180,255,.16);box-shadow:0 40px 100px rgba(0,0,0,.55);font-family:${SANS};color:#EEEAF6">
      <div style="font:600 ${L(20, 24)}px ${MONO};letter-spacing:.14em;color:#7FE3F0">BEFORE YOU LOOK</div>
      <div style="font:700 ${L(54, 60)}px/1.2 ${SERIF};margin:18px 0 34px">How sure are you?</div>
      <div style="display:flex;gap:22px"><div class="b1" style="flex:1;text-align:center;padding:22px;border-radius:999px;font:600 ${L(32, 36)}px ${SANS};border:2px solid rgba(170,180,255,.25)">Sure</div>
      <div class="b2" style="flex:1;text-align:center;padding:22px;border-radius:999px;font:600 ${L(32, 36)}px ${SANS};border:2px solid rgba(170,180,255,.25)">Not sure</div></div></div>`);
    const ch = box(N.cam[3], 200, 230); const ph = Phone(N.cam[2], "screens/polity.png", L(820, 980));
    const h = hud(N.cam[2], "PRELIMS · NEGATIVE MARKING", "");
    return { N, card, ch, ph, h, b1: card.querySelector(".b1"), b2: card.querySelector(".b2") };
  }, function (t) {
    const { N, card, ch, ph, h, b1, b2 } = this.k, l = t - E20;
    N.G.draw({ lit: .14, t, alpha: .9, x: 40, y: -l * 8 });
    const swap = at.j05 - .1, cp = tw(t, swap, .5, 0, 1, E.io);
    at2(card, L(W * .5, W / 2) - cp * L(500, 0), L(H * .48, H * .42) - cp * L(0, 300), { s: 1 - cp * .25, o: 1 - cp * .85, blur: cp * 6, ry: -6 });
    const wob = Math.sin(t * 7), side = wob > 0 ? 1 : 0, inLine = t > at.c06 - .1 && t < end.c06 + .2;
    b1.style.background = inLine && side ? "rgba(240,160,75,.25)" : ""; b2.style.background = inLine && !side ? "rgba(240,160,75,.25)" : "";
    setHTML(ch, CH.chotu({ mouth: talking(t, ["c06"]) ? "o" : "pout", look: [wob * 8, 6], ph: t, steam: "spiral", eyes: t > end.c06 + .2 ? .3 : 0 }));
    at2(ch, L(W * .5, W / 2) + wob * L(120, 140) - cp * L(500, 300), L(H * .48, H * .42) + L(200, 220) - cp * L(0, 300), { r: wob * 14, s: L(1.1, 1.25), o: 1 - cp });
    // the real topic page slides in; rack focus to "−⅓ for a wrong answer"
    at2(ph, L(W * .6, W / 2), L(H * .5, H * .55) + (1 - cp) * H * .7, { ry: -10, s: lerp(.95, L(1.1, 1.08), tw(t, swap, 2, 0, 1)) });
    ph.sweep(clamp((t - swap) / 1.5)); ph.mark(360, 440, tw(t, wt("j05", "ish") - .15, .25, 0, 1));
    at2(h, L(W * .6, W / 2), L(H * .11, H * .16), { o: cp }); typeOn(h, t, swap + .2, 45);
    N.cam.set({ x: 0, y: 0, z: 1 + l * .012 }, [0, 2, 0, 4]);
  }, { fi: .1, fo: .2 });

  // E3. THE REVIEW: back just before you forget (a day, a week, months) -----------------------------
  const E30 = E21, E31 = at.j06 - .2;
  Scene(E30, E31, root => {
    const N = NightBack(root); const g = box(N.cam[2], L(1300, 960), L(560, 640), "");
    const h = hud(N.cam[2], "SPACED RETRIEVAL · EBBINGHAUS 1885 · BJORK 1994", ""); const h2 = hud(N.cam[2], "INTERLEAVING · ROHRER & TAYLOR 2007", "");
    const tag = box(N.cam[2], L(700, 900), 80, `<div style="text-align:center;font:600 ${L(34, 40)}px ${SANS};color:#FFC27A">10 to 20 minutes a day. Then it ends.</div>`);
    return { N, g, h, h2, tag };
  }, function (t) {
    const { N, g, h, h2, tag } = this.k, l = t - E30;
    N.G.draw({ lit: tw(t, E30, E31 - E30, .14, .3, E.lin), t, alpha: .85, y: -l * 8 });
    const cw = g._w, chh = g._h, X0 = 60, X1 = cw - 30, Y0 = 40, Y1 = chh - 80, reviews = [.18, .42, .78], p = tw(t, E30 + .1, 3.6, 0, 1, E.lin);
    let path = "", dots = "", y = 0; const N2 = 160;
    for (let i = 0; i <= N2; i++) { const u = i / N2; if (u > p) break; const last = [0, ...reviews].filter(r => r <= u).pop(), k = [0, ...reviews].indexOf(last), dec = [5.5, 2.4, 1.1, .45][k];
      const keep = 1 - (1 - Math.exp(-(u - last) * dec * 3)) * .75; const px = X0 + u * (X1 - X0), py = Y0 + (Y1 - Y0) * (1 - keep); path += (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1); }
    reviews.forEach((r, i) => { if (p >= r) { const px = X0 + r * (X1 - X0), fl = clamp(1 - (p - r) * 8);
      dots += `<circle cx="${px}" cy="${Y0}" r="${12 + fl * 16}" fill="#F0A04B" opacity="${.9 - fl * .4}" style="filter:drop-shadow(0 0 ${14 + fl * 30}px rgba(240,160,75,.9))"/><text x="${px}" y="${Y1 + 50}" text-anchor="middle" font-family="${MONO}" font-size="${L(20, 24)}" fill="#FFC27A" letter-spacing="2">${["A DAY", "A WEEK", "MONTHS"][i]}</text>`; } });
    setHTML(g, `<svg viewBox="0 0 ${cw} ${chh}" width="100%" height="100%" style="overflow:visible"><path d="M${X0} 10 V${Y1} H${X1}" fill="none" stroke="rgba(170,180,255,.3)" stroke-width="3"/>
      <text x="${X0 + 10}" y="14" font-family="${MONO}" font-size="${L(20, 24)}" fill="#A3A8C6" letter-spacing="2">WHAT YOU REMEMBER</text>
      <path d="${path}" fill="none" stroke="#7FE3F0" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 14px rgba(127,227,240,.8))"/>${dots}</svg>`);
    at2(g, W / 2, L(H * .5, H * .44), { s: tw(t, E30, 4, .95, 1.03, E.lin) });
    at2(h, W / 2, L(H * .11, H * .16), { o: tw(t, E30 + .2, .3, 0, 1) }); typeOn(h, t, E30 + .2, 55);
    at2(h2, W / 2, L(H * .11, H * .16) + 44, { o: tw(t, E30 + 1.6, .3, 0, 1) }); typeOn(h2, t, E30 + 1.6, 55);
    at2(tag, W / 2, L(H * .2, H * .7), { o: tw(t, wt("n05", "everything"), .4, 0, 1) });
    N.cam.set({ x: 0, y: 0, z: 1 + l * .01 }, [0, 2, 0, 4]);
  }, { fi: .2, fo: .2 });

  // E4. MAINS: write, mark it yourself, second opinion, rewrite. Hindi or English. -------------------------
  const E40 = E31, E41 = at.c07 - .25;
  const scribble = (x, y, w, n, gap, seed, col = "#1F2A5A", width = 4) => { const r = rng(seed); let s = ""; for (let i = 0; i < n; i++) { const lw = w * (.75 + r() * .25); let d = `M${x} ${y + i * gap}`; for (let k = 1; k <= 26; k++) d += ` L${(x + lw * k / 26).toFixed(1)} ${(y + i * gap + Math.sin(k * 2.1 + r() * 3) * 5 + (r() - .5) * 4).toFixed(1)}`; s += `<path class="w" d="${d}" fill="none" stroke="${col}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`; } return s; };
  Scene(E40, E41, root => {
    const N = NightBack(root);
    const sheet = box(N.cam[2], 640, 820, `<svg viewBox="0 0 640 820" width="100%" height="100%" style="overflow:visible"><rect width="640" height="820" rx="10" fill="#FBF7F0"/>
      ${Array.from({ length: 20 }, (_, i) => `<path d="M30 ${120 + i * 34} H610" stroke="#D7E3F0" stroke-width="2"/>`).join("")}<path d="M90 40 V800" stroke="#F0B8B0" stroke-width="2"/>
      <text x="110" y="62" font-family="${SERIF}" font-weight="700" font-size="24" fill="#2A1B12">Q. Federalism in India:</text><text x="110" y="96" font-family="${SERIF}" font-weight="700" font-size="24" fill="#2A1B12">cooperative or competitive?</text>
      <g class="en">${scribble(110, 150, 470, 4, 34, 1)}<g class="weak">${scribble(110, 320, 470, 3, 34, 2)}</g>${scribble(110, 456, 470, 4, 34, 3)}</g>
      <g class="re" opacity="0">${scribble(110, 320, 470, 3, 34, 9, "#1F6E3E")}</g>
      <g class="strike" opacity="0"><path d="M106 316 L590 384 M106 384 L590 316" stroke="#C0453A" stroke-width="5" stroke-linecap="round"/></g>
      <g class="marks" opacity="0" font-family="${SANS}" font-weight="700" fill="#2A5A9A"><text x="34" y="176" font-size="34">✓</text><text x="34" y="350" font-size="34">?</text><text x="34" y="484" font-size="34">✓</text><text x="500" y="790" font-size="40">6/10</text></g></svg>`);
    const so = box(N.cam[2], L(520, 620), L(560, 520), `<div style="width:100%;height:100%;box-sizing:border-box;padding:34px;border-radius:22px;background:rgba(18,22,42,.92);border:1px solid rgba(127,227,240,.35);box-shadow:0 30px 80px rgba(0,0,0,.6);font-family:${SANS};color:#EEEAF6">
      <div style="font:600 ${L(20, 24)}px ${MONO};letter-spacing:.14em;color:#7FE3F0">SECOND OPINION</div>
      <div style="font:400 ${L(28, 30)}px/1.5 ${SANS};margin-top:16px">Intro: clear ✓<br>Body: <span style="color:#FFC27A">needs one example</span><br>Conclusion: <span style="color:#FFC27A">weakest part</span></div>
      <div style="display:flex;gap:20px;margin-top:24px;font:700 ${L(30, 34)}px ${SANS}"><div style="color:#A3A8C6">You: 6/10</div><div style="color:#FFC27A">Second: 5/10</div></div>
      <div style="margin-top:22px;padding:14px 20px;border-radius:999px;background:linear-gradient(#FFC27A,#F0A04B);color:#1B1205;font:600 ${L(26, 28)}px ${SANS};text-align:center">Rewrite the weakest part</div></div>`);
    const hi = box(N.cam[2], 640, 820, `<svg viewBox="0 0 640 820" width="100%" height="100%"><rect width="640" height="820" rx="10" fill="#FBF7F0"/>${Array.from({ length: 20 }, (_, i) => `<path d="M30 ${120 + i * 34} H610" stroke="#D7E3F0" stroke-width="2"/>`).join("")}<path d="M90 40 V800" stroke="#F0B8B0" stroke-width="2"/>
      <text x="110" y="84" font-family="Mukta" font-weight="700" font-size="30" fill="#2A1B12">प्र. भारत में संघवाद: सहकारी या प्रतिस्पर्धी?</text>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M110 ${140 + i * 68} H${560 - (i * 37 % 90)}" stroke="#1F2A5A" stroke-width="4"/>`).join("")}${scribble(110, 160, 450, 9, 68, 4)}</svg>`);
    const h = hud(N.cam[2], "ERICSSON 1993 · DELIBERATE PRACTICE", ""), h2 = hud(N.cam[2], "HATTIE & TIMPERLEY 2007 · FEEDBACK", "");
    const jb = box(N.cam[3], 440, 540), pen = box(N.cam[3], 260, 40, `<svg viewBox="0 0 260 40" width="100%" height="100%"><rect x="0" y="12" width="220" height="16" rx="8" fill="#1F2A5A"/><path d="M220 12 L258 20 L220 28Z" fill="#C8B79E"/><rect x="20" y="10" width="60" height="20" rx="4" fill="#C98A0B"/></svg>`);
    const sheetSvg = sheet.querySelector("svg"), words = [...sheetSvg.querySelectorAll(".en .w")].map(p => { const L2 = p.getTotalLength(); p.style.strokeDasharray = L2; return [p, L2]; });
    const reW = [...sheetSvg.querySelectorAll(".re .w")].map(p => { const L2 = p.getTotalLength(); p.style.strokeDasharray = L2; return [p, L2]; });
    return { N, sheet, so, hi, h, h2, jb, pen, words, reW, marks: sheetSvg.querySelector(".marks"), strike: sheetSvg.querySelector(".strike"), re: sheetSvg.querySelector(".re"), weak: sheetSvg.querySelector(".weak") };
  }, function (t) {
    const k = this.k, l = t - E40, tMark = wt("j06", "mark"), tSec = wt("j06", "second") - .4, tRe = wt("j06", "rewrite") - .1, tHi = at.n06 - .2;
    k.N.G.draw({ lit: .3, t, alpha: .8, y: -l * 6 });
    // write: lines draw on
    const wp = tw(t, E40 + .1, tMark - E40 - .2, 0, 1, E.lin);
    k.words.forEach(([p, L2], i) => { const q = clamp(wp * k.words.length - i); p.style.strokeDashoffset = L2 * (1 - q); });
    k.marks.setAttribute("opacity", tw(t, tMark, .3, 0, 1));
    const sp = tw(t, tSec, .5, 0, 1, E.back), rp = tw(t, tRe + .3, 1.6, 0, 1, E.lin);
    k.strike.setAttribute("opacity", tw(t, tRe, .2, 0, 1) * (1 - tw(t, tRe + .3, .3, 0, 1))); k.weak.setAttribute("opacity", 1 - tw(t, tRe + .2, .3, 0, 1));
    k.re.setAttribute("opacity", t > tRe + .3 ? 1 : 0); k.reW.forEach(([p, L2], i) => p.style.strokeDashoffset = L2 * (1 - clamp(rp * 3 - i)));
    const flip = tw(t, tHi, .5, 0, 1, E.io), split = flip;
    const sx = L(W * .38, W / 2), sy = L(H * .5, H * .40);
    at2(k.sheet, sx - split * L(330, 0), sy - split * L(0, 0), { s: L(.94, 1.05) * (1 - split * .12) * tw(t, E40, 1, .92, 1, E.out), r: -2 + split * 3, ry: Math.sin(flip * Math.PI) * 50 });
    at2(k.so, L(W * .77, W / 2), L(H * .5, H * .68), { o: sp * (1 - flip), s: sp * L(1, .85), ry: -8 });
    at2(k.hi, sx + split * L(330, 0), sy + (1 - split) * 40, { s: L(.94, 1.05) * .88, r: 2, o: split, ry: -(1 - flip) * 50 });
    if (V) { at2(k.sheet, W / 2 - split * 140, sy - split * 30, { s: 1.05 * (1 - split * .3), r: -3 * split }); at2(k.hi, W / 2 + split * 140, sy + 60, { s: 1.05 * .72, r: 3, o: split }); }
    const penOn = t < tMark + .2 || (t > tRe + .2 && t < tRe + 2);
    const pIdx = t < tMark ? wp : rp, px = sx - L(250, 250) + ((pIdx * 30) % 1) * L(470, 470), py = sy - 260 + (t < tMark ? pIdx * 420 : 170 + rp * 70);
    at2(k.pen, px + 130, py - 10, { r: -30, o: penOn && flip < .1 ? 1 : 0 });
    at2(k.h, W / 2, L(H * .11, H * .1), { o: win(t, E40 + .3, tSec, .3, .2) }); typeOn(k.h, t, E40 + .3, 50);
    at2(k.h2, W / 2, L(H * .11, H * .1), { o: win(t, tSec + .1, tHi, .3, .2) }); typeOn(k.h2, t, tSec + .1, 50);
    // Jeetu leans in for "बस, लिखो।"
    const jp = tw(t, at.j07 - .3, .4, 0, 1, E.out);
    setHTML(k.jb, CH.jeetu({ smile: .7, talk: talking(t, ["j07"]), tumbler: false, eyes: t > end.j07 ? .85 : 0 }));
    at2(k.jb, L(W * .86, W * .78), L(H * .8, H * .9) + (1 - jp) * 300, { o: jp, s: L(.8, .65) });
    k.N.cam.set({ x: 0, y: 0, z: 1.0 + l * .008 }, [0, 2, 0, 3]);
  }, { fi: .2, fo: .2 });

  // E5. CHAI: three cards, then it ends. Not three hundred pages. ------------------------------------
  const E50 = E41, E51 = at.n08 - .2;
  Scene(E50, E51, root => {
    const R = Room(root); const kettle = box(R.cam[3], 300, 220, `<svg viewBox="0 0 300 220" width="100%" height="100%"><path d="M60 60 Q60 200 150 200 Q240 200 240 60Z" fill="#B9C0C7"/><path d="M60 60 H240" stroke="#8E979F" stroke-width="12" stroke-linecap="round"/><path d="M240 90 Q300 80 290 30" fill="none" stroke="#8E979F" stroke-width="14" stroke-linecap="round"/><path d="M60 100 Q10 110 0 150" fill="none" stroke="#B9C0C7" stroke-width="18" stroke-linecap="round"/></svg>`);
    const stream = el("div", ABS + `width:12px;height:0;border-radius:6px;background:linear-gradient(#C27A3A,#8D4F01)`, "", R.cam[3]);
    const tags = [["GS2 · POLITY", "One card, tied to its syllabus line."], ["GS3 · ECONOMY", "Read it, then one recall question."], ["GS1 · GEOGRAPHY", "That's today's Chai. It ends."]];
    const cards = tags.map(([a, b]) => box(R.cam[3], L(440, 560), L(220, 260), `<div style="width:100%;height:100%;box-sizing:border-box;padding:28px;border-radius:18px;background:#FFFDF9;border:1px solid #E4D8C8;box-shadow:0 20px 50px rgba(0,0,0,.45);font-family:${SANS};color:#2A1B12">
      <div style="font:600 ${L(18, 22)}px ${MONO};letter-spacing:.12em;color:#9A4E0E">CHAI · ${a}</div><div style="margin-top:14px;height:12px;width:90%;border-radius:6px;background:#E4D8C8"></div><div style="margin-top:10px;height:12px;width:70%;border-radius:6px;background:#E4D8C8"></div>
      <div style="margin-top:18px;font:600 ${L(25, 30)}px/1.3 ${SANS}">${b}</div></div>`));
    const mags = ["NOVEMBER", "DECEMBER", "JANUARY"].map(m => box(R.cam[2], L(620, 700), L(177, 200), MAG(m)));
    return { R, kettle, stream, cards, mags };
  }, function (t) {
    const { R, kettle, stream, cards, mags } = this.k, l = t - E50;
    setHTML(R.book, BOOK(1, 1)); at2(R.book, R.bookAt[0] - L(200, 0), R.bookAt[1], { s: L(.9, 1.2), o: .9 });
    R.jeetu.style.display = "none"; R.silhouette.style.opacity = 0; R.tumbler.style.display = "none"; R.hero.style.display = "none";
    const cx = L(W * .3, W * .5), cy = L(H * .62, H * .6);
    setHTML(R.chotu, CH.chotu({ mouth: talking(t, ["c07"]) ? "grin" : "smile", eyes: t < E50 + .9 ? .9 : 0, ph: t * 1.5, look: [8, -4] }));
    at2(R.chotu, cx, cy, { s: L(1.5, 1.7) * (1 + Math.max(0, Math.sin(Math.min(1, (t - E50 - .2) / .8) * Math.PI)) * .05) });
    const kp = win(t, E50 - .1, E50 + 1.2, .3, .3); at2(kettle, cx + L(170, 150), cy - L(260, 300), { o: kp, r: -20 * kp });
    stream.style.height = (kp > .6 ? L(190, 220) : 0) + "px"; put(stream, { x: cx + 6, y: cy - L(300, 340), o: kp > .6 ? 1 : 0 });
    const c0 = [at.c07 + .55, wt("c07", "three") - .15, wt("c07", "day")];
    cards.forEach((c, i) => { const p = tw(t, c0[i], .45, 0, 1, E.back);
      at2(c, L(W * .66, W * .5) + i * L(36, 30), L(H * .3, H * .22) + i * L(150, 170) + (1 - p) * 60, { o: clamp(p * 2), s: .9 + .1 * p, r: (i - 1) * 2.5 }); });
    const fly = tw(t, wt("c07", "not"), .7, 0, 1, E.in);
    mags.forEach((m, i) => at2(m, L(W * .82, W * .85) + fly * (900 + i * 200), L(H * .48, H * .4) - i * 70 - fly * 400, { r: fly * (60 + i * 30), o: tw(t, E50 + .4, .3, 0, .9) * (1 - fly) }));
    R.cam.set({ x: L(-60, 0), y: L(-40, -40), z: 1.0 + l * .015 }, [3, 2, 0, 0]);
  }, { fi: .15, fo: .2 });

  // E6. THE POD (Hindi line) -------------------------------------------------------------------
  const E60 = E51, E61 = at.n09 - .25;
  Scene(E60, E61, root => {
    const N = NightBack(root); const ring = el("div", ABS, "", N.cam[2]);
    const skins = [["#C68A62", "#2A1B12"], ["#8E5A3E", "#1E1410"], ["#E2B48C", "#3B2716"], ["#A86B4C", "#2A1B12"], ["#7A4A30", "#1E1410"], ["#D19A70", "#4A2E1B"], ["#B07850", "#1E1410"]];
    const faces = skins.map(([s, h], i) => box(ring, 150, 150, CH.podFace(s, h, { smile: i % 2 })));
    const lamp = box(N.cam[2], 160, 160, `<div style="width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,#FFE0A8,#F0A04B 40%,rgba(240,160,75,0) 70%)"></div>`);
    const seat = box(ring, 170, 170, `<div style="width:100%;height:100%;border-radius:50%;border:4px dashed #F0A04B;box-shadow:0 0 50px rgba(240,160,75,.6),inset 0 0 40px rgba(240,160,75,.35)"></div>`);
    const me = box(ring, 170, 196); const h = hud(N.cam[2], "YOUR POD · 6 TO 8 ASPIRANTS · SAME STAGE · NO RANKS", "");
    return { N, faces, lamp, seat, me, h };
  }, function (t) {
    const { N, faces, lamp, seat, me, h } = this.k, l = t - E60;
    N.G.draw({ lit: .35, t, alpha: .7, y: -l * 6 });
    const cx = W / 2, cy = L(H * .5, H * .44), R0 = L(330, 360), n = faces.length + 1, rot = l * .08;
    faces.forEach((f, i) => { const a = rot + (i + 1) / n * Math.PI * 2 - Math.PI / 2, p = tw(t, E60 + i * .08, .4, 0, 1, E.back);
      at2(f, cx + Math.cos(a) * R0 * (V ? .85 : 1), cy + Math.sin(a) * R0 * .62, { s: p * (.85 + .15 * Math.sin(a) + .15) }); });
    const a0 = rot - Math.PI / 2, sx = cx + Math.cos(a0) * R0 * (V ? .85 : 1), sy = cy + Math.sin(a0) * R0 * .62;
    at2(seat, sx, sy, { s: 1 + Math.sin(t * 5) * .04, o: 1 - tw(t, wt("n08", "एक") - .1, .3, 0, 1) });
    const mp = tw(t, wt("n08", "एक") - .2, .5, 0, 1, E.back);
    setHTML(me, CH.hero({ brow: "sure", mouth: "smile" })); at2(me, sx, sy + (1 - mp) * 200, { s: mp * .4, o: mp });
    at2(lamp, cx, cy, { s: 1.4 + Math.sin(t * 3) * .05 });
    at2(h, W / 2, L(H * .09, H * .16), { o: tw(t, E60 + .2, .3, 0, 1) }); typeOn(h, t, E60 + .2, 60);
    N.cam.set({ x: 0, y: 0, z: tw(t, E60, E61 - E60, 1.1, 1.0, E.out) }, [0, 2, 0, 0]);
  }, { fi: .2, fo: .25 });

  // F. THE GARDEN: 9 papers, 59 topics, 297 lines; October to March, it lights up ---------------------
  const F0 = E61, F1 = at.j09 - .3;
  Scene(F0, F1, root => {
    const cam = camera(root, [.15, .5, 1, 1.2]); skyGlow(cam[0]); stars(cam[0], 260, 33, .7); const G = Garden(cam[2]);
    const nums = [["9", "PAPERS"], ["59", "TOPICS"], ["297", "LINES"]].map(([a, b]) => box(root, L(420, 330), 230, `<div style="text-align:center;color:#EEEAF6"><div style="font:400 ${L(150, 130)}px/1 ${DISPLAY};text-shadow:0 0 40px rgba(240,160,75,.55)">${a}</div><div style="font:600 ${L(24, 26)}px ${MONO};letter-spacing:.2em;color:#7FE3F0;margin-top:6px">${b}</div></div>`));
    const h = hud(root, "THE WHOLE UPSC SYLLABUS · EVERY LINE A LEAF", "");
    const month = box(root, 700, 120, ""); const legend = box(root, L(1100, 1000), 70, `<div style="display:flex;justify-content:center;gap:${L(34, 22)}px;font:600 ${L(22, 24)}px ${MONO};letter-spacing:.1em;color:#A3A8C6">
      <span><b style="color:#8D9AB8">●</b> NOT YET</span><span><b style="color:#6DB36F">●</b> MET</span><span><b style="color:#9BE38C">●</b> CAN RECALL</span><span><b style="color:#F0A04B">✿</b> CAN USE</span></div>`);
    return { cam, G, nums, h, month, legend };
  }, function (t) {
    const { cam, G, nums, h, month, legend } = this.k, l = t - F0, lightStart = end.n09 + .05;
    const lit = tw(t, lightStart, F1 - lightStart - .1, 0, 1.05, E.io);
    G.draw({ lit, t, z: tw(t, F0, F1 - F0, L(1.5, 1.6), 1.0, E.io), y: tw(t, F0, F1 - F0, L(-120, -200), 0, E.io) });
    const wts = [wt("n09", "nine"), wt("n09", "fifty"), wt("n09", "two")];
    nums.forEach((n, i) => { const p = tw(t, wts[i] - .1, .35, 0, 1, E.back);
      at2(n, L(W * (.25 + i * .25), W / 2), L(H * .38, H * (.2 + i * .14)), { s: .7 + .3 * p, o: clamp(p * 2) * (1 - tw(t, lightStart - .1, .4, 0, 1)) }); });
    const months = ["OCTOBER", "NOVEMBER", "DECEMBER", "JANUARY", "FEBRUARY", "MARCH"], mi = Math.min(5, Math.floor(clamp((t - lightStart) / (F1 - lightStart - .2)) * 6));
    setHTML(month, `<div style="text-align:center;font:400 ${L(90, 96)}px/1 ${DISPLAY};color:#FFE0A8;text-shadow:0 0 40px rgba(240,160,75,.7)">${months[mi]}</div>`);
    at2(month, W / 2, L(H * .16, H * .2), { o: win(t, lightStart, F1, .2, .2) });
    at2(h, W / 2, L(H * .11, H * .1), { o: win(t, F0 + .2, lightStart, .3, .2) }); typeOn(h, t, F0 + .2, 60);
    at2(legend, W / 2, L(H * .92, H * .76), { o: win(t, lightStart + .2, F1, .3, .2) });
    cam.set({ x: 0, y: 0, z: 1 }, [0, 0, 0, 0]);
    this.root.style.filter = `brightness(${1 + tw(t, F1 - .4, .3, 0, .6) * (1 - tw(t, F1 - .1, .1, 0, 1))})`;
  }, { fi: .25, fo: .12 });

  // G. MARCH. PAGE 42? (the payoff) --------------------------------------------------------------
  const G0 = F1, G1 = at.n12 - .25;
  Scene(G0, G1, root => {
    const R = Room(root); const h = hud(root, "MARCH · BOOK CLOSED", `left:${L(120, 80)}px;top:${L(110, 300)}px`);
    const closed = box(R.cam[2], 420, 120, `<svg viewBox="0 0 420 120" width="100%" height="100%"><rect x="0" y="20" width="420" height="96" rx="8" fill="#2E4A6E"/><rect x="0" y="20" width="420" height="22" rx="6" fill="#3B5C86"/><text x="30" y="88" font-family="${SERIF}" font-weight="700" font-size="34" fill="#EEEAF6">Indian Polity</text><rect x="370" y="20" width="16" height="96" fill="#F0A04B"/></svg>`);
    const blooms = el("div", ABS, "", R.cam[2]); const fl = [0, 1, 2].map(() => box(blooms, 90, 90, `<svg viewBox="-20 -20 40 40" width="100%" height="100%" style="overflow:visible"><g style="filter:drop-shadow(0 0 6px rgba(240,160,75,.9))">${CH.marigold(3.2)}</g></svg>`));
    return { R, h, closed, fl };
  }, function (t) {
    const { R, h, closed, fl } = this.k, l = t - G0;
    R.book.style.display = "none"; R.glow.style.opacity = .9; R.silhouette.style.opacity = 0;
    at2(closed, R.bookAt[0], R.bookAt[1] + 40, { s: L(1, 1.2), r: -3 });
    const tj = talking(t, ["j09"]), th = talking(t, ["h03"]);
    setHTML(R.jeetu, CH.jeetu({ talk: tj, smile: t > end.h03 - .3 ? .9 : .4, brow: tj ? .7 : 0 })); at2(R.jeetu, R.jeetuAt[0], R.jeetuAt[1], { s: L(1, .95) });
    setHTML(R.hero, CH.hero({ brow: "sure", mouth: th ? "talk" : (t > end.h03 ? "smile" : "flat"), talk: th, look: [10, 0] })); at2(R.hero, R.heroAt[0], R.heroAt[1]);
    const hop = t > end.h03 - .5 ? Math.abs(Math.sin((t - end.h03) * 9)) * 26 * Math.exp(-(t - end.h03 + .5) * 1.5) : 0;
    setHTML(R.chotu, CH.chotu({ mouth: t > end.h03 - .5 ? "grin" : "o", wide: .5, look: t < at.h03 ? [12, -4] : [-12, -4], ph: t, steam: t > end.h03 - .5 ? "spiral" : "curl" }));
    at2(R.chotu, L(W * .5, W * .52), R.chotuAt[1] - hop, { s: L(1, 1.15) });
    R.tumbler.style.display = ""; at2(R.tumbler, R.jeetuAt[0] - L(170, 120), R.deskY + L(30, 40), { s: L(.9, 1) });
    const bw = [wt("h03", "federalism"), wt("h03", "seventh"), wt("h03", "three")];
    fl.forEach((f, i) => { const p = tw(t, bw[i] + .1, .4, 0, 1, E.back); at2(f, R.heroAt[0] - 110 + i * 110, R.heroAt[1] - L(270, 290) - Math.sin(t * 2 + i) * 6, { s: p, o: clamp(p * 2), r: t * 30 }); });
    const fJ = [R.jeetuAt[0], R.jeetuAt[1]], fH = [R.heroAt[0], R.heroAt[1] - 40], p = tw(t, at.h03 - .25, .5, 0, 1, E.io);
    const z = L(1.35, 1.3) + l * .01;
    R.cam.set({ x: lerp(fJ[0], fH[0], p) - W / 2, y: lerp(fJ[1], fH[1], p) - H / 2, z }, [2, 0, 0, 3]);
    R.jeetu.style.filter = `blur(${(p * 4).toFixed(1)}px)`; R.hero.style.filter = `blur(${((1 - p) * 4).toFixed(1)}px)`;
    typeOn(h, t, G0 + .2); h.style.opacity = win(t, G0 + .2, G1, .2, .2);
  }, { fi: .15, fo: .2 });

  // H. THE THOUGHT + THE REFUSAL (stamps), rising to the hit ----------------------------------------
  const H0 = G1, H1 = end.n12 + .3;
  Scene(H0, H1, root => {
    const cam = camera(root, [.15, .5, 1]); skyGlow(cam[0]); stars(cam[0], 260, 51, .8); const G = Garden(cam[1]);
    const stamps = [["NO STREAKS", FLAME(1.6)], ["NO LEADERBOARDS", ""], ["NO “SELECTION CHANCE: 73%”", ""]].map(([s, ic]) => box(cam[2], L(1000, 900), 120,
      `<div style="display:flex;align-items:center;justify-content:center;gap:18px;height:100%"><span class="ic">${ic}</span><span style="font:600 ${L(46, 44)}px ${MONO};letter-spacing:.08em;color:#EEEAF6;padding:10px 26px;border:4px solid #EEEAF6;border-radius:12px;white-space:nowrap;background:rgba(6,7,15,.82);box-shadow:0 0 60px rgba(6,7,15,.9)">${s}</span></div>`));
    return { cam, G, stamps };
  }, function (t) {
    const { cam, G, stamps } = this.k, l = t - H0;
    G.draw({ lit: 1.05, t, z: tw(t, H0, H1 - H0, 1, 1.25, E.in), y: tw(t, H0, H1 - H0, 0, 260, E.in) });
    const st = [H0 + .25, H0 + 1.05, H0 + 1.85];
    stamps.forEach((s, i) => { const p = tw(t, st[i], .18, 0, 1, E.out), out = tw(t, wt("n12", "its") - .2, .4, 0, 1);
      at2(s, W / 2, L(H * (.26 + i * .14), H * (.24 + i * .1)), { s: lerp(1.8, 1, p), o: p * (1 - out), r: (i - 1) * 2 });
      const ic = s.querySelector(".ic"); if (ic) ic.style.opacity = 1 - tw(t, st[0] + .35, .2, 0, 1); });
    cam.set({ x: 0, y: 0, z: 1 + l * .01 }, [0, 0, 0]);
    this.root.style.filter = `brightness(${1 + tw(t, H1 - .6, .6, 0, .8, E.in)})`;
  }, { fi: .15, fo: .05 });

  // I. TITLE (the hit) ----------------------------------------------------------------------------
  const I0 = H1, I1 = at.c08 - .15;
  Scene(I0, I1, root => {
    skyGlow(root); stars(root, 200, 61, .7);
    const burst = el("canvas", ABS, "", root); burst.width = W; burst.height = H;
    const title = box(root, L(1400, 1000), L(420, 520), `<div style="text-align:center"><div style="display:flex;align-items:center;justify-content:center;gap:${L(30, 20)}px"><div class="cup" style="width:${L(150, 140)}px;height:${L(172, 161)}px">${CH.chotu({ ph: 0 })}</div>
      <div style="font:400 ${L(230, 200)}px/1 ${DISPLAY};color:#E0A879;background:linear-gradient(#FFE0A8,#F0A04B 55%,#C8693A);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 0 40px rgba(240,160,75,.55))">Aspiran</div></div>
      <div style="font:600 ${L(30, 32)}px ${MONO};letter-spacing:.2em;color:#A3A8C6;margin-top:${L(20, 24)}px">UPSC · ENGLISH + हिंदी</div></div>`);
    const flare = el("div", ABS + `width:${W}px;height:${H}px;background:linear-gradient(100deg,transparent 40%,rgba(255,224,168,.35) 49%,rgba(255,255,255,.6) 50%,rgba(255,224,168,.35) 51%,transparent 60%);mix-blend-mode:screen`, "", root);
    const flash = el("div", ABS + `width:${W}px;height:${H}px;background:#FFF3E0`, "", root);
    return { burst, title, flare, flash };
  }, function (t) {
    const { burst, title, flare, flash } = this.k, l = t - I0, g = burst.getContext("2d");
    flash.style.opacity = clamp(1 - l / .35) * .9;
    at2(title, W / 2, H / 2, { s: tw(t, I0, I1 - I0 + .5, 1.12, 1.0, E.out), blur: clamp(1 - l / .25) * 14 });
    put(flare, { x: lerp(-W, W, tw(t, I0 + .15, 1.4, 0, 1, E.io)), o: .9 });
    g.clearRect(0, 0, W, H); const r = rng(5);
    for (let i = 0; i < 160; i++) { const a = r() * 7, sp = 300 + r() * 900, p = clamp(l / 2.4), d = sp * E.out(p), x = W / 2 + Math.cos(a) * d * L(1.2, .8), y = H / 2 + Math.sin(a) * d * .6;
      g.fillStyle = r() < .5 ? `rgba(240,160,75,${(1 - p) * .9})` : `rgba(198,255,166,${(1 - p) * .8})`; g.beginPath(); g.arc(x, y, 2 + r() * 4, 0, 7); g.fill(); }
  }, { fi: 0, fo: .25 });

  // J. THE BUTTON: a tiny streak? ---------------------------------------------------------------
  const J0 = I1, J1 = at.n14 - .3;
  Scene(J0, J1, root => { const R = Room(root); return { R }; }, function (t) {
    const { R } = this.k, l = t - J0;
    R.book.style.display = "none"; R.hero.style.display = "none"; R.silhouette.style.opacity = 0; R.glow.style.opacity = .9;
    const tc = talking(t, ["c08", "c09"]), tj = talking(t, ["j10"]), offended = t > at.c09 - .1;
    setHTML(R.jeetu, CH.jeetu({ talk: tj, smile: t > end.c09 ? .9 : .3, brow: t > at.j10 - .2 && t < end.j10 + .3 ? .8 : 0, eyes: t > end.c09 + .25 ? .85 : 0 }));
    at2(R.jeetu, R.jeetuAt[0], R.jeetuAt[1], { s: L(1, .95) });
    setHTML(R.chotu, CH.chotu({ mouth: offended ? "pout" : tc ? "o" : "smile", cheeks: offended ? 1 : 0, wide: offended ? .4 : 0, eyes: !offended && t < at.j10 ? .3 : 0, look: [12, -6], steam: offended ? "spiral" : "curl", ph: t * 2,
      flame: t > at.c08 + .3 && t < at.j10 + .6 ? tw(t, at.c08 + .3, .3, 0, 1, E.back) * (1 - tw(t, at.j10 + .3, .2, 0, 1)) : 0 }));
    const sid = tw(t, J0, .8, 0, 1, E.out);
    at2(R.chotu, lerp(L(W * .4, W * .35), L(W * .55, W * .45), sid) + (offended ? Math.sin(t * 50) * 3 * Math.exp(-(t - at.c09) * 3) : 0), R.chotuAt[1] - (offended ? tw(t, at.c09 - .1, .15, 0, 30, E.out) : 0), { s: L(1.25, 1.3) });
    R.tumbler.style.display = ""; const sip = tw(t, end.c09 + .15, .35, 0, 1, E.io);
    at2(R.tumbler, R.jeetuAt[0] - L(170, 120), R.deskY + L(30, 40) - sip * L(120, 90), { s: L(.9, 1), r: -sip * 20 });
    const fx = lerp(W * .5, (R.jeetuAt[0] + L(W * .55, W * .45)) / 2, .6);
    R.cam.set({ x: fx - W / 2, y: L(H * .5, H * .48) - H / 2, z: L(1.3, 1.25) + l * .012 }, [3, 1, 0, 0]);
  }, { fi: .2, fo: .3 });

  // K. END CARD -------------------------------------------------------------------------------
  Scene(J1, TL.total + 1, root => {
    const cam = camera(root, [.15, .5, 1]); skyGlow(cam[0]); stars(cam[0], 220, 71, .7); const G = Garden(cam[1]);
    const card = box(cam[2], L(1300, 960), L(640, 900), `<div style="text-align:center;font-family:${SANS};color:#EEEAF6">
      <div style="font:400 ${L(150, 150)}px/1 ${DISPLAY};background:linear-gradient(#FFE0A8,#F0A04B 55%,#C8693A);-webkit-background-clip:text;color:transparent">Aspiran</div>
      <div style="font:600 ${L(24, 28)}px ${MONO};letter-spacing:.2em;color:#A3A8C6;margin:14px 0 ${L(46, 60)}px">UPSC · ENGLISH + हिंदी</div>
      <div class="btn" style="display:inline-block;padding:${L(26, 32)}px ${L(60, 70)}px;border-radius:999px;background:linear-gradient(#FFC27A,#F0A04B);color:#1B1205;font:600 ${L(46, 54)}px ${SANS};box-shadow:0 8px 60px rgba(240,160,75,.45)">Try one topic free</div>
      <div style="font:400 ${L(80, 96)}px/1 ${DISPLAY};color:#FFC27A;margin-top:${L(40, 56)}px">aspiran.in</div>
      <div style="font:400 ${L(28, 32)}px/1.5 ${SANS};color:#A3A8C6;margin-top:${L(30, 40)}px">A companion to your books. Not coaching.</div></div>`);
    const duo = box(cam[2], 330, 200, `<div style="display:flex;align-items:flex-end;gap:6px;height:100%"><div class="c" style="width:120px;height:138px"></div><div class="j" style="width:170px;height:209px"></div></div>`);
    duo.querySelector(".c").innerHTML = CH.chotu({ mouth: "smirk" }); duo.querySelector(".j").innerHTML = CH.jeetu({ smile: .8, tumbler: true });
    return { cam, G, card, duo };
  }, function (t) {
    const { cam, G, card, duo } = this.k, l = t - J1;
    G.draw({ lit: 1.05, t, alpha: .55, y: -l * 10 });
    at2(card, W / 2, L(H * .47, H * .44), { s: tw(t, J1, 1.2, .94, 1, E.out), o: tw(t, J1, .5, 0, 1) });
    card.querySelector(".btn").style.boxShadow = `0 8px ${60 + Math.sin(t * 3) * 20}px rgba(240,160,75,${.45 + Math.sin(t * 3) * .1})`;
    at2(duo, L(W - 230, W / 2), L(H - 140, H * .115), { o: tw(t, J1 + .6, .4, 0, 1), s: L(.9, 1.05) });
    cam.set({ x: 0, y: 0, z: 1 + l * .01 }, [0, 0, 0]);
    stage.style.filter = `brightness(${1 - tw(t, TL.total - .7, .7, 0, 1, E.in)})`;
  }, { fi: .3, fo: 0 });

  // ---------------------------------------------------------------- captions, grain, vignette, bars (on top of everything)
  const vignette = el("div", `position:fixed;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,.55) 100%)`, "", document.body);
  const bars = [0, 1].map(i => el("div", `position:fixed;left:0;${i ? "bottom" : "top"}:0;width:${W}px;height:${V ? 0 : 54}px;background:#000`, "", document.body));
  const grain = el("canvas", `position:fixed;left:0;top:0;width:${W}px;height:${H}px;opacity:.07;mix-blend-mode:overlay;pointer-events:none;image-rendering:pixelated`, "", document.body);
  grain.width = Math.round(W / 3); grain.height = Math.round(H / 3); const gg = grain.getContext("2d"), gimg = gg.createImageData(grain.width, grain.height);
  const cap = el("div", `position:fixed;left:0;width:${W}px;text-align:center;pointer-events:none;bottom:${L(84, 330)}px`, "", document.body);
  const capName = { C: ["CHOTU", "#F0A04B"], J: ["JEETU", "#7FE3F0"], H: ["", ""], N: ["", ""] };
  // break a caption into chunks (sentences) timed by the spoken words
  const chunks = TL.lines.map(l => {
    const parts = l.cap.replace(/\.(?=\S)/g, "\u2024").match(/[^.?!।…]+[.?!।…]+["”]?|[^.?!।…]+$/g).map(s => s.trim().replace(/\u2024/g, ".")).filter(Boolean);
    const merged = []; parts.forEach(p => { if (merged.length && (merged[merged.length - 1].length + p.length < (V ? 34 : 52))) merged[merged.length - 1] += " " + p; else merged.push(p); });
    const total = merged.reduce((s, p) => s + p.split(/\s+/).length, 0), nw = l.words.length; let acc = 0;
    return merged.map((p, i) => { const k0 = Math.round(acc / total * nw); acc += p.split(/\s+/).length; const k1 = Math.min(nw - 1, Math.round(acc / total * nw) - 1);
      return { l, text: p, t0: i ? l.words[k0].t0 : l.t0, t1: i < merged.length - 1 ? l.words[Math.min(nw - 1, k1 + 1)].t0 : l.t1 + .25 }; });
  }).flat();
  function drawCaption(t) {
    const c = chunks.find(c => t >= c.t0 - .05 && t < c.t1);
    if (!c) { setHTML(cap, ""); return; }
    const [nm, col] = capName[c.l.spk], hi = /[ऀ-ॿ]/.test(c.text);
    setHTML(cap, `${nm ? `<div style="font:600 ${L(20, 26)}px ${MONO};letter-spacing:.2em;color:${col};margin-bottom:6px;text-shadow:0 2px 10px #000">${nm}</div>` : ""}
      <span style="display:inline-block;max-width:${L(1400, 940)}px;padding:${L(8, 12)}px ${L(22, 26)}px;border-radius:14px;background:rgba(6,7,15,.55);font:${hi ? 600 : 600} ${L(hi ? 44 : 42, hi ? 54 : 52)}px/1.3 ${SANS};color:#FFF6EA;text-shadow:0 2px 12px rgba(0,0,0,.8)">${c.text}</span>
      ${c.l.en ? `<div style="font:400 ${L(28, 34)}px ${SANS};color:#E0D6CC;margin-top:8px;text-shadow:0 2px 10px #000;font-style:italic">${c.l.en}</div>` : ""}`);
  }

  window.FILM = {
    total: TL.total, fps: TL.fps, ready: false,
    seek(t) {
      stage.style.filter = "";
      for (const s of scenes) {
        const on = t >= s.t0 - (s.fi || 0) && t < s.t1 + (s.fo || 0);
        s.root.style.display = on ? "" : "none";
        if (!on) continue;
        s.root.style.opacity = Math.min(s.fi ? clamp((t - s.t0 + s.fi) / (2 * s.fi)) : 1, s.fo ? clamp((s.t1 + s.fo - t) / (2 * s.fo)) : 1);
        s.root.style.filter = ""; s.draw(t);
      }
      drawCaption(t);
      const r = rng(Math.floor(t * 30) + 7), d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gg.putImageData(gimg, 0, 0);
    }
  };
  document.fonts.ready.then(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))).then(() => { FILM.seek(0); FILM.ready = true; });
})();
