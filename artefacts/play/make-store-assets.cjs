// Builds the captioned Play screenshots (1080x1920) and the video title cards (1920x1080).
const { chromium } = require("playwright-core");
const fs = require("fs");
const D = __dirname, OUT = "/Users/srinivasvedantam/Documents/app/artefacts/play";
const FONT = "file:///Users/srinivasvedantam/Documents/app/server/public/app/fonts/martel-latin-800-normal.woff2";
const CUP = `<svg viewBox="0 0 40 40"><path d="M14 3c-2 3 2 4 0 7M20 2c-2 3 2 4 0 8M26 3c-2 3 2 4 0 7" fill="none" stroke="#D9822B" stroke-width="2" stroke-linecap="round"/><path d="M5 15h30l-4.5 20.5a3 3 0 0 1-3 2.5H12.5a3 3 0 0 1-3-2.5z" fill="#C8693A"/><rect x="4" y="13" width="32" height="4.5" rx="2.2" fill="#E08A55"/><rect x="14" y="22" width="3.2" height="5" rx="1.6" fill="#2A1B12"/><rect x="22.8" y="22" width="3.2" height="5" rx="1.6" fill="#2A1B12"/></svg>`;
const BASE = `@font-face{font-family:Martel;font-weight:800;src:url("${FONT}") format("woff2")}
html,body{margin:0;overflow:hidden}
body{background:radial-gradient(ellipse at 75% 18%,#3a2a4f 0%,#1d1a2e 50%,#141322 100%);color:#FFF8F3;font-family:-apple-system,"Helvetica Neue",sans-serif;position:relative}
.k{color:#F2A54A;letter-spacing:.14em;text-transform:uppercase;font-weight:700}
h1{font:800 84px/1.12 Martel,Georgia,serif;margin:0;letter-spacing:-1px;text-wrap:balance}
p{color:#FCE8C3;margin:0}
.star{position:absolute;width:4px;height:4px;border-radius:50%;background:#FCE8C3;opacity:.7}`;
const stars = (w, h) => Array.from({ length: 14 }, (_, i) => `<div class="star" style="left:${(i * 389) % w}px;top:${(i * 157) % (h * 0.3)}px"></div>`).join("");

const SHOTS = [
  ["01-garden", "r-map", "The syllabus garden", "The whole UPSC syllabus. Every line of it.", "Each leaf is one line. It lights up as you learn it.", 0],
  ["02-teach", "02-teach", "How Aspiran teaches", "Built on how memory actually works.", "Recall, spaced review, write and rewrite.", 0.42],
  ["03-recall", "r-review", "Recall, not re-reading", "Close the book. Pull it out of your head.", "Reviews come back just before you'd forget.", 0],
  ["04-vine", "r-vine_gs2", "Paper by paper", "See exactly what you know, line by line.", "Prelims, CSAT, GS1–4, Essay, Optional.", 0],
  ["05-mains", "r-mains", "Mains writing", "Write, mark, rewrite.", "The rough answer first. The good one after.", 0],
  ["06-chotu", "r-chotu", "Chotu · AI study buddy", "Ask anything, in English or Hindi.", "Always labelled AI. Never predicts ranks.", 0],
  ["07-you", "r-progress", "You vs. you", "No ranks. No streaks. No public scores.", "Only you against your own yesterday.", 0],
];

const phoneHTML = (img, crop) => `<div class="ph"><div class="scr" style="background-image:url('file://${D}/raw/${img}.png');background-position:center ${crop * 100}%"></div></div>`;

(async () => {
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  fs.mkdirSync(OUT + "/phone", { recursive: true });
  for (const [name, img, kicker, head, sub, crop] of SHOTS) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
      html,body{width:1080px;height:1920px}
      .top{position:absolute;left:84px;right:84px;top:110px;display:flex;flex-direction:column;gap:26px}
      .k{font-size:30px}
      p{font-size:38px;line-height:1.35}
      .ph{position:absolute;left:150px;top:640px;width:780px;height:1386px;border-radius:64px;background:#0b0a12;padding:18px;box-sizing:border-box;box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 0 3px #3a3350}
      .scr{width:100%;height:100%;border-radius:48px;background-size:100% auto;background-repeat:no-repeat}
      .glow{position:absolute;left:0;right:0;bottom:0;height:220px;background:linear-gradient(transparent,#141322 85%)}
      </style></head><body>${stars(1080, 1920)}
      <div class="top"><div class="k">${kicker}</div><h1>${head}</h1><p>${sub}</p></div>
      ${phoneHTML(img, crop)}</body></html>`;
    fs.writeFileSync(D + "/c.html", html);
    await p.goto("file://" + D + "/c.html"); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/phone/${name}.png` });
    console.log("phone", name);
  }

  // Video frames, 1920x1080: text cards plus each phone screen beside its caption.
  await p.setViewportSize({ width: 1920, height: 1080 });
  fs.mkdirSync(D + "/vid", { recursive: true });
  const card = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}
    html,body{width:1920px;height:1080px}
    .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center;padding:0 200px}
    h1{font-size:104px} p{font-size:46px} .k{font-size:34px}
    .cup{width:220px;height:220px}
    .ph{position:absolute;right:220px;top:60px;width:540px;height:960px;border-radius:48px;background:#0b0a12;padding:14px;box-sizing:border-box;box-shadow:0 30px 90px rgba(0,0,0,.55),0 0 0 3px #3a3350}
    .scr{width:100%;height:100%;border-radius:36px;background-size:100% auto;background-repeat:no-repeat}
    .l{position:absolute;left:180px;top:0;bottom:0;width:860px;display:flex;flex-direction:column;justify-content:center;gap:34px}
    .l h1{font-size:88px} .l p{font-size:44px;line-height:1.35}
    </style></head><body>${stars(1920, 1080)}${body}</body></html>`;
  const frames = [
    ["v00", `<div class="c"><div class="k">For every UPSC aspirant</div><h1>9 papers. 297 lines.<br>One syllabus.</h1><p>What if you could see all of it, and watch it light up?</p></div>`],
    ...SHOTS.map(([name, img, kicker, head, sub, crop], i) => ["v" + String(i + 1).padStart(2, "0"),
      `<div class="l"><div class="k">${kicker}</div><h1>${head}</h1><p>${sub}</p></div>${phoneHTML(img, crop)}`]),
    ["v99", `<div class="c"><div class="cup">${CUP}</div><h1>Aspiran</h1><p>Never prep alone.</p><p style="font-size:38px;color:#F2A54A">Free on Google Play · aspiran.in</p></div>`],
  ];
  for (const [name, body] of frames) {
    fs.writeFileSync(D + "/c.html", card(body));
    await p.goto("file://" + D + "/c.html"); await p.waitForTimeout(400);
    await p.screenshot({ path: `${D}/vid/${name}.png` });
    console.log("video", name);
  }
  await b.close();
})();
