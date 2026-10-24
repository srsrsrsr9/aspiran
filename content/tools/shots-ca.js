// Current-affairs shot pack for the motion engine: scene opener, map zoom, stat reveal, timeline, quote card,
// why-it-matters chips and the quiz hand-off. Shots are data-driven so any Chai card can fill them.
// Maps draw land only (Natural Earth 50m land, no country borders), so no political boundary is ever shown.
(function () {
  const K = MotionEngine.kit, S = MotionEngine.SHOTS;
  const { W, H, C, E, clamp, lerp, tw, kf, el, put, abs, SERIF, SANS, chip, drawable, camera } = K;
  const accent = () => ({ LIGHT: [C.chai, C.chaiSoft], NEUTRAL: [C.teal, C.tealSoft], SERIOUS: [C.ink, C.line], TRAGIC: [C.ink, C.line] }[K.tone] || [C.teal, C.tealSoft]);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kicker = (layer, text, top = 250) => {
    const [a, soft] = accent();
    return el("div", abs + `top:${top}px;left:90px;font:700 40px ${SANS};letter-spacing:6px;text-transform:uppercase;color:${a};white-space:nowrap`, esc(text), layer);
  };
  // Words of a sentence as separate spans, so they can pop in one by one.
  const words = (parent, text, css) => {
    const box = el("div", abs + css, "", parent);
    return { box, ws: text.split(" ").map(w => el("span", "display:inline-block;margin-right:0.26em;will-change:transform", esc(w), box)) };
  };
  const popWords = (ws, t, t0, step = 0.09) => ws.forEach((w, i) => put(w, { y: tw(t, t0 + i * step, 0.45, 50, 0, E.back), o: tw(t, t0 + i * step, 0.25, 0, 1) }));

  // ---- scene opener: kicker, headline, the card's illustration with a slow push-in -----------------------
  S["ca-open"] = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    const k = kicker(layer, d.kicker, 240);
    const head = words(layer, d.headline, `top:320px;left:90px;width:900px;font:800 92px/1.16 ${SERIF};color:${C.ink};text-wrap:balance`);
    const frame = el("div", abs + `top:860px;left:90px;width:900px;height:620px;border-radius:44px;overflow:hidden;background:${soft};border:4px solid ${C.ink}`, "", layer);
    const img = el("img", abs + "width:900px;height:620px;object-fit:contain;transform-origin:50% 50%", "", frame);
    img.src = K.root + d.illustration;
    return {
      sfx: [[0.1, "whoosh", 0.45], [0.55, "page", 0.4]],
      draw(t) {
        put(k, { o: tw(t, 0.05, 0.3, 0, 1), x: tw(t, 0.05, 0.4, -40, 0, E.out) });
        popWords(head.ws, t, 0.2);
        put(frame, { y: tw(t, 0.45, 0.7, 260, 0, E.out), o: tw(t, 0.45, 0.3, 0, 1) });
        put(img, { s: tw(t, 0.45, dur, 1.0, 1.16, E.lin), x: tw(t, 0.45, dur, 0, -30, E.lin), y: tw(t, 0.45, dur, 10, -16, E.lin) });
      }
    };
  };

  // ---- map: land-only world, camera moves cued to words, pins, warm/cool areas and arcs ------------------
  // data: { lon0, start:{center:[lon,lat], zoom}, moves:[{cue, center, zoom, d}], pins:[{at, label, cue}],
  //         areas:[{at, r, label, cue, warm}], arcs:[{from, to, cue}] }
  S.map = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    const proj = d3.geoNaturalEarth1().rotate([-(d.lon0 || 0), 0]).scale(620).translate([1800, 900]);
    const path = d3.geoPath(proj), P = ll => proj(ll);
    const degPx = Math.abs(P([1, 0])[0] - P([0, 0])[0]);
    const areas = (d.areas || []).map((x, i) => {
      const [cx, cy] = P(x.at), col = x.warm ? C.mari : C.teal;
      return { x, t: cue(x.cue), svg: `<radialGradient id="ar${i}"><stop offset="0" stop-color="${col}" stop-opacity=".85"/><stop offset=".6" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
        <ellipse class="ar${i}" cx="${cx}" cy="${cy}" rx="${x.r * degPx * 1.6}" ry="${x.r * degPx * 0.7}" fill="url(#ar${i})"/>` };
    });
    el("div", abs, `<svg width="3600" height="1800" style="overflow:visible"><defs>${areas.map(x => x.svg.split("<ellipse")[0]).join("")}</defs>
      <path d="${path(d3.geoGraticule10())}" fill="none" stroke="${C.line}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <path d="${path(K.land)}" fill="${soft}" stroke="${a}" stroke-opacity=".55" stroke-width="2" vector-effect="non-scaling-stroke"/>
      ${areas.map(x => "<ellipse" + x.svg.split("<ellipse")[1]).join("")}</svg>`, cam);
    const areaEls = areas.map((x, i) => cam.querySelector(`.ar${i}`));
    // Camera keys: hold, then ease to each move at its cue. Zoom eases in log space so it feels even.
    const st = d.start, keys = [{ t: 0, c: P(st.center), z: st.zoom }];
    (d.moves || []).forEach(m => { const t0 = Math.max(keys[keys.length - 1].t, cue(m.cue)); keys.push({ t: t0, c: keys[keys.length - 1].c, z: keys[keys.length - 1].z }, { t: t0 + (m.d || 1.6), c: P(m.center), z: m.zoom }); });
    const cx = t => kf(t, keys.map(k => [k.t, k.c[0]])), cy = t => kf(t, keys.map(k => [k.t, k.c[1]])), cz = t => Math.exp(kf(t, keys.map(k => [k.t, Math.log(k.z)])));
    const hud = el("div", abs + `width:${W}px;height:${H}px`, "", layer);
    const arcSvg = el("div", abs, `<svg width="${W}" height="${H}">${(d.arcs || []).map(() => `<path fill="none" stroke="${C.mari}" stroke-width="10" stroke-linecap="round"/><circle r="14" fill="${C.mari}"/>`).join("")}</svg>`, hud).firstChild;
    const arcs = (d.arcs || []).map((x, i) => ({ x, t: cue(x.cue), p: arcSvg.querySelectorAll("path")[i], dot: arcSvg.querySelectorAll("circle")[i] }));
    const pins = (d.pins || []).map(x => ({ x, t: cue(x.cue),
      pin: el("div", abs + "width:70px;height:94px;transform-origin:50% 100%", `<svg width="70" height="94" viewBox="0 0 90 120"><path d="M45 118 C 20 80 4 62 4 42 A 41 41 0 1 1 86 42 C 86 62 70 80 45 118 Z" fill="${C.chai}"/><circle cx="45" cy="42" r="15" fill="${C.paper}"/></svg>`, hud),
      tag: chip(hud, esc(x.label), C.ink, C.paper, 44) }));
    const areaTags = areas.filter(x => x.x.label).map(x => ({ ...x, tag: chip(hud, esc(x.x.label), x.x.warm ? C.mari : C.teal, C.paper, 44) }));
    const k = d.kicker ? kicker(layer, d.kicker, 240) : null;
    return {
      sfx: [...pins.map(p => [p.t + 0.3, "tap", 0.55]), ...areas.map(x => [x.t, "tune", 0.4]), ...arcs.map(x => [x.t, "whoosh", 0.4])],
      draw(t) {
        const z = cz(t) * (1 + 0.025 * t / dur), X = cx(t), Y = cy(t);
        camera(cam, { x: X, y: Y, s: z });
        const scr = ll => { const [px, py] = P(ll); return [(px - X) * z + W / 2, (py - Y) * z + H / 2]; };
        areas.forEach((x, i) => { const p = clamp((t - x.t) / 0.9); areaEls[i].setAttribute("opacity", E.out(p) * (0.85 + 0.15 * Math.sin(t * 3))); });
        areaTags.forEach(x => { const [sx, sy] = scr(x.x.at), p = clamp((t - x.t - 0.2) / 0.45);
          put(x.tag, { x: Math.min(W - 60 - x.tag.offsetWidth, Math.max(60, sx - x.tag.offsetWidth / 2)), y: sy - 40 + (1 - E.back(p)) * 40, o: p > 0 ? 1 : 0 }); });
        pins.forEach(p => { const [sx, sy] = scr(p.x.at), q = clamp((t - p.t) / 0.55);
          put(p.pin, { x: sx - 35, y: sy - 94 + (1 - E.back(q)) * -300, o: q > 0 ? 1 : 0 });
          const r = clamp((t - p.t - 0.25) / 0.45);
          put(p.tag, { x: Math.min(W - 60 - p.tag.offsetWidth, Math.max(60, sx - p.tag.offsetWidth / 2)), y: sy - 200 + (1 - E.back(r)) * 30, o: r > 0 ? 1 : 0 }); });
        arcs.forEach(x => { const [x0, y0] = scr(x.x.from), [x1, y1] = scr(x.x.to), mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.35;
          x.p.setAttribute("d", `M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`);
          const L = x.p.getTotalLength(), p = E.io(clamp((t - x.t) / 1.2));
          x.p.style.strokeDasharray = `${L * p} ${L}`; x.p.setAttribute("opacity", p > 0 ? 1 : 0);
          const pt = x.p.getPointAtLength(L * p); x.dot.setAttribute("cx", pt.x); x.dot.setAttribute("cy", pt.y); x.dot.setAttribute("opacity", p > 0 && p < 1 ? 1 : 0); });
        if (k) put(k, { o: tw(t, 0.05, 0.3, 0, 1) });
      }
    };
  };

  // ---- stat: one or two numbers that count up on their cue word ------------------------------------------
  // data: { kicker, items:[{value, prefix, suffix, label, cue, decimals}], note:{text, cue} }
  S.stat = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent(), n = d.items.length;
    const k = kicker(layer, d.kicker, 250);
    const items = d.items.map((x, i) => {
      const top = n === 1 ? 520 : 430 + i * 450;
      const num = el("div", abs + `top:${top}px;left:90px;font:800 ${Math.min(n === 1 ? 260 : 220, Math.round(1500 / String((x.prefix || "") + x.value + (x.suffix || "")).length))}px/1 ${SERIF};color:${a};font-variant-numeric:tabular-nums;white-space:nowrap`, "", layer);
      const bar = el("div", abs + `top:${top + (n === 1 ? 290 : 250)}px;left:90px;width:900px;height:14px;border-radius:7px;background:${a};transform-origin:0 50%`, "", layer);
      const lab = el("div", abs + `top:${top + (n === 1 ? 330 : 285)}px;left:90px;width:900px;font:600 60px/1.2 ${SANS};color:${C.ink}`, esc(x.label), layer);
      return { x, t: cue(x.cue) - 0.15, num, bar, lab };
    });
    const note = d.note ? el("div", abs + `top:${n === 1 ? 1130 : 1350}px;left:90px;width:900px;font:500 52px/1.3 ${SANS};color:${C.muted}`, esc(d.note.text), layer) : null;
    const tNote = d.note ? cue(d.note.cue) : 0;
    return {
      sfx: items.flatMap(x => [[x.t, "tick", 0.5], [x.t + 0.9, "snap", 0.5]]),
      draw(t) {
        put(k, { o: tw(t, 0.05, 0.3, 0, 1), x: tw(t, 0.05, 0.4, -40, 0, E.out) });
        items.forEach(it => { const p = clamp((t - it.t) / 0.9), v = it.x.value * E.out(p);
          it.num.textContent = (it.x.prefix || "") + v.toFixed(it.x.decimals || 0) + (it.x.suffix || "");
          put(it.num, { o: t >= it.t ? 1 : 0, s: 1 + (p > 0.95 && p < 1 ? 0 : 0), y: tw(t, it.t, 0.4, 40, 0, E.out) });
          it.bar.style.transform = `scaleX(${E.out(p)})`; it.bar.style.opacity = 0.9;
          put(it.lab, { o: tw(t, it.t + 0.5, 0.35, 0, 1), y: tw(t, it.t + 0.5, 0.45, 24, 0, E.out) }); });
        if (note) put(note, { o: tw(t, tNote - 0.1, 0.4, 0, 1), y: tw(t, tNote - 0.1, 0.5, 30, 0, E.out) });
      }
    };
  };

  // ---- timeline: the camera rides along a line of years ---------------------------------------------------
  // data: { kicker, points:[{year, label, cue}] }
  S.timeline = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    const pts = []; d.points.forEach((p, i) => pts.push({ ...p, x: i ? pts[i - 1].x + Math.max(560, Math.min(900, (p.year - d.points[i - 1].year) * 40)) : 540, t: cue(p.cue) }));
    const Y = 980, x1 = pts[pts.length - 1].x + 800;
    const base = el("div", abs + `top:${Y - 4}px;left:-400px;width:${x1 + 800}px;height:8px;background:${C.line};border-radius:4px`, "", cam);
    const fill = el("div", abs + `top:${Y - 6}px;left:-400px;width:${x1 + 800}px;height:12px;background:${a};border-radius:6px;transform-origin:0 50%`, "", cam);
    const marks = pts.map(p => ({ p,
      dot: el("div", abs + `width:64px;height:64px;border-radius:50%;background:${C.paper};border:12px solid ${a}`, "", cam),
      year: el("div", abs + `width:560px;text-align:center;font:800 150px/1 ${SERIF};color:${C.ink};font-variant-numeric:tabular-nums`, String(p.year), cam),
      lab: el("div", abs + `width:520px;text-align:center;font:600 54px/1.25 ${SANS};color:${C.muted}`, esc(p.label), cam) }));
    const k = kicker(layer, d.kicker, 250);
    return {
      sfx: pts.map(p => [p.t, "tap", 0.55]),
      draw(t) {
        const keys = [[0, pts[0].x]]; pts.forEach((p, i) => { if (i) keys.push([p.t - 0.2, pts[i - 1].x], [p.t + 0.6, p.x]); });
        const camX = kf(t, keys) + t * 12; camera(cam, { x: camX, y: 960, s: 1 });
        fill.style.transform = `scaleX(${clamp((camX + 400) / (x1 + 800))})`;
        marks.forEach(m => { const q = clamp((t - m.p.t + 0.1) / 0.5);
          put(m.dot, { x: m.p.x - 32, y: Y - 32, s: E.back(q), o: q > 0 ? 1 : 0 });
          put(m.year, { x: m.p.x - 280, y: Y - 260 + (1 - E.out(q)) * 60, o: q });
          put(m.lab, { x: m.p.x - 260, y: Y + 80 + (1 - E.out(q)) * 40, o: tw(t, m.p.t + 0.15, 0.35, 0, 1) }); });
        put(k, { o: tw(t, 0.05, 0.3, 0, 1), x: tw(t, 0.05, 0.4, -40, 0, E.out) });
      }
    };
  };

  // ---- quote / takeaway card --------------------------------------------------------------------------
  // data: { kicker, text, by }
  S.quote = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    layer.style.background = soft;
    const mark = el("div", abs + `top:330px;left:70px;font:800 420px/1 ${SERIF};color:${a};opacity:.9`, "“", layer);
    const k = kicker(layer, d.kicker, 220);
    const body = words(layer, d.text, `top:700px;left:90px;width:900px;font:800 84px/1.22 ${SERIF};color:${C.ink};text-wrap:balance`);
    const by = d.by ? el("div", abs + `top:1330px;left:90px;width:900px;font:500 48px/1.3 ${SANS};color:${C.muted}`, esc(d.by), layer) : null;
    const step = Math.min(0.22, (dur - 1.6) / Math.max(1, body.ws.length));
    return {
      enter: "circle",
      sfx: [[0.3, "page", 0.4]],
      draw(t) {
        put(mark, { s: tw(t, 0.1, 0.6, 0.4, 1, E.back), o: tw(t, 0.1, 0.3, 0, 0.9), r: tw(t, 0.1, 0.6, -12, 0, E.out) });
        put(k, { o: tw(t, 0.05, 0.3, 0, 1) });
        popWords(body.ws, t, 0.45, step);
        if (by) put(by, { o: tw(t, 0.45 + body.ws.length * step, 0.4, 0, 1) });
      }
    };
  };

  // ---- why it matters: one card per exam link ----------------------------------------------------------
  // data: { kicker, items:[{text, sub, cue}] }
  S.chips = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    const k = kicker(layer, d.kicker || "Why it matters", 250);
    const head = el("div", abs + `top:320px;left:90px;width:900px;font:800 96px/1.1 ${SERIF};color:${C.ink}`, esc(d.title || "For your exam"), layer);
    const cards = d.items.map((x, i) => ({ t: cue(x.cue) - 0.1,
      e: el("div", abs + `top:${560 + i * 260}px;left:90px;width:900px;padding:34px 44px;border-radius:32px;background:${i % 2 ? C.surface : soft};border:3px solid ${i % 2 ? C.line : "transparent"}`,
        `<div style="font:700 58px/1.2 ${SANS};color:${a}">${esc(x.text)}</div><div style="font:500 44px/1.3 ${SANS};color:${C.muted};margin-top:6px">${esc(x.sub || "")}</div>`, layer) }));
    return {
      sfx: cards.map(c => [c.t, "nudge", 0.45]),
      draw(t) {
        put(k, { o: tw(t, 0.05, 0.3, 0, 1) }); put(head, { o: tw(t, 0.1, 0.4, 0, 1), y: tw(t, 0.1, 0.5, 30, 0, E.out) });
        cards.forEach(c => put(c.e, { x: tw(t, c.t, 0.55, 900, 0, E.back), o: tw(t, c.t, 0.2, 0, 1) }));
      }
    };
  };

  // ---- quiz hand-off: the question and options; the app shows the real quiz right after -----------------
  // data: { kicker, q, options[], footer }
  S.quiz = (layer, cam, b, cue, dur) => {
    const d = b.data, [a, soft] = accent();
    const k = kicker(layer, d.kicker || "Your turn", 250);
    const q = words(layer, d.q, `top:320px;left:90px;width:900px;font:800 80px/1.2 ${SERIF};color:${C.ink};text-wrap:balance`);
    const opts = d.options.map((o, i) => el("div", abs + `top:${740 + i * 150}px;left:90px;width:900px;padding:26px 38px;border-radius:999px;border:4px solid ${C.ink};background:${C.surface};font:600 50px/1.2 ${SANS};color:${C.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`,
      `<span style="display:inline-block;width:64px;color:${a};font-weight:800">${"ABCD"[i]}</span>${esc(o)}`, layer));
    const foot = el("div", abs + `top:1390px;left:90px;width:900px;font:600 46px ${SANS};color:${a}`, esc(d.footer || "Pick one. The answer comes next."), layer);
    const t0 = 0.5 + q.ws.length * 0.07;
    return {
      sfx: [[0.1, "chime", 0.35], ...opts.map((_, i) => [t0 + i * 0.18, "tick", 0.35])],
      draw(t) {
        put(k, { o: tw(t, 0.05, 0.3, 0, 1) });
        popWords(q.ws, t, 0.2, 0.07);
        opts.forEach((o, i) => put(o, { x: tw(t, t0 + i * 0.18, 0.5, 700, 0, E.back), o: tw(t, t0 + i * 0.18, 0.2, 0, 1) }));
        put(foot, { o: tw(t, t0 + 1, 0.4, 0, 1) * (0.75 + 0.25 * Math.sin(t * 4)) });
      }
    };
  };
})();
