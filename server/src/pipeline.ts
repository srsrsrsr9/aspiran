import { type Hop, runAI } from "./ai";
import { llmControls } from "./staff";
import { backfillEmbeddings, relevantNotes } from "./library";
import { type Env, istDay, newId } from "./shared";
import { INDIA_WORDS, LOADED_WORDS, ROUTINE_TITLES, SERIOUS_WORDS, SOURCES, SYLLABUS, type Source } from "./sources";

/**
 * Daily news pipeline (cron at 05:00 IST, catch-up slots after): fetch allow-listed feeds, dedupe, score for UPSC
 * relevance, queue the day's best, draft Chai Cards with Workers AI a few at a time, run automatic checks.
 * Nothing reaches pods until an editor approves it, or the automatic Chai's second check passes it (see desk.ts).
 */

const DRAFT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const GUARD_MODEL = "@cf/meta/llama-guard-3-8b";
const KEEP = 12;
/**
 * Drafts per run. Cloudflare's free plan allows 50 outside calls per invocation, and Workers AI calls count: on 15 Nov
 * 2026 the 12th draft hit "Too many subrequests". One draft costs up to 5 (story page, note embedding, the draft and its
 * one retry, the safety check); the 7 feeds and the note backfill 8 more. Five drafts is about 33, leaving room for the
 * slot's other jobs. The catch-up slots draft the rest.
 */
export const DRAFTS_PER_RUN = 5;
/** Flags on a queued story with no card yet, and on one whose draft failed (tried again once on a later slot). */
export const WAITING = "Waiting for its AI draft";
const UNAVAILABLE = "AI draft unavailable";
/** Does this row still need its AI draft? Queued, or failed once. A second failure is left for the editor. */
export const needsDraft = (flags: string[]) => flags.some((f) => f === WAITING || f.startsWith(UNAVAILABLE + " ("));

interface FeedItem {
  source: Source;
  title: string;
  link: string;
  description: string;
}

export type Tone = "light" | "neutral" | "serious" | "tragic";

// --- Fetch and parse --------------------------------------------------------

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();

export const stripHtml = (html: string) =>
  decode(
    html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "),
  ).replace(/\s+/g, " ").trim();

export function parseRss(xml: string, source: Source): FeedItem[] {
  const items: FeedItem[] = [];
  for (const m of xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const tag = (t: string) => decode(block.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i"))?.[1] ?? "");
    const title = stripHtml(tag("title"));
    const link = tag("link");
    if (title && /^https?:\/\//.test(link)) items.push({ source, title, link, description: stripHtml(tag("description")) });
  }
  return items;
}

/**
 * A press page with no feed (PRS, ISRO): every link the source's pattern accepts, in page order (newest first on
 * these pages), with its link text as the title. Links are made absolute against the page's own address.
 */
export function parseHtmlList(html: string, source: Source): FeedItem[] {
  const items: FeedItem[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decode(m[1]);
    if (source.links && !source.links.test(href)) continue;
    const title = stripHtml(m[2]);
    if (title.length < 20) continue; // menus and "Read more"
    let link: string;
    try { link = new URL(href, source.url).toString(); } catch { continue; }
    if (!/^https?:\/\//.test(link) || seen.has(link)) continue;
    seen.add(link);
    items.push({ source, title, link, description: "" });
  }
  return items;
}

/** The readable part of a story page: menus, headers, footers and side panels removed before the tags go. */
export const articleText = (html: string) => {
  const main = html.match(/<(main|article)\b[\s\S]*?<\/\1>/i)?.[0] ?? html;
  const text = stripHtml(main.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, " "));
  // Some pages (RBI's) put the story inside an odd wrapper; if the trimming left almost nothing, keep the whole page.
  return text.length >= 300 ? text : stripHtml(html);
};

async function fetchText(url: string, limit = 8000): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "UPSC-Pods-NewsBot/0.1 (editorial pipeline)" }, cf: { cacheTtl: 300 } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.text()).slice(0, limit * 50);
}

// --- Score and dedupe ---------------------------------------------------------

