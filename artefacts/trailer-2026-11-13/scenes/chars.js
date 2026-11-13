// The trailer's three characters as SVG strings, drawn from parameters so every frame can set an expression.
// Flat shapes, warm tones, no real person's likeness. Chotu is the app's own drawing (marketing prompt section 7)
// with his face and steam made adjustable.
(function () {
  const INK = "#2A1B12";

  // ---------------------------------------------------------------- Chotu, the clay chai cup (200 x 230 box)
  // o: {eyes: 0 open..1 closed, look:[dx,dy], wide:0..1, mouth:'smile'|'o'|'flat'|'grin'|'pout', steam:'curl'|'up'|'spiral'|'none', ph: steam phase, cheeks:0..1, flame:0..1}
  function chotu(o = {}) {
    const e = o.eyes || 0, [lx, ly] = o.look || [0, 0], wide = o.wide || 0, ph = o.ph || 0, puff = o.cheeks || 0;
    const ry = 11 * (1 + wide * 0.35) * (1 - e * 0.9), rx = 8 * (1 + wide * 0.25);
    const eye = (cx) => e > 0.85
      ? `<path d="M${cx - 9} 121 Q${cx} 127 ${cx + 9} 121" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
      : `<ellipse cx="${cx + lx}" cy="${120 + ly}" rx="${rx}" ry="${ry}" fill="${INK}"/><circle cx="${cx + 3 + lx}" cy="${115 + ly}" r="${3 * (1 - e)}" fill="#fff"/>`;
    const m = {
      smile: `<path d="M88 140Q100 154 112 140" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      grin: `<path d="M84 138Q100 162 116 138Z" fill="${INK}"/><path d="M90 146Q100 154 110 146" fill="#E07A6A"/>`,
      o: `<ellipse cx="100" cy="146" rx="7" ry="9" fill="${INK}"/>`,
      flat: `<path d="M90 145H110" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      pout: `<path d="M90 148Q100 140 110 148" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      smirk: `<path d="M88 144Q102 150 113 138" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    }[o.mouth || "smile"];
    const w = (i) => Math.sin(ph * 2 + i * 1.3) * 4;
    const steam = {
      curl: `<path d="M80 52c-8-10 ${8 + w(0)} -14 0 -26"/><path d="M100 48c-8-10 ${8 + w(1)} -14 0 -28"/><path d="M120 52c-8-10 ${8 + w(2)} -14 0 -26"/>`,
      up: `<path d="M80 54V${18 + w(0)}"/><path d="M100 50V${8 + w(1)}"/><path d="M120 54V${18 + w(2)}"/>`,
      spiral: `<path d="M100 50c-14-6-14-24 0-26c12-2 14 14 2 16c-6 1-7-7-1-7"/><path d="M76 54c-6-8 4-12-2-20"/><path d="M124 54c6-8-4-12 2-20"/>`,
      none: ``
    }[o.steam || "curl"];
    const flame = o.flame ? `<g transform="translate(150 60) scale(${o.flame})"><path d="M0 0C-12 -10 -6 -24 0 -34C2 -24 14 -18 8 -4C6 2 2 2 0 0Z" fill="#F0A04B"/><path d="M0 -4C-5 -9 -3 -16 0 -20C2 -14 6 -10 3 -5Z" fill="#FFE0A8"/></g>` : "";
    return `<svg viewBox="0 0 200 230" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <ellipse cx="100" cy="216" rx="58" ry="8" fill="#000" opacity=".28"/>
  <g fill="none" stroke="#F0A04B" stroke-width="5" stroke-linecap="round" opacity=".95">${steam}</g>
  <ellipse cx="36" cy="132" rx="17" ry="9" fill="#9A4A26"/><ellipse cx="164" cy="132" rx="17" ry="9" fill="#9A4A26"/>
  <path d="M38 74H162L148 192Q146 208 130 208H70Q54 208 52 192Z" fill="#C8693A"/>
  <path d="M45 150H155L148 192Q146 208 130 208H70Q54 208 52 192Z" fill="#9A4A26" opacity=".35"/>
  <path d="M50 84 L58 180" stroke="#E9A274" stroke-width="5" stroke-linecap="round" opacity=".45"/>
  <ellipse cx="100" cy="74" rx="64" ry="12" fill="#E08A55"/><ellipse cx="100" cy="74" rx="54" ry="7.5" fill="#6B3A1F"/>
  ${eye(76)}${eye(124)}
  <ellipse cx="58" cy="142" rx="${9 + puff * 5}" ry="${6 + puff * 4}" fill="#F2A27C" opacity=".8"/><ellipse cx="142" cy="142" rx="${9 + puff * 5}" ry="${6 + puff * 4}" fill="#F2A27C" opacity=".8"/>
  ${m}
  <rect x="82" y="168" width="36" height="20" rx="6" fill="#FFF6EA"/>
  <text x="100" y="183" text-anchor="middle" font-family="Plex, monospace" font-size="13" font-weight="700" fill="#6B3A1F">AI</text>
  ${flame}
</svg>`;
  }

  // ---------------------------------------------------------------- The aspirant, a young woman, bust (400 x 460 box)
  // o: {brow:'neutral'|'worried'|'tired'|'up'|'sure', mouth:'flat'|'o'|'smile'|'grit'|'talk', eyes:0..1 closed, look:[dx,dy], talk:0..1, sweat:0..1, glow:0..1}
  function hero(o = {}) {
    const [lx, ly] = o.look || [0, 0], e = o.eyes || 0, talk = o.talk || 0;
    const brows = {
      neutral: ["M140 186 Q160 178 180 184", "M220 184 Q240 178 260 186"],
      worried: ["M140 182 Q162 182 180 172", "M220 172 Q238 182 260 182"],
      tired: ["M140 190 Q160 186 180 190", "M220 190 Q240 186 260 190"],
      up: ["M140 176 Q160 164 180 172", "M220 172 Q240 164 260 176"],
      sure: ["M140 184 Q160 176 182 182", "M218 182 Q240 176 260 184"]
    }[o.brow || "neutral"];
    const lid = o.brow === "tired" ? 0.45 : 0;
    const ee = Math.max(e, lid), ry = 13 * (1 - ee * 0.85);
    const eye = (cx) => ee > 0.9
      ? `<path d="M${cx - 12} 212 Q${cx} 218 ${cx + 12} 212" fill="none" stroke="#1E1410" stroke-width="4" stroke-linecap="round"/>`
      : `<ellipse cx="${cx + lx}" cy="${212 + ly + ee * 4}" rx="10" ry="${ry}" fill="#1E1410"/><circle cx="${cx + 3 + lx}" cy="${207 + ly + ee * 4}" r="${3.2 * (1 - ee)}" fill="#fff"/>` +
        (lid ? `<path d="M${cx - 14} ${204} Q${cx} ${200} ${cx + 14} ${204} L${cx + 14} ${212} Q${cx} ${208} ${cx - 14} ${212}Z" fill="#B97A56"/>` : "");
    const open = (o.mouth === "talk" ? talk : 0);
    const mouth = {
      flat: `<path d="M184 272 Q200 274 216 272" fill="none" stroke="#6E2E22" stroke-width="5" stroke-linecap="round"/>`,
      o: `<ellipse cx="200" cy="276" rx="9" ry="12" fill="#5A1F18"/>`,
      smile: `<path d="M180 268 Q200 288 220 268" fill="none" stroke="#6E2E22" stroke-width="5" stroke-linecap="round"/>`,
      grit: `<path d="M182 270 H218 V280 H182Z" fill="#fff" stroke="#6E2E22" stroke-width="4" stroke-linejoin="round"/>`,
      talk: `<path d="M184 270 Q200 ${272 + open * 18} 216 270 Q200 ${268 + open * 4} 184 270Z" fill="#5A1F18" stroke="#6E2E22" stroke-width="4" stroke-linejoin="round"/>`
    }[o.mouth || "flat"];
    const sweat = o.sweat ? `<path d="M276 170 q8 14 0 22 q-8 -8 0 -22Z" fill="#9FD3F0" opacity="${o.sweat}"/>` : "";
    return `<svg viewBox="0 0 400 460" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <path d="M70 460 Q76 360 150 336 L250 336 Q324 360 330 460Z" fill="#2E6E6A"/>
  <path d="M168 336 L200 380 L232 336" fill="none" stroke="#C98A0B" stroke-width="7" stroke-linejoin="round"/>
  <path d="M96 400 Q120 372 150 360" fill="none" stroke="#C98A0B" stroke-width="22" stroke-linecap="round" opacity=".85"/>
  <rect x="176" y="296" width="48" height="50" rx="14" fill="#A86B4C"/>
  <path d="M110 160 Q104 100 160 82 Q200 70 240 82 Q298 100 290 170 L292 250 Q270 220 270 180 Q240 150 200 148 Q150 150 130 182 Q128 230 108 250Z" fill="#1E1410"/>
  <ellipse cx="200" cy="216" rx="78" ry="92" fill="#B97A56"/>
  <ellipse cx="124" cy="222" rx="13" ry="20" fill="#A86B4C"/><ellipse cx="276" cy="222" rx="13" ry="20" fill="#A86B4C"/>
  <circle cx="124" cy="246" r="5" fill="#F0A04B"/><circle cx="276" cy="246" r="5" fill="#F0A04B"/>
  <path d="M122 190 Q130 120 200 118 Q270 120 278 190 Q250 150 210 146 Q170 146 122 190Z" fill="#1E1410"/>
  <circle cx="200" cy="72" r="38" fill="#1E1410"/>
  <path d="M226 52 L262 20" stroke="#F0A04B" stroke-width="8" stroke-linecap="round"/><path d="M262 20 L270 12" stroke="#FFE0A8" stroke-width="8" stroke-linecap="round"/>
  <g fill="none" stroke="#1E1410" stroke-width="6" stroke-linecap="round"><path d="${brows[0]}"/><path d="${brows[1]}"/></g>
  ${eye(160)}${eye(240)}
  <path d="M198 222 Q192 246 200 250" fill="none" stroke="#8E5338" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="148" cy="252" rx="14" ry="8" fill="#D9846A" opacity=".45"/><ellipse cx="252" cy="252" rx="14" ry="8" fill="#D9846A" opacity=".45"/>
  ${mouth}${sweat}
</svg>`;
  }

  // ---------------------------------------------------------------- Jeetu, the mentor, bust with tumbler (440 x 540 box)
  // o: {brow:0..1 raise (left), smile:0..1, eyes:0..1 closed, glint:0..1, talk:0..1, tumbler:bool, look:[dx,dy]}
  function jeetu(o = {}) {
    const raise = o.brow || 0, s = o.smile == null ? 0.4 : o.smile, e = o.eyes || 0, g = o.glint || 0, talk = o.talk || 0, [lx, ly] = o.look || [0, 0];
    const eye = (cx) => e > 0.8 ? `<path d="M${cx - 10} 238 Q${cx} 243 ${cx + 10} 238" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
      : `<ellipse cx="${cx + lx}" cy="${238 + ly}" rx="7.5" ry="${8.5 * (1 - e)}" fill="${INK}"/><circle cx="${cx + 2 + lx}" cy="${235 + ly}" r="2.3" fill="#fff"/>`;
    const tumbler = o.tumbler === false ? "" : `<g transform="translate(300 420)">
      <path d="M-34 -70 H34 L28 40 Q27 50 18 50 H-18 Q-27 50 -28 40Z" fill="url(#steel)"/>
      <ellipse cx="0" cy="-70" rx="34" ry="7" fill="#DDE3E8"/><ellipse cx="0" cy="-70" rx="28" ry="4.5" fill="#7A4A26"/>
      <path d="M-20 -60 L-16 36" stroke="#fff" stroke-width="6" opacity=".55" stroke-linecap="round"/>
      <path d="M-48 -10 Q-56 30 -30 40 L30 40 Q50 20 40 -14Z" fill="#9C6646"/><path d="M-30 -2 H32 M-32 14 H34" stroke="#7E4F35" stroke-width="3"/></g>`;
    return `<svg viewBox="0 0 440 540" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
  <defs><linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#8E979F"/><stop offset=".35" stop-color="#E4E9ED"/><stop offset=".7" stop-color="#A9B1B8"/><stop offset="1" stop-color="#6E767E"/></linearGradient></defs>
  <path d="M40 540 Q48 400 140 370 L300 370 Q392 400 400 540Z" fill="#EDE3D2"/>
  <path d="M30 540 Q40 420 130 372 L176 360 Q150 450 170 540Z" fill="#5B2A22"/><path d="M410 540 Q400 420 310 372 L264 360 Q290 450 270 540Z" fill="#5B2A22"/>
  <path d="M168 540 Q150 450 176 362" fill="none" stroke="#C98A0B" stroke-width="8"/><path d="M272 540 Q290 450 264 362" fill="none" stroke="#C98A0B" stroke-width="8"/>
  <path d="M158 540 Q140 450 168 364" fill="none" stroke="#C98A0B" stroke-width="3" stroke-dasharray="6 6"/>
  <rect x="190" y="320" width="60" height="56" rx="16" fill="#8E5A3E"/>
  <ellipse cx="220" cy="244" rx="86" ry="100" fill="#9C6646"/>
  <ellipse cx="136" cy="248" rx="14" ry="22" fill="#8E5A3E"/><ellipse cx="304" cy="248" rx="14" ry="22" fill="#8E5A3E"/>
  <path d="M134 226 Q128 160 170 142 Q220 128 270 142 Q312 160 306 226 Q296 186 280 176 Q290 160 262 154 Q220 150 178 154 Q150 160 160 176 Q144 186 134 226Z" fill="#D9D4CC"/>
  <path d="M176 156 Q220 140 264 156 Q240 146 220 146 Q200 146 176 156Z" fill="#C9C2B8"/>
  <path d="M150 300 Q160 350 220 356 Q280 350 290 300 Q280 330 250 332 Q220 340 190 332 Q160 330 150 300Z" fill="#CFC8BE"/>
  <path d="M184 296 Q220 ${282 - s * 4} 256 296 Q240 302 220 300 Q200 302 184 296Z" fill="#E3DDD4"/>
  <path d="M198 312 Q220 ${316 + s * 10 + talk * 8} 242 312" fill="${talk > 0.1 ? "#4A1F14" : "none"}" stroke="#4A1F14" stroke-width="4" stroke-linecap="round"/>
  <g fill="none" stroke="#CFC8BE" stroke-width="8" stroke-linecap="round"><path d="M168 ${210 - raise * 14} Q186 ${200 - raise * 16} 204 ${208 - raise * 8}"/><path d="M236 208 Q254 200 272 210"/></g>
  ${eye(186)}${eye(254)}
  <path d="M168 222 Q178 214 190 216 M250 216 Q262 214 272 222" fill="none" stroke="#7E4F35" stroke-width="2.5" opacity=".7"/>
  <path d="M164 254 Q170 262 180 262 M260 262 Q270 262 276 254" fill="none" stroke="#7E4F35" stroke-width="2.5" opacity=".6"/>
  <path d="M218 246 Q210 270 220 276 Q228 276 230 270" fill="none" stroke="#7E4F35" stroke-width="4" stroke-linecap="round"/>
  <g fill="rgba(200,230,255,.08)" stroke="#2A1B12" stroke-width="5"><circle cx="186" cy="238" r="27"/><circle cx="254" cy="238" r="27"/></g>
  <path d="M213 236 Q220 230 227 236 M159 232 L136 226 M281 232 L304 226" fill="none" stroke="#2A1B12" stroke-width="5" stroke-linecap="round"/>
  <g opacity="${0.35 + g * 0.65}"><path d="M170 226 L182 214" stroke="#fff" stroke-width="${4 + g * 3}" stroke-linecap="round"/><path d="M238 226 L250 214" stroke="#fff" stroke-width="${4 + g * 3}" stroke-linecap="round"/></g>
  ${g > 0.05 ? `<g transform="translate(250 216)" opacity="${g}"><path d="M0 -40 L5 -5 L40 0 L5 5 L0 40 L-5 5 L-40 0 L-5 -5Z" fill="#FFF6DA"/></g>` : ""}
  ${tumbler}
</svg>`;
  }

  // ---------------------------------------------------------------- small round pod face (dots for eyes)
  const podFace = (skin, hair, o = {}) => `<svg viewBox="0 0 120 120" width="100%" height="100%"><circle cx="60" cy="64" r="44" fill="${skin}"/>
    <path d="M18 58 Q22 18 60 18 Q98 18 102 58 Q86 36 60 36 Q34 36 18 58Z" fill="${hair}"/>
    <circle cx="46" cy="66" r="4.5" fill="#1E1410"/><circle cx="74" cy="66" r="4.5" fill="#1E1410"/>
    <path d="M50 84 Q60 ${o.smile ? 92 : 88} 70 84" fill="none" stroke="#1E1410" stroke-width="3.5" stroke-linecap="round"/></svg>`;

  // ---------------------------------------------------------------- leaf and marigold (marketing prompt section 7)
  const marigold = (s = 1, o = 1) => `<g transform="scale(${s})" opacity="${o}"><g fill="#F0A04B">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-3.3" rx="2.3" ry="3.3" transform="rotate(${a})"/>`).join("")}</g><circle r="1.9" fill="#FFE0A8"/></g>`;

  window.CH = { chotu, hero, jeetu, podFace, marigold };
})();
