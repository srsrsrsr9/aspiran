import Anthropic from "@anthropic-ai/sdk";
import { type Env, istDay } from "./shared";
import { ensureSchema, llmControls } from "./staff";

/**
 * Every model call goes through here, so admins can see usage and switch things off.
 * Checks the controls (master switch, per-purpose switches, daily caps) before calling, and logs
 * one row per call: purpose, model, status, time taken and tokens. Never the prompt or the output.
 */

export type Purpose = "draft" | "guard" | "embed" | "author" | "chotu" | "evaluate";

export class AiBlocked extends Error {}

const logger = (env: Env, purpose: Purpose, model: string) =>
  (status: string, ms: number | null, tin: number | null, tout: number | null, error: string | null) =>
    env.DB.prepare("INSERT INTO llm_calls (at, day, purpose, model, status, ms, tokens_in, tokens_out, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(new Date().toISOString(), istDay(), purpose, model, status, ms, tin, tout, error?.slice(0, 200) ?? null).run().catch(() => {});

/** Throws AiBlocked (and logs it) if an admin switched this off or today's caps are used up. */
async function gate(env: Env, purpose: Purpose, log: ReturnType<typeof logger>) {
  await ensureSchema(env);
  const c = await llmControls(env);
  let why = "";
  if (!c.enabled) why = "AI turned off by an admin";
  else if (!c.purposes[purpose]) why = `AI ${purpose} turned off by an admin`;
  else {
    const today = await env.DB.prepare("SELECT COUNT(*) AS calls, COALESCE(SUM(tokens_in + tokens_out), 0) AS tokens FROM llm_calls WHERE day = ? AND status = 'ok'")
      .bind(istDay()).first<{ calls: number; tokens: number }>();
    if ((today?.calls ?? 0) >= c.dailyCallCap) why = "Daily AI call limit reached";
    else if ((today?.tokens ?? 0) >= c.dailyTokenCap) why = "Daily AI token limit reached";
  }
  if (why) {
    await log("blocked", null, null, null, why);
    throw new AiBlocked(why);
  }
  return c;
}

export async function runAI(env: Env, purpose: Purpose, model: string, input: Record<string, unknown>): Promise<any> {
  const log = logger(env, purpose, model);
  await gate(env, purpose, log);
  if (!env.AI) {
    await log("unavailable", null, null, null, "Workers AI not bound");
    throw new Error("Workers AI not bound; run `npm run dev:ai` after `wrangler login`");
  }

  const t0 = Date.now();
  try {
    const out = (await env.AI.run(model as any, input as any)) as any;
    const u = out?.usage ?? {};
    // Workers AI reports usage for text models; otherwise estimate at about 4 characters a token.
    const tin = u.prompt_tokens ?? Math.ceil(JSON.stringify(input.messages ?? input.text ?? "").length / 4);
    const tout = u.completion_tokens ?? Math.ceil((typeof out?.response === "string" ? out.response.length : JSON.stringify(out?.response ?? "").length) / 4);
    await log("ok", Date.now() - t0, tin, purpose === "embed" ? 0 : tout, null);
    return out;
  } catch (e) {
    await log("error", Date.now() - t0, null, null, String(e));
    throw e;
  }
}

// --- Claude, for the desk's Author tab ---------------------------------------------------------

export interface ClaudeJob {
  system: string;
  messages: Anthropic.MessageParam[];
  /** JSON schema for structured output. The reply text is then one JSON object. */
  schema?: Record<string, unknown>;
  maxTokens?: number;
}

/**
 * One Claude call with the same switches, caps and logging as Workers AI. The key is ANTHROPIC_API_KEY,
 * typed by the owner into .dev.vars (local) or `wrangler secret put` (deployed); it never leaves the server.
 */
export async function callClaude(env: Env, purpose: Purpose, job: ClaudeJob): Promise<{ message: Anthropic.Message; text: string }> {
  const c = await llmControls(env);
  const model = c.authorModel;
  const log = logger(env, purpose, model);
  await gate(env, purpose, log);
  if (!env.ANTHROPIC_API_KEY) {
    await log("unavailable", null, null, null, "ANTHROPIC_API_KEY not set");
    throw new AiBlocked("No Claude key on this server. Add ANTHROPIC_API_KEY to .dev.vars and restart, or use Copy prompt.");
  }
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
  const t0 = Date.now();
  try {
    const message = await client.messages.stream({
      model,
      max_tokens: job.maxTokens ?? 16000,
      // The shared instructions are the same on every call, so they're cached.
      system: [{ type: "text", text: job.system, cache_control: { type: "ephemeral" } }],
      messages: job.messages,
      output_config: { effort: "medium", ...(job.schema ? { format: { type: "json_schema", schema: job.schema } } : {}) },
    }).finalMessage();
    const u = message.usage;
    await log("ok", Date.now() - t0, u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0), u.output_tokens, null);
    const text = message.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    return { message, text };
  } catch (e) {
    const msg = e instanceof Anthropic.AuthenticationError ? "Claude rejected the key (check ANTHROPIC_API_KEY)"
      : e instanceof Anthropic.RateLimitError ? "Claude is rate-limiting this key; try again in a minute"
      : e instanceof Anthropic.APIError ? `Claude error ${e.status ?? ""}: ${e.message}` : String(e);
    await log("error", Date.now() - t0, null, null, msg);
    throw new Error(msg);
  }
}

