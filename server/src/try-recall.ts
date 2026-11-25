// The day-3 email of "Try one topic" (sales build order step 1, owner approved 20 Nov 2026). A visitor who kept cards
// in the open demo can ask for one email, three days later, with 5 of them again. The email links to the web app
// (#tryback/<code>), which asks the 5 questions and says privately "You kept 4 of 5", then offers to join and keep them.
//
//   POST /try/recall                { sessionId, pathId, email, consent: true, consentText, cards: [card ids], lang,
//                                     series?: true, seriesText }   series: K4's five study emails, a separate tick (try-series.ts)
//                                   → { ok, code, due }   one per browser session; asking again updates it, never a 2nd email
//   POST /try/recall/<code>/stop    cancel before it goes, or the email's unsubscribe link (one-click, RFC 8058)
//   GET  /try/recall/<code>/stop    the same, from a plain link: a short page that says it's done
//   GET  /try/recall/<code>         the cards to ask (approved languages only), and the result if already answered
//   POST /try/recall/<code>/answers { picks: { cardId: optionIndex } } → { kept, of }, kept the first time only
//
// Privacy, as the demo says it: the address is used for this one email and deleted once it's sent (or cancelled).
// One email, never a second, no newsletter; unless the visitor also ticked the separate K4 box (try-series.ts). "Delete what I sent" in the demo deletes the row too (try.ts).
// Sending: the half-hourly cron (index.ts) calls sendRecalls in the late-morning slots; Ops can run it by hand
// (POST /admin/api/try/recall/run). At most RUN_MAX a run, to stay under Cloudflare's 50 outside calls.

import { publicLibrary } from "./content";
import { sendMail } from "./mail";
import { logEvent } from "./metrics";
import { ensureSchema, sha256Hex } from "./staff";
import { type Env, bad, istDay, json } from "./shared";
import { seriesFor, seriesSignUp, seriesStopLink, stopSeries, stopSeriesForRecall } from "./try-series";

/** Questions asked again on day 3: the visitor's own cards first, filled from the topic's other cards. */
export const ASK = 5;
/** Days after the demo. */
export const AFTER_DAYS = 3;
/** Emails per cron run (each is one outside call). */
const RUN_MAX = 40;
/** A send Resend refused is tried once more, in a later slot; then given up and the address deleted. */
const MAX_TRIES = 2;
/** Sign-ups per network per day: far above a household, far below someone filling in other people's addresses. */
const PER_NETWORK = 20;