export function score(item: { title: string; description: string; source: Source }) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  // The source's own paper and topic get a head start (RBI is economy, ISRO is science, the Earth Observatory is
  // geography): one stray word ("bill" in "Treasury Bills", "satellite" in a river story) doesn't move a card to
  // another paper; two or more syllabus words for another topic do.
  const HEAD_START = 3;
  const src = item.source;
  let best: { s: number; gs: string; topic: string } = { s: src.gs ? HEAD_START : 0, gs: src.gs ?? "GS2", topic: src.topic ?? "Current affairs" };
  let total = 0;
  for (const row of SYLLABUS) {
    const hits = row.words.filter((w) => text.includes(w)).length;
    const s = hits * row.weight;
    total += s;
    const lean = s + (src.gs && row.topic === src.topic ? HEAD_START : 0);
    if (lean > best.s) best = { s: lean, gs: row.gs, topic: row.topic };
  }
  // A clear Indian angle (an Indian source, or India in the story) is worth more to an aspirant than a scene abroad;
  // routine data releases and penalty notices (RBI's weekly tables, auction results) are worth little.
  const india = src.indian || INDIA_WORDS.test(text) ? 3 : 0;
  const routine = ROUTINE_TITLES.test(item.title) ? -8 : 0;
  return { score: total + (item.source.official ? 2 : 0) + india + routine, gs: best.gs, topic: best.topic };
}

const titleWords = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []);

/** One event, one item: titles that share most of their words are treated as the same story. */
export function dedupe<T extends { title: string }>(items: T[]): T[] {
  const kept: { item: T; w: Set<string> }[] = [];
  for (const item of items) {
    const w = titleWords(item.title);
    const dup = kept.some((k) => {
      let inter = 0;
      for (const x of w) if (k.w.has(x)) inter++;
      return inter / (new Set([...w, ...k.w]).size || 1) > 0.5;
    });
    if (!dup) kept.push({ item, w });
  }
  return kept.map((k) => k.item);
}

/** "GS2", "GS 2", "gs-2" and "GS-II" all read as "GS2"; anything else is "". */
export function gsOf(v: unknown): string {
  const m = String(v ?? "").toUpperCase().match(/GS\s*[-·]?\s*(IV|III|II|I|[1-4])\b/);
  if (!m) return "";
  return "GS" + (({ I: "1", II: "2", III: "3", IV: "4" } as Record<string, string>)[m[1]] ?? m[1]);
}

/**
 * Takes up to n items, best first, spread across GS papers: the best of each paper in turn, then the next best of
 * each, and so on. Items arrive sorted best first; their order within a paper is kept.
 */
export function spreadPick<T>(items: T[], n: number, paper: (t: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = paper(it) || "?";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  const out: T[] = [];
  while (out.length < n && [...groups.values()].some((g) => g.length)) {
    for (const g of groups.values()) {
      if (out.length >= n) break;
      const next = g.shift();
      if (next !== undefined) out.push(next);
    }
  }
  return out;
}

/** The day's three papers, in the order a missing one is filled. GS1 first: the feeds supply it least (most of them are
 * economy, polity and world news), so a GS1 draft that passes the checks must not lose its place to a second GS3. */
export const PAPERS = ["GS1", "GS2", "GS3"] as const;

/**
 * Which item to take next for the day's three (the Desk's publish and the 07:00 automatic Chai): items are best first.
 * The first card is the best overall; after that, the best of a paper the day doesn't have yet, GS1 first, then GS2,
 * then GS3; when every paper is there (or nothing is left for a missing one), the best of the rest. -1 when empty.
 */
export function nextPick<T>(items: T[], have: Set<string>, paper: (t: T) => string): number {
  if (!items.length) return -1;
  if (!have.size) return 0;
  for (const p of PAPERS) {
    if (have.has(p)) continue;
    const i = items.findIndex((t) => paper(t) === p);
    if (i >= 0) return i;
  }
  return 0;
}

/**
 * The order the day's queued stories are drafted in: the best of each paper first (GS1, GS2, GS3), then the next best
 * of each, so the 05:00 slot's few drafts already hold a GS1 story when there is one, ready for 07:00.
 */
export function draftOrder<T extends { card_json?: string | null }>(rows: T[]): T[] {
  const paperOfRow = (r: T) => { try { return gsOf(JSON.parse(r.card_json || "{}").gsPaper); } catch { return ""; } };
  const rank = (p: string) => { const i = (PAPERS as readonly string[]).indexOf(p); return i < 0 ? PAPERS.length : i; };
  // spreadPick takes the groups in the order they first appear: put the papers in GS1, GS2, GS3 order first.
  const firsts = [...new Set(rows.map(paperOfRow))].sort((a, b) => rank(a) - rank(b));
  const lead = firsts.map((p) => rows.find((r) => paperOfRow(r) === p)!);
  return spreadPick([...lead, ...rows.filter((r) => !lead.includes(r))], rows.length, paperOfRow);
}

export function guessTone(text: string): Tone {
  const t = text.toLowerCase();
  // Whole words only: "war" no longer matches "warm air" (it raised a fog picture to serious), nor "dead" "deadline".
  return SERIOUS_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(t)) ? "serious" : "neutral";
}