// --- Cloud Chotu: Groq, Google and NVIDIA, routed by language ------------------------------------

export interface ChatTurn { role: "system" | "user" | "assistant"; content: string }
/** A user turn with a picture (Answer Studio's photo of a handwritten answer), in the OpenAI-compatible shape. */
export interface VisionTurn { role: "user"; content: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] }

/** The keys are typed by the owner into .dev.vars (local) or `wrangler secret put` (deployed); never logged. */
type ChatEnv = Env & { GOOGLE_AI_API_KEY?: string; NVIDIA_API_KEY?: string };
type Provider = "groq" | "google" | "nvidia";

const PROVIDERS: Record<Provider, { name: string; url: string; key: (env: ChatEnv) => string | undefined; keyName: string }> = {
  groq: { name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions", key: (e) => e.GROQ_API_KEY, keyName: "GROQ_API_KEY" },
  google: { name: "Google", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: (e) => e.GOOGLE_AI_API_KEY, keyName: "GOOGLE_AI_API_KEY" },
  nvidia: { name: "NVIDIA", url: "https://integrate.api.nvidia.com/v1/chat/completions", key: (e) => e.NVIDIA_API_KEY, keyName: "NVIDIA_API_KEY" },
};

/** One model to try: where it runs, its id there, extra request fields, and how long to wait for it. */
export interface Hop { provider: Provider; model: string; extra?: Record<string, unknown>; timeoutMs?: number }

const GROQ_EXTRA = { reasoning_effort: "medium", include_reasoning: false, max_completion_tokens: 1200 };
// Qwen on Groq takes no reasoning_effort levels; its thinking is kept out of the reply instead.
const QWEN_EXTRA = { reasoning_format: "hidden", max_completion_tokens: 1200 };
const GEMINI_EXTRA = { reasoning_effort: "low", max_tokens: 1200 };

/**
 * Which models answer in each language Chotu speaks, best first. On an error, rate limit or timeout the next
 * one is tried, and a provider with no key is skipped. Picks from the model watch (research/model-watch.md):
 * English goes to Groq first (fast; owner's call, 2 Nov 2026), with Nemotron 3 Ultra as the fallback. Nemotron mangles
 * Telugu, so Telugu stays on Google.
 */
export const CHAT_ROUTES: Record<"en" | "hi" | "te", Hop[]> = {
  en: [
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-120b", extra: GROQ_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-20b", extra: GROQ_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1200 }, timeoutMs: 25_000 },
  ],
  hi: [
    { provider: "google", model: "gemini-3.8-flash", extra: GEMINI_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1200 }, timeoutMs: 25_000 },
    { provider: "nvidia", model: "google/gemma-4-31b-it", extra: { max_tokens: 1200 }, timeoutMs: 30_000 },
    { provider: "google", model: "gemma-4-31b-it", extra: { max_tokens: 1200 } },
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-120b", extra: GROQ_EXTRA },
  ],
  te: [
    { provider: "google", model: "gemini-3.8-flash", extra: GEMINI_EXTRA },
    { provider: "google", model: "gemini-3.5-flash-lite", extra: GEMINI_EXTRA },
    { provider: "google", model: "gemma-4-31b-it", extra: { max_tokens: 1200 } },
    { provider: "nvidia", model: "google/gemma-4-31b-it", extra: { max_tokens: 1200 }, timeoutMs: 20_000 },
  ],
};

