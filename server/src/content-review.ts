import { type Env, bad, json } from "./shared";
import { type Staff, label } from "./staff";
import { ENGINE_KINDS } from "./engines";
import { coverage, coverageRows, placeItem } from "./coverage";

/**
 * Content coverage and owner reviews, for the admin's "Coverage and review" section (admin.html).
 *
 * Coverage: what exists, by type (Chai cards, past papers, mocks, practice, lessons, videos, Listen audio, study walks),
 * by syllabus area (Prelims, CSAT, GS1 to GS4, Essay, optionals) and by language (English, Hindi, Telugu), with the gaps
 * named in plain words. D1 is close to its free 5M rows read a day, so the summary is built from one pass over the
 * library and the Chai cards and kept in R2 (_cache/content-summary.json, never served at /media). A page load reads that
 * file and the review rows only. It is rebuilt when it is older than MAX_AGE_H hours or when someone presses "Count again".
 * Videos come from the R2 manifests under ca/ (weekly current affairs, Syllabus in a minute and the shorts).
 *
 * Reviews: the owner (or an editor) opens any piece, sees English and Hindi side by side, gives 1 to 5, ticks issues
 * and a note, and marks it reviewed. One row per piece in content_reviews (migrations/0017_content_reviews.sql); every
 * save is also in the audit log, as all admin changes are. A review is internal: nothing outside admin says a piece was
 * "checked by a human editor" because of it.
 */

export const MAX_AGE_H = 12;
const CACHE_KEY = "_cache/content-summary.json";
const VERSION = 1;

/** The owner's words for each type, in the order the page shows them. */
export const TYPES: [string, string][] = [
  ["chai", "Chai cards"],
  ["pyq", "Past papers (PYQs)"],
  ["mock", "Mocks"],
  ["practice", "Practice games, quizzes and flashcards"],
  ["lessons", "Lessons and notes"],
  ["videos", "Videos"],
  ["audio", "Listen (audio)"],
  ["walks", "Study walks"],
  ["other", "Other small pieces"],
];
export const AREAS: [string, string][] = [
  ["prelims", "Prelims GS"], ["csat", "CSAT"], ["gs1", "GS1"], ["gs2", "GS2"], ["gs3", "GS3"], ["gs4", "GS4 (Ethics)"],
  ["essay", "Essay"], ["optional", "Optional subjects"], ["other", "Not tied to a paper"],
];
export const ISSUES: [string, string][] = [
  ["factual", "Factual error"], ["translation", "Translation"], ["tone", "Tone"], ["formatting", "Formatting"], ["outdated", "Out of date"], ["other", "Other"],
];

const LESSONS = ["read", "explainer", "topic-path", "essay", "mains-skeleton", "gs4-glossary", "optional-node", "optional-syllabus", "optional-priority", "printable"];
const PRACTICE = ["quiz", "match", "timeline", "map", "number", "myth", "debate", "scratch", "trail", "radio", "assemble", "chain", "thennow", "postcard",
  "terms", "csat-week", "gs4-case", "interactive", "interview-bank"];
const AUDIO = ["audio-lecture", "walk-script", "winddown", "calm", "sound"];
const OPTIONAL = ["optional-node", "optional-syllabus", "optional-priority"];

/** Which of the owner's types a library item is. */
export function typeOf(kind: string, data: any, id: string): string {
  if (kind === "pyq" || kind === "mock") return kind;
  if (kind === "audio-lecture" && (data?.kind === "audio-study-walk" || data?.speakers || /walk|^audio-lecture:a\d+-/i.test(id))) return "walks";
  if (AUDIO.includes(kind)) return "audio";
  if (LESSONS.includes(kind)) return "lessons";
  if (PRACTICE.includes(kind) || ENGINE_KINDS[kind]) return "practice";
  return "other";
}

/** One piece in the summary's index: [ref, type, areas joined by ",", title, live 0/1, languages "en,hi,te" (made), updated]. */
type Entry = [string, string, string, string, number, string, string];
type Cell = { total: number; live: number; hiMade: number; hiLive: number; teMade: number; teLive: number; questions: number };
const cell = (): Cell => ({ total: 0, live: 0, hiMade: 0, hiLive: 0, teMade: 0, teLive: 0, questions: 0 });

