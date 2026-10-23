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

async function fetchText(url: string, limit = 8000): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "UPSC-Pods-NewsBot/0.1 (editorial pipeline)" }, cf: { cacheTtl: 300 } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.text()).slice(0, limit * 50);
}

// --- Score and dedupe ---------------------------------------------------------

export function score(item: { title: string; description: string; source: Source }) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let best = { s: 0, gs: "GS2", topic: "Current affairs" };
  let total = 0;
  for (const row of SYLLABUS) {
    const hits = row.words.filter((w) => text.includes(w)).length;
    const s = hits * row.weight;
    total += s;
    if (s > best.s) best = { s, gs: row.gs, topic: row.topic };
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

function firstJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
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
    gsPaper: typeof raw?.gsPaper === "string" ? raw.gsPaper : c.gs,
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

/** Facts must come from the source; political summaries stay neutral. */
export function autoChecks(card: any, sourceText: string): string[] {
  const flags: string[] = [];
  const src = sourceText.toLowerCase().replace(/,/g, "");
  for (const n of new Set<string>(card.summary.match(/\d[\d,.]*\d|\d/g) ?? [])) {
    const plain = n.replace(/,/g, "").replace(/\.$/, "");
    if (!src.includes(plain.toLowerCase())) flags.push(`Number not in source: ${n}`);
  }
  for (const name of new Set<string>(card.summary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [])) {
    if (!src.includes(name.toLowerCase())) flags.push(`Name not in source: ${name}`);
  }
  const lower = `${card.headline} ${card.summary}`.toLowerCase();
  for (const w of LOADED_WORDS) if (lower.includes(w)) flags.push(`Loaded word: "${w}"`);
  if (card.tone !== "light" && card.chotu) flags.push("Joke on a non-light card");
  return flags;
}

async function draft(env: Env, item: FeedItem, text: string, gs: string, topic: string) {
  const c = await llmControls(env);
  const notes = await relevantNotes(env, `${item.title}\n${text.slice(0, 1000)}`);
  const out = (await runAI(env, "draft", c.draftModel || DRAFT_MODEL, {
    messages: prompt(item, text, notes, gs, topic),
    response_format: { type: "json_object" },
    max_tokens: c.maxTokens,
    temperature: c.temperature,
  })) as { response?: unknown };
  const r = out.response;
  return typeof r === "string" ? firstJson(r) : r;
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
  const s = score({ title: input.title, description: input.text, source: { name: input.sourceName, url: input.sourceUrl, official: true } });
  const feedItem: FeedItem = { source: { name: input.sourceName, url: input.sourceUrl, official: true }, title: input.title, link: input.sourceUrl, description: "" };
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
      const items = parseRss(await fetchText(source.url, 50_000), source);
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
  const ranked = dedupe(unseen.map((i) => ({ ...i, ...score(i) })).sort((a, b) => b.score - a.score)).slice(0, KEEP);
  await backfillEmbeddings(env);

  for (const item of ranked) {
    let text = item.description;
    try {
      text = stripHtml(await fetchText(item.link)).slice(0, 6000) || text;
    } catch {
      // keep the feed description
    }
    await addCandidate(env, { title: item.title, sourceName: item.source.name, sourceUrl: item.link, text, score: item.score }, day);
    await env.DB.prepare("INSERT OR IGNORE INTO seen (url, seen_on) VALUES (?, ?)").bind(item.link, day).run();
  }
  log.push(`queued ${ranked.length} candidates for ${day}`);
  return log;
}
