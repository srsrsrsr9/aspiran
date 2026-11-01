// The long home page: the star field, the rooms' interactions, and Chotu walking down the page with the visitor.
// Chotu's scripted lines and questions are below (SCRIPT). Free-text questions go to the Worker's /web/chotu;
// answers are saved to /web/lead as they come in. If the server can't be reached, the page still works and the
// seat form falls back to WhatsApp.

const API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? 'http://localhost:8788'
  : 'https://upsc-pods-production.chotu-aec.workers.dev';
const WA_NUMBER = '919876656573';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll(s)] as T[];
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private window */ } },
};

// ---------------------------------------------------------------- visitor
type Details = Record<string, string>;
const visitorId = store.get('aspiran-vid') ?? `v-${crypto.getRandomValues(new Uint32Array(3)).join('-')}`;
store.set('aspiran-vid', visitorId);
const details: Details = (() => { try { return JSON.parse(store.get('aspiran-details') ?? '{}'); } catch { return {}; } })();
const source = (() => {
  const u = new URL(location.href);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => u.searchParams.get(k)).filter(Boolean).join('/');
  return utm || (document.referrer ? new URL(document.referrer).hostname : 'direct');
})();

let saveTimer = 0;
function setDetail(k: string, v: string) {
  details[k] = v;
  store.set('aspiran-details', JSON.stringify(details));
  renderSummary();
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => postLead().catch(() => {}), 1200);
}
async function postLead(extra: Record<string, unknown> = {}) {
  const r = await fetch(`${API}/web/lead`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ visitorId, details, lang: 'en', source, ...extra }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Could not save');
  return j;
}

// ---------------------------------------------------------------- star field
(() => {
  const c = $<HTMLCanvasElement>('#stars');
  const g = c.getContext('2d');
  if (!g) return;
  let w = 0, h = 0, dpr = 1;
  const stars = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() ** 2, t: Math.random() * 6.28 }));
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
  const draw = (now: number) => {
    g.clearRect(0, 0, w, h);
    const sy = scrollY * dpr;
    for (const s of stars) {
      const y = (((s.y * h - sy * (0.05 + s.z * 0.25)) % h) + h) % h;
      const tw = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(now / 900 + s.t);
      g.globalAlpha = (0.25 + s.z * 0.75) * tw;
      g.fillStyle = s.z > 0.85 ? '#FFD9A0' : '#DDE3FF';
      g.beginPath(); g.arc(s.x * w, y, (0.4 + s.z * 1.4) * dpr, 0, 6.283); g.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  if (reduced) addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
})();

// ---------------------------------------------------------------- reveals
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.25 });
$$('[data-reveal], .pause, .snaps, .podviz').forEach((el) => io.observe(el));

// Room 12: each "never" gets struck through as it passes the middle of the screen.
const strikeIo = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { const li = e.target; setTimeout(() => li.classList.add('x'), 250); strikeIo.unobserve(li); }
}), { rootMargin: '0px 0px -45% 0px' });
$$('#strike li').forEach((li) => strikeIo.observe(li));