export interface Summary {
  version: number; builtAt: string; rowsRead: number;
  types: { id: string; name: string }[]; areas: { id: string; name: string }[];
  byType: Record<string, Cell>; byArea: Record<string, Cell>; matrix: Record<string, Record<string, Cell>>;
  chaiByPaper: Record<string, number>;
  gaps: { level: "bad" | "warn" | "info"; text: string }[];
  grid: Awaited<ReturnType<typeof coverage>>;
  items: Entry[];
}

const str = (v: any): string => (typeof v === "string" ? v : typeof v?.en === "string" ? v.en : "");
const parse = (s: string | null | undefined): any => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };

/** Builds the summary: one read of library and candidates, and the video manifests in R2. */
export async function buildSummary(env: Env): Promise<Summary> {
  const rows = await coverageRows(env);
  for (const r of rows.lib) r.data = parse(r.json); // parsed once, shared with coverage()
  const grid = await coverage(env, rows);
  const byType: Record<string, Cell> = Object.fromEntries(TYPES.map(([t]) => [t, cell()]));
  const byArea: Record<string, Cell> = Object.fromEntries(AREAS.map(([a]) => [a, cell()]));
  const matrix: Record<string, Record<string, Cell>> = Object.fromEntries(AREAS.map(([a]) => [a, Object.fromEntries(TYPES.map(([t]) => [t, cell()]))]));
  const chaiByPaper: Record<string, number> = { gs1: 0, gs2: 0, gs3: 0, gs4: 0, none: 0 };
  const items: Entry[] = [];

  const add = (ref: string, type: string, areas: string[], title: string, live: boolean, hi: [boolean, boolean], te: [boolean, boolean], updated: string, questions = 0) => {
    const bump = (c: Cell) => {
      c.total++; c.questions += questions;
      if (live) c.live++;
      if (hi[0]) c.hiMade++;
      if (live && hi[1]) c.hiLive++;
      if (te[0]) c.teMade++;
      if (live && te[1]) c.teLive++;
    };
    bump(byType[type]);
    for (const a of areas) { bump(byArea[a]); bump(matrix[a][type]); }
    items.push([ref, type, areas.join(","), title.slice(0, 160), live ? 1 : 0, ["en", hi[0] && "hi", te[0] && "te"].filter(Boolean).join(","), updated]);
  };
  const areasFor = (cells: [string, number][]) => [...new Set(cells.map(([p]) => p))];

  for (const r of rows.lib) {
    if (r.status === "hidden") continue;
    const data = r.data;
    const type = typeOf(r.kind, data, r.id);
    let areas = OPTIONAL.includes(r.kind) ? ["optional"] : areasFor(placeItem(data, r.id, r.title));
    if (!areas.length) areas = ["other"];
    const trs = parse(r.translations), apr = parse(r.approvals);
    const questions = Array.isArray(data?.questions) ? data.questions.length : 0;
    add(`library:${r.id}`, type, areas, r.title, !!r.en_editor && r.status === "approved", [String(r.json).includes('"hi"'), !!r.hi_editor], [!!trs?.te, !!apr?.te], r.updated_at ?? "", questions);
  }
  for (const r of rows.cards) {
    const c = parse(r.card_json);
    const gs = String(c.gsPaper ?? "").toLowerCase().replace(/\s+/g, "");
    const paper = /^gs[1-4]$/.test(gs) ? gs : "";
    chaiByPaper[paper || "none"]++;
    const areas = paper ? [paper] : ["prelims"];
    add(`card:${r.id}`, "chai", areas, c.headline || r.title || r.id, !!r.en_editor, [!!c.hi, !!r.hi_editor], [!!c.te, false], r.day ?? "");
  }
  if (env.MEDIA) {
    let cursor: string | undefined;
    const weeks: string[] = [];
    do {
      const page = await env.MEDIA.list({ prefix: "ca/", delimiter: "/", cursor });
      for (const p of page.delimitedPrefixes) { const w = p.slice(3, -1); if (/^\d{4}-\d{2}$/.test(w)) weeks.push(w); }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    for (const w of weeks) {
      const obj = await env.MEDIA.get(`ca/${w}/manifest.json`).catch(() => null);
      if (!obj) continue;
      const m = parse(await obj.text());
      const lang = String(m.lang ?? "en");
      for (const e of m.episodes ?? []) {
        let areas = areasFor(placeItem(e, "", str(e.title)));
        if (!areas.length) areas = ["other"];
        const live = e.review?.status === "approved";
        add(`video:${w}:${e.n}`, "videos", areas, `${m.title ? str(m.title) + ": " : ""}${str(e.title) || `Scene ${e.n}`}${lang !== "en" ? ` (${lang})` : ""}`,
          live, [lang === "hi" || !!e.vttHi, lang === "hi" || !!e.vttHi], [lang === "te", lang === "te"], m.generatedAt ?? "", Array.isArray(e.quiz) ? e.quiz.length : 0);
      }
    }
  }

  const summary: Summary = {
    version: VERSION, builtAt: new Date().toISOString(), rowsRead: rows.lib.length + rows.cards.length,
    types: TYPES.map(([id, name]) => ({ id, name })), areas: AREAS.map(([id, name]) => ({ id, name })),
    byType, byArea, matrix, chaiByPaper, gaps: [], grid, items,
  };
  summary.gaps = findGaps(summary);
  return summary;
}

/** The gaps, in plain words, worst first. */
export function findGaps(s: Pick<Summary, "byType" | "matrix" | "chaiByPaper" | "grid" | "byArea">): Summary["gaps"] {
  const out: Summary["gaps"] = [];
  const name = (list: [string, string][], id: string) => list.find(([x]) => x === id)?.[1] ?? id;
  // Chai by GS paper: the daily cards should spread across GS1, GS2 and GS3.
  const chai = ["gs1", "gs2", "gs3"].map((p) => s.chaiByPaper[p] ?? 0);
  const chaiMean = chai.reduce((a, b) => a + b, 0) / 3;
  ["gs1", "gs2", "gs3"].forEach((p, i) => {
    if (chai[i] === 0) out.push({ level: "bad", text: `No Chai cards for ${name(AREAS, p)} yet.` });
    else if (chai[i] < chaiMean * 0.5) out.push({ level: "warn", text: `Chai is thin in ${name(AREAS, p)}: ${chai[i]} cards, against about ${Math.round(chaiMean)} on average for GS1 to GS3.` });
  });
  // Each paper should have something live of the main kinds.
  const want: Record<string, string[]> = {
    prelims: ["pyq", "mock", "practice", "lessons"], csat: ["pyq", "mock", "practice"], gs1: ["pyq", "practice", "lessons", "videos", "audio"],
    gs2: ["pyq", "practice", "lessons", "videos", "audio"], gs3: ["pyq", "practice", "lessons", "videos", "audio"], gs4: ["pyq", "practice", "lessons"], essay: ["pyq", "lessons"],
  };
  for (const [a, types] of Object.entries(want)) {
    const missing = types.filter((t) => (s.matrix[a]?.[t]?.live ?? 0) === 0);
    if (missing.length) out.push({ level: "warn", text: `${name(AREAS, a)} has nothing live in: ${missing.map((t) => name(TYPES, t)).join(", ")}.` });
  }
  // Hindi behind English.
  for (const [a] of AREAS) {
    const c = s.byArea[a];
    if (c && c.live >= 10 && c.hiLive < c.live * 0.6) out.push({ level: "warn", text: `Hindi is behind in ${name(AREAS, a)}: ${c.hiLive} of ${c.live} live pieces have approved Hindi.` });
  }
  // Syllabus topics with nothing at all.
  const gapTopics = s.grid.papers.flatMap((p) => p.rows.filter((r) => r.status === "gap").map((r) => `${p.name}: ${r.topic}`));
  if (gapTopics.length) out.push({ level: "bad", text: `${gapTopics.length} syllabus topic${gapTopics.length > 1 ? "s have" : " has"} nothing yet: ${gapTopics.slice(0, 6).join("; ")}${gapTopics.length > 6 ? "; and more (see the topic table)" : ""}.` });
  // Telugu is the pilot language.
  const teLive = Object.values(s.byType).reduce((n, c) => n + c.teLive, 0), teMade = Object.values(s.byType).reduce((n, c) => n + c.teMade, 0);
  if (teLive === 0) out.push({ level: "info", text: teMade ? `Telugu: ${teMade} pieces translated, none approved yet.` : "Telugu (the pilot language): nothing translated yet." });
  return out;
}

// --- The cache -----------------------------------------------------------------------------------

let memo: Summary | null = null; // one per isolate, so repeat loads within a few minutes don't even touch R2
let memoAt = 0;

/** The summary, from memory, then R2, then built afresh (and saved) when missing, old or `force`d. */
export async function contentSummary(env: Env, force = false): Promise<Summary> {
  const fresh = (s: Summary | null) => !!s && s.version === VERSION && Date.now() - Date.parse(s.builtAt) < MAX_AGE_H * 3600e3;
  if (!force && memo && fresh(memo) && Date.now() - memoAt < 5 * 60e3) return memo;
  if (!force && env.MEDIA) {
    const hit = await env.MEDIA.get(CACHE_KEY).catch(() => null);
    const s = hit ? (parse(await hit.text()) as Summary) : null;
    if (fresh(s)) { memo = s; memoAt = Date.now(); return s!; }
  }
  const s = await buildSummary(env);
  if (env.MEDIA) await env.MEDIA.put(CACHE_KEY, JSON.stringify(s), { httpMetadata: { contentType: "application/json" } }).catch(() => {});
  memo = s; memoAt = Date.now();
  return s;
}

// --- Reviews -------------------------------------------------------------------------------------

export const REVIEW_TABLE = `CREATE TABLE IF NOT EXISTS content_reviews (ref TEXT PRIMARY KEY, rating INTEGER, issues TEXT NOT NULL DEFAULT '[]', note TEXT,
  status TEXT NOT NULL DEFAULT 'reviewed', reviewer TEXT NOT NULL, reviewer_id TEXT, reviewed_at TEXT NOT NULL, item_updated TEXT)`;
let tableReady = false;
async function ensureTable(env: Env) {
  if (tableReady) return;
  await env.DB.prepare(REVIEW_TABLE).run();
  tableReady = true;
}

type ReviewRow = { ref: string; rating: number | null; issues: string; note: string | null; status: string; reviewer: string; reviewed_at: string; item_updated: string | null };
/** Every review, without the notes (one row each; there is one per reviewed piece, so this stays small). */
async function reviewMap(env: Env): Promise<Map<string, ReviewRow>> {
  await ensureTable(env);
  const { results } = await env.DB.prepare("SELECT ref, rating, issues, status, reviewer, reviewed_at, item_updated FROM content_reviews").all<ReviewRow>();
  return new Map(results.map((r) => [r.ref, r]));
}

/** Review progress per area and per type. A piece edited after its review counts as "changed since". */
function progress(s: Summary, reviews: Map<string, ReviewRow>) {
  const blank = () => ({ total: 0, reviewed: 0, ratingSum: 0, rated: 0, low: 0, issues: 0, changed: 0 });
  const byArea: Record<string, ReturnType<typeof blank>> = Object.fromEntries(AREAS.map(([a]) => [a, blank()]));
  const byType: Record<string, ReturnType<typeof blank>> = Object.fromEntries(TYPES.map(([t]) => [t, blank()]));
  const all = blank();
  for (const [ref, type, areas, , , , updated] of s.items) {
    const r = reviews.get(ref);
    const targets = [all, byType[type], ...areas.split(",").map((a) => byArea[a]).filter(Boolean)];
    for (const p of targets) {
      p.total++;
      if (!r) continue;
      if (r.status === "reviewed") p.reviewed++;
      if (r.rating) { p.rated++; p.ratingSum += r.rating; if (r.rating <= 2) p.low++; }
      if (r.issues && r.issues !== "[]") p.issues++;
      if (r.item_updated && updated && updated > r.item_updated) p.changed++;
    }
  }
  const out = (p: ReturnType<typeof blank>) => ({ total: p.total, reviewed: p.reviewed, avgRating: p.rated ? Math.round((p.ratingSum / p.rated) * 10) / 10 : null, low: p.low, issues: p.issues, changed: p.changed });
  return { all: out(all), byArea: Object.fromEntries(Object.entries(byArea).map(([k, v]) => [k, out(v)])), byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, out(v)])) };
}

