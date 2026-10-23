import { AiBlocked, type Hop, type VisionTurn, callChat } from "./ai";
import { type Env, HELPLINES, bad, distress, json } from "./shared";
import { extraDistress } from "./langs";
import { bump } from "./staff";
import { logEvent } from "./metrics";
import { checkFeedback, recordFeedback } from "./plus";
import { clip, readFeedback, wordsIn } from "./rubric";

/**
 * Answer Studio (sell-first plan, W5): rubric feedback on one Mains answer, from a photo of the handwritten sheet
 * or typed text. POST /answers/evaluate {memberId, question, words: 150 | 250, text?, image?: {mime, data (base64)}}.
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

const PROMPT = (question: string, words: number, source: string) => `You are an experienced UPSC Civil Services Mains evaluator. Grade one answer to this question, written for a ${words}-word limit:

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
  const content: VisionTurn["content"] = [{ type: "text", text: PROMPT(question, words, source) + (text ? `\n\nANSWER:\n${text}` : "") }];
  if (img) content.push({ type: "image_url", image_url: { url: `data:${img.mime};base64,${img.data}` } });

  try {
    let fb = null as ReturnType<typeof readFeedback>, model = "";
    // One retry if the reply isn't usable JSON: free models sometimes wander.
    for (let i = 0; i < 2 && !fb; i++) {
      const out = await callChat(env, "evaluate", [{ role: "user", content }], EVAL_HOPS);
      fb = readFeedback(out.text, text && !img ? wordsIn(text) : null);
      model = out.model;
    }
    if (!fb) return json({ error: "The reviewer's reply didn't come through properly. Try again in a minute; this one isn't counted." }, 502);
    await recordFeedback(env, memberId);
    await bump(env, "answer_evals");
    await logEvent(env, "answer_evaluated", { memberId }, { words: String(words), via: img ? "photo" : "text" });
    const left = allowance.left === null ? null : Math.max(0, allowance.left - 1);
    return json({ ...fb, words, limitWords: words, overLimit: fb.wordCount > words * 1.1, model, ai: true, left, limit: allowance.limit });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ error: "Answer review is offline right now.", offline: true }, 503);
    return json({ error: "Couldn't review the answer just now. Try again in a minute; this one isn't counted." }, 502);
  }
}
