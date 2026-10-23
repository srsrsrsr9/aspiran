import PT from "./vendor/pods-templates.cjs";
import { type Env, bad, json } from "./shared";
import { ensureSchema, sha256Hex } from "./staff";

/**
 * "Request your language". The core of the app stays in English (Hindi where it already exists); people tap the
 * languages they'd like next, and the founder builds what's asked for most (admin console → Languages).
 *
 * What's stored: the language, a SHA-256 of a random id the app made for this device, whether they'd help translate,
 * and when. No member id, no name, no contact details. One row per language per device, so taps are deduped.
 */

/** Hinglish isn't a script, so it isn't in PT.LANGS; the rest are. English and Hindi are already in the app. */
export const REQUESTABLE: { code: string; name: string; native: string }[] = [
  { code: "hinglish", name: "Hinglish", native: "Hinglish" },
  ...["te", "ta", "bn", "mr", "kn", "ml", "gu", "or"].map((code) => ({ code, name: PT.LANGS[code].name, native: PT.LANGS[code].native })),
];
const CODES = new Set(REQUESTABLE.map((l) => l.code));
const DEVICE = /^[\w-]{16,64}$/;

/**
 * POST /languages/request { device, lang, on?: boolean (default true), helper?: boolean }
 * on=false withdraws that device's request for that language.
 */
export async function requestLanguage(env: Env, body: any): Promise<Response> {
  const device = String(body?.device ?? ""), lang = String(body?.lang ?? "");
  if (!DEVICE.test(device)) return bad("device is required");
  if (!CODES.has(lang)) return bad("Pick one of the languages on the list");
  await ensureSchema(env);
  const who = await sha256Hex("lang-request:" + device);
  if (body?.on === false) {
    await env.DB.prepare("DELETE FROM lang_requests WHERE lang = ? AND who = ?").bind(lang, who).run();
    return json({ ok: true, lang, requested: false });
  }
  await env.DB.prepare(
    "INSERT INTO lang_requests (lang, who, helper, at) VALUES (?, ?, ?, ?) ON CONFLICT (lang, who) DO UPDATE SET helper = excluded.helper",
  ).bind(lang, who, body?.helper ? 1 : 0, new Date().toISOString()).run();
  return json({ ok: true, lang, requested: true });
}

/** For the admin console: requests and would-be helpers per language, most asked first. */
export async function languageRequests(env: Env) {
  await ensureSchema(env);
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { results } = await env.DB.prepare(
    "SELECT lang, COUNT(*) AS n, SUM(helper) AS helpers, SUM(CASE WHEN at >= ? THEN 1 ELSE 0 END) AS week FROM lang_requests GROUP BY lang",
  ).bind(since).all<{ lang: string; n: number; helpers: number; week: number }>();
  const devices = await env.DB.prepare("SELECT COUNT(DISTINCT who) AS n FROM lang_requests").first<{ n: number }>();
  const by = new Map(results.map((r) => [r.lang, r]));
  const languages = REQUESTABLE.map((l) => ({ ...l, requests: by.get(l.code)?.n ?? 0, helpers: by.get(l.code)?.helpers ?? 0, lastWeek: by.get(l.code)?.week ?? 0 }))
    .sort((a, b) => b.requests - a.requests || a.name.localeCompare(b.name));
  return { languages, devices: devices?.n ?? 0 };
}