/** The queue: not reviewed (or changed since) first, then lowest rated, then oldest review. */
function queue(s: Summary, reviews: Map<string, ReviewRow>, url: URL) {
  const type = url.searchParams.get("type") || "", area = url.searchParams.get("area") || "", show = url.searchParams.get("show") || "todo";
  const q = (url.searchParams.get("q") || "").toLowerCase().slice(0, 80);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0), limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 40));
  const rows = s.items
    .filter(([, t, a, title]) => (!type || t === type) && (!area || a.split(",").includes(area)) && (!q || title.toLowerCase().includes(q)))
    .map(([ref, t, a, title, live, langs, updated]) => {
      const r = reviews.get(ref);
      const changed = !!(r?.item_updated && updated && updated > r.item_updated);
      return { ref, type: t, areas: a.split(","), title, live: !!live, langs: langs.split(","), rating: r?.rating ?? null, status: r?.status ?? null,
        issues: r ? parse(r.issues) : [], reviewer: r?.reviewer ?? null, reviewedAt: r?.reviewed_at ?? null, changed };
    })
    .filter((x) => show === "all" ? true : show === "low" ? x.rating != null && x.rating <= 2 : show === "issues" ? x.issues.length > 0 : show === "done" ? x.status === "reviewed" : x.status !== "reviewed" || x.changed);
  const order = TYPES.map(([t]) => t);
  rows.sort((a, b) => {
    const ua = a.status === "reviewed" && !a.changed ? 1 : 0, ub = b.status === "reviewed" && !b.changed ? 1 : 0;
    if (ua !== ub) return ua - ub;
    const ra = a.rating ?? 0, rb = b.rating ?? 0;
    if (ra !== rb) return ra - rb;
    if (a.live !== b.live) return a.live ? -1 : 1;
    return order.indexOf(a.type) - order.indexOf(b.type) || a.title.localeCompare(b.title);
  });
  return { total: rows.length, offset, limit, rows: rows.slice(offset, offset + limit) };
}

