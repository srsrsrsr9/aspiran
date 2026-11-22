import { publicLibrary } from "./content";
import { type Env } from "./shared";
import { flags } from "./staff";
import { NODES } from "../public/app/syllabus.js";
import { learnPath } from "./learn";

/**
 * GET /web/site-content: what aspiran.in publishes as free reading pages (owner, 22 Nov 2026: "add a ton of content
 * that we already produced" for search and credibility). The website's build fetches this once a day and turns it into
 * static pages on aspiran.in: notes, daily current affairs, Mains answer frames, ethics cases, essay topics, landmark
 * cases, schemes and English–Hindi term lists.
 *
 * What stays in the app only: practice and quizzes, mocks, flashcards, audio and video, answer marking and the review
 * loop. Approved items only (publicLibrary's rule, so Hindi only where it is approved). Removed before sending: who
 * checked what, how it was made, the internal fact-check lists, sound and motion settings, Chotu's jokes, and anything
 * in a tragic tone (never shareable). Cached for an hour.
 */

export const SITE_KINDS = ["read", "mains-skeleton", "gs4-case", "ethics-dilemma", "essay", "landmark-case", "scheme-snapshot", "terms"];
const DROP = ["provenance", "review", "mood", "sfx", "sounds", "play", "factsToCheck", "audio", "languages", "checkedBy", "checkedOn", "auto", "chotu", "sourceList"];
const tragic = (d: any) => String(d?.tone ?? "").toUpperCase() === "TRAGIC";

function clean(d: any) {
  for (const k of DROP) delete d[k];
  if (d.hi && typeof d.hi === "object") for (const k of DROP) delete d.hi[k];
  return d;
}

export async function siteContent(env: Env): Promise<Response> {
  const headers = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" };
  const f = await flags(env);
  if (!f.library) return new Response(JSON.stringify({ items: [], briefs: [], papers: [], paused: true }), { headers });
  const lib = await (await publicLibrary(env, SITE_KINDS)).json<{ items: { id: string; kind: string; updatedAt: string; hindi: boolean; data: any }[] }>();
  const items = lib.items
    .filter((i) => !tragic(i.data) && (i.kind !== "read" || f.long_reads))
    .map((i) => ({ id: i.id, kind: i.kind, updatedAt: i.updatedAt, hindi: i.hindi, data: clean(i.data) }));
  // Answer frames carry their UPSC question (from the approved past paper), so a page can show what was asked.
  const pyq = await (await publicLibrary(env, ["pyq"])).json<{ items: { data: any }[] }>();
  const asked = new Map<string, { en: string; hi?: string; marks?: number; words?: number; year?: number; paper?: string }>();
  for (const { data: p } of pyq.items) for (const q of p.questions ?? []) {
    const key = `${p.id}-q${String(q.n).padStart(2, "0")}`;
    if (q.en?.q) asked.set(key, { en: q.en.q, hi: q.hi?.q, marks: q.marks, words: q.words, year: p.year, paper: p.paper });
  }
  for (const i of items) if (i.kind === "mains-skeleton" && asked.has(i.data.pyqId)) i.data.asked = asked.get(i.data.pyqId);
  // PYQs (owner, 22 Nov 2026: say "PYQs" and keep them on the site in its own look): UPSC's papers in full, with UPSC's
  // key and, where written, why the keyed answer is right. Only papers with a real UPSC id, never a sample.
  const papers = pyq.items.map((x) => x.data).filter((p) => /^cs[pm]-\d{4}-[a-z0-9]+$/.test(p?.id ?? "") && !p.sample && Array.isArray(p.questions))
    .map((p) => ({ id: p.id, exam: p.exam === "mains" ? "mains" : "prelims", year: Number(p.year), paper: p.paper, title: p.title, sourceUrl: p.source?.url ?? "",
      key: p.answerKey ?? { status: "none" },
      questions: p.questions.filter((q: any) => q && typeof q.n === "string" && (q.en?.q ?? q.q)).map((q: any) => ({
        n: q.n, nodes: Array.isArray(q.nodes) ? q.nodes : [], marks: q.marks, words: q.words, answer: q.answer ?? null,
        en: { q: q.en?.q ?? q.q, options: q.en?.options }, hi: q.hi?.q ? { q: q.hi.q, options: q.hi.options } : undefined,
        explain: q.explain?.why ? { why: q.explain.why, wrong: q.explain.wrong ?? [], trap: q.explain.trap } : undefined })) }));
  const nodes = (NODES as any[]).map((n) => ({ id: n.id, name: n.name, paper: n.paper.short, learn: learnPath(n) }));
  const { results } = await env.DB.prepare("SELECT day, json FROM briefs ORDER BY day DESC LIMIT 400").all<{ day: string; json: string }>();
  const briefs = results.flatMap((r) => {
    const b = JSON.parse(r.json);
    if (b.sample) return [];
    const cards = (b.items ?? []).filter((it: any) => !tragic(it)).map(clean);
    return cards.length ? [{ day: r.day, items: cards }] : [];
  });
  return new Response(JSON.stringify({ generatedAt: new Date().toISOString(), nodes, items, briefs, papers }), { headers });
}
