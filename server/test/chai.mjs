// Chai: three cards a day, spread across GS papers, from more than one source (14 Nov 2026, the trailer's promise).
// Part 1 needs no server: the pipeline's own rules (feed parsing, the name check, the JSON repair, the GS spread),
// bundled from src/pipeline.ts. Part 2 runs against a local server like the other suites:
//   EDITOR_TOKEN=... node --import ./test/dev-auth.mjs test/chai.mjs
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const step = (name) => console.log("✓", name);

// --- Part 1: the rules, without a server --------------------------------------------------------------------------
const dir = mkdtempSync(join(tmpdir(), "chai-test-"));
const out = join(dir, "pipeline.mjs");
await build({ stdin: { contents: 'export * from "./src/pipeline.ts"; export { SOURCES } from "./src/sources.ts";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const P = await import(pathToFileURL(out).href);
rmSync(dir, { recursive: true, force: true });
const { SOURCES } = P;

// Sources: GS1, GS2 and GS3 each have at least one working feed; PIB stays off (403 to an honest bot).
const on = SOURCES.filter((s) => s.enabled !== false);
for (const gs of ["GS1", "GS2", "GS3"]) assert.ok(on.some((s) => s.gs === gs), `a source for ${gs}`);
assert.ok(on.length >= 6, "more than RBI");
assert.equal(SOURCES.find((s) => s.name === "PIB").enabled, false);
for (const s of on) assert.ok(s.gs && s.topic, `${s.name} is tagged with a paper and topic`);
step(`${on.length} sources on, covering GS1, GS2 and GS3`);

// An RSS feed (SEBI, RBI, UN, NASA, UNESCO) and a press page with no feed (PRS, ISRO).
const rss = `<rss><channel><item><title><![CDATA[SEBI board meeting]]></title><link>https://www.sebi.gov.in/media/x.html</link><description>&lt;p&gt;Decisions&lt;/p&gt;</description></item></channel></rss>`;
const sebi = SOURCES.find((s) => s.name === "SEBI");
assert.deepEqual(P.parseRss(rss, sebi).map((i) => [i.title, i.link, i.description]), [["SEBI board meeting", "https://www.sebi.gov.in/media/x.html", "Decisions"]]);
const prs = SOURCES.find((s) => s.name.startsWith("PRS"));
const prsPage = `<nav><a href="/billtrack/category/all">All bills by category, every one of them</a></nav>
  <a href="/billtrack/the-tribunals-reforms-bill-2026">The Tribunals Reforms Bill, 2026</a>
  <a href="/billtrack/the-tribunals-reforms-bill-2026">The Tribunals Reforms Bill, 2026</a>
  <a href="/billtrack/the-kerala-alteration-of-name-bill-2026"><span>The Kerala (Alteration of Name) Bill, 2026</span></a>
  <a href="/about">About PRS Legislative Research and its work</a>`;
const prsItems = P.parseHtmlList(prsPage, prs);
assert.deepEqual(prsItems.map((i) => i.link), ["https://prsindia.org/billtrack/the-tribunals-reforms-bill-2026", "https://prsindia.org/billtrack/the-kerala-alteration-of-name-bill-2026"]);
assert.equal(prsItems[1].title, "The Kerala (Alteration of Name) Bill, 2026");
const isro = SOURCES.find((s) => s.name === "ISRO");
const isroItems = P.parseHtmlList(`<a href="Press.html">Press</a><a href="SSLV_D2_Mission_successful.html">Successful flight of Small Satellite Launch Vehicle (SSLV)</a><a href="https://elsewhere.example/x.html">A link to somewhere else entirely</a>`, isro);
assert.deepEqual(isroItems.map((i) => i.link), ["https://www.isro.gov.in/SSLV_D2_Mission_successful.html"]);
const story = "<p>" + "Body text. ".repeat(40) + "</p>";
assert.equal(P.articleText(`<header>Menu Home About</header><main><h1>Title</h1>${story}</main><footer>Copyright</footer>`), ("Title " + "Body text. ".repeat(40)).trim());
assert.ok(P.articleText(`<form><header>Menu</header><div>${story}</div></form>`).startsWith("Body text."), "a page wrapped in a form (RBI) keeps its story");
assert.ok(P.articleText("<header>Menu Home</header><p>Short.</p>").includes("Short."), "a page with almost nothing left keeps everything");
step("RSS feeds and press pages with no feed both read, menus left out");

// Scoring: the source's paper stands when no syllabus word decides; a strong syllabus word still wins.
assert.equal(P.score({ title: "Earth at night over the Nile", description: "", source: SOURCES.find((s) => s.name === "NASA Earth Observatory") }).gs, "GS1");
assert.equal(P.score({ title: "Monsoon rainfall over the Himalaya", description: "", source: SOURCES.find((s) => s.name === "UN News") }).topic, "Geography");
assert.equal(P.gsOf("GS 2"), "GS2"); assert.equal(P.gsOf("gs-III"), "GS3"); assert.equal(P.gsOf("GS1"), "GS1"); assert.equal(P.gsOf("Polity"), "");
const pool = [["a", "GS3"], ["b", "GS3"], ["c", "GS3"], ["d", "GS2"], ["e", "GS1"], ["f", "GS2"]];
assert.deepEqual(P.spreadPick(pool, 3, (x) => x[1]).map((x) => x[0]), ["a", "d", "e"]);
assert.deepEqual(P.spreadPick(pool, 5, (x) => x[1]).map((x) => x[0]), ["a", "d", "e", "b", "f"]);
step("each draft is tagged with its paper; the day's drafts are spread across GS1, GS2 and GS3");

// The name check: "The Reserve Bank" is in "Reserve Bank of India" (it fired falsely 58 times).
const src = "The Reserve Bank of India kept the policy repo rate at 5.5 per cent, Governor Sanjay Malhotra said.".toLowerCase();
assert.equal(P.nameInSource("The Reserve Bank", src), true);
assert.equal(P.nameInSource("Reserve Bank", src), true);
assert.equal(P.nameInSource("Sanjay Malhotra", src), true);
assert.equal(P.nameInSource("On Monday", src), false, "a real word after the lead still has to be there");
assert.equal(P.nameInSource("State Bank", src), false);
assert.equal(P.nameInSource("Bank Of", "of the river bank of".toLowerCase()), true);
const flags = P.autoChecks({ summary: "The Reserve Bank kept the repo rate at 5.5 per cent. The Finance Ministry agreed.", headline: "x", tone: "neutral" }, src);
assert.deepEqual(flags, ["Name not in source: The Finance Ministry"]);
step("name check finds a short name inside a longer one, still flags a name that isn't there");

// The draft parser: fences, a line around it, trailing commas, raw line breaks in strings; a cut-off reply is null.
assert.deepEqual(P.firstJson('```json\n{"tone":"neutral","x":[1,2,],}\n```'), { tone: "neutral", x: [1, 2] });
assert.deepEqual(P.firstJson('Here is the card:\n{"summary":"Line one\nline two","n":"a } b"}\nHope that helps.'), { summary: "Line one\nline two", n: "a } b" });
assert.equal(P.firstJson('{"tone":"neutral","hi":{"headline":"आज'), null, "a reply cut off by the token limit");
assert.equal(P.firstJson(""), null);
assert.equal(P.firstJson("[1,2]"), null, "only an object is a card");
step("draft replies are repaired where they can be; a cut-off reply is asked for again, not crashed on");

// 15 Nov 2026: the automatic Chai sent nothing. The second check: a different family from the Llama drafter, with room
// to answer (gpt-oss spent its 300 tokens reasoning and sent an empty reply), and a strict reading of its verdict.
assert.ok(P.AUTO_HOPS.length >= 3, "more than one provider can do the second check");
for (const h of P.AUTO_HOPS) {
  assert.ok(!/llama/i.test(h.model), `${h.model} is not the drafter's family`);
  const room = h.extra?.max_completion_tokens ?? h.extra?.max_tokens ?? 0;
  assert.ok(room >= 1500, `${h.model} has room to reason and still answer (${room})`);
}
assert.ok(new Set(P.AUTO_HOPS.map((h) => h.provider)).size >= 2, "a provider down for billing doesn't stop the check");
assert.deepEqual(P.readVerdict('{"verdict": "pass", "reason": "All facts are in the source."}'), { pass: true, reason: "All facts are in the source." });
assert.equal(P.readVerdict('Sure.\n{"verdict":"PASS"}').pass, true);
assert.equal(P.readVerdict('{"verdict": "fail", "reason": "The 7.1% is not yearly growth."}').pass, false);
assert.equal(P.readVerdict("pass").pass, false, "no JSON, no pass");
assert.equal(P.readVerdict("").pass, false);
step("second check: another model family, room to answer, only a clear pass passes");

// Tone: whole words. "warm air" is not war, a deadline is not dead, rapeseed is not rape; a real flood still waits.
assert.equal(P.guessTone("Autumn Mornings Bring Valley Fog. Because cold air is denser than warm air, it flows downslope."), "neutral");
assert.equal(P.guessTone("The deadline for rapeseed procurement was extended towards March."), "neutral");
assert.equal(P.guessTone("Heavy rain flooded rivers; officials issued evacuation orders."), "serious");
assert.equal(P.guessTone("Two people died in the landslide."), "serious");
assert.equal(P.guessTone("The war in the region displaced families."), "serious");
assert.equal(P.guessTone("Terrorist attack condemned."), "serious");
step("tone check: harmless words no longer raise a story to serious; deaths, floods and war still do");

// Relevance: an Indian angle scores up; routine data tables and penalty notices score down.
const nasa = SOURCES.find((s) => s.name === "NASA Earth Observatory"), rbi = SOURCES.find((s) => s.name === "Reserve Bank of India");
const fog = P.score({ title: "Autumn Mornings Bring Valley Fog", description: "", source: nasa }).score;
const ganga = P.score({ title: "Fog Over the Ganga Plains", description: "Winter fog across northern India.", source: nasa }).score;
assert.ok(ganga > fog, "the same picture over India ranks higher");
const bop = P.score({ title: "Developments in India's Balance of Payments for the Month of September 2026", description: "", source: rbi }).score;
const weekly = P.score({ title: "Reserve Bank of India – Bulletin Weekly Statistical Supplement – Extract", description: "", source: rbi }).score;
const penalty = P.score({ title: "Reserve Bank of India imposes monetary penalty on One Mobikwik Systems Limited", description: "", source: rbi }).score;
assert.ok(bop > weekly && bop > penalty, "a real economy story beats a weekly table and a penalty notice");
assert.ok(rbi.indian && !nasa.indian, "Indian sources are marked");
step("relevance: Indian angle up, routine releases down");

// Drafting in small batches: a queued story and a failed one still need a draft; a second failure is left to the editor.
assert.ok(P.DRAFTS_PER_RUN * 5 + 8 <= 45, "a run stays well under Cloudflare's 50 outside calls");
assert.equal(P.needsDraft([P.WAITING]), true);
assert.equal(P.needsDraft(["AI draft unavailable (AiError: 3046: Request timeout)", "No summary yet: write one"]), true);
assert.equal(P.needsDraft(["AI draft unavailable twice (AiError: 3046: Request timeout)"]), false);
assert.equal(P.needsDraft(["Number not in source: 12"]), false);
step(`drafting goes ${P.DRAFTS_PER_RUN} stories a slot; a failed draft is tried once more, then left to the editor`);

// --- Part 2: the Desk publishes three -----------------------------------------------------------------------------
const BASE = process.env.BASE ?? "http://127.0.0.1:8787";
const TOKEN = process.env.EDITOR_TOKEN;
if (!TOKEN) { console.log("(no EDITOR_TOKEN: skipped the server part)"); process.exit(0); }
const call = async (path, { method = "GET", body, auth = true } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer " + TOKEN } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};
const run = Math.random().toString(36).slice(2, 8);
// Five approved cards: two RBI (GS3), PRS (GS2), NASA Earth Observatory (GS1), ISRO (GS3).
const stories = [
  ["Reserve Bank of India", "RBI keeps repo rate unchanged", "The Reserve Bank of India kept the repo rate at 5.5 per cent."],
  ["Reserve Bank of India", "RBI issues directions on gold loans", "The Reserve Bank of India issued directions on gold loans by banks."],
  ["PRS Legislative Research", "The Tribunals Reforms Bill, 2026", "The Tribunals Reforms Bill, 2026 was introduced in Lok Sabha."],
  ["NASA Earth Observatory", "Sediment plumes at the mouth of the Ganges", "Satellite images show sediment plumes where the Ganges meets the Bay of Bengal."],
  ["ISRO", "ISRO tests an improved first stage of SSLV", "ISRO tested an improved version of the first stage of the Small Satellite Launch Vehicle."],
];
const ids = [];
for (const [sourceName, title, text] of stories) {
  const r = await call("/desk/api/stories", { method: "POST", body: { title, sourceName, sourceUrl: `https://example.gov.in/${run}/${ids.length}`, text } });
  assert.ok(r.data.id, "story queued");
  ids.push(r.data.id);
}
const queue = (await call("/desk/api/queue")).data.candidates;
const paper = (id) => queue.find((c) => c.id === id).card.gsPaper;
assert.deepEqual(ids.map(paper), ["GS3", "GS3", "GS2", "GS1", "GS3"], "each card carries its source's paper");
for (const [k, id] of ids.entries()) {
  const c = queue.find((x) => x.id === id).card;
  await call(`/desk/api/cards/${id}`, { method: "POST", body: { card: { ...c, tone: "neutral", summary: stories[k][2] } } });
  await call(`/desk/api/cards/${id}/approve`, { method: "POST", body: { lang: "en", editor: "Chai test" } });
}
const rbiNote = (await call("/desk/api/queue")).data.candidates.find((c) => c.id === ids[0]);
assert.ok(!rbiNote.flags.some((f) => f.startsWith("Name not in source")), "no false name flag on an RBI card");

let pub = (await call("/desk/api/publish", { method: "POST" })).data;
assert.equal(pub.cards, 3, "five approved, three go out");
let brief = (await call("/brief/latest", { auth: false })).data;
assert.equal(brief.items.length, 3);
assert.deepEqual(new Set(brief.items.map((i) => i.gsPaper)), new Set(["GS1", "GS2", "GS3"]), "one card from each paper");
step("five approved cards, three published: GS1, GS2 and GS3");

// An editor's order wins: the two RBI cards first, in that order; the third slot still goes to a new paper.
await call(`/desk/api/cards/${ids[1]}/position`, { method: "POST", body: { position: 1 } });
await call(`/desk/api/cards/${ids[0]}/position`, { method: "POST", body: { position: 2 } });
pub = (await call("/desk/api/publish", { method: "POST" })).data;
brief = (await call("/brief/latest", { auth: false })).data;
assert.equal(brief.items.length, 3);
assert.deepEqual(brief.items.slice(0, 2).map((i) => i.id), [ids[1], ids[0]]);
assert.notEqual(brief.items[2].gsPaper, "GS3", "the open slot goes to a paper the brief doesn't have");
step("an editor's chosen order still wins; the open slot goes to another paper");

// A draft that fails (no AI on a local server) is tried once more by the next drafting run, then left for the editor.
const lone = (await call("/desk/api/stories", { method: "POST", body: { title: "The Waiting Story Bill, 2026", sourceName: "PRS Legislative Research", sourceUrl: `https://example.gov.in/${run}/wait`, text: "The Waiting Story Bill, 2026 was introduced in Lok Sabha." } })).data.id;
const flagsOf = async (id) => (await call("/desk/api/queue")).data.candidates.find((c) => c.id === id).flags;
assert.ok((await flagsOf(lone)).some((f) => f.startsWith("AI draft unavailable (")), "first try failed");
let log = (await call("/desk/api/pipeline", { method: "POST", body: { fetch: false } })).data.log;
assert.ok(log.some((l) => /^drafted \d+ of [1-9]/.test(l)), "the next run picks it up: " + log.join(" | "));
assert.ok((await flagsOf(lone)).some((f) => f.startsWith("AI draft unavailable twice")), "second try recorded");
log = (await call("/desk/api/pipeline", { method: "POST", body: { fetch: false } })).data.log;
assert.ok(!(await flagsOf(lone)).some((f) => f.startsWith("AI draft unavailable (")), "not tried a third time");
step("a failed draft is tried once more on the next run, then left for the editor");