const SESSION = /^[a-z0-9]{16,40}$/;
const CODE = /^[a-f0-9]{32}$/;
const EMAIL = /^[^@\s<>"']{1,64}@[^@\s<>"']{1,180}\.[a-z]{2,24}$/i;
const str = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

export const addDays = (day: string, n: number) => new Date(Date.parse(day + "T12:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
const appBase = (env: Env) => (env.PUBLIC_BASE_URL || "https://app.aspiran.in").replace(/\/$/, "");

type Card = { id: string; q: Record<string, string>; options: Record<string, string>[]; answer: number; why?: Record<string, string> };
type Path = { id: string; title: Record<string, string>; short?: Record<string, string>; languages: string[]; cards: Card[] };

/** The approved topic path (only the languages an editor approved), with every card from its Keep steps, in order. */
async function approvedPath(env: Env, pathId: string): Promise<Path | null> {
  const data = await (await publicLibrary(env, ["topic-path"])).json<{ items: { id: string; kind: string; languages: string[]; data: any }[] }>();
  const item = data.items.find((i) => i.kind === "topic-path" && (i.data?.id === pathId || i.id === pathId));
  if (!item) return null;
  const cards: Card[] = (item.data.steps ?? []).filter((s: any) => s.type === "keep").flatMap((s: any) => s.cards ?? []);
  return { id: item.data.id ?? item.id, title: item.data.title, short: item.data.short, languages: item.languages, cards };
}

/** The visitor's cards first (those that exist in the topic), then the topic's others, ASK in all, in topic order. */
export function pickCards(all: string[], mine: string[]): string[] {
  const own = all.filter((id) => mine.includes(id));
  const rest = all.filter((id) => !own.includes(id));
  const chosen = new Set([...own, ...rest].slice(0, ASK));
  return all.filter((id) => chosen.has(id));
}

async function underCap(req: Request, env: Env): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  const k = "tryrecall:" + (await sha256Hex(ip + ":" + istDay())).slice(0, 24);
  const row = await env.DB.prepare("INSERT INTO web_rate (k, day, n) VALUES (?, ?, 1) ON CONFLICT(k, day) DO UPDATE SET n = n + 1 RETURNING n")
    .bind(k, istDay()).first<{ n: number }>();
  return (row?.n ?? 1) <= PER_NETWORK;
}

async function signUp(req: Request, env: Env): Promise<Response> {
  const b = await req.json<any>().catch(() => null);
  if (!b || !SESSION.test(String(b.sessionId ?? ""))) return bad("sessionId is required");
  if (String(b.company ?? "")) return json({ ok: true }); // the hidden field only bots fill
  if (b.consent !== true) return bad("Tick the box to say we can send you this one email.");
  const email = str(b.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return bad("That doesn't look like an email address.");
  const pathId = str(b.pathId, 64);
  const path = /^[\w-]{3,64}$/.test(pathId) ? await approvedPath(env, pathId) : null;
  if (!path || !path.cards.length) return bad("That topic isn't open.", 404);
  if (!(await underCap(req, env))) return json({ error: "That's a lot of sign-ups from one place today. Try again tomorrow." }, 429);
  const mine = Array.isArray(b.cards) ? b.cards.map((c: unknown) => String(c)).slice(0, 40) : [];
  const cards = pickCards(path.cards.map((c) => c.id), mine);
  const lang = b.lang === "hi" && path.languages.includes("hi") ? "hi" : "en";
  const now = new Date(), due = addDays(istDay(now), AFTER_DAYS);
  await ensureSchema(env);
  const had = await env.DB.prepare("SELECT code, sent_at FROM try_recall WHERE session_id = ? AND path_id = ?").bind(b.sessionId, path.id).first<{ code: string; sent_at: string | null }>();
  if (had?.sent_at) return json({ ok: true, code: had.code, already: "sent" }); // one email, never a second
  // K4: only when its own box was ticked (b.series === true, never assumed).
  const series = (code: string) => b.series === true
    ? seriesSignUp(env, { sessionId: b.sessionId, recallCode: code, email, lang, consentText: str(b.seriesText, 600) || "Send me 5 short study emails." }).then((c) => c)
    : Promise.resolve(null);
  if (had) {
    await env.DB.prepare("UPDATE try_recall SET email = ?, lang = ?, cards = ?, consent_text = ?, due_day = ?, stopped_at = NULL WHERE code = ?")
      .bind(email, lang, JSON.stringify(cards), str(b.consentText, 600), due, had.code).run();
    return json({ ok: true, code: had.code, due, n: cards.length, series: await series(had.code) });
  }
  const code = Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) => x.toString(16).padStart(2, "0")).join("");
  await env.DB.prepare(`INSERT INTO try_recall (code, session_id, path_id, email, lang, cards, consent_text, created_at, due_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(code, b.sessionId, path.id, email, lang, JSON.stringify(cards), str(b.consentText, 600), now.toISOString(), due).run();
  return json({ ok: true, code, due, n: cards.length, series: await series(code) });
}

type Row = { code: string; session_id: string; path_id: string; email: string | null; lang: string; cards: string; created_at: string; due_day: string;
  sent_at: string | null; tries: number; opened_at: string | null; answered_at: string | null; kept: number | null; of_n: number | null; stopped_at: string | null };
const rowOf = (env: Env, code: string) => env.DB.prepare("SELECT * FROM try_recall WHERE code = ?").bind(code).first<Row>();

async function stop(env: Env, code: string, series = true) {
  await env.DB.prepare("UPDATE try_recall SET email = NULL, stopped_at = COALESCE(stopped_at, ?) WHERE code = ?").bind(new Date().toISOString(), code).run();
  if (series) await stopSeriesForRecall(env, code); // "stop" means every email still to come
}

const STOP_PAGE = (hi: boolean) => `<!doctype html><html lang="${hi ? "hi" : "en"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aspiran</title><body style="font:17px/1.5 system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;color:#2A1B12;background:#F7F2EA">
<h1 style="font-size:22px">${hi ? "हो गया।" : "Done."}</h1>
<p>${hi ? "हम आपको इसके बारे में कोई ईमेल नहीं भेजेंगे, और आपका पता मिटा दिया गया है।" : "We won't email you about this, and your address is deleted."}</p>
<p><a href="https://aspiran.in/" style="color:#9A4E0E">aspiran.in</a></p></body></html>`;

async function view(env: Env, row: Row): Promise<Response> {
  const path = await approvedPath(env, row.path_id);
  if (!path) return json({ error: "That topic isn't open any more." }, 404);
  const ids: string[] = JSON.parse(row.cards);
  const cards = ids.map((id) => path.cards.find((c) => c.id === id)).filter(Boolean);
  if (!row.opened_at) await env.DB.prepare("UPDATE try_recall SET opened_at = ? WHERE code = ?").bind(new Date().toISOString(), row.code).run();
  return new Response(JSON.stringify({
    pathId: path.id, title: path.title, short: path.short ?? null, languages: path.languages, lang: row.lang, madeOn: row.created_at.slice(0, 10), cards,
    result: row.answered_at ? { kept: row.kept, of: row.of_n } : null,
  }), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

async function answers(req: Request, env: Env, row: Row): Promise<Response> {
  if (row.answered_at) return json({ kept: row.kept, of: row.of_n, again: true });
  const b = await req.json<any>().catch(() => null);
  const picks = b?.picks && typeof b.picks === "object" ? b.picks : null;
  if (!picks) return bad("picks is required");
  const path = await approvedPath(env, row.path_id);
  if (!path) return json({ error: "That topic isn't open any more." }, 404);
  const ids: string[] = JSON.parse(row.cards);
  let kept = 0;
  for (const id of ids) { const c = path.cards.find((x) => x.id === id); if (c && Number(picks[id]) === c.answer) kept++; }
  await env.DB.prepare("UPDATE try_recall SET answered_at = ?, kept = ?, of_n = ? WHERE code = ? AND answered_at IS NULL")
    .bind(new Date().toISOString(), kept, ids.length, row.code).run();
  return json({ kept, of: ids.length });
}

export async function recallRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path !== "/try/recall" && !path.startsWith("/try/recall/") && !path.startsWith("/try/series/")) return null;
  await ensureSchema(env);
  if (path === "/try/recall") return req.method === "POST" ? signUp(req, env) : json({ error: "Use POST." }, 405);
  const ser = path.match(/^\/try\/series\/([^/]+)\/stop$/);
  if (ser) {
    if (!CODE.test(ser[1])) return json({ error: "That link isn't right. It may have been cut short." }, 404);
    const r = await env.DB.prepare("SELECT lang FROM try_series WHERE code = ?").bind(ser[1]).first<{ lang: string }>();
    if (r) await stopSeries(env, ser[1]);
    return req.method === "GET" ? new Response(STOP_PAGE(r?.lang === "hi"), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }) : json({ ok: true });
  }
  const m = path.match(/^\/try\/recall\/([^/]+)(\/stop|\/answers)?$/);
  if (!m || !CODE.test(m[1])) return json({ error: "That link isn't right. It may have been cut short." }, 404);
  const row = await rowOf(env, m[1]);
  if (m[2] === "/stop") {
    if (row) await stop(env, row.code);
    return req.method === "GET" ? new Response(STOP_PAGE(row?.lang === "hi"), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }) : json({ ok: true });
  }
  if (!row) return json({ error: "That link has expired, or the questions were deleted." }, 404);
  if (m[2] === "/answers") return req.method === "POST" ? answers(req, env, row) : json({ error: "Use POST." }, 405);
  return req.method === "GET" ? view(env, row) : json({ error: "Use GET." }, 405);
}

/** The email itself: plain text, English or Hindi, one link to answer and one to stop. */
export function recallMail(env: Env, row: { code: string; lang: string; created_at: string }, title: string, n: number, seriesCode: string | null = null) {
  const base = appBase(env), link = `${base}/app/#tryback/${row.code}`, stopLink = seriesCode ? seriesStopLink(env, seriesCode) : `${base}/try/recall/${row.code}/stop`;
  const hi = row.lang === "hi";
  const text = (hi ? [
    "नमस्ते,",
    "",
    `तीन दिन पहले आपने Aspiran पर "${title}" आज़माया था। जैसा आपने कहा था, उसके ${n} सवाल फिर से। देखिए कितना याद रहा।`,
    "लगभग दो मिनट, कोई घड़ी नहीं, और नतीजा सिर्फ़ आप देखेंगे।",
    "",
    `यहाँ जवाब दीजिए: ${link}`,
    "",
    "अभी क्यों: जो बात भूलने से ठीक पहले फिर याद की जाए, वह ज़्यादा दिन टिकती है।",
    "",
    ...(seriesCode ? [
      "यह पाँच छोटे ईमेल में से दूसरा है। आपका पता आख़िरी ईमेल (30वें दिन) तक रखा जाएगा, फिर मिटा दिया जाएगा।",
      `ये ईमेल बंद करें: ${stopLink}`,
    ] : [
      "इसके बारे में यही एक ईमेल है। इसे भेजने के बाद हमने आपका पता मिटा दिया है।",
      `नहीं चाहिए था? ${stopLink}`,
    ]),
    "",
    "Aspiran",
  ] : [
    "Hello,",
    "",
    `Three days ago you tried "${title}" on Aspiran. As you asked, here are ${n} of its questions again, to see what stayed.`,
    "About two minutes, no clock, and only you see how it went.",
    "",
    `Answer them here: ${link}`,
    "",
    "Why now: something you pull back just as it starts to fade stays with you longer than something you re-read.",
    "",
    ...(seriesCode ? [
      "This is the second of your five short study emails. We keep your address until the last one, on day 30, then delete it.",
      `Stop these emails: ${stopLink}`,
    ] : [
      "This is the only email about it. Now that it's sent, we've deleted your address.",
      `Didn't want it? ${stopLink}`,
    ]),
    "",
    "Aspiran",
  ]).join("\n");
  return {
    subject: hi ? `${title}: ${n} सवाल, तीन दिन बाद` : `${title}: ${n} questions, three days on`,
    text,
    headers: { "List-Unsubscribe": `<${stopLink}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

/**
 * Sends the day-3 emails that are due (due day today or earlier), at most RUN_MAX. Each row is claimed before sending
 * (tries + 1), so two runs never send the same one; once sent, the address is deleted. Rows still unsent a week after
 * they were due (Resend down, or the topic closed) lose their address too.
 */
export async function sendRecalls(env: Env, day = istDay()): Promise<{ sent: number; failed: number; expired: number }> {
  await ensureSchema(env);
  const expired = (await env.DB.prepare("UPDATE try_recall SET email = NULL WHERE email IS NOT NULL AND sent_at IS NULL AND (due_day < ? OR tries >= ?)")
    .bind(addDays(day, -7), MAX_TRIES).run()).meta.changes ?? 0;
  const { results } = await env.DB.prepare(
    "SELECT * FROM try_recall WHERE email IS NOT NULL AND sent_at IS NULL AND stopped_at IS NULL AND due_day <= ? AND tries < ? ORDER BY due_day, created_at LIMIT ?",
  ).bind(day, MAX_TRIES, RUN_MAX).all<Row>();
  const paths = new Map<string, Path | null>();
  let sent = 0, failed = 0;
  for (const row of results) {
    const claim = await env.DB.prepare("UPDATE try_recall SET tries = tries + 1 WHERE code = ? AND sent_at IS NULL AND tries = ?").bind(row.code, row.tries).run();
    if (!claim.meta.changes) continue; // another run has it
    if (!paths.has(row.path_id)) paths.set(row.path_id, await approvedPath(env, row.path_id));
    const path = paths.get(row.path_id);
    if (!path) { await stop(env, row.code, false); continue; } // the topic closed: no day-3 email, address gone (the series carries on)
    const title = (row.lang === "hi" && (path.short?.hi || path.title.hi)) || path.short?.en || path.title.en;
    const n = (JSON.parse(row.cards) as string[]).length;
    const ser = await seriesFor(env, row.code);
    const ok = await sendMail(env, { to: row.email!, ...recallMail(env, row, title, n, ser?.code ?? null) });
    if (ok) {
      await env.DB.prepare("UPDATE try_recall SET sent_at = ?, email = NULL WHERE code = ?").bind(new Date().toISOString(), row.code).run();
      await logEvent(env, "try_day3_sent", {}, { path: row.path_id });
      sent++;
    } else failed++;
  }
  return { sent, failed, expired };
}

/** For Admin: the funnel in counts. No addresses. */
export async function recallFunnel(env: Env) {
  await ensureSchema(env);
  const r = await env.DB.prepare(`SELECT COUNT(*) AS signed, SUM(sent_at IS NOT NULL) AS sent, SUM(stopped_at IS NOT NULL) AS stopped,
    SUM(sent_at IS NULL AND email IS NOT NULL) AS waiting, SUM(opened_at IS NOT NULL) AS opened, SUM(answered_at IS NOT NULL) AS answered,
    SUM(kept) AS kept, SUM(of_n) AS asked FROM try_recall`).first<Record<string, number | null>>();
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, v ?? 0]));
}