// --- Draft --------------------------------------------------------------------

const STYLE_LINES = [
  "The repo rate didn't move. Neither did my revision. Only one of them is the RBI lending to banks.",
  "Even bills need a deadline. Unlike your revision plan, apparently.",
  "ISRO reached orbit before I reached page 40 of Laxmikanth.",
  "New scheme, new acronym. Add it to the flashcards before it adds itself to Prelims.",
];

function prompt(item: FeedItem, text: string, notes: { title: string; body: string }[], gs: string, topic: string) {
  return [
    {
      role: "system",
      content: `You write "Chai Cards": current affairs for Indian civil services (UPSC) aspirants, simple enough for a 15-year-old.
Rules:
- Use ONLY facts in the SOURCE TEXT. Every number, name and date must appear there. If unsure, leave it out.
- Summary: 4 to 6 short sentences, plain words, no jargon without explaining it.
- Tone label first: "light" (schemes, science, space, sports, odd facts), "neutral" (politics, courts, foreign policy, elections), "serious" (deaths, disasters, violence, crime, caste or communal issues, war, health crises, suicide). When in doubt: serious.
- "chotu": one light joke ONLY when tone is "light"; otherwise null. Jokes are about the idea or aspirant life (chai, mock tests, revision), never about a person, party, religion, caste, region, gender or victim. Examples of the voice: ${STYLE_LINES.map((l) => `"${l}"`).join(" ")}
- Political items: no adjectives about parties or people; state government and opposition positions plainly.
- whyForUpsc: 2 or 3 bullets linking to law, history, economics or the syllabus. Use the CONTEXT NOTES for these lenses; do not invent Articles, Acts or committees.
- examCorner: an MCQ (4 options, answerIndex 0-3, one-line explanation) for Prelims-type stories, or a mainsPrompt ending "(150 words)" for Mains-type stories; 2 or 3 keyFacts; pyq null.
- "hi": the same card written natively in simple Hindi (Devanagari), not a word-for-word translation. Keep Article numbers and acronyms. "hi.chotu" may be Hinglish, only if tone is light.
Reply with JSON only.`,
    },
    {
      role: "user",
      content: `SUGGESTED LENS: ${gs} · ${topic}
SOURCE: ${item.source.name} — ${item.title}
SOURCE TEXT:
${text}

CONTEXT NOTES:
${notes.map((n) => `- ${n.title}: ${n.body}`).join("\n") || "(none)"}

Return: {"tone","gsPaper","topic","examType":"prelims|mains|both","staticLink","headline","summary","glossary":[],"whyForUpsc":[],"examCorner":{"mcq":{"question","options":[],"answerIndex","explanation"} or null,"mainsPrompt": string or null,"keyFacts":[],"pyq":null},"chotu": string or null,"hi":{"headline","summary","glossary":[],"whyForUpsc":[],"mcq": same shape or null,"mainsPrompt": string or null,"keyFacts":[],"chotu": string or null}}`,
    },
  ];
}

/**
 * The model's reply as an object. Models wrap JSON in code fences, add a line before or after it, leave a trailing
 * comma, or put a raw line break inside a string; all of those are repaired here. Returns null (never throws) when
 * there is no whole object, e.g. a reply cut off by the token limit, so the caller can ask again.
 */
