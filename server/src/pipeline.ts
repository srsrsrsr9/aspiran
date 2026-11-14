import { runAI } from "./ai";
import { llmControls } from "./staff";
import { backfillEmbeddings, relevantNotes } from "./library";
import { type Env, istDay, newId } from "./shared";
import { LOADED_WORDS, SERIOUS_WORDS, SOURCES, SYLLABUS, type Source } from "./sources";

/**
 * Daily news pipeline (cron at 05:30 IST): fetch allow-listed feeds, dedupe, score for UPSC
 * relevance, draft Chai Cards with Workers AI, run automatic checks, and queue them for the editor.
 * Nothing reaches pods until an editor approves it (see desk.ts).
 */

const DRAFT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const GUARD_MODEL = "@cf/meta/llama-guard-3-8b";
const KEEP = 12;

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
  return { score: total + (item.source.official ? 2 : 0), gs: best.gs, topic: best.topic };
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

export function guessTone(text: string): Tone {
  const t = text.toLowerCase();
  return SERIOUS_WORDS.some((w) => new RegExp(`\\b${w}`).test(t)) ? "serious" : "neutral";
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
 * One card from the model. About 1 in 10 replies used to fail to parse (cut off at the token limit by the Hindi half,
 * or with a stray comma or line break). Now the reply is repaired where it can be, and if it still isn't a whole
 * object the model is asked once more, with more room and no randomness. Throws only if both tries fail.
 */
async function draft(env: Env, item: FeedItem, text: string, gs: string, topic: string) {
  const c = await llmControls(env);
  const notes = await relevantNotes(env, `${item.title}\n${text.slice(0, 1000)}`);
  const messages = prompt(item, text, notes, gs, topic);
  const tries = [
    { max_tokens: c.maxTokens, temperature: c.temperature },
    { max_tokens: Math.min(Math.max(c.maxTokens * 2, 4000), 8000), temperature: 0 },
  ];
  let last = "";
  for (const t of tries) {
    const out = (await runAI(env, "draft", c.draftModel || DRAFT_MODEL, { messages, response_format: { type: "json_object" }, ...t })) as { response?: unknown };
    const r = out.response;
    const parsed = typeof r === "string" ? firstJson(r) : r && typeof r === "object" ? r : null;
    if (parsed) return parsed;
    last = typeof r === "string" ? r.slice(-60) : typeof r;
  }
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

// --- Run ------------------------------------------------------------------------

export interface CandidateInput {
  title: string;
  sourceName: string;
  sourceUrl: string;
  text: string;
  score?: number;
}

/** Draft one story into the editor queue. Used by the cron and by the desk's "add a story". */
export async function addCandidate(env: Env, input: CandidateInput, day = istDay()) {
  const id = newId("c");
  // A known source lends its paper and topic (PRS is polity); an editor's own story is scored on its words alone.
  const known = SOURCES.find((x) => x.name === input.sourceName);
  const source: Source = { name: input.sourceName, url: input.sourceUrl, official: known?.official ?? true, gs: known?.gs, topic: known?.topic };
  const s = score({ title: input.title, description: input.text, source });
  const feedItem: FeedItem = { source, title: input.title, link: input.sourceUrl, description: "" };
  let card: any;
  let flags: string[];
  try {
    const raw = await draft(env, feedItem, input.text, s.gs, s.topic);
    ({ card, flags } = normalizeCard(raw, { id, title: input.title, sourceName: input.sourceName, sourceUrl: input.sourceUrl, text: input.text, gs: s.gs, topic: s.topic }));
    if (card.summary && !(await guard(env, card.summary))) flags.push("Safety check: unsafe");
  } catch (e) {
    // No AI (not logged in, or allowance used up): headline and link only, the editor writes the rest.
    ({ card, flags } = normalizeCard({ tone: guessTone(input.title + " " + input.text) }, { id, title: input.title, sourceName: input.sourceName, sourceUrl: input.sourceUrl, text: input.text, gs: s.gs, topic: s.topic }));
    flags.unshift(`AI draft unavailable (${String(e).slice(0, 80)})`);
  }
  await env.DB.prepare(
    `INSERT INTO candidates (id, day, source_name, source_url, title, source_text, score, card_json, flags, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, day, input.sourceName, input.sourceUrl, input.title, input.text, input.score ?? s.score, JSON.stringify(card), JSON.stringify(flags), new Date().toISOString()).run();
  return id;
}

export async function runPipeline(env: Env, day = istDay()) {
  const log: string[] = [];
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
  await backfillEmbeddings(env);

  for (const item of ranked) {
    let text = item.description;
    try {
      text = articleText(await fetchText(item.link)).slice(0, 6000) || text;
    } catch {
      // keep the feed description
    }
    await addCandidate(env, { title: item.title, sourceName: item.source.name, sourceUrl: item.link, text, score: item.score }, day);
    await env.DB.prepare("INSERT OR IGNORE INTO seen (url, seen_on) VALUES (?, ?)").bind(item.link, day).run();
  }
  log.push(`queued ${ranked.length} candidates for ${day}`);
  return log;
}
