import { ACT, LINES } from "../public/app/jeetu-lines.js";
import { extraDistress } from "./langs";
import { quietHours } from "./jeetu";
import { activeResult, resultDays } from "./results";
import { type Env, bad, distress, istDay, json } from "./shared";
import { bump, ensureSchema, flags } from "./staff";

/**
 * Spoken voices for Chotu · AI and Jeetu · AI, made by Fish Audio (artefacts/voices-2026-11-15/README.md).
 *
 * POST /voice (signed-in members only) answers with an MP3 of one line. It never takes free text:
 *   {who, line, lang}   one of the scripted lines in public/app/jeetu-lines.js, by key ("en" or "hi");
 *   {who, text, sig}    a reply the server itself gave this member. /chotu and /jeetu add `voice` (the sig) to a reply
 *                       when it may be spoken; the sig is an HMAC over who, the member and the text, so no chat is kept.
 * Never voiced: distress and care replies (they get no sig, and the text is checked again here), Jeetu during his
 * quiet hours, anything in result week, anything over MAX_CHARS.
 * Each new line is made once and kept in R2 (_cache/voice/, never served at /media), so a repeat costs nothing.
 * Caps: MEMBER_DAILY new lines per member a day (usage, kind "voice") and GLOBAL_DAILY for everyone together.
 * Every call to Fish Audio is logged in voice_calls (bytes, time, status; never the text), which Admin → AI usage shows.
 * Off (503, and /config says voice: false) while FISH_AUDIO_API_KEY is missing or the `voice` flag is off.
 */

export type Who = "chotu" | "jeetu";

/** The two voices: Fish Audio's own licensed Hindi voices (no community clones). Ids are public, not secrets. */
export const VOICES: Record<Who, { id: string; speed: number; name: string }> = {
  // Brighter, younger, a touch quicker.
  chotu: { id: "24e7cbf4121745e7bb3b54d1a0d2be80", speed: 1.08, name: "शांत और भावुक स्वर (licensed)" },
  // Darker, calmer, a touch slower.
  jeetu: { id: "18e8999c98b746bda58521980d817e8c", speed: 0.92, name: "Hashtag agriculture hindi voice (licensed)" },
};
const MODEL = "s2.1-pro";
/** $15 per million UTF-8 bytes of text (Fish Audio price list, 15 Nov 2026). */
export const USD_PER_MILLION_BYTES = 15;
export const MAX_CHARS = 1200;
export const MEMBER_DAILY = 40;
export const GLOBAL_DAILY = 3000;

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (s: string) => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

