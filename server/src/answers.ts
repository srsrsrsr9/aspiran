import { AiBlocked, type Hop, type VisionTurn, callChat } from "./ai";
import { type Env, HELPLINES, bad, distress, json } from "./shared";
import { extraDistress } from "./langs";
import { bump } from "./staff";
import { logEvent } from "./metrics";
import { checkFeedback, recordFeedback } from "./plus";
import { clip, readFeedback, wordsIn } from "./rubric";

/**
 * Answer Studio (sell-first plan, W5): rubric feedback on one Mains answer, from a photo of the handwritten sheet
 * or typed text. POST /answers/evaluate {memberId, question, words: 150 | 250, text?, image?: {mime, data (base64)}, lang?: "hi"}.
 * Hindi-medium answers are marked by the same rubric with the feedback in Hindi (LANG_RULES).
 *
 * Five areas, each with a band against a typical scoring answer (below, at or above) and one fix: the directive
 * word, structure, content coverage, examples and data, and the conclusion. Plus a word count and a model-answer
 * skeleton. The photo is only passed to the model: it is never written to storage or logs.
 *
 * Allowance (plus.ts): 3 a week free, unlimited on Plus. A use is counted only once feedback has been given.
 */

const MAX_IMAGE_B64 = 5_600_000; // about 4 MB of picture
const MAX_TEXT = 6000;
const MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Vision-capable models, best first. Low temperature: grading should be steady from one try to the next. */
export const EVAL_HOPS: Hop[] = [
  { provider: "google", model: "gemini-3.8-flash", extra: { temperature: 0.2, reasoning_effort: "low", max_tokens: 1800 }, timeoutMs: 40_000 },
  { provider: "nvidia", model: "google/gemma-4-31b-it", extra: { temperature: 0.2, max_tokens: 1800 }, timeoutMs: 40_000 },
  { provider: "groq", model: "meta-llama/llama-4-scout-17b-16e-instruct", extra: { temperature: 0.2, max_completion_tokens: 1800 }, timeoutMs: 30_000 },
];

/** Typed answers need no vision, so the fast text model goes first; the vision models follow as fallbacks. */
export const TYPED_EVAL_HOPS: Hop[] = [
  { provider: "groq", model: "openai/gpt-oss-120b", extra: { temperature: 0.2, reasoning_effort: "medium", include_reasoning: false, max_completion_tokens: 1800 }, timeoutMs: 30_000 },
  ...EVAL_HOPS,
];

/** Hindi-medium answers: the model that reads and writes Hindi best goes first, typed or photographed. */
export const HINDI_EVAL_HOPS: Hop[] = [EVAL_HOPS[0], TYPED_EVAL_HOPS[0], ...EVAL_HOPS.slice(1)];

const DEVANAGARI = /[\u0900-\u097F]/g;
/** Mostly Devanagari? Then it is a Hindi-medium answer, whatever the app said. */
export const looksHindi = (t: string) => { const letters = t.replace(/[\s\d\p{P}]/gu, ""); return letters.length > 0 && (t.match(DEVANAGARI)?.length ?? 0) > letters.length * 0.4; };

/**
 * The language line. "hi": a Hindi-medium answer, marked as UPSC marks Hindi-medium copies, feedback in Hindi.
 * "auto": a photo from an app that didn't say (older Android builds), so the model follows the sheet's language.
 */
const LANG_RULES = {
  en: "",
  hi: `

This is a Hindi-medium answer. Mark it exactly as a Hindi-medium copy is marked in the real exam: the same five areas, the same standard. Do not mark it down for being in Hindi, for standard Hindi administrative terms, or for an English term written in brackets or in Roman script where that is the usual practice (for example GDP, GST, NITI Aayog). Do mark down unclear Hindi, literal translation that hides the meaning, and wrong Hindi terms for constitutional or economic ideas, and give the correct term in the fix.
Write every "note", every "fix", the whole "skeleton" and the "summary" in simple, standard Hindi in Devanagari script, the way a good Hindi-medium teacher writes in the margin. Keep the JSON keys and the band values ("below", "at", "above") in English exactly as given.`,
  auto: `

If the answer is written in Hindi, treat it as a Hindi-medium answer: mark it by the same standard, never mark it down for being in Hindi, and write every "note", "fix", the "skeleton" and the "summary" in simple Hindi in Devanagari script. Otherwise write them in English. Keep the JSON keys and the band values in English either way.`,
};

const PROMPT = (question: string, words: number, source: string, lang: keyof typeof LANG_RULES = "en") => BASE_PROMPT(question, words, source) + LANG_RULES[lang];

