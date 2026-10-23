import type { Env } from "./shared";
import { newId } from "./shared";
import { runAI } from "./ai";

/**
 * The UPSC context library: short notes on Articles, Acts, cases, committees, events and concepts,
 * written in our own words (bare Acts and the Constitution may be quoted; NCERT and coaching notes
 * may not). The pipeline passes the most relevant notes to the drafting model so lenses are looked
 * up, not invented. Approved cards add notes, so the library grows a little every day.
 */
export interface Note {
  id: string;
  kind: string;
  title: string;
  body: string;
  source: string | null;
  embedding: string | null;
  updated_at: string;
}

const EMBED_MODEL = "@cf/baai/bge-m3"; // multilingual, so Hindi queries work too

export async function embed(env: Env, texts: string[]): Promise<number[][] | null> {
  if (!env.AI) return null;
  try {
    const out = (await runAI(env, "embed", EMBED_MODEL, { text: texts })) as { data?: number[][] };
    return out.data ?? null;
  } catch {
    return null; // not logged in, or the free allowance is used up
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

const words = (s: string) => new Set(s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []);

/** Fill missing embeddings, a batch at a time. Cheap enough to run before each draft run. */
export async function backfillEmbeddings(env: Env, limit = 50) {
  const { results } = await env.DB.prepare("SELECT id, title, body FROM notes WHERE embedding IS NULL LIMIT ?").bind(limit).all<Note>();
  if (!results.length) return 0;
  const vectors = await embed(env, results.map((n) => `${n.title}\n${n.body}`));
  if (!vectors) return 0;
  await env.DB.batch(
    results.map((n, i) => env.DB.prepare("UPDATE notes SET embedding = ? WHERE id = ?").bind(JSON.stringify(vectors[i]), n.id)),
  );
  return results.length;
}

/** Top-k notes for a story. Uses embeddings when available, word overlap otherwise. */
export async function relevantNotes(env: Env, query: string, k = 3): Promise<Note[]> {
  const { results } = await env.DB.prepare("SELECT * FROM notes").all<Note>();
  if (!results.length) return [];
  const qv = (await embed(env, [query]))?.[0];
  const qw = words(query);
  const scored = results.map((n) => {
    if (qv && n.embedding) return { n, s: cosine(qv, JSON.parse(n.embedding)) };
    const nw = words(`${n.title} ${n.body}`);
    let hit = 0;
    for (const w of qw) if (nw.has(w)) hit++;
    return { n, s: hit / (qw.size || 1) };
  });
  return scored.sort((a, b) => b.s - a.s).slice(0, k).filter((x) => x.s > 0.1).map((x) => x.n);
}

export async function addNote(env: Env, note: { kind: string; title: string; body: string; source?: string | null; id?: string }) {
  const id = note.id ?? newId("n");
  await env.DB.prepare(
    "INSERT OR REPLACE INTO notes (id, kind, title, body, source, embedding, updated_at) VALUES (?, ?, ?, ?, ?, NULL, ?)",
  ).bind(id, note.kind, note.title.slice(0, 200), note.body.slice(0, 4000), note.source ?? null, new Date().toISOString()).run();
  return id;
}

export async function listNotes(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT id, kind, title, body, source, updated_at, embedding IS NOT NULL AS embedded FROM notes ORDER BY updated_at DESC",
  ).all();
  return results;
}