/** "te", "Telugu" or "తెలుగు" → "te"; the same for Hindi; anything else is English. */
export function chatLang(x: unknown): keyof typeof CHAT_ROUTES {
  const s = String(x ?? "").trim().toLowerCase();
  if (/^(te\b|telugu|తెలుగు)/.test(s)) return "te";
  if (/^(hi\b|hindi|हिन्दी|हिंदी)/.test(s)) return "hi";
  return "en";
}

/**
 * One chat reply, trying each hop in turn with the same switches, caps and logging as the others.
 * Error bodies can echo the request, so only the status is kept.
 */
export async function callChat(env: ChatEnv, purpose: Purpose, messages: (ChatTurn | VisionTurn)[], hops: Hop[]): Promise<{ text: string; model: string }> {
  let last = "No AI provider answered";
  let keyed = 0;
  for (const hop of hops) {
    const p = PROVIDERS[hop.provider];
    const key = p.key(env);
    const log = logger(env, purpose, hop.model);
    await gate(env, purpose, log);
    if (!key) {
      await log("unavailable", null, null, null, `${p.keyName} not set`);
      continue;
    }
    keyed++;
    const t0 = Date.now();
    try {
      const res = await fetch(p.url, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: hop.model, messages, temperature: 0.6, ...hop.extra }),
        signal: AbortSignal.timeout(hop.timeoutMs ?? 20_000),
      });
      if (!res.ok) {
        last = res.status === 401 || res.status === 403 ? `${p.name} rejected the key (check ${p.keyName})`
          : res.status === 429 ? `${p.name} is rate-limiting this key` : `${p.name} error ${res.status}`;
        await log("error", Date.now() - t0, null, null, last);
        continue;
      }
      const out = (await res.json()) as any;
      const text = String(out?.choices?.[0]?.message?.content ?? "").trim();
      const u = out?.usage ?? {};
      if (!text) {
        last = `${p.name} sent an empty reply`;
        await log("error", Date.now() - t0, u.prompt_tokens ?? null, u.completion_tokens ?? null, last);
        continue;
      }
      await log("ok", Date.now() - t0, u.prompt_tokens ?? null, u.completion_tokens ?? null, null);
      return { text, model: hop.model };
    } catch (e) {
      last = e instanceof Error && e.name === "TimeoutError" ? `${p.name} took too long` : `${p.name} unreachable: ${e instanceof Error ? e.name : "error"}`;
      await log("error", Date.now() - t0, null, null, last);
    }
  }
  if (!keyed) throw new AiBlocked("No AI keys on this server. Add GROQ_API_KEY, GOOGLE_AI_API_KEY or NVIDIA_API_KEY to .dev.vars and restart.");
  throw new Error(last);
}

/** The English route, kept for any caller that still asks for Groq by name. */
export const callGroq = (env: Env, purpose: Purpose, messages: ChatTurn[]) => callChat(env, purpose, messages, CHAT_ROUTES.en);