// --- One piece, English and Hindi side by side ----------------------------------------------------

const SKIP = new Set(["id", "file", "files", "mp4", "mp4Social", "vtt", "vttHi", "poster", "review", "provenance", "checkedBy", "checkedOn", "schema", "version",
  "audio", "recording", "illustration", "image", "base", "svg", "sha256", "nodes", "syllabusNodes", "node", "embedding", "languages", "flags"]);

/** Every text in a piece as [where, English, Hindi, Telugu] rows. Handles { en, hi } leaves, parallel { en: {...}, hi: {...} }
 *  objects and a card's top-level English with a "hi" object beside it. */
export function sideBySide(data: any, te?: any): { path: string; en: string; hi: string; te?: string }[] {
  const rows = new Map<string, { path: string; en: string; hi: string; te?: string }>();
  const txt = (v: any): string | null => typeof v === "string" ? v : typeof v === "number" ? String(v) : Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number") ? v.filter((x) => String(x).trim()).map((x) => `• ${x}`).join("\n") : null;
  const set = (path: string, lang: "en" | "hi" | "te", v: string) => {
    if (rows.size >= 600 && !rows.has(path)) return;
    const row = rows.get(path) ?? { path, en: "", hi: "" };
    row[lang] = v;
    rows.set(path, row);
  };
  const flat = (node: any, path: string, lang: "en" | "hi" | "te") => {
    const t = txt(node);
    if (t != null) { if (t.trim() && !/^(https?:|\/media\/)/.test(t)) set(path || "text", lang, t); return; }
    if (Array.isArray(node)) node.forEach((x, i) => flat(x, `${path}[${i + 1}]`, lang));
    else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) if (!SKIP.has(k)) flat(v, path ? `${path}.${k}` : k, lang);
  };
  const walk = (node: any, path: string) => {
    if (Array.isArray(node)) return node.forEach((x, i) => walk(x, `${path}[${i + 1}]`));
    if (!node || typeof node !== "object") {
      const t = txt(node);
      if (t && t.length > 3 && !/^(https?:|\/media\/)/.test(t) && !/^[\w.:-]+$/.test(t)) set(path, "en", t);
      return;
    }
    if ("en" in node || "hi" in node) {
      for (const lang of ["en", "hi", "te"] as const) if (node[lang] != null) flat(node[lang], path, lang);
      for (const [k, v] of Object.entries(node)) if (!["en", "hi", "te"].includes(k) && !SKIP.has(k)) walk(v, path ? `${path}.${k}` : k);
      return;
    }
    for (const [k, v] of Object.entries(node)) if (!SKIP.has(k)) walk(v, path ? `${path}.${k}` : k);
  };
  if (data && typeof data === "object" && !Array.isArray(data) && data.hi && typeof data.hi === "object" && !("en" in data)) {
    // A Chai card: English at the top level, Hindi in "hi" with the same keys.
    const { hi, te: teCard, ...en } = data;
    flat(en, "", "en"); flat(hi, "", "hi");
    if (teCard && typeof teCard === "object") flat(teCard, "", "te");
  } else walk(data, "");
  if (te && typeof te === "object") flat(te.texts ?? te.strings ?? te, "telugu", "te");
  return [...rows.values()];
}

