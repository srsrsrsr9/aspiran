// Daily posts (src/posts.ts, 20 Nov 2026): the day's Chai and a past question for Telegram and WhatsApp.
// Part 1 needs no server: the post builder, bundled from src/posts.ts. Part 2 runs against a local server with a
// stand-in for api.telegram.org on the port after the server's (test-all.sh sets TELEGRAM_API_BASE):
//   EDITOR_TOKEN=... node --import ./test/dev-auth.mjs test/posts.mjs
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const step = (name) => console.log("✓", name);

// --- Part 1: the builder, without a server -----------------------------------------------------------------------
const dir = mkdtempSync(join(tmpdir(), "posts-test-"));
const out = join(dir, "posts.mjs");
await build({ entryPoints: ["src/posts.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const P = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });

const day = "2026-11-20";
const card = (n, extra = {}) => ({ id: "c" + n, tone: "neutral", gsPaper: "GS" + n, topic: "Topic " + n, headline: `Headline <${n}> & more`, summary: `Summary ${n}. ` + "Words go on. ".repeat(10), shareable: true, ...extra });
const brief = { date: day, items: [card(1, { hi: { headline: "हिंदी शीर्षक" } }), card(2, { tone: "tragic", shareable: false, headline: "A sad story" }), card(3)] };
const papers = JSON.parse(readFileSync(new URL("../../content/pyq/pyq.json", import.meta.url), "utf8")).papers;

// The tragic card stays out; the links open the card's own place in the app's day, with UTM tags per channel.
let post = P.buildDailyPost(brief, null, day);
assert.equal(post.cards.length, 2);
assert.ok(!post.telegram.text.includes("A sad story") && !post.whatsapp.text.includes("A sad story"), "a tragic card never goes out");
assert.equal(post.cards[1].link.telegram, "https://app.aspiran.in/app/?utm_source=telegram&utm_medium=chai&utm_campaign=daily-2026-11-20#chai/2");
assert.ok(post.cards[0].link.whatsapp.includes("utm_source=whatsapp"));
assert.ok(post.telegram.text.includes("Headline &lt;1&gt; &amp; more"), "Telegram's HTML is escaped");
assert.ok(post.whatsapp.text.includes("*1. Headline <1> & more*"), "WhatsApp gets plain text with *bold*");
assert.ok(post.telegram.text.includes("<i>हिंदी शीर्षक</i>"), "the Hindi headline rides along when there is one");
assert.ok(post.telegram.text.includes("Test yourself: one tap"));
for (const t of [post.telegram.text, post.whatsapp.text]) assert.ok(!/\bAI\b/.test(t), "no AI label anywhere");
step("tragic cards left out, links carry UTM tags and open the right card, text escaped per channel");

// A card marked not shareable stays out too; a day of only tragic stories still has a post (the question).
assert.equal(P.buildDailyPost({ items: [card(1, { shareable: false })] }, null, day).cards.length, 0);
assert.equal(P.shareableCards({ items: [card(1, { tone: "TRAGIC" })] }).length, 0);

// The past question: the same all day, a different one the next day, never a sample paper.
const a = P.pickPyq(papers, day), b = P.pickPyq(papers, "2026-11-21");
assert.ok(a && b);
assert.deepEqual(P.pickPyq(papers, day), a, "same question all day");
assert.notEqual(`${a.paper.id}/${a.q.n}`, `${b.paper.id}/${b.q.n}`, "a new question tomorrow");
const seen = new Set();
for (let i = 0; i < 60; i++) { const d = new Date(Date.UTC(2026, 10, 1) + i * 864e5).toISOString().slice(0, 10); const p = P.pickPyq(papers, d); assert.ok(!p.paper.sample); seen.add(p.paper.id); }
assert.ok(seen.size >= 5, "two months of questions come from many papers: " + [...seen].join(", "));
assert.equal(P.pickPyq([], day), null);
step(`past question of the day: steady within a day, new each day, ${seen.size} papers in two months, never a sample`);

// A Prelims question with UPSC's official key: options in the text, the answer only in Telegram's quiz poll.
const prelims = papers.find((p) => p.exam === "prelims" && p.answerKey?.status === "official");
const shortQ = prelims.questions.find((q) => q.en.q.length < 280 && q.en.options.every((o) => o.length < 100));
post = P.buildDailyPost(brief, { paper: prelims, q: shortQ }, day);
assert.equal(post.pyq.exam, "prelims");
assert.ok(post.telegram.text.includes("(A) ") && post.telegram.text.includes("(D) "));
assert.deepEqual(post.telegram.poll && { correct: post.telegram.poll.correct, n: post.telegram.poll.options.length }, { correct: shortQ.answer, n: 4 });
assert.ok(post.telegram.poll.explanation.includes("official answer key"));
assert.ok(!/answer is|correct answer/i.test(post.whatsapp.text), "WhatsApp never gives the answer away");
assert.ok(post.pyq.link.whatsapp.endsWith("utm_medium=pyq&utm_campaign=daily-2026-11-20#prelims"));
// Without an official key there's no poll and no answer.
post = P.buildDailyPost(brief, { paper: { ...prelims, answerKey: { status: "awaiting" } }, q: shortQ }, day);
assert.equal(post.telegram.poll, null); assert.equal(post.pyq.answer, null);
// A Mains question: no options, no model answer, the word limit and a link to write it.
const mains = papers.find((p) => p.exam === "mains");
post = P.buildDailyPost(brief, { paper: mains, q: mains.questions[0] }, day);
assert.equal(post.telegram.poll, null); assert.equal(post.pyq.options, null);
assert.ok(post.whatsapp.text.includes("Write it in 150 words (10 marks)"));
assert.ok(post.telegram.text.includes("UPSC Mains 2025 · GS Paper I · Q1"));
step("Prelims: options shown, answer only in the quiz poll and only with UPSC's key; Mains: word limit and a link");

// Long days stay under Telegram's 4096 characters; summaries end on a whole sentence or word.
const long = { items: [1, 2, 3].map((n) => card(n, { summary: "A long sentence about the economy. ".repeat(60) })) };
post = P.buildDailyPost(long, { paper: mains, q: mains.questions[0] }, day);
assert.ok(post.telegram.text.length < 4096, "length " + post.telegram.text.length);
assert.ok(post.cards.every((c) => /[.…]$/.test(c.summary)));
assert.equal(P.trimText("One. Two three four five six seven.", 20), "One. Two three four…");
step("a long day stays under Telegram's limit; summaries are cut at a sentence or word");

// The image: valid SVG, 1080 × 1350, headlines escaped, English only.
const svg = P.postImageSvg(P.buildDailyPost(brief, { paper: prelims, q: shortQ }, day));
assert.ok(svg.startsWith("<svg") && svg.includes('width="1080" height="1350"'));
assert.ok(svg.includes("Headline &lt;1&gt; &amp; more") && !svg.includes("हिंदी"));
assert.ok(svg.includes("Past question of the day") && svg.includes("app.aspiran.in"));
step("the WhatsApp image is a 1080 × 1350 SVG with escaped text");

// --- Part 2: Admin shows the day's post and sends it to a stand-in Telegram -----------------------------------------
const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) { console.log("(no EDITOR_TOKEN: skipped the server part)"); process.exit(0); }
const call = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", authorization: "Bearer " + TOKEN }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => null) };
};

// The stand-in for api.telegram.org: records what it's sent.
const sent = [];
const tgPort = Number(new URL(BASE).port || 8787) + 1;
const tg = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    sent.push({ path: req.url, body: JSON.parse(body || "{}") });
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, result: { message_id: sent.length } }));
  });
}).listen(tgPort, "127.0.0.1");

