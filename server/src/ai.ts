import Anthropic from "@anthropic-ai/sdk";
import { type Env, istDay } from "./shared";
import { ensureSchema, getSetting, llmControls, setSetting } from "./staff";

/**
 * Every model call goes through here, so admins can see usage and switch things off.
 * Checks the controls (master switch, per-purpose switches, daily caps) before calling, and logs
 * one row per call: purpose, model, status, time taken and tokens. Never the prompt or the output.
 */

export type Purpose = "draft" | "guard" | "embed" | "author" | "chotu" | "evaluate" | "watch";

export class AiBlocked extends Error {}

/**
 * Who a call was for, so spend can be watched by group (owner, 22 Nov 2026): a website visitor, a free member, a Plus
 * member, a pod's shared chat, an institute, or the team's own jobs (drafting, checks, fact watch).
 */
export type Who = "visitor" | "free" | "plus" | "pod" | "institute" | "team";

/**
 * List prices in USD per million tokens [input, output], from console.groq.com/docs/models on 22 Nov 2026. Only
 * for our estimate in Admin → Helpers and usage; Groq's console has the real bill. A model not listed costs 0 here.
 */
export const PRICES: Record<string, [number, number]> = {
  "qwen/qwen3.8-27b": [0.8, 4.0],
  "openai/gpt-oss-120b": [0.15, 0.6],
  "openai/gpt-oss-20b": [0.075, 0.3],
};
const costOf = (model: string, tin: number | null, tout: number | null) => {
  const p = PRICES[model];
  return p && (tin || tout) ? ((tin ?? 0) * p[0] + (tout ?? 0) * p[1]) / 1e6 : null;
};

const logger = (env: Env, purpose: Purpose, model: string, provider: string | null = null, who: Who = "team") =>
  (status: string, ms: number | null, tin: number | null, tout: number | null, error: string | null) =>
    env.DB.prepare("INSERT INTO llm_calls (at, day, purpose, model, status, ms, tokens_in, tokens_out, error, provider, who, cost_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(new Date().toISOString(), istDay(), purpose, model, status, ms, tin, tout, error?.slice(0, 200) ?? null, provider, who,
        provider === "groq" ? costOf(model, tin, tout) : null).run().catch(() => {});

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
  const log = logger(env, purpose, model, "workers-ai");
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
  const log = logger(env, purpose, model, "anthropic");
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
 * one is tried, and a provider with no key, or one set aside after a billing or key error, is skipped.
 * English goes to Groq first (fast; owner's call, 2 Nov 2026), with Nemotron 3 Ultra as the fallback.
 * Google goes last in Hindi and Telugu while its account answers 402 (owner, 15 Nov 2026: "keep working directly
 * with back ups").
 * Live tries on 15 Nov 2026: Qwen answered Hindi and Telugu well in about 1 s; gpt-oss-120b well in 1-1.5 s; Nemotron
 * good Hindi but 10 s, and wrong Telugu; Gemma on NVIDIA timed out every time, so it's out of both lists.
 */
export const CHAT_ROUTES: Record<"en" | "hi" | "te", Hop[]> = {
  en: [
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-120b", extra: GROQ_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-20b", extra: GROQ_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1200 }, timeoutMs: 25_000 },
  ],
  hi: [
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-120b", extra: GROQ_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1200 }, timeoutMs: 25_000 },
    { provider: "google", model: "gemini-3.8-flash", extra: GEMINI_EXTRA },
    { provider: "google", model: "gemma-4-31b-it", extra: { max_tokens: 1200 } },
  ],
  te: [
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-120b", extra: GROQ_EXTRA },
    { provider: "groq", model: "openai/gpt-oss-20b", extra: GROQ_EXTRA },
    { provider: "google", model: "gemini-3.8-flash", extra: GEMINI_EXTRA },
    { provider: "google", model: "gemini-3.5-flash-lite", extra: GEMINI_EXTRA },
    { provider: "google", model: "gemma-4-31b-it", extra: { max_tokens: 1200 } },
  ],
};

/**
 * Jeetu's models (owner, 22 Nov 2026: "high-quality online models only", Plus). The strongest working model first:
 * gpt-oss-120b on Groq with more reasoning, since a plan needs thinking and the owner's 15 Nov live test rated its
 * Hindi and Telugu well (and it costs about a fifth of Qwen). Then Qwen 3.8, then Nemotron 3 Ultra (strong, slow,
 * Hindi and English only), then Gemini, which stays last while Google's account answers 402. Same list in every
 * language; a provider set aside after a billing or key error is skipped as for Chotu.
 */