async function piece(env: Env, ref: string) {
  const [type, ...rest] = ref.split(":");
  const id = rest.join(":");
  if (type === "library") {
    const r = await env.DB.prepare("SELECT id, kind, title, json, status, en_editor, en_checked_on, hi_editor, hi_checked_on, updated_at, translations, approvals FROM library WHERE id = ?").bind(id).first<any>();
    if (!r) return null;
    const data = parse(r.json);
    const te = parse(r.translations)?.te;
    return { ref, kind: r.kind, type: typeOf(r.kind, data, r.id), title: r.title, status: r.status, updated: r.updated_at,
      approvals: { en: r.en_editor ? `${r.en_editor}, ${r.en_checked_on ?? ""}` : null, hi: r.hi_editor ? `${r.hi_editor}, ${r.hi_checked_on ?? ""}` : null, te: parse(r.approvals)?.te?.by ?? null },
      rows: sideBySide(data, te), hasTelugu: !!te };
  }
  if (type === "card") {
    const r = await env.DB.prepare("SELECT id, day, title, card_json, status, en_editor, en_checked_on, hi_editor, hi_checked_on, source_url FROM candidates WHERE id = ?").bind(id).first<any>();
    if (!r) return null;
    const c = parse(r.card_json);
    return { ref, kind: "chai", type: "chai", title: c.headline || r.title, status: r.status, updated: r.day, source: r.source_url,
      approvals: { en: r.en_editor ? `${r.en_editor}, ${r.en_checked_on ?? ""}` : null, hi: r.hi_editor ? `${r.hi_editor}, ${r.hi_checked_on ?? ""}` : null, te: null },
      rows: sideBySide(c), hasTelugu: !!c.te };
  }
  if (type === "video" && env.MEDIA) {
    const [week, n] = id.split(":");
    if (!/^\d{4}-\d{2}$/.test(week)) return null;
    const obj = await env.MEDIA.get(`ca/${week}/manifest.json`);
    const m = obj ? parse(await obj.text()) : null;
    const e = m?.episodes?.find((x: any) => String(x.n) === n);
    if (!e) return null;
    const base = `/media/ca/${week}/`;
    return { ref, kind: "video", type: "videos", title: str(e.title) || `Scene ${n}`, status: e.review?.status ?? "draft", updated: m.generatedAt,
      approvals: { en: e.review?.checkedBy ?? null, hi: null, te: null }, language: m.lang ?? "en",
      media: { video: e.mp4 ? base + e.mp4 : null, captions: e.vtt ? base + e.vtt : null, captionsHi: e.vttHi ? base + e.vttHi : null, poster: e.poster ? base + e.poster : null },
      rows: sideBySide(e), hasTelugu: m.lang === "te" };
  }
  return null;
}

