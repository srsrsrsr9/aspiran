import { AiBlocked, callChat } from "./ai";
import { type Env, HELPLINES, bad, distress, istDay, istNow, json } from "./shared";
import { extraDistress } from "./langs";
import { inQuietHours } from "./friends";
import { activeResult, resultDays } from "./results";
import { bump, ensureSchema } from "./staff";
import { logEvent } from "./metrics";
import { TYPED_EVAL_HOPS } from "./answers";
import { clip } from "./rubric";

/**
 * Mock interview board (teaching plan, interview). The questions come from the approved interview bank on the
 * member's phone; this asks one board member, played by AI, for a follow-up to the answer just given.
 * POST /interview/follow {memberId, persona: {name, style}, question, answer, hindi?}
 *   -> {followUp, ai: true} | {quiet: true} | {care: true, helplines} | {limit: true}
 *
 * Like Chotu: quiet 23:30-07:00 IST and in a result week (the board then uses the bank only), never called on a
 * distress phrase, and it never remarks on feelings, ranks or results. No scores, no verdicts: only the next question.
 * The answer is passed to the model and not stored.
 */

const DAILY = 40;
const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));

const PROMPT = (name: string, style: string, question: string, answer: string, hindi: boolean) => `You are playing one member of a UPSC Civil Services interview board in a practice session. Your role: ${name}. Your style: ${style}

You asked: "${question}"
The candidate answered: "${answer}"

Ask ONE short follow-up question, in your style, that builds on what the candidate actually said: probe a claim, ask for an example or evidence, or test the other side. Stay courteous and neutral.
Rules: one question only, at most 35 words. No praise, no scoring, no verdict, no advice. Never mention feelings, marks, ranks or results. ${hindi ? "Write it in Hindi (Devanagari)." : "Write it in English."}
Reply with the question only.`;

export async function interviewRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path !== "/interview/follow" || req.method !== "POST") return null;
  const body = await req.json<any>().catch(() => null);
  if (!body) return bad("A JSON body is required");
  const memberId = String(body.memberId ?? "");
  if (!validId(memberId)) return bad("memberId is required");
  const question = clip(body.question, 400), answer = clip(body.answer, 2000);
  const name = clip(body.persona?.name, 60), style = clip(body.persona?.style, 300);
  if (!question || !answer || !name) return bad("persona, question and answer are required");
  const hindi = body.hindi === true;

  if (distress(answer, await extraDistress(env).catch(() => [] as string[]))) return json({ care: true, helplines: HELPLINES });
  const hm = istNow().toISOString().slice(11, 16);
  if (inQuietHours(hm) || activeResult(await resultDays(env))) return json({ quiet: true });

  await ensureSchema(env);
  const day = istDay();
  const row = await env.DB.prepare("SELECT n FROM interview_uses WHERE member_id = ? AND day = ?").bind(memberId, day).first<{ n: number }>();
  if ((row?.n ?? 0) >= DAILY) return json({ limit: true });

  try {
    const out = await callChat(env, "chotu", [{ role: "user", content: PROMPT(name, style, question, answer, hindi) }], TYPED_EVAL_HOPS);
    const followUp = out.text.trim().replace(/^["'“]+|["'”]+$/g, "").split("\n").find((l) => l.trim())?.trim().slice(0, 300) ?? "";
    if (!followUp) return json({ error: "The board member didn't come through. Carry on with the next question." }, 502);
    await env.DB.prepare("INSERT INTO interview_uses (member_id, day, n) VALUES (?, ?, 1) ON CONFLICT(member_id, day) DO UPDATE SET n = n + 1").bind(memberId, day).run();
    await bump(env, "interview_follow");
    await logEvent(env, "interview_follow", { memberId }, {});
    return json({ followUp, ai: true, model: out.model });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ quiet: true, offline: true });
    return json({ error: "The board member didn't come through. Carry on with the next question." }, 502);
  }
}
