// Renders the daily post for a day without sending anything: the Telegram text (and a preview page), the WhatsApp
// text, and the image (SVG, plus PNG when ImageMagick is installed).
//   node scripts/sample-posts.mjs <brief.json | https://app.aspiran.in/brief/latest> <out folder> [YYYY-MM-DD]
// The past question comes from content/pyq/pyq.json (in the app it comes from the approved papers).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const [src, out, dayArg] = process.argv.slice(2);
if (!src || !out) { console.error("Usage: node scripts/sample-posts.mjs <brief.json | URL> <out folder> [YYYY-MM-DD]"); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), "sample-posts-"));
await build({ entryPoints: ["src/posts.ts"], bundle: true, format: "esm", platform: "node", outfile: join(dir, "posts.mjs"), logLevel: "error" });
const P = await import(pathToFileURL(join(dir, "posts.mjs")).href);
rmSync(dir, { recursive: true, force: true });

const brief = /^https?:/.test(src) ? await (await fetch(src)).json() : JSON.parse(readFileSync(src, "utf8"));
const day = dayArg ?? brief.date;
if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? "")) { console.error("No day: the brief has no date (a sign-in error?). Pass YYYY-MM-DD."); process.exit(1); }
const papers = JSON.parse(readFileSync(new URL("../../content/pyq/pyq.json", import.meta.url), "utf8")).papers;
const post = P.buildDailyPost(brief, P.pickPyq(papers, day), day);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "telegram.html.txt"), post.telegram.text + (post.telegram.poll ? `\n\n--- then a quiz poll ---\n${JSON.stringify(post.telegram.poll, null, 2)}` : "") + "\n");
writeFileSync(join(out, "whatsapp.txt"), post.whatsapp.text + "\n");
writeFileSync(join(out, "image.svg"), P.postImageSvg(post));
// A page that shows the Telegram message roughly as the channel shows it.
writeFileSync(join(out, "telegram-preview.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Telegram preview ${day}</title>
<style>body{background:#8BA3B8;font:15px/1.45 system-ui,sans-serif;margin:0;padding:24px 16px}.m{max-width:480px;margin:auto;background:#fff;border-radius:12px;padding:12px 14px;white-space:pre-wrap;color:#000}a{color:#168ACD}.p{max-width:480px;margin:12px auto;background:#fff;border-radius:12px;padding:12px 14px}</style>
<div class="m">${post.telegram.text}</div>${post.telegram.poll ? `<div class="p"><b>Quiz</b><br>${post.telegram.poll.options.map((o) => "○ " + o.replace(/</g, "&lt;")).join("<br>")}</div>` : ""}`);
try { execFileSync("magick", [join(out, "image.svg"), join(out, "image.png")], { stdio: "pipe" }); } catch { console.log("(no ImageMagick: PNG left out; Admin makes it in the browser)"); }
console.log(`${day}: ${post.cards.length} cards, past question ${post.pyq ? `${post.pyq.exam} ${post.pyq.year} Q${post.pyq.n}` : "none"}, Telegram ${post.telegram.text.length} chars → ${out}`);