try {
  let r = await call("/admin/api/posts");
  assert.equal(r.status, 200);
  assert.equal(r.data.on, false, "the flag starts off");
  const before = r.data.post;

  // Publish a day: three approved cards, one of them tragic.
  const run = Math.random().toString(36).slice(2, 8);
  const stories = [
    ["Reserve Bank of India", "RBI keeps repo rate unchanged", "The Reserve Bank of India kept the repo rate at 5.5 per cent.", "neutral"],
    ["PRS Legislative Research", "The Tribunals Reforms Bill, 2026", "The Tribunals Reforms Bill, 2026 was introduced in Lok Sabha.", "neutral"],
    ["NASA Earth Observatory", "Floods in the delta", "Floods in the delta took many lives.", "tragic"],
  ];
  for (const [sourceName, title, text, tone] of stories) {
    const id = (await call("/desk/api/stories", { method: "POST", body: { title, sourceName, sourceUrl: `https://example.gov.in/${run}/${title.length}`, text } })).data.id;
    const c = (await call("/desk/api/queue")).data.candidates.find((x) => x.id === id).card;
    await call(`/desk/api/cards/${id}`, { method: "POST", body: { card: { ...c, tone, headline: title, summary: text } } });
    await call(`/desk/api/cards/${id}/approve`, { method: "POST", body: { lang: "en", editor: "Posts test" } });
  }
  assert.ok((await call("/desk/api/publish", { method: "POST" })).data.published);
  r = await call("/admin/api/posts");
  const post = r.data.post;
  assert.ok(post, "today's post, once the Chai is out" + (before ? "" : " (it wasn't before)"));
  assert.ok(post.cards.some((c) => c.headline === "RBI keeps repo rate unchanged"));
  assert.ok(!post.cards.some((c) => c.headline === "Floods in the delta"), "the tragic card isn't in the post");
  assert.ok(r.data.svg.startsWith("<svg"));
  assert.equal(r.data.token, true, "the test server has a stand-in bot token");
  step("Admin shows today's post once the Chai is out, tragic card left out, with the image");

  // A channel must be an @name or a numeric id; a send needs one.
  assert.equal((await call("/admin/api/posts/settings", { method: "POST", body: { telegramChat: "not a channel" } })).status, 400);
  await call("/admin/api/posts/settings", { method: "POST", body: { telegramChat: "" } });
  r = await call("/admin/api/posts/send", { method: "POST", body: {} });
  assert.equal(r.status, 502); assert.match(r.data.error, /No Telegram channel/);
  assert.equal(sent.length, 0);
  assert.equal((await call("/admin/api/posts/settings", { method: "POST", body: { telegramChat: "@aspiran_test" } })).status, 200);

  r = await call("/admin/api/posts/send", { method: "POST", body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const msg = sent.find((s) => s.path.endsWith("/sendMessage"));
  assert.ok(msg.path.startsWith("/botlocal-test-bot/"), "the token goes in the path, as Telegram wants");
  assert.equal(msg.body.chat_id, "@aspiran_test");
  assert.equal(msg.body.parse_mode, "HTML");
  assert.ok(msg.body.text.includes("RBI keeps repo rate unchanged") && !msg.body.text.includes("Floods"));
  assert.ok(msg.body.text.includes("utm_source=telegram"));
  r = await call("/admin/api/posts");
  assert.equal(r.data.log[r.data.day].telegram.ok, true, "the send is recorded");
  step("a send by hand reaches Telegram (stand-in) with the channel, HTML and UTM links, and is recorded");

  // Telegram saying no is shown, never the token.
  tg.removeAllListeners("request");
  tg.on("request", (req, res) => { req.resume(); req.on("end", () => { res.statusCode = 400; res.end(JSON.stringify({ ok: false, description: "Bad Request: chat not found" })); }); });
  r = await call("/admin/api/posts/send", { method: "POST", body: {} });
  assert.equal(r.status, 502);
  assert.match(r.data.error, /chat not found/);
  assert.ok(!r.data.error.includes("local-test-bot"), "the token never shows");
  step("a refusal from Telegram is shown in Admin, without the token");

  // The flag still says off: the cron hasn't been let loose by any of this.
  assert.equal((await call("/admin/api/posts")).data.on, false);
  step("the daily_posts flag is still off");
} finally {
  tg.close();
}