export function firstJson(text: string): any {
  if (!text) return null;
  const t = text.replace(/^\uFEFF/, "").replace(/```(?:json)?/gi, "");
  const tries: string[] = [t.trim()];
  const start = t.indexOf("{");
  if (start >= 0) {
    // The first balanced {...}, walking the text so braces inside strings don't count.
    let depth = 0, inStr = false, esc = false, end = -1;
    for (let i = start; i < t.length; i++) {
      const ch = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) { end = i; break; }
    }
    if (end > 0) tries.push(t.slice(start, end + 1));
  }
  for (const c of tries) {
    for (const v of [c, repairJson(c)]) {
      try {
        const out = JSON.parse(v);
        if (out && typeof out === "object" && !Array.isArray(out)) return out;
      } catch { /* next */ }
    }
  }
  return null;
}

/** Trailing commas out; raw line breaks and tabs inside strings escaped. */
function repairJson(s: string): string {
  let out = "", inStr = false, esc = false;
  for (const ch of s) {
    if (inStr) {
      if (esc) { esc = false; out += ch; continue; }
      if (ch === "\\") { esc = true; out += ch; continue; }
      if (ch === '"') inStr = false;
      out += ch === "\n" ? "\\n" : ch === "\r" ? "" : ch === "\t" ? "\\t" : ch;
    } else {
      if (ch === '"') inStr = true;
      out += ch;
    }
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}

const strList = (v: unknown, max = 6) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim()).slice(0, max) : [];

function mcqOf(v: any) {
  if (!v || typeof v.question !== "string") return null;
  const options = strList(v.options, 4);
  const answerIndex = Number(v.answerIndex);
  if (options.length !== 4 || !(answerIndex >= 0 && answerIndex <= 3)) return null;
  return { question: v.question, options, answerIndex, explanation: String(v.explanation ?? "") };
}

/** Turn model output into the app's NewsItem shape, enforcing the tone and humour rules. */
export function normalizeCard(raw: any, c: { id: string; title: string; sourceName: string; sourceUrl: string; text: string; gs: string; topic: string }) {
  const keywordTone = guessTone(`${c.title} ${c.text}`);
  let tone: Tone = ["light", "neutral", "serious", "tragic"].includes(raw?.tone) ? raw.tone : "serious";
  const flags: string[] = [];
  if (keywordTone === "serious" && (tone === "light" || tone === "neutral")) {
    tone = "serious";
    flags.push("Tone raised to serious by keyword check");
  }
  const light = tone === "light";
  const ec = raw?.examCorner ?? {};
  const card: any = {
    id: c.id,
    tone,
    gsPaper: gsOf(raw?.gsPaper) || c.gs, // "GS 3", "GS-III" and "GS3" all become "GS3"
    topic: typeof raw?.topic === "string" ? raw.topic : c.topic,
    examType: ["prelims", "mains", "both"].includes(raw?.examType) ? raw.examType : "both",
    staticLink: typeof raw?.staticLink === "string" ? raw.staticLink : "",
    headline: String(raw?.headline || c.title),
    summary: String(raw?.summary ?? ""),
    glossary: strList(raw?.glossary, 3),
    whyForUpsc: strList(raw?.whyForUpsc, 3),
    examCorner: {
      mcq: mcqOf(ec.mcq),
      mainsPrompt: typeof ec.mainsPrompt === "string" ? ec.mainsPrompt : null,
      keyFacts: strList(ec.keyFacts, 3),
      pyq: null,
    },
    sources: [{ name: c.sourceName, url: c.sourceUrl }],
    checkedBy: null,
    checkedOn: null,
    chotu: light && typeof raw?.chotu === "string" ? raw.chotu : null,
  };
  const hi = raw?.hi;
  if (hi && typeof hi.headline === "string" && typeof hi.summary === "string") {
    card.hi = {
      headline: hi.headline,
      summary: hi.summary,
      glossary: strList(hi.glossary, 3),
      whyForUpsc: strList(hi.whyForUpsc, 3),
      mcq: mcqOf(hi.mcq),
      mainsPrompt: typeof hi.mainsPrompt === "string" ? hi.mainsPrompt : null,
      keyFacts: strList(hi.keyFacts, 3),
      chotu: light && typeof hi.chotu === "string" ? hi.chotu : null,
      checkedBy: null,
      checkedOn: null,
    };
  }
  if (!card.summary) flags.push("No summary yet: write one");
  return { card, flags: [...flags, ...autoChecks(card, c.text)] };
}

// Words that start a sentence or a phrase but are not part of a name: "The Reserve Bank", "On Monday".
const NAME_LEADS = new Set(["the", "a", "an", "this", "that", "these", "those", "its", "their", "on", "in", "at", "for", "from", "by", "with", "under", "after", "before", "during", "since", "while", "when", "and", "but", "both", "all", "each", "every", "india's", "indian"]);

/**
 * Is a capitalised name from the card in the source? "The Reserve Bank" is found in "Reserve Bank of India": words like
 * "The" and "On" that only start a sentence are dropped, and the rest must appear as whole words, so a short name
 * inside a longer one counts. A name made only of such words is not checked.
 */
export function nameInSource(name: string, srcLower: string): boolean {
  const words = name.toLowerCase().split(/\s+/);
  while (words.length && NAME_LEADS.has(words[0])) words.shift();
  if (!words.length) return true;
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
  return new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`).test(srcLower);
}