// --- The API (admin.ts routes /admin/api/review/...) ----------------------------------------------

export async function reviewApi(env: Env, s: Staff, what: string, method: string, url: URL, body: any): Promise<Response> {
  if (method === "GET" && what === "summary") {
    const sum = await contentSummary(env);
    const reviews = await reviewMap(env);
    const { items, grid, ...rest } = sum;
    return json({ ...rest, ageHours: Math.round((Date.now() - Date.parse(sum.builtAt)) / 360e3) / 10, maxAgeHours: MAX_AGE_H,
      gridTotals: grid.totals, issues: ISSUES.map(([id, name]) => ({ id, name })), progress: progress(sum, reviews) });
  }
  if (method === "POST" && what === "refresh") {
    const sum = await contentSummary(env, true);
    return json({ ok: true, builtAt: sum.builtAt, items: sum.items.length, rowsRead: sum.rowsRead });
  }
  if (method === "GET" && what === "queue") return json(queue(await contentSummary(env), await reviewMap(env), url));
  if (method === "GET" && what === "item") {
    const ref = url.searchParams.get("ref") ?? "";
    if (!/^(library|card|video):.{1,200}$/.test(ref)) return bad("That isn't a piece of content.");
    const p = await piece(env, ref);
    if (!p) return bad("That piece isn't there any more. It may have been deleted or renamed.", 404);
    await ensureTable(env);
    const review = await env.DB.prepare("SELECT * FROM content_reviews WHERE ref = ?").bind(ref).first<any>();
    return json({ ...p, review: review ? { ...review, issues: parse(review.issues) } : null, issueNames: ISSUES.map(([id, name]) => ({ id, name })) });
  }
  if (method === "POST" && what === "save") {
    const ref = String(body?.ref ?? "");
    if (!/^(library|card|video):.{1,200}$/.test(ref)) return bad("That isn't a piece of content.");
    const rating = body?.rating == null || body.rating === "" ? null : Number(body.rating);
    if (rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) return bad("The rating should be 1 to 5 stars.");
    const known = ISSUES.map(([id]) => id);
    const issues = Array.isArray(body?.issues) ? [...new Set(body.issues.map(String))] : [];
    if (issues.some((i) => !known.includes(i as string))) return bad("Pick issues from the list: " + ISSUES.map(([, n]) => n).join(", ") + ".");
    const note = String(body?.note ?? "").trim().slice(0, 2000) || null;
    const status = body?.reviewed === false ? "started" : "reviewed";
    if (status === "reviewed" && rating == null) return bad("Give it a rating (1 to 5) before marking it reviewed.");
    if (issues.includes("other") && !note) return bad("Say what the other issue is in the note.");
    const p = await piece(env, ref);
    if (!p) return bad("That piece isn't there any more. It may have been deleted or renamed.", 404);
    await ensureTable(env);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO content_reviews (ref, rating, issues, note, status, reviewer, reviewer_id, reviewed_at, item_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(ref) DO UPDATE SET rating = excluded.rating, issues = excluded.issues, note = excluded.note, status = excluded.status,
       reviewer = excluded.reviewer, reviewer_id = excluded.reviewer_id, reviewed_at = excluded.reviewed_at, item_updated = excluded.item_updated`,
    ).bind(ref, rating, JSON.stringify(issues), note, status, label(s), s.id, now, p.updated ?? null).run();
    return json({ ok: true, ref, status, rating, issues, reviewedAt: now });
  }
  return bad("Not found", 404);
}

/** For the existing Content section's topic table: the cached grid, so opening Content doesn't scan the library. */
export async function cachedCoverage(env: Env) {
  const s = await contentSummary(env);
  return { ...s.grid, builtAt: s.builtAt };
}