// ---------------------------------------------------------------- Room 02: the leak
(() => {
  const path = $('#leak-path'), dots = $('#leak-dots'), chart = $('.leak-chart');
  const X0 = 40, X1 = 580, Y0 = 200, TOP = 50;
  const y = (v: number) => Y0 - (Y0 - TOP) * v;
  const read = () => {
    let d = '';
    for (let i = 0; i <= 120; i++) { const t = i / 120; d += `${i ? 'L' : 'M'}${(X0 + (X1 - X0) * t).toFixed(1)},${y(0.12 + 0.88 * Math.exp(-t * 9)).toFixed(1)}`; }
    return { d, reviews: [] as number[] };
  };
  const aspiran = () => {
    const reviews = [0.02, 0.06, 0.15, 0.34, 0.68];
    let d = '', last = 0, rate = 9, i0 = true;
    for (let i = 0; i <= 240; i++) {
      const t = i / 240;
      const r = reviews.filter((x) => x <= t).length;
      const since = r ? reviews[r - 1] : 0;
      if (r !== last) { last = r; rate = 9 / (1 + r * 1.6); }
      const v = 0.18 + 0.8 * Math.exp(-(t - since) * rate);
      d += `${i0 ? 'M' : 'L'}${(X0 + (X1 - X0) * t).toFixed(1)},${y(v).toFixed(1)}`; i0 = false;
    }
    return { d, reviews };
  };
  const show = (mode: 'read' | 'aspiran') => {
    const p = mode === 'read' ? read() : aspiran();
    path.setAttribute('d', p.d);
    chart.classList.toggle('on', mode === 'aspiran');
    dots.innerHTML = p.reviews.map((t) => `<circle cx="${X0 + (X1 - X0) * t}" cy="${y(0.98)}" r="5"><title>A short review</title></circle>`).join('');
    if (!reduced) {
      const len = (path as unknown as SVGPathElement).getTotalLength();
      path.style.transition = 'none'; path.style.strokeDasharray = `${len}`; path.style.strokeDashoffset = `${len}`;
      requestAnimationFrame(() => { path.style.transition = 'stroke-dashoffset 1.6s ease-out, stroke .4s'; path.style.strokeDashoffset = '0'; });
    }
    $$('[data-leak]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.leak === mode)));
  };
  $$('[data-leak]').forEach((b) => b.addEventListener('click', () => show(b.dataset.leak as 'read' | 'aspiran')));
  show('read');
  // Flip to the good version once on its own, the first time the chart is properly in view.
  const once = new IntersectionObserver(([e]) => { if (e.isIntersecting) { once.disconnect(); setTimeout(() => show('aspiran'), 2600); } }, { threshold: 0.7 });
  once.observe(chart);
})();

// ---------------------------------------------------------------- Room 03: the sky
(() => {
  const svg = $('#sky'), wrap = $('#sky-wrap'), month = $('#sky-month'), tip = $('#sky-tip');
  const centres: Record<string, [number, number]> = {
    GS1: [190, 170], GS2: [450, 135], GS3: [740, 175], GS4: [860, 420], Essay: [585, 415], CSAT: [345, 430], Optional: [120, 420],
  };
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = $$<SVGGElement>('#sky .star').map((el) => {
    const [cx, cy] = centres[el.dataset.paper!];
    const a = rnd() * 6.283, r = 18 + rnd() * 78;
    const x = cx + Math.cos(a) * r * 1.25, y = cy + Math.sin(a) * r * 0.8;
    el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    const met = 0.04 + rnd() * 0.55, recall = met + 0.12 + rnd() * 0.25, use = rnd() < 0.45 ? recall + 0.08 + rnd() * 0.25 : 2;
    return { el, x, y, paper: el.dataset.paper!, topic: el.dataset.topic!, met, recall, use, state: '' };
  });
  // Constellation lines: each star to its nearest neighbour in the same paper.
  const lines = $('#sky-lines');
  const links: [number, number][] = [];
  stars.forEach((s, i) => {
    let best = -1, bd = 1e9;
    stars.forEach((o, j) => { if (j !== i && o.paper === s.paper) { const d = (o.x - s.x) ** 2 + (o.y - s.y) ** 2; if (d < bd) { bd = d; best = j; } } });
    if (best >= 0 && !links.some(([a, b]) => (a === best && b === i))) links.push([i, best]);
  });
  lines.innerHTML = links.map(([a, b]) => `<line x1="${stars[a].x}" y1="${stars[a].y}" x2="${stars[b].x}" y2="${stars[b].y}" data-a="${a}" data-b="${b}"/>`).join('');
  $('#sky-labels').innerHTML = Object.entries(centres).map(([k, [x, y]]) => `<text x="${x}" y="${y - 108}" text-anchor="middle">${k.toUpperCase()}</text>`).join('');
  const lineEls = $$<SVGLineElement>('#sky-lines line');
  const label = { '': 'not started', met: 'met', recall: 'can recall', use: 'can use' } as Record<string, string>;

  const paint = (p: number) => {
    let m = 0, r = 0, u = 0;
    for (const s of stars) {
      const st = p >= s.use ? 'use' : p >= s.recall ? 'recall' : p >= s.met ? 'met' : '';
      if (st !== s.state) { s.el.classList.remove('met', 'recall', 'use'); if (st) s.el.classList.add(st); s.state = st; }
      s.el.setAttribute('aria-label', `${s.paper}: ${s.topic}, ${label[st]}`);
      if (st) m++; if (st === 'recall' || st === 'use') r++; if (st === 'use') u++;
    }
    lineEls.forEach((l) => l.classList.toggle('lit', !!stars[+l.dataset.a!].state && !!stars[+l.dataset.b!].state));
    const mo = Math.min(12, Math.round(p * 12));
    month.textContent = mo === 0 ? 'MONTH 0 · FOG' : `MONTH ${mo} · ${m} MET · ${r} CAN RECALL · ${u} CAN USE`;
  };
  const onScroll = () => {
    const b = wrap.getBoundingClientRect();
    const total = b.height - innerHeight * 0.8;
    paint(Math.max(0, Math.min(1, (-b.top + innerHeight * 0.15) / Math.max(total, 1))));
  };
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();
  const pick = (s: (typeof stars)[number]) => { tip.textContent = `${s.paper} · ${s.topic}: ${label[s.state]}`; };
  stars.forEach((s) => { s.el.addEventListener('click', () => pick(s)); s.el.addEventListener('focus', () => pick(s)); });
  void svg;
})();

// ---------------------------------------------------------------- Room 04: recall
$$('#recall-opts button').forEach((b) => b.addEventListener('click', () => {
  const a = b.dataset.a!;
  $$<HTMLButtonElement>('#recall-opts button').forEach((x) => { x.disabled = true; if (x.dataset.a === '1') x.classList.add('right'); });
  if (a !== '1' && a !== 'x') b.classList.add('wrong');
  const out = $('#recall-out');
  out.hidden = false;
  out.textContent = a === '1'
    ? 'Once. 1976, the 42nd Amendment. You just pulled that out of memory after a few minutes and a lot of scrolling. That pull is what makes it stay.'
    : a === 'x'
      ? "Once: 1976, the 42nd Amendment. Saying \"no idea\" is honest, and the correction you just read will stick better than if you'd only re-read it."
      : "It's once: 1976, the 42nd Amendment. A miss you've just corrected is often remembered better than a fact you only re-read.";
  setDetail('recall', a === '1' ? 'right' : a === 'x' ? 'no idea' : 'missed');
  chotuSays(a === '1' ? `Look at you${details.name ? ', ' + details.name : ''}. Told you I'd check.` : 'No shame. Now you will remember it. That is literally how this works.');
}, { once: true }));

// ---------------------------------------------------------------- Room 05: mark, then compare
(() => {
  const rows = [
    ['Directive', 4, 'It does explain, mostly. "Role in fiscal federalism" needed one line on what that means.'],
    ['Structure', 2, 'No introduction, no headings: one block of facts.'],
    ['Content', 3, 'Accurate, but misses the vertical and horizontal gap the Commission exists to close.'],
    ['Examples', 2, 'One number. No state, no dispute, no grant in action.'],
    ['Conclusion', 1, '"Very important" is not a conclusion.'],
  ] as const;
  const mine: (number | null)[] = rows.map(() => null);
  const box = $('#rubric'), btn = $<HTMLButtonElement>('#mark-reveal');
  box.innerHTML = rows.map(([n], i) => `<div class="rrow" data-r="${i}"><b>${n}</b><div class="taps" role="group" aria-label="Your mark for ${n}, 1 to 5">${[1, 2, 3, 4, 5].map((v) => `<button type="button" data-v="${v}" aria-pressed="false">${v}</button>`).join('')}</div><span class="gap"></span></div>`).join('');
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button'); if (!b || btn.dataset.done) return;
    const r = +(b.closest('.rrow') as HTMLElement).dataset.r!;
    mine[r] = +b.dataset.v!;
    b.parentElement!.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    btn.disabled = mine.some((v) => v === null);
  });
  btn.addEventListener('click', () => {
    btn.dataset.done = '1'; btn.disabled = true;
    let gap = 0;
    rows.forEach(([, ai, why], i) => {
      const row = box.querySelector(`[data-r="${i}"]`)!;
      row.querySelector(`button[data-v="${ai}"]`)!.classList.add('ai');
      const d = (mine[i] ?? 0) - ai; gap += Math.abs(d);
      row.querySelector('.gap')!.textContent = `AI: ${ai}. ${d === 0 ? 'Same as yours.' : d > 0 ? `You were ${d} kinder.` : `You were ${-d} harsher.`} ${why}`;
    });
    const out = $('#mark-out'); out.hidden = false;
    out.textContent = gap <= 3
      ? `You were ${gap} points off in total. That's a sharp eye already. Most people start 6 to 10 off.`
      : `You were ${gap} points off in total. Most people start there, and kinder than an examiner. Closing that gap is the skill.`;
    chotuSays('Gold rings are my marks. Now imagine rewriting just the conclusion. Five minutes. That is the whole loop.');
  });
})();