/** What is actually spoken: no markdown marks, no emoji, single spaces. The cache key and the sig use this. */
export function speakable(text: string): string {
  return String(text ?? "").replace(/[*_#>`~|]+/g, " ").replace(/\p{Extended_Pictographic}/gu, " ").replace(/\s+/g, " ").trim();
}

export const voiceReady = async (env: Env) => !!env.FISH_AUDIO_API_KEY && !!env.MEDIA && (await flags(env)).voice;

async function hmac(env: Env, msg: string): Promise<string> {
  // The signing key comes from the Fish Audio key itself: no key, no sigs, no feature.
  const key = await crypto.subtle.importKey("raw", enc.encode("aspiran-voice-sig:" + env.FISH_AUDIO_API_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}
const sigFor = async (env: Env, who: Who, member: string, text: string) => hmac(env, `${who}\n${member}\n${await sha256(speakable(text))}`);

/** The sig for one reply the server is about to send this member, or null when it must not be spoken. */
export async function voiceSig(env: Env, who: Who, member: string | null, text: string): Promise<string | null> {
  if (!member || !(await voiceReady(env))) return null;
  const t = speakable(text);
  if (!t || t.length > MAX_CHARS) return null;
  if (who === "jeetu" && quietHours()) return null;
  if (distress(t, await extraDistress(env).catch(() => [] as string[]))) return null;
  return sigFor(env, who, member, t);
}

/** Adds `voice` (the sig) to a /chotu or /jeetu reply that may be spoken. Care, quiet and error replies pass untouched. */
export async function withVoice(env: Env, who: Who, member: string | null, res: Response): Promise<Response> {
  if (res.status !== 200 || !member || !env.FISH_AUDIO_API_KEY) return res;
  const body = await res.clone().json<any>().catch(() => null);
  if (!body || typeof body.reply !== "string" || body.care || body.quiet) return res;
  const sig = await voiceSig(env, who, member, body.reply);
  return sig ? json({ ...body, voice: sig }) : res;
}

const log = (env: Env, who: Who, kind: string, bytes: number, ms: number | null, status: string, error: string | null = null) =>
  env.DB.prepare("INSERT INTO voice_calls (at, day, who, kind, bytes, ms, status, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(new Date().toISOString(), istDay(), who, kind, bytes, ms, status, error?.slice(0, 200) ?? null).run().catch(() => {});

const mp3 = (body: ReadableStream | ArrayBuffer, cached: boolean) => new Response(body, {
  headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400", "x-voice-cache": cached ? "hit" : "miss", "access-control-allow-origin": "*" },
});

export async function voiceRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path !== "/voice" || req.method !== "POST") return null;
  if (!(await voiceReady(env))) return json({ error: "Voices are off for now.", off: true }, 503);
  const b = await req.json<any>().catch(() => null);
  const who: Who | null = b?.who === "chotu" || b?.who === "jeetu" ? b.who : null;
  const member = String(b?.memberId ?? "");
  if (!b || !who) return bad("who is required");
  if (!/^[\w-]{8,64}$/.test(member)) return json({ error: "Sign in to listen." }, 401);

  // Which words: a scripted line by key, or a reply this server signed for this member. Never free text.
  let text = "", kind = "reply";
  if (typeof b.line === "string") {
    const l = (who === "jeetu" ? LINES[b.line] : null) ?? (ACT[b.line]?.who === who ? ACT[b.line] : null);
    if (!l) return bad("Unknown line", 404);
    text = speakable(b.lang === "hi" ? l.hi : l.en); kind = "line";
  } else {
    text = speakable(b.text);
    if (!text) return bad("line, or text with its sig, is required");
    if (text.length > MAX_CHARS) return json({ error: "That one is too long to read aloud." }, 413);
    if (typeof b.sig !== "string" || b.sig.length !== 64 || b.sig !== await sigFor(env, who, member, text)) return json({ error: "Only replies from Chotu or Jeetu can be read aloud." }, 403);
  }
  // Never a voice on distress, in result week, or for Jeetu in his quiet hours.
  if (distress(text, await extraDistress(env).catch(() => [] as string[]))) return json({ error: "This one stays as text." }, 403);
  if (who === "jeetu" && quietHours()) return json({ error: "Jeetu is quiet until seven.", quiet: true }, 409);
  if (activeResult(await resultDays(env))) return json({ error: "Voices are quiet this week.", quiet: true }, 409);

  const voice = VOICES[who];
  const key = `_cache/voice/${who}/${await sha256(`${voice.id}|${voice.speed}|${MODEL}|${text}`)}.mp3`;
  const hit = await env.MEDIA!.get(key);
  if (hit) { await bump(env, "voice_cache_hits"); return mp3(hit.body, true); }

  // A new line costs money: the caps. Scripted lines are a fixed, small set, so they don't count against a member.
  await ensureSchema(env);
  const day = istDay();
  const all = (await env.DB.prepare("SELECT COUNT(*) AS n FROM voice_calls WHERE day = ? AND status = 'ok'").bind(day).first<{ n: number }>())?.n ?? 0;
  if (all >= GLOBAL_DAILY) return json({ error: "Voices are resting for today. Back tomorrow.", limit: true }, 429);
  if (kind === "reply") {
    const mine = (await env.DB.prepare("SELECT n FROM usage WHERE member_id = ? AND day = ? AND kind = 'voice'").bind(member, day).first<{ n: number }>())?.n ?? 0;
    if (mine >= (Number(env.VOICE_MEMBER_DAILY) || MEMBER_DAILY)) return json({ error: "That's today's listening used up. The text is still here; voices are back tomorrow.", limit: true }, 429);
  }

  const bytes = enc.encode(text).length;
  // A local test server can point this at a stand-in (test/voice.mjs); production always calls Fish Audio.
  const base = env.FISH_AUDIO_BASE && env.AUTH_MODE === "dev" ? env.FISH_AUDIO_BASE.replace(/\/$/, "") : "https://api.fish.audio";
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/v1/tts`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.FISH_AUDIO_API_KEY}`, "content-type": "application/json", model: MODEL },
      body: JSON.stringify({ text, reference_id: voice.id, format: "mp3", mp3_bitrate: 64, normalize: true, latency: "normal", prosody: { speed: voice.speed } }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      // Error bodies can echo the request, so only the status is kept.
      await log(env, who, kind, bytes, Date.now() - t0, "error", `Fish Audio ${res.status}`);
      return json({ error: "The voice couldn't be made just now. Try again in a minute." }, 502);
    }
    const audio = await res.arrayBuffer();
    if (audio.byteLength < 200) { await log(env, who, kind, bytes, Date.now() - t0, "error", "empty audio"); return json({ error: "The voice couldn't be made just now. Try again in a minute." }, 502); }
    await env.MEDIA!.put(key, audio, { httpMetadata: { contentType: "audio/mpeg" } });
    await log(env, who, kind, bytes, Date.now() - t0, "ok");
    if (kind === "reply") await env.DB.prepare("INSERT INTO usage (member_id, day, kind, n) VALUES (?, ?, 'voice', 1) ON CONFLICT(member_id, day, kind) DO UPDATE SET n = n + 1").bind(member, day).run();
    return mp3(audio, false);
  } catch (e) {
    await log(env, who, kind, bytes, Date.now() - t0, "error", String((e as Error)?.name ?? "error"));
    return json({ error: "The voice couldn't be made just now. Try again in a minute." }, 502);
  }
}

/** For Admin → AI usage: what the voices cost, by day and by character. Counts and bytes only, never text. */
export async function voiceUsage(env: Env, since: string) {
  await ensureSchema(env);
  const daily = (await env.DB.prepare(
    `SELECT day, who, SUM(status = 'ok') AS made, SUM(status != 'ok') AS failed, COALESCE(SUM(CASE WHEN status = 'ok' THEN bytes END), 0) AS bytes
     FROM voice_calls WHERE day >= ? GROUP BY day, who ORDER BY day DESC, who`).bind(since).all<{ day: string; who: string; made: number; failed: number; bytes: number }>()).results;
  const hits = (await env.DB.prepare("SELECT COALESCE(SUM(n), 0) AS n FROM daily_counts WHERE metric = 'voice_cache_hits' AND day >= ?").bind(since).first<{ n: number }>())?.n ?? 0;
  const bytes = daily.reduce((a, r) => a + r.bytes, 0);
  return { on: await voiceReady(env), key: !!env.FISH_AUDIO_API_KEY, daily, cacheHits: hits, bytes, usd: Math.round(bytes * USD_PER_MILLION_BYTES / 1e4) / 100,
    usdPerMillionBytes: USD_PER_MILLION_BYTES, caps: { memberDaily: MEMBER_DAILY, globalDaily: GLOBAL_DAILY, maxChars: MAX_CHARS } };
}