const BASE_PROMPT = (question: string, words: number, source: string) => `You are an experienced UPSC Civil Services Mains evaluator. Grade one answer to this question, written for a ${words}-word limit:

"${question}"

The answer is ${source}. If it is a photo, read the handwriting carefully; if you can't read part of it, say so in that area's note rather than guessing.

Judge against a typical answer that scores well in the real exam (not a perfect one). For each of the five areas give a band: "below", "at" or "above" that answer, a one-sentence note on what you saw, and ONE specific fix the writer can apply in their next answer.
- directive: did it do what the directive word asks (discuss, critically examine, analyse, comment, explain...)?
- structure: introduction, body that is easy to scan (sub-headings, points, flow), and a link back to the question.
- content: coverage of the main dimensions the question expects; anything important missing.
- examples: examples, data, reports, committees, cases, articles or schemes that back the points.
- conclusion: a balanced, forward-looking ending tied to the question.

Also count the words in the answer, give a short skeleton of a model answer (an intro line, 4 to 6 body points, a conclusion line), and one warm, honest summary line for the writer.

Reply with JSON only, no other text:
{"wordCount": number, "readable": boolean, "areas": {"directive": {"band": "below|at|above", "note": "...", "fix": "..."}, "structure": {...}, "content": {...}, "examples": {...}, "conclusion": {...}}, "skeleton": {"intro": "...", "body": ["..."], "conclusion": "..."}, "summary": "..."}`;

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));

export async function answersRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path !== "/answers/evaluate" || req.method !== "POST") return null;
  const body = await req.json<any>().catch(() => null);
  if (!body) return bad("A JSON body is required");
  const memberId = String(body.memberId ?? "");
  if (!validId(memberId)) return bad("memberId is required");
  const question = clip(body.question, 600);
  if (!question) return bad("question is required");
  const words = Number(body.words) === 250 ? 250 : 150;
  const text = String(body.text ?? "").trim().slice(0, MAX_TEXT);
  const img = body.image && typeof body.image === "object" ? body.image : null;
  if (!text && !img) return bad("Send the answer as text, or a photo of it");
  if (img && (!MIMES.has(String(img.mime)) || typeof img.data !== "string" || !img.data || img.data.length > MAX_IMAGE_B64)) {
    return bad("The photo must be a JPEG, PNG or WebP under 4 MB");
  }

  // Same rule as Chotu: on a distress phrase the model is never called.
  if (text && distress(text, await extraDistress(env).catch(() => [] as string[]))) return json({ care: true, helplines: HELPLINES });

  const allowance = await checkFeedback(env, memberId);
  if (!allowance.ok) {
    return json({ error: "That's your 3 free answer reviews for this week. They come back on Monday, or Plus makes them unlimited.", limit: allowance.limit, left: 0, moment: "feedback_used" }, 402);
  }

  const source = img ? "in the photo of a handwritten sheet below" : "typed below";
  // Hindi when the app says so, or when the typed answer or the question is in Devanagari. A photo with no word
  // from the app lets the model follow the sheet.
  const saidHindi = /^hi/i.test(String(body.lang ?? "")) || body.hindi === true;
  const lang = saidHindi || (text && looksHindi(text)) || looksHindi(question) ? "hi" : img ? "auto" : "en";
  const content: VisionTurn["content"] = [{ type: "text", text: PROMPT(question, words, source, lang) + (text ? `\n\nANSWER:\n${text}` : "") }];
  if (img) content.push({ type: "image_url", image_url: { url: `data:${img.mime};base64,${img.data}` } });

  try {
    let fb = null as ReturnType<typeof readFeedback>, model = "";
    // One retry if the reply isn't usable JSON: free models sometimes wander.
    for (let i = 0; i < 2 && !fb; i++) {
      const out = img
        ? await callChat(env, "evaluate", [{ role: "user", content }], EVAL_HOPS)
        : await callChat(env, "evaluate", [{ role: "user", content: content[0].type === "text" ? content[0].text : "" }], lang === "hi" ? HINDI_EVAL_HOPS : TYPED_EVAL_HOPS);
      fb = readFeedback(out.text, text && !img ? wordsIn(text) : null);
      model = out.model;
    }
    if (!fb) return json({ error: "The reviewer's reply didn't come through properly. Try again in a minute; this one isn't counted." }, 502);
    await recordFeedback(env, memberId);
    await bump(env, "answer_evals");
    await logEvent(env, "answer_evaluated", { memberId }, { words: String(words), via: img ? "photo" : "text", lang });
    const left = allowance.left === null ? null : Math.max(0, allowance.left - 1);
    return json({ ...fb, lang, words, limitWords: words, overLimit: fb.wordCount > words * 1.1, model, ai: true, left, limit: allowance.limit });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ error: "Answer review is offline right now.", offline: true }, 503);
    return json({ error: "Couldn't review the answer just now. Try again in a minute; this one isn't counted." }, 502);
  }
}