// ---------------------------------------------------------------- Room 06: pluck the line
(() => {
  const petals = $('#petals'), RIGHT = 3;
  const sec = $('#pluck');
  const onScroll = () => {
    const b = sec.getBoundingClientRect();
    const p = (innerHeight / 2 - (b.top + b.height / 2)) / innerHeight;
    if (!reduced) petals.style.setProperty('--drift', Math.max(-1.4, Math.min(1.4, p * 2.2)).toFixed(3));
  };
  $$('.petal').forEach((el) => el.style.setProperty('--drift', 'inherit'));
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  let done = false;
  petals.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('.petal') as HTMLElement | null; if (!b || done) return;
    const i = +b.dataset.i!, out = $('#pluck-out'); out.hidden = false;
    if (i === RIGHT) {
      done = true;
      $$('.petal').forEach((p) => p.classList.toggle('wilt', p !== b));
      b.classList.add('plucked');
      out.textContent = 'Plucked. "Decided in budget meetings" is the proof: people decide, before the weather arrives.';
      setDetail('pluck', 'right');
    } else if (i === 5) {
      b.classList.add('miss');
      out.textContent = "Tempting. That line states the claim; it doesn't prove it. CSAT loves this trap. Try once more.";
      setDetail('pluck', 'trap');
    } else {
      b.classList.add('miss');
      out.textContent = 'Close, but this one is about money or habit, not a decision. Look for who decides.';
    }
  });
})();