const JEETU_GPT = { reasoning_effort: "high", include_reasoning: false, max_completion_tokens: 2500 };
export const JEETU_ROUTES: Record<"en" | "hi" | "te", Hop[]> = {
  en: [
    { provider: "groq", model: "openai/gpt-oss-120b", extra: JEETU_GPT, timeoutMs: 30_000 },
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1500 }, timeoutMs: 30_000 },
    { provider: "google", model: "gemini-3.8-flash", extra: { ...GEMINI_EXTRA, reasoning_effort: "medium" } },
  ],
  hi: [
    { provider: "groq", model: "openai/gpt-oss-120b", extra: JEETU_GPT, timeoutMs: 30_000 },
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "nvidia", model: "nvidia/nemotron-3-ultra-550b-a55b", extra: { max_tokens: 1500 }, timeoutMs: 30_000 },
    { provider: "google", model: "gemini-3.8-flash", extra: { ...GEMINI_EXTRA, reasoning_effort: "medium" } },
  ],
  te: [
    { provider: "groq", model: "openai/gpt-oss-120b", extra: JEETU_GPT, timeoutMs: 30_000 },
    { provider: "groq", model: "qwen/qwen3.8-27b", extra: QWEN_EXTRA },
    { provider: "google", model: "gemini-3.8-flash", extra: { ...GEMINI_EXTRA, reasoning_effort: "medium" } },
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
 * Error bodies can echo the request, so only the status is kept. A provider set aside after a billing or key error
 * is skipped, so no one waits on it; only if every other model fails is it asked as a last resort.
 */
/**
 * The Groq key for a group (owner, 22 Nov 2026). Each key belongs to its own Groq project, so the console shows free
 * members' and visitors' spend (the marketing cost) apart from Plus and the team's jobs. Any key not set falls back
 * to GROQ_API_KEY, so nothing breaks before the owner adds them.
 */
export function groqKeyFor(env: Env, who: Who): string | undefined {
  const own = who === "plus" ? env.GROQ_API_KEY_PLUS : who === "free" || who === "visitor" || who === "pod" ? env.GROQ_API_KEY_FREE : undefined;
  return own || env.GROQ_API_KEY;
}

export async function callChat(env: ChatEnv, purpose: Purpose, messages: (ChatTurn | VisionTurn)[], hops: Hop[], who: Who = "team"): Promise<{ text: string; model: string }> {
  let last = "No AI provider answered";
  let keyed = 0;
  const down = await downProviders(env);
  const aside = new Set(Object.keys(down));
  const failed = new Set<string>(); // providers that gave a billing or key error during this call
  const order = [...hops.filter((h) => !aside.has(h.provider)), ...hops.filter((h) => aside.has(h.provider))];
  for (const hop of order) {
    if (failed.has(hop.provider)) continue;
    const p = PROVIDERS[hop.provider];
    const key = hop.provider === "groq" ? groqKeyFor(env, who) : p.key(env);
    const log = logger(env, purpose, hop.model, hop.provider, who);
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
          : res.status === 402 ? `${p.name} error 402: billing or credit needed on the account behind ${p.keyName}`
          : res.status === 429 ? `${p.name} is rate-limiting this key` : `${p.name} error ${res.status}`;
        await log("error", Date.now() - t0, null, null, last);
        // Billing or a rejected key doesn't fix itself in a minute: set the provider aside (the whole account, not one model).
        if ([401, 402, 403].includes(res.status)) { failed.add(hop.provider); await markDown(env, hop.provider, last); }
        continue;
      }
      const out = (await res.json()) as any;
      const text = String(out?.choices?.[0]?.message?.content ?? "").trim();
      const u = out?.usage ?? {};
      if (!text) {
        // A reasoning model that spends its whole token allowance thinking sends no answer at all (finish_reason
        // "length"): that is a setting to fix (more tokens, less reasoning), not the provider being down.
        last = out?.choices?.[0]?.finish_reason === "length" ? `${p.name} ran out of tokens before answering` : `${p.name} sent an empty reply`;
        await log("error", Date.now() - t0, u.prompt_tokens ?? null, u.completion_tokens ?? null, last);
        continue;
      }
      await log("ok", Date.now() - t0, u.prompt_tokens ?? null, u.completion_tokens ?? null, null);
      if (down[hop.provider]) await markUp(env, hop.provider);
      return { text, model: hop.model };
    } catch (e) {
      last = e instanceof Error && e.name === "TimeoutError" ? `${p.name} took too long` : `${p.name} unreachable: ${e instanceof Error ? e.name : "error"}`;
      await log("error", Date.now() - t0, null, null, last);
    }
  }
  if (!keyed) throw new AiBlocked("No AI keys on this server. Add GROQ_API_KEY, GOOGLE_AI_API_KEY or NVIDIA_API_KEY to .dev.vars and restart.");
  throw new Error(last);
}

