// Renders a "Chai in 60" reel JSON into a 1080x1920 MP4 with burned-in captions.
// Usage: NODE_PATH=$(npm root -g) node render-reel.cjs <content-root> <reel.json> [en|hi] [out.mp4]
// Needs Playwright (Chromium) and ffmpeg. Frames are drawn as HTML, screenshotted, then joined with ffmpeg.
// Rules from the reel JSON are applied: TRAGIC cards are skipped, the bed sits at its gain and fades when the motif starts.
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const [root, reelRel, lang = "en", outArg] = process.argv.slice(2);
if (!root || !reelRel) { console.error("usage: render-reel.cjs <content-root> <reel.json> [en|hi] [out.mp4]"); process.exit(1); }
const reel = JSON.parse(fs.readFileSync(path.join(root, reelRel), "utf8"));
const pack = JSON.parse(fs.readFileSync(path.join(root, reel.cards), "utf8"));
const tokens = JSON.parse(fs.readFileSync(path.join(root, "tokens.json"), "utf8"));
const C = tokens.color.light, W = 1080, H = 1920, FADE = 0.35;
const out = outArg || path.join(root, "reels", "out", `${reel.id}.${lang}.mp4`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const font = lang === "hi" ? `"Mukta","Martel","FreeSerif",sans-serif` : `"Mukta","Inter",system-ui,sans-serif`;
const serif = lang === "hi" ? `"Martel","FreeSerif",serif` : `"Martel","Georgia",serif`;
const page = body => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Martel:wght@400;700;800&family=Mukta:wght@400;500;600&display=swap">
<style>
*{box-sizing:border-box;margin:0}
body{width:${W}px;height:${H}px;background:${C.paper};color:${C.ink};font-family:${font};overflow:hidden}
.wrap{position:absolute;inset:0;padding:150px 90px 220px;display:flex;flex-direction:column}
.brand{position:absolute;left:90px;right:90px;bottom:110px;display:flex;justify-content:space-between;font-size:34px;color:${C.muted};font-weight:500}
.brand b{color:${C.chai}}
.ill{width:100%;aspect-ratio:16/10;border-radius:40px;background:${C.surface};border:3px solid ${C.line};display:flex;align-items:center;justify-content:center;overflow:hidden}
.ill img{width:100%;height:100%;object-fit:contain}
.chips{display:flex;gap:18px;margin:56px 0 34px;flex-wrap:wrap}
.chip{font-size:36px;font-weight:600;padding:10px 28px;border-radius:999px;background:${C.tealSoft};color:${C.teal}}
.chip.s{background:${C.chaiSoft};color:${C.chai}}
h1{font-family:${serif};font-size:${lang === "hi" ? 70 : 74}px;line-height:1.28;font-weight:800}
.take{margin-top:auto;padding:44px 50px;border-radius:36px;background:${C.chai};color:#fff;font-size:${lang === "hi" ? 50 : 52}px;line-height:1.38;font-weight:600}
.take small{display:block;font-size:32px;font-weight:500;opacity:.85;margin-bottom:12px;letter-spacing:.04em}
.lines{margin:auto 0;display:flex;flex-direction:column;gap:40px}
.lines .l0{font-size:44px;color:${C.muted};font-weight:500}
.lines .l1{font-family:${serif};font-size:96px;line-height:1.2;font-weight:800;color:${C.chai}}
.lines .l2{font-size:50px;color:${C.ink}}
.cup{font-size:150px}
.idx{font-size:34px;color:${C.muted};margin-bottom:28px;font-weight:600}
</style></head><body><div class="wrap">${body}</div>
<div class="brand"><span><b>UPSC Pods</b> · ${lang === "hi" ? "आज की चाय" : "Chai in 60"}</span><span>${esc(pack.date || "")}</span></div></body></html>`;

const label = { en: { take: "TAKEAWAY", card: (i, n) => `Card ${i} of ${n}` }, hi: { take: "याद रखें", card: (i, n) => `कार्ड ${i} / ${n}` } }[lang];
const cards = reel.segments.filter(s => s.kind === "card").map(s => pack.cards.find(c => c.id === s.cardId)).filter(Boolean);
const shown = cards.filter(c => c.tone !== "TRAGIC");

async function main() {
  const browser = await chromium.launch(); const p = await browser.newPage({ viewport: { width: W, height: H } });
  const shot = async (html, name) => { const f = path.join(tmp, name + ".html"); fs.writeFileSync(f, html);
    await p.goto("file://" + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const png = path.join(tmp, name + ".png"); await p.screenshot({ path: png }); return png; };
  const svgUrl = rel => "file://" + path.join(root, rel);
  const clips = []; let t = 0, motifAt = null, k = 0;
  for (const seg of reel.segments) {
    if (seg.kind === "card") {
      const c = pack.cards.find(x => x.id === seg.cardId);
      if (!c || c.tone === "TRAGIC") { console.log("skip", seg.cardId, c ? "(TRAGIC)" : "(missing)"); continue; }
      const L = c[lang], chips = (L.lensChips || []).slice(0, 2).map((x, i) => `<span class="chip${i ? " s" : ""}">${esc(x)}</span>`).join("");
      const head = `<div class="idx">${label.card(shown.indexOf(c) + 1, shown.length)}</div><div class="ill"><img src="${svgUrl(c.illustration)}"></div><div class="chips">${chips}</div><h1>${esc(L.headline)}</h1>`;
      const a = await shot(page(head), `s${k}a`), b = await shot(page(head + `<div class="take"><small>${label.take}</small>${esc(L.takeaway)}</div>`), `s${k}b`);
      const at = seg.showTakeawayAtSeconds ?? seg.seconds / 2;
      clips.push({ imgs: [[a, at], [b, seg.seconds - at]], seconds: seg.seconds });
    } else {
      const lines = (seg.text?.[lang] || []).map((x, i) => `<div class="l${Math.min(i, 2)}">${esc(x)}</div>`).join("");
      const png = await shot(page(`<div class="lines">${seg.kind === "intro" ? '<div class="cup">☕</div>' : ""}${lines}</div>`), `s${k}`);
      clips.push({ imgs: [[png, seg.seconds]], seconds: seg.seconds });
      if (seg.kind === "outro" && seg.sound) { const at = String(seg.sound).match(/at ([\d.]+) ?s/); motifAt = at ? Number(at[1]) : t + 0.4; }
    }
    t += seg.seconds; k++;
  }
  await browser.close();
  // one clip per segment, fading in and out so cuts are soft
  const parts = clips.map((c, i) => {
    const f = path.join(tmp, `c${i}.mp4`), args = ["-y", "-v", "error"]; let filter = "";
    c.imgs.forEach(([img, d], j) => { args.push("-loop", "1", "-t", String(d), "-i", img); });
    if (c.imgs.length === 2) { const d0 = c.imgs[0][1];
      filter = `[0][1]xfade=transition=fade:duration=0.5:offset=${d0 - 0.25}[v0];[v0]`; args.splice(args.indexOf(c.imgs[0][0]) - 2, 1, String(d0 + 0.25)); }
    else filter = "[0]";
    filter += `fade=t=in:st=0:d=${FADE},fade=t=out:st=${c.seconds - FADE}:d=${FADE},format=yuv420p,fps=30[v]`;
    execFileSync("ffmpeg", [...args, "-filter_complex", filter, "-map", "[v]", "-t", String(c.seconds), "-c:v", "libx264", "-preset", "medium", "-crf", "20", f]);
    return f; });
  const list = path.join(tmp, "list.txt"); fs.writeFileSync(list, parts.map(f => `file '${f}'`).join("\n"));
  const video = path.join(tmp, "video.mp4"); execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", video]);
  // sound: bed at gain 0.55 (looped), fading out as the motif starts; the motif plays once
  const total = clips.reduce((s, c) => s + c.seconds, 0), rule = (reel.rules || []).join(" ");
  const gain = Number((rule.match(/gain ([\d.]+)/) || [])[1] || 0.55), m = motifAt ?? total - 3;
  const bed = path.join(root, "audio/bed.ogg"), motif = path.join(root, "audio/motif.ogg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-stream_loop", "-1", "-i", bed, "-i", motif, "-filter_complex",
    `[1]atrim=0:${total},volume=${gain},afade=t=in:st=0:d=1,afade=t=out:st=${m}:d=1.5[b];[2]adelay=${Math.round(m * 1000)}|${Math.round(m * 1000)}[m];[b][m]amix=inputs=2:duration=first:normalize=0,aresample=48000[a]`,
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-ac", "2", "-t", String(total), "-movflags", "+faststart", out]);
  console.log(`wrote ${out} (${total}s, ${shown.length} cards, motif at ${m}s)`);
  fs.rmSync(tmp, { recursive: true, force: true });
}
main().catch(e => { console.error(e); process.exit(1); });
