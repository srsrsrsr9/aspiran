/**
 * Answer Studio's rubric (answers.ts) and the reader for the model's reply. No imports, so the tests can load it.
 */

export const RUBRIC = ["directive", "structure", "content", "examples", "conclusion"] as const;
type Area = (typeof RUBRIC)[number];
type Band = "below" | "at" | "above";

export const wordsIn = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const band = (v: unknown): Band => {
  const s = String(v ?? "").toLowerCase();
  return s.startsWith("above") ? "above" : s.startsWith("below") ? "below" : "at";
};

/** The model's JSON, read leniently: fenced or with text around it, and every field checked. Null if unusable. */
export function readFeedback(raw: string, typedWords: number | null) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let o: any;
  try { o = JSON.parse(m[0]); } catch { return null; }
  if (!o || typeof o !== "object" || !o.areas) return null;
  const areas = {} as Record<Area, { band: Band; note: string; fix: string }>;
  for (const k of RUBRIC) {
    const a = o.areas[k] ?? {};
    areas[k] = { band: band(a.band), note: clip(a.note, 300), fix: clip(a.fix, 300) };
  }
  if (RUBRIC.every((k) => !areas[k].note && !areas[k].fix)) return null;
  const sk = o.skeleton ?? {};
  return {
    // A typed answer's count is ours; the model only counts handwriting.
    wordCount: typedWords ?? Math.max(0, Math.round(Number(o.wordCount) || 0)),
    readable: o.readable !== false,
    areas,
    skeleton: {
      intro: clip(sk.intro, 300),
      body: (Array.isArray(sk.body) ? sk.body : []).map((b: unknown) => clip(b, 200)).filter(Boolean).slice(0, 8),
      conclusion: clip(sk.conclusion, 300),
    },
    summary: clip(o.summary, 300),
  };
}