/**
 * How long a provider that answered with a billing or key error stays set aside. The 05:00 health check
 * (checkProviders) brings it back sooner once it answers properly; this is the backstop.
 */
export const DOWN_FOR_MS = 24 * 60 * 60 * 1000;
const DOWN_KEY = "ai_down";
type Down = Partial<Record<Provider, { since: string; why: string }>>;

/** Providers set aside within DOWN_FOR_MS. */
export async function downProviders(env: Env): Promise<Down> {
  const all = await getSetting<Down>(env, DOWN_KEY, {}).catch(() => ({}) as Down);
  const cut = Date.now() - DOWN_FOR_MS;
  return Object.fromEntries(Object.entries(all).filter(([, v]) => v && Date.parse(v.since) > cut)) as Down;
}
async function markDown(env: Env, provider: Provider, why: string) {
  const all = await getSetting<Down>(env, DOWN_KEY, {}).catch(() => ({}) as Down);
  all[provider] = { since: new Date().toISOString(), why: why.slice(0, 160) };
  await setSetting(env, DOWN_KEY, all, "ai").catch(() => {});
}
async function markUp(env: Env, provider: Provider) {
  const all = await getSetting<Down>(env, DOWN_KEY, {}).catch(() => ({}) as Down);
  if (!all[provider]) return;
  delete all[provider];
  await setSetting(env, DOWN_KEY, all, "ai").catch(() => {});
}

/** One tiny call per set-aside provider: the cheapest way to see if its billing or key is fixed. */
const PROBE: Record<Provider, string> = { google: "gemini-3.5-flash-lite", groq: "openai/gpt-oss-20b", nvidia: "google/gemma-4-31b-it" };

/**
 * The 05:00 health check: asks each set-aside provider for a one-word reply. If it answers, it is back in every
 * route at once; if not, it stays aside (and the 24 hours start again). No user chat ever pays for this wait.
 */
export async function checkProviders(env: ChatEnv): Promise<Record<string, "back" | "still down">> {
  const out: Record<string, "back" | "still down"> = {};
  for (const provider of Object.keys(await downProviders(env)) as Provider[]) {
    const p = PROVIDERS[provider];
    const key = p.key(env);
    if (!key) continue;
    const log = logger(env, "watch", PROBE[provider], provider);
    try { await gate(env, "watch", log); } catch { continue; }
    const t0 = Date.now();
    let ok = false, why = `${p.name} unreachable`;
    try {
      const res = await fetch(p.url, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: PROBE[provider], messages: [{ role: "user", content: "Reply with the word OK." }], max_tokens: 5, temperature: 0 }),
        signal: AbortSignal.timeout(15_000),
      });
      ok = res.ok;
      why = res.status === 402 ? `${p.name} error 402: billing or credit needed on the account behind ${p.keyName}`
        : res.status === 401 || res.status === 403 ? `${p.name} rejected the key (check ${p.keyName})` : `${p.name} error ${res.status}`;
    } catch { /* stays down */ }
    await log(ok ? "ok" : "error", Date.now() - t0, null, null, ok ? null : `health check: ${why}`);
    if (ok) await markUp(env, provider); else await markDown(env, provider, why);
    out[provider] = ok ? "back" : "still down";
  }
  return out;
}

/** The English route, kept for any caller that still asks for Groq by name. */
export const callGroq = (env: Env, purpose: Purpose, messages: ChatTurn[], who: Who = "team") => callChat(env, purpose, messages, CHAT_ROUTES.en, who);