/** Facts must come from the source; political summaries stay neutral. */
export function autoChecks(card: any, sourceText: string): string[] {
  const flags: string[] = [];
  const src = sourceText.toLowerCase().replace(/,/g, "");
  for (const n of new Set<string>(card.summary.match(/\d[\d,.]*\d|\d/g) ?? [])) {
    const plain = n.replace(/,/g, "").replace(/\.$/, "");
    if (!src.includes(plain.toLowerCase())) flags.push(`Number not in source: ${n}`);
  }
  for (const name of new Set<string>(card.summary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [])) {
    if (!nameInSource(name, src)) flags.push(`Name not in source: ${name}`);
  }
  const lower = `${card.headline} ${card.summary}`.toLowerCase();
  for (const w of LOADED_WORDS) if (lower.includes(w)) flags.push(`Loaded word: "${w}"`);
  if (card.tone !== "light" && card.chotu) flags.push("Joke on a non-light card");
  return flags;
}

/**
 * A reply cut off by the token limit while writing the Hindi half ("hi" comes last): the English card before it, closed
 * off, so the day keeps an English card instead of none. Null when the cut came before the English card was whole.
 */
export function englishOnly(text: string): any {
  if (typeof text !== "string") return null;
  const at = text.search(/,\s*"hi"\s*:\s*\{(?![\s\S]*"hi"\s*:)/);
  if (at < 0) return null;
  const card = firstJson(text.slice(0, at) + "}");
  return card && typeof card.summary === "string" && card.summary.trim() ? card : null;
}

/** Said to the model when its first reply was cut off: the second reply must be shorter, not given more room. */
const SHORTER = `Your last reply was too long and was cut off. Reply again with the same JSON, kept short: summary 3 or 4 sentences, 2 whyForUpsc bullets, 2 keyFacts, an empty glossary, and the Hindi half no longer than the English.`;

/**
 * One card from the model. A whole English and Hindi card is often longer than the 2,500-token limit, and this model
 * writes about 27 tokens a second, so asking again with more room ran past Workers AI's 120-second limit ("3046: Request
 * timeout", 15 Nov 2026). Now a reply cut off in the Hindi half keeps its English card; otherwise (or if that is all
 * there is) the model is asked once more for a shorter card, with no randomness. Throws only if nothing usable came back.
 */
async function draft(env: Env, item: FeedItem, text: string, gs: string, topic: string) {
  const c = await llmControls(env);
  const notes = await relevantNotes(env, `${item.title}\n${text.slice(0, 1000)}`);
  const messages = prompt(item, text, notes, gs, topic);
  const model = c.draftModel || DRAFT_MODEL;
  const first = (await runAI(env, "draft", model, { messages, response_format: { type: "json_object" }, max_tokens: c.maxTokens, temperature: c.temperature })) as { response?: unknown };
  let r = first.response;
  const parsed = typeof r === "string" ? firstJson(r) : r && typeof r === "object" ? r : null;
  if (parsed) return parsed;
  const english = typeof r === "string" ? englishOnly(r) : null;
  let last = typeof r === "string" ? r.slice(-60) : typeof r;
  try {
    const again = (await runAI(env, "draft", model, { messages: [...messages, { role: "user", content: SHORTER }], response_format: { type: "json_object" }, max_tokens: c.maxTokens, temperature: 0 })) as { response?: unknown };
    r = again.response;
    const p2 = typeof r === "string" ? firstJson(r) ?? englishOnly(r) : r && typeof r === "object" ? r : null;
    if (p2) return p2;
    last = typeof r === "string" ? r.slice(-60) : typeof r;
  } catch (e) {
    if (english) return english;
    throw e;
  }
  if (english) return english;
  throw new Error(`reply was not valid JSON twice (ends: ${last})`);
}

async function guard(env: Env, summary: string): Promise<boolean> {
  if (!env.AI) return true;
  try {
    const out = (await runAI(env, "guard", GUARD_MODEL, {
      messages: [
        { role: "user", content: "Summarise today's news for students." },
        { role: "assistant", content: summary },
      ],
    })) as any;
    return !JSON.stringify(out).toLowerCase().includes("unsafe");
  } catch {
    return true; // checked by the editor anyway
  }
}

// --- The automatic Chai's second check (desk.ts autoPick) ---------------------------------------------------

// The drafts come from Llama on Workers AI; the second read is another family (OpenAI's open model, then Qwen, NVIDIA's
// Nemotron and Gemini), steady and strict. gpt-oss reasons before it answers and its reasoning counts against the token
// limit: at 300 tokens it used them all thinking and sent nothing back (every check on 15 Nov 2026), so it gets room.
export const AUTO_HOPS: Hop[] = [
  { provider: "groq", model: "openai/gpt-oss-120b", extra: { temperature: 0, reasoning_effort: "low", include_reasoning: false, max_completion_tokens: 2000 }, timeoutMs: 30_000 },
  { provider: "groq", model: "qwen/qwen3.8-27b", extra: { temperature: 0, reasoning_format: "hidden", max_completion_tokens: 2000 }, timeoutMs: 30_000 },
  { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { temperature: 0, max_tokens: 2000 }, timeoutMs: 30_000 },
  { provider: "google", model: "gemini-3.8-flash", extra: { temperature: 0, reasoning_effort: "low", max_tokens: 2000 }, timeoutMs: 30_000 },
];

/** The second check's answer: {"verdict": "pass"} passes; anything else, or no JSON, does not. */
export function readVerdict(text: string): { pass: boolean; reason: string } {
  const m = String(text ?? "").match(/\{[\s\S]*\}/);
  try {
    const v = m ? JSON.parse(m[0]) : null;
    return { pass: String(v?.verdict ?? "").toLowerCase() === "pass", reason: typeof v?.reason === "string" ? v.reason : "" };
  } catch { return { pass: false, reason: "unreadable answer" }; }
}

// --- Run ------------------------------------------------------------------------

export interface CandidateInput {
  title: string;
  sourceName: string;
  sourceUrl: string;
  text: string;
  score?: number;
}

/** The card for one story: drafted by the model, or, when the AI isn't available, a headline-only card with the reason. */
async function cardFor(env: Env, id: string, input: CandidateInput, failFlag = UNAVAILABLE) {
  // A known source lends its paper and topic (PRS is polity); an editor's own story is scored on its words alone.
  const known = SOURCES.find((x) => x.name === input.sourceName);
  const source: Source = { name: input.sourceName, url: input.sourceUrl, official: known?.official ?? true, gs: known?.gs, topic: known?.topic, indian: known?.indian };
  const s = score({ title: input.title, description: input.text, source });
  const feedItem: FeedItem = { source, title: input.title, link: input.sourceUrl, description: "" };
  const base = { id, title: input.title, sourceName: input.sourceName, sourceUrl: input.sourceUrl, text: input.text, gs: s.gs, topic: s.topic };
  let card: any;
  let flags: string[];
  try {
    const raw = await draft(env, feedItem, input.text, s.gs, s.topic);
    ({ card, flags } = normalizeCard(raw, base));
    if (card.summary && !(await guard(env, card.summary))) flags.push("Safety check: unsafe");
  } catch (e) {
    // No AI (not logged in, allowance used up, a timeout): headline and link only; tried again on a later slot.
    ({ card, flags } = normalizeCard({ tone: guessTone(input.title + " " + input.text) }, base));
    flags.unshift(`${failFlag} (${String(e).slice(0, 80)})`);
  }
  return { card, flags, score: s.score };
}

/** Draft one story into the editor queue. Used by the desk's "add a story" and the content imports. */
export async function addCandidate(env: Env, input: CandidateInput, day = istDay()) {
  const id = newId("c");
  const { card, flags, score: sc } = await cardFor(env, id, input);
  await insertCandidate(env, id, day, input, input.score ?? sc, card, flags);
  return id;
}

async function insertCandidate(env: Env, id: string, day: string, input: CandidateInput, sc: number, card: unknown, flags: string[]) {
  await env.DB.prepare(
    `INSERT INTO candidates (id, day, source_name, source_url, title, source_text, score, card_json, flags, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, day, input.sourceName, input.sourceUrl, input.title, input.text, sc, JSON.stringify(card), JSON.stringify(flags), new Date().toISOString()).run();
}

interface WaitingRow { id: string; title: string; source_name: string; source_url: string; source_text: string; flags: string; card_json: string | null }

/** The day's stories still waiting for a draft (queued, or failed once): each paper's best first, see draftOrder. */
export async function waitingDrafts(env: Env, day = istDay()): Promise<WaitingRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, title, source_name, source_url, source_text, flags, card_json FROM candidates
     WHERE day = ? AND status = 'draft' AND (flags LIKE ? OR flags LIKE ?) ORDER BY score DESC, created_at`,
  ).bind(day, `%${WAITING}%`, `%${UNAVAILABLE} (%`).all<WaitingRow>();
  return draftOrder(results.filter((r) => { try { return needsDraft(JSON.parse(r.flags || "[]")); } catch { return false; } }));
}

/** Drafts a queued story (fetching its page first if only the feed's line is stored), or tries a failed one again. */
async function draftWaiting(env: Env, row: WaitingRow) {
  let text = row.source_text;
  if (text.length < 400 && /^https?:\/\//.test(row.source_url)) {
    try { text = articleText(await fetchText(row.source_url)).slice(0, 6000) || text; } catch { /* keep the feed's line */ }
  }
  const second = !JSON.parse(row.flags || "[]").includes(WAITING);
  const { card, flags } = await cardFor(env, row.id, { title: row.title, sourceName: row.source_name, sourceUrl: row.source_url, text }, second ? `${UNAVAILABLE} twice` : UNAVAILABLE);
  await env.DB.prepare("UPDATE candidates SET source_text = ?, card_json = ?, flags = ? WHERE id = ? AND status = 'draft'")
    .bind(text, JSON.stringify(card), JSON.stringify(flags), row.id).run();
  return !flags.some((f) => f.startsWith(UNAVAILABLE));
}

/**
 * One drafting run. With `fetch` (05:00, the Desk's "Run pipeline", or a catch-up slot on a day with nothing yet), the
 * feeds are read and the day's best KEEP stories are queued at once, each marked WAITING. Then up to DRAFTS_PER_RUN
 * waiting stories are drafted, best first; the catch-up slots draft the rest, and try a failed draft once more.
 */
export async function runPipeline(env: Env, day = istDay(), opts: { fetch?: boolean } = {}) {
  const log: string[] = [];
  if (opts.fetch ?? true) {
    const all: FeedItem[] = [];
    for (const source of SOURCES.filter((s) => s.enabled !== false)) {
      try {
        const body = await fetchText(source.url, 50_000);
        const items = (source.kind === "html" ? parseHtmlList(body, source) : parseRss(body, source)).slice(0, source.max ?? 10);
        log.push(`${source.name}: fetched ${items.length} items`);
        all.push(...items);
      } catch (e) {
        log.push(`${source.name}: failed (${String(e).slice(0, 100)})`);
      }
    }
    const unseen: FeedItem[] = [];
    for (const item of all) {
      const seen = await env.DB.prepare("SELECT 1 FROM seen WHERE url = ?").bind(item.link).first();
      if (!seen) unseen.push(item);
    }
    // The day's drafts are spread across the papers, so the Desk (and the automatic Chai) can pick GS1, GS2 and GS3.
    const ranked = spreadPick(dedupe(unseen.map((i) => ({ ...i, ...score(i) })).sort((a, b) => b.score - a.score)), KEEP, (i) => i.gs);
    for (const item of ranked) {
      const id = newId("c");
      const input = { title: item.title, sourceName: item.source.name, sourceUrl: item.link, text: item.description };
      const { card, flags } = normalizeCard({ tone: guessTone(`${item.title} ${item.description}`) }, { id, ...input, gs: item.gs, topic: item.topic });
      await insertCandidate(env, id, day, input, item.score, card, [WAITING, ...flags.filter((f) => !f.startsWith("No summary"))]);
      await env.DB.prepare("INSERT OR IGNORE INTO seen (url, seen_on) VALUES (?, ?)").bind(item.link, day).run();
    }
    log.push(`queued ${ranked.length} stories for ${day}`);
  }

  const waiting = await waitingDrafts(env, day);
  if (waiting.length) await backfillEmbeddings(env);
  let ok = 0;
  const batch = waiting.slice(0, DRAFTS_PER_RUN);
  for (const row of batch) if (await draftWaiting(env, row)) ok++;
  log.push(`drafted ${ok} of ${batch.length}; ${waiting.length - batch.length} left for the next slot`);
  return log;
}