// ---------------------------------------------------------------- Room 07: keep for Mains
$('#keep').addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLButtonElement;
  b.disabled = true; b.textContent = 'Kept ✓';
  $('#chai-card').classList.add('kept');
  $('#case-list').innerHTML = '<li class="new">Example: ward-level heat plans. Shows that adaptation works best at the smallest level that can act.</li><li class="dim">Three more slots for this topic.</li>';
  setDetail('chai', 'kept');
  chotuSays("Filed. In Mains, that's an example ready to use, not a headline you half remember.");
}, { once: true });

// ---------------------------------------------------------------- Room 08: are you sure?
(() => {
  const qs = [
    { s: 'The President can dissolve the Rajya Sabha.', a: false, why: "False. It's a permanent house; a third of its members retire every two years." },
    { s: 'B. R. Ambedkar called Article 32 the "heart and soul" of the Constitution.', a: true, why: 'True. Article 32 is the right to go to the Supreme Court to enforce your fundamental rights.' },
    { s: 'The Tropic of Cancer passes through eight Indian states.', a: true, why: 'True: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, Mizoram.' },
  ];
  const ans: { tf?: boolean; sure?: boolean }[] = qs.map(() => ({}));
  const box = $('#cal');
  box.innerHTML = qs.map((q, i) => `<div class="calq" data-q="${i}"><p>${q.s}</p><div class="row">
    <button type="button" data-tf="1" aria-pressed="false">True</button><button type="button" data-tf="0" aria-pressed="false">False</button>
    <span class="sep">AND</span>
    <button type="button" data-sure="1" aria-pressed="false">I'm sure</button><button type="button" data-sure="0" aria-pressed="false">Not sure</button>
    </div><p class="why" hidden></p></div>`).join('');
  box.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button'); if (!b) return;
    const qEl = b.closest('.calq') as HTMLElement, i = +qEl.dataset.q!;
    if (qEl.dataset.done) return;
    if (b.dataset.tf) { ans[i].tf = b.dataset.tf === '1'; qEl.querySelectorAll('[data-tf]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }
    if (b.dataset.sure) { ans[i].sure = b.dataset.sure === '1'; qEl.querySelectorAll('[data-sure]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }
    if (ans[i].tf === undefined || ans[i].sure === undefined) return;
    qEl.dataset.done = '1';
    const right = ans[i].tf === qs[i].a;
    qEl.querySelector(`[data-tf="${ans[i].tf ? 1 : 0}"]`)!.classList.add(right ? 'right' : 'wrong');
    const why = qEl.querySelector('.why') as HTMLElement; why.hidden = false; why.textContent = qs[i].why;
    if (ans.every((x) => x.tf !== undefined && x.sure !== undefined)) {
      const sure = ans.filter((x) => x.sure);
      let sr = 0, ur = 0; const un = ans.filter((x) => !x.sure).length;
      ans.forEach((x, k) => { const ok = x.tf === qs[k].a; if (x.sure && ok) sr++; if (!x.sure && ok) ur++; });
      const out = $('#cal-out'); out.hidden = false;
      out.textContent = sure.length === 0
        ? `You weren't sure of any, and got ${ur} of 3 right. You know more than you trust. That's worth working on: it costs marks when you skip.`
        : sr === sure.length
          ? `When you were sure, you were right ${sr} of ${sure.length}.${un ? ` When you weren't, ${ur} of ${un}.` : ''} Trust that feeling. Aspiran checks it every month.`
          : `When you were sure, you were right ${sr} of ${sure.length}. One confident miss is a third of a mark gone in Prelims. Those are the ones Aspiran shows you first.`;
      setDetail('calibration', `${sr}/${sure.length} sure-right`);
    }
  });
})();

// ---------------------------------------------------------------- Room 10: sleep
(() => {
  const range = $<HTMLInputElement>('#sleep-range'), out = $('#sleep-out'), cap = $('#sleep-cap'), sky = $('#sleep-sky');
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const dots = Array.from({ length: 48 }, (_, i) => ({ x: 20 + rnd() * 560, y: 16 + rnd() * 108, r: 2 + rnd() * 3, k: rnd(), i }));
  sky.innerHTML = dots.map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="#7FE3F0"/>`).join('');
  const cs = [...sky.querySelectorAll('circle')];
  const kept = (h: number) => Math.max(0.3, Math.min(1, 0.3 + (h - 4) * 0.17)); // an illustration, not a measurement
  let moved = false;
  const show = () => {
    const h = +range.value, f = kept(h);
    out.textContent = `${h} h`;
    cs.forEach((c, i) => { const on = dots[i].k < f; c.style.opacity = on ? '1' : '.12'; c.setAttribute('fill', on ? (h >= 7 ? '#7FE3F0' : '#FFC56B') : '#3A3F66'); });
    cap.textContent = h < 6
      ? "Under six hours for a week and the stars go out, quietly. You won't feel it happen. Your recall will."
      : h < 7 ? 'Close. One more hour of sleep is the cheapest revision there is.'
        : 'Sleep is part of the syllabus. This is where last week\'s reading settles in.';
  };
  range.addEventListener('input', () => { show(); moved = true; });
  range.addEventListener('change', () => { if (moved) setDetail('sleep', `${range.value} h (slider)`); });
  show();
})();

// ---------------------------------------------------------------- Chotu
type Ask = { key: string; q: string; chips?: string[]; text?: boolean; then?: (v: string) => string | Ask | void };
type Beat = { say?: string | (() => string); ask?: Ask };
const nm = () => (details.name ? `, ${details.name}` : '');
const SCRIPT: Record<string, Beat> = {
  hero: {
    say: () => {
      const hr = new Date().getHours(), m = new Date().getMinutes();
      const late = hr === 23 && m >= 30 || hr < 7;
      return late
        ? "Namaste! I'm Chotu · AI, a chai cup with opinions. It's late, so I'm half asleep: I'll walk with you, but my typed replies wait till 7 a.m."
        : "Namaste! I'm Chotu · AI, a chai cup with opinions. I'll walk down this page with you.";
    },
    ask: {
      key: 'name', q: 'What should I call you?', text: true, chips: ['Skip'],
      then: (v) => v === 'Skip' ? 'Mystery aspirant. I respect it. Scroll on, I\'ll keep up.' : `Nice to meet you, ${v}. Scroll on. Something in the first room is a trap.`,
    },
  },
  plant: { say: 'Seriously. Remember that fact. I will check.' },
  leak: {
    ask: {
      key: 'attempt', q: `Which attempt is this${nm()}?`, chips: ['Not started yet', 'First', 'Second', 'Third or more'],
      then: (v) => v === 'Not started yet' ? 'Perfect time. No bad habits to unlearn.'
        : v === 'First' ? 'First attempt. The leak is the thing to fix early.'
          : "Then you've felt the leak. This time we plug it.",
    },
  },
  sky: {
    ask: {
      key: 'medium', q: 'Which medium will you write Mains in?', chips: ['English', 'Hindi', 'Not sure yet'],
      then: (v) => v === 'Hindi' ? 'हिंदी, बढ़िया। Notes, practice and answer feedback, all in Hindi.' : 'Noted. Every topic carries its terms in both languages anyway.',
    },
  },
  recall: { say: "Here's the check I promised. No scrolling up!" },
  write: {
    ask: {
      key: 'optional', q: 'Picked your optional yet?', chips: ['Not yet', 'Yes'],
      then: (v) => v === 'Yes'
        ? { key: 'optional', q: 'Which one?', text: true, then: (o) => `${o}. Good. Optional repeats its themes a lot, so we start from its past papers.` }
        : 'No rush. Pick it from its past papers, not from what is popular.',
    },
  },
  pluck: { say: 'CSAT is boring until the year it fails someone. Pluck the right line.' },
  chai: {
    ask: {
      key: 'hours', q: 'On a normal day, how many hours can you really study?', chips: ['Under 3', '3 to 6', '6 or more', 'Working, so evenings'],
      then: (v) => v === 'Working, so evenings' ? 'Then your plan gets built for evenings. Nobody here assumes eight free hours.'
        : v === '6 or more' ? 'Good. Around four of those can be truly focused. The rest is reading, review and rest.' : 'Enough, if they are the right hours.',
    },
  },
  sure: { say: 'Negative marking punishes confident mistakes. Let\'s see how sure you are.' },
  pod: {
    ask: {
      key: 'worry', q: "What's the hardest part of prep for you right now?", text: true,
      chips: ['Staying consistent', 'Answer writing', 'Too much to cover', 'Feeling alone'],
      then: (v) => /consist/i.test(v) ? "Then here's a secret: the plan survives missed days. Nothing breaks, nothing piles up. You just pick up today's three."
        : /answer|writ/i.test(v) ? 'Then the Mains room was for you. Skeleton drills: two minutes each, ten a week.'
          : /alone|lonely/i.test(v) ? "That's what the pod is for. Real people, at your stage."
            : /much|cover|syllab/i.test(v) ? 'The sky helps: one star at a time, and you can see which ones are lit.'
              : 'Thank you for telling me. I\'ll make sure your pod hears what matters.',
    },
  },
  yours: {
    ask: {
      key: 'sleep', q: 'Honest answer: how did you sleep last night?', chips: ['Under 6 h', '6 to 7 h', '7 to 8 h', '8 h or more'],
      then: (v) => v === 'Under 6 h' ? 'Hmm. Tonight, try the cheapest revision there is.' : 'Good. Last night counts as study.',
    },
  },
  never: { say: 'Notice what is missing? Good.' },
  interview: { say: 'Picture me on the board, in a tiny bandhgala.' },
  price: { say: '₹999 for the first 300 on the website. After that it is ₹9,999. Just saying.' },
  seat: { say: () => `Here's everything you told me${nm()}. Leave a number or email and I'll save your seat.` },
};

const dock = $('#dock'), log = $('#dock-log'), chips = $('#dock-chips'), bubble = $('#dock-bubble');
const input = $<HTMLInputElement>('#dock-in'), cup = $('#dock-cup');
const seen = new Set<string>();
const queue: Ask[] = [];
let pending: Ask | null = null;
const chat: { role: 'user' | 'assistant'; content: string }[] = [];

const openDock = (v: boolean) => {
  dock.dataset.open = String(v); cup.setAttribute('aria-expanded', String(v));
  if (v) { bubble.hidden = true; log.scrollTop = log.scrollHeight; setTimeout(() => input.focus({ preventScroll: true }), 50); }
};
cup.addEventListener('click', () => openDock(dock.dataset.open !== 'true'));
$('#dock-x').addEventListener('click', () => openDock(false));
bubble.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('button')) openDock(true); });
$$('[data-open-chotu]').forEach((b) => b.addEventListener('click', () => openDock(true)));
addEventListener('keydown', (e) => { if (e.key === 'Escape' && dock.dataset.open === 'true') openDock(false); });

function add(cls: 'c' | 'u', text: string) {
  const el = document.createElement('div'); el.className = `msg ${cls}`; el.textContent = text;
  log.appendChild(el); log.scrollTop = log.scrollHeight;
  return el;
}
function gesture() {
  $$('[data-chotu="dock"] .ch-gest').forEach((g) => { g.setAttribute('class', 'ch-gest'); void g.getBoundingClientRect(); g.setAttribute('class', `ch-gest gst${Math.floor(Math.random() * 6)}`); });
}
let bubbleTimer = 0;
const narrow = () => innerWidth < 600;
function chotuSays(text: string, ask?: Ask) {
  add("c", text);
  ask ??= pending ?? undefined; // a question still open keeps its buttons under any new line
  clearTimeout(bubbleTimer);
  // On phones the bubble steps aside after a few seconds; a dot on the cup says a question is waiting.
  if (!ask || narrow()) bubbleTimer = window.setTimeout(() => { bubble.hidden = true; }, ask ? 7000 : narrow() ? 5000 : 9000);
  if (dock.dataset.open !== 'true') {
    bubble.hidden = false;
    bubble.innerHTML = '';
    const p = document.createElement('div'); p.textContent = text; bubble.appendChild(p);
    if (ask && ask.q !== text) { const q = document.createElement("div"); q.style.marginTop = "6px"; q.style.fontWeight = "600"; q.textContent = ask.q; bubble.appendChild(q); }
    if (ask?.chips) {
      const row = document.createElement('div'); row.className = 'dock-chips'; row.style.padding = '8px 0 0';
      ask.chips.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => answer(c); row.appendChild(b); });
      if (ask.text) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Type…'; b.onclick = () => openDock(true); row.appendChild(b); }
      bubble.appendChild(row);
    }
  }
  if (!reduced) gesture();
}
function renderChips(ask: Ask | null) {
  chips.innerHTML = '';
  ask?.chips?.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => answer(c); chips.appendChild(b); });
  input.placeholder = ask?.text ? 'Type your answer' : 'Ask Chotu anything';
}
let ignored = 0;
function askNow(a: Ask) {
  pending = a; ignored = 0; dock.dataset.waiting = 'true';
  const q = typeof a.q === 'string' ? a.q : '';
  chotuSays(q, a);
  renderChips(a);
}
function next() {
  pending = null; renderChips(null); dock.dataset.waiting = 'false';
  const a = queue.shift();
  if (a) setTimeout(() => { if (!details[a.key] || a.key === 'optional') askNow(a); else next(); }, 900);
}
function answer(v: string) {
  const a = pending; if (!a) return;
  add('u', v);
  if (v !== 'Skip') setDetail(a.key, v);
  const r = a.then?.(v);
  if (r && typeof r === 'object') { setTimeout(() => askNow(r), 600); pending = null; renderChips(null); dock.dataset.waiting = 'false'; return; }
  if (typeof r === 'string') setTimeout(() => chotuSays(r), 500);
  setTimeout(next, 900);
}
function beat(scene: string) {
  if (seen.has(scene)) return; seen.add(scene);
  // A question left unanswered for two rooms is dropped quietly; nobody is chased down the page.
  if (pending && ++ignored >= 2) { pending = null; renderChips(null); dock.dataset.waiting = 'false'; }
  const b = SCRIPT[scene]; if (!b) return;
  if (b.say) chotuSays(typeof b.say === 'function' ? b.say() : b.say);
  if (b.ask) {
    // Questions are re-phrased at the moment they're asked, so the name lands if we have it.
    const fresh = scene === 'leak' ? { ...b.ask, q: `Which attempt is this${nm()}?` } : b.ask;
    if (details[fresh.key] && fresh.key !== 'optional') return;
    if (pending) queue.push(fresh); else setTimeout(() => askNow(fresh), b.say ? 1100 : 0);
  }
}
const sceneIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) beat((e.target as HTMLElement).dataset.scene!); }), { threshold: 0.35 });
// Chotu always says hello first, even when the page opens part-way down (a reload, a shared link).
setTimeout(() => { beat('hero'); $$('[data-scene]').forEach((s) => sceneIo.observe(s)); }, 700);

$('#dock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = input.value.trim(); if (!v) return;
  input.value = '';
  // A typed reply answers the open question unless it is clearly a question of its own.
  const looksLikeQuestion = /\?/.test(v) || (pending?.key === "name" && v.split(/\s+/).length > 3);
  if (pending?.text && !looksLikeQuestion) { answer(v); return; }
  add('u', v);
  chat.push({ role: 'user', content: v });
  const t = add('c', 'Chotu is thinking…'); t.classList.add('typing');
  try {
    const r = await fetch(`${API}/web/chotu`, {
      signal: AbortSignal.timeout(35_000),
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId, messages: chat.slice(-8), details, lang: /[ऀ-ॿ]/.test(v) ? 'hi' : 'en' }),
    });
    const j = await r.json().catch(() => ({}));
    t.remove();
    if (j.care) {
      add('c', "I'm an AI, and this matters too much for me to get wrong. Please talk to someone now: Tele-MANAS, 14416 (free, 24 hours). If you're in danger, call 112.");
      return;
    }
    const reply = j.reply || j.error || "I can't reach my brain right now. Try again in a minute, or leave your details below.";
    add('c', reply);
    if (j.reply) chat.push({ role: 'assistant', content: j.reply });
  } catch {
    t.remove();
    add('c', "I can't reach my brain right now. The page still works, and you can leave your details at the end.");
  }
  if (!reduced) gesture();
});

// ---------------------------------------------------------------- Room 17: the seat
const LABELS: Record<string, string> = {
  name: 'Name', attempt: 'Attempt', medium: 'Medium', optional: 'Optional', hours: 'Hours a day', worry: 'Hardest part',
  sleep: 'Sleep', recall: 'Room 01 recall', pluck: 'CSAT line', chai: 'Case file', calibration: 'When sure',
};
function renderSummary() {
  const dl = $('#seat-summary');
  const rows = Object.entries(LABELS).filter(([k]) => details[k]);
  if (!rows.length) return;
  dl.innerHTML = '';
  rows.forEach(([k, l]) => {
    const dt = document.createElement('dt'); dt.textContent = l;
    const dd = document.createElement('dd'); dd.textContent = details[k];
    dl.append(dt, dd);
  });
  $('#seat-h').textContent = details.name ? `Here's what Chotu knows about you, ${details.name}.` : "Here's what Chotu knows about you.";
  const wa = $<HTMLAnchorElement>('#seat-wa');
  wa.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText())}`;
}
const waText = () => `Hi Aspiran! I'd like a seat in the first pod batch.\n` +
  Object.entries(LABELS).filter(([k]) => details[k] && ['name', 'attempt', 'medium', 'optional', 'hours'].includes(k)).map(([k, l]) => `${l}: ${details[k]}`).join('\n');
renderSummary();

$('#seat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = $('#seat-out'), contact = $<HTMLInputElement>('#seat-contact').value.trim(), ok = $<HTMLInputElement>('#seat-ok').checked;
  const hp = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('input[name="company"]')!.value;
  out.className = 'form-out';
  if (!contact) { out.textContent = 'Add a WhatsApp number or an email.'; out.classList.add('err'); return; }
  if (!ok) { out.textContent = 'Tick the box so we can message you.'; out.classList.add('err'); return; }
  out.textContent = 'Saving…';
  try {
    await postLead({ contact, consent: true, company: hp });
    out.textContent = `Seat saved${nm()}. We'll message you when your pod batch opens.`; out.classList.add('ok');
    chotuSays(`Saved${nm()}. See you in the pod. I'll bring the chai.`);
  } catch (err) {
    const msg = (err as Error).message;
    if (/look like|Tick/.test(msg)) { out.textContent = msg; out.classList.add('err'); return; }
    out.innerHTML = '';
    const a = document.createElement('a');
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText() + `\nContact: ${contact}`)}`; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = "Our server didn't answer. Tap here to send it on WhatsApp instead.";
    out.appendChild(a);
  }
});
export {};
