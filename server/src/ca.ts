import { devTokenAllowed } from "./auth-dev";
import { type Env, bad, json } from "./shared";
import { type Staff, approverName, ensureSchema } from "./staff";

/**
 * Cinematic current affairs (W7): a week in seven short vertical scenes (upsc-pods/ca-week@1), rendered by the motion
 * workstream and uploaded here from the desk (scripts/import-ca.mjs). Files live in R2 under ca/<week>/ and are served
 * at /media/ca/<week>/ like any pack file; the manifest's paths are relative to that folder.
 *
 * Phones read GET /ca (the weeks) and GET /ca/<week> (one week). Only scenes an editor marked approved go out; a local
 * dev server also hands drafts to debug builds that ask (?drafts=1), which show them with a DRAFT tag.
 *
 * Plus lock: the video and captions of a scene that isn't free (and the whole-week cut, unless every scene is free) are
 * served only with a signed query, ?exp=<unix s>&sig=<hex>, that a Plus member gets from GET /plus/ca-key (plus.ts)
 * and that lasts [KEY_HOURS] hours. Posters stay open: the shelf shows locked scenes blurred. The phone caches by the
 * path without the query, so a scene watched once still plays offline after the key runs out.
 */

export const CA_SCHEMA = "upsc-pods/ca-week@1";
const WEEK = /^\d{4}-\d{2}$/;
const SAFE_ID = /^[\w.-]{1,80}$/;
const SAFE_REL = /^(?!.*\.\.)[\w.-]+(\/[\w.-]+)*$/;

const KEY_HOURS = 6;
const enc = new TextEncoder();
let mediaKey: Promise<CryptoKey> | null = null;
/** A random 32-byte key made on first use and kept in D1 (never sent anywhere), like the session key (password.ts). */
function caKey(env: Env): Promise<CryptoKey> {
  mediaKey ??= (async () => {
    await ensureSchema(env);
    const fresh = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("INSERT INTO server_keys (name, value, created_at) VALUES ('ca_media', ?, ?) ON CONFLICT(name) DO NOTHING")
      .bind(fresh, new Date().toISOString()).run();
    const row = await env.DB.prepare("SELECT value FROM server_keys WHERE name = 'ca_media'").first<{ value: string }>();
    return crypto.subtle.importKey("raw", enc.encode(row!.value), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  })().catch((e) => { mediaKey = null; throw e; });
  return mediaKey;
}
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
const signFor = async (env: Env, week: string, exp: number) => hex(await crypto.subtle.sign("HMAC", await caKey(env), enc.encode(`ca/${week}|${exp}`)));

/** The query that opens a week's locked files for [KEY_HOURS] hours. Only for a member with Plus (plus.ts checks). */
export async function caKeyFor(env: Env, week: string, now = Date.now()): Promise<{ week: string; query: string; expiresAt: string }> {
  const exp = Math.floor(now / 1000) + KEY_HOURS * 3600;
  return { week, query: `exp=${exp}&sig=${await signFor(env, week, exp)}`, expiresAt: new Date(exp * 1000).toISOString() };
}

// Which files of a week are locked, read from its manifest and kept a minute per isolate (a video is many range reads).
const lockedCache = new Map<string, { at: number; files: Set<string> }>();
export function lockedFiles(m: any): Set<string> {
  const out = new Set<string>();
  const eps = m?.episodes ?? [];
  for (const e of eps) if (!e.free) for (const k of ["mp4", "vtt"]) if (e[k]) out.add(e[k]);
  if (m?.weekMp4 && eps.some((e: any) => !e.free)) out.add(m.weekMp4);
  return out;
}

/**
 * For /media/ca/<week>/<file>: null when the file is open (or not a CA file), else a 403 unless the query carries a
 * valid, unexpired signature for that week. Called before serveMedia (index.ts).
 */
export async function caMediaGate(env: Env, key: string, url: URL): Promise<Response | null> {
  const at = key.match(/^ca\/(\d{4}-\d{2})\/(.+)$/);
  if (!at || !env.MEDIA) return null;
  const [, week, file] = at;
  let hit = lockedCache.get(week);
  if (!hit || Date.now() - hit.at > 60_000) {
    const m = await readManifest(env, week).catch(() => null);
    hit = { at: Date.now(), files: lockedFiles(m) };
    lockedCache.set(week, hit);
  }
  if (!hit.files.has(file)) return null;
  const exp = Number(url.searchParams.get("exp")), sig = url.searchParams.get("sig") ?? "";
  if (!Number.isInteger(exp) || exp * 1000 <= Date.now() || exp * 1000 > Date.now() + (KEY_HOURS + 1) * 3600_000) return bad("This scene is in Plus", 403);
  // Constant-time compare of two hex strings of the same length.
  const want = await signFor(env, week, exp);
  let diff = want.length ^ sig.length;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ (sig.charCodeAt(i) || 0);
  return diff === 0 ? null : bad("This scene is in Plus", 403);
}

/** What's wrong with a week's manifest, in words for the desk. Empty when it's fine. */
export function checkWeek(m: any, week?: string): string[] {
  const errs: string[] = [];
  if (m?.schema !== CA_SCHEMA) return [`Not a current-affairs week (schema should be ${CA_SCHEMA})`];
  if (!WEEK.test(String(m.week))) errs.push("week should look like 2026-41");
  if (week && m.week !== week) errs.push(`This manifest is for week ${m.week}`);
  if (typeof m.lang !== "string" || !m.lang) errs.push("lang is missing");
  if (m.weekMp4 != null && !SAFE_REL.test(m.weekMp4)) errs.push("weekMp4 isn't a plain relative path");
  if (!Array.isArray(m.episodes) || !m.episodes.length) return [...errs, "episodes is empty"];
  const ids = new Set<string>();
  m.episodes.forEach((e: any, i: number) => {
    const at = `episode ${e?.n ?? i + 1}`;
    if (!SAFE_ID.test(String(e?.id))) errs.push(`${at}: id is missing or has odd characters`);
    else if (ids.has(e.id)) errs.push(`${at}: id ${e.id} is used twice`);
    ids.add(e?.id);
    if (typeof e?.n !== "number") errs.push(`${at}: n should be a number`);
    if (typeof e?.title !== "string" || !e.title.trim()) errs.push(`${at}: title is missing`);
    if (typeof e?.durationSec !== "number" || e.durationSec <= 0) errs.push(`${at}: durationSec should be a positive number`);
    for (const k of ["mp4", "vtt", "poster"]) if (!SAFE_REL.test(String(e?.[k] ?? ""))) errs.push(`${at}: ${k} is missing or isn't a plain relative path`);
    if (!Array.isArray(e?.syllabusNodes)) errs.push(`${at}: syllabusNodes should be a list`);
    if (!Array.isArray(e?.sources)) errs.push(`${at}: sources should be a list`);
    if (typeof e?.free !== "boolean") errs.push(`${at}: free should be true or false`);
    if (!["draft", "approved"].includes(e?.review?.status)) errs.push(`${at}: review.status should be draft or approved`);
    (Array.isArray(e?.quiz) ? e.quiz : [errs.push(`${at}: quiz should be a list`)].slice(1)).forEach((q: any, k: number) => {
      const qa = `${at}, question ${k + 1}`;
      if (typeof q?.q !== "string" || !q.q.trim()) errs.push(`${qa}: q is missing`);
      if (!Array.isArray(q?.options) || q.options.length < 2) errs.push(`${qa}: needs at least two options`);
      else if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) errs.push(`${qa}: answerIndex is out of range`);
      if (typeof q?.why !== "string" || !q.why.trim()) errs.push(`${qa}: why is missing`);
    });
  });
  return errs;
}

/** The files a week needs: each scene's video, captions and poster, and the whole-week cut if there is one. */
export function weekFiles(m: any): string[] {
  const out = new Set<string>();
  if (m.weekMp4) out.add(m.weekMp4);
  for (const e of m.episodes ?? []) for (const k of ["mp4", "vtt", "poster"]) if (e[k]) out.add(e[k]);
  return [...out];
}

/** The week as phones get it: only approved scenes (drafts too when asked for locally), and the folder its paths sit in. */
export function publicWeek(m: any, drafts: boolean) {
  const episodes = (m.episodes ?? [])
    .filter((e: any) => drafts || e.review?.status === "approved")
    .map(({ mp4Social, ...e }: any) => e)
    .sort((a: any, b: any) => a.n - b.n);
  return { schema: m.schema, week: m.week, lang: m.lang, generatedAt: m.generatedAt, voice: m.voice, weekMp4: m.weekMp4, base: `/media/ca/${m.week}/`, episodes };
}

async function readManifest(env: Env, week: string): Promise<any | null> {
  const obj = await env.MEDIA!.get(`ca/${week}/manifest.json`);
  return obj ? JSON.parse(await obj.text()) : null;
}

async function allWeeks(env: Env): Promise<string[]> {
  const weeks: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA!.list({ prefix: "ca/", delimiter: "/", cursor });
    for (const p of page.delimitedPrefixes) { const w = p.slice(3, -1); if (WEEK.test(w)) weeks.push(w); }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return weeks.sort().reverse();
}

/** GET /ca and GET /ca/<week>. */
export async function publicCa(req: Request, env: Env, path: string): Promise<Response | null> {
  if (req.method !== "GET" || (path !== "/ca" && !path.startsWith("/ca/"))) return null;
  if (!env.MEDIA) return json({ weeks: [] });
  const url = new URL(req.url);
  const drafts = url.searchParams.get("drafts") === "1" && devTokenAllowed(env.AUTH_MODE, url);
  const headers = { "access-control-allow-origin": "*", "cache-control": "no-cache" };
  if (path === "/ca") {
    const weeks = [];
    for (const w of await allWeeks(env)) {
      const m = await readManifest(env, w).catch(() => null);
      if (!m) continue;
      const p = publicWeek(m, drafts);
      if (!p.episodes.length) continue;
      weeks.push({
        week: w, lang: p.lang, generatedAt: p.generatedAt, scenes: p.episodes.length,
        free: p.episodes.filter((e: any) => e.free).length,
        seconds: p.episodes.reduce((s: number, e: any) => s + (e.durationSec ?? 0), 0),
        poster: p.base + p.episodes[0].poster,
      });
    }
    return Response.json({ weeks }, { headers });
  }
  const week = path.slice("/ca/".length);
  if (!WEEK.test(week)) return bad("Bad week", 404);
  const m = await readManifest(env, week);
  const p = m && publicWeek(m, drafts);
  if (!p?.episodes.length) return bad("No such week", 404);
  return Response.json(p, { headers });
}

/**
 * Desk: PUT ca/<week>/files/<path> (manifest.json first, then the files it names), GET ca, GET ca/<week> (every
 * scene, drafts too, with links the desk can play) and POST ca/<week>/episodes/<id>/review {status, editor}.
 */
export async function caDeskApi(req: Request, env: Env, path: string, s?: Staff): Promise<Response | null> {
  const one = path.match(/^ca\/([^/]+)$/);
  if (one && req.method === "GET") {
    if (!env.MEDIA || !WEEK.test(one[1])) return bad("No such week", 404);
    const m = await readManifest(env, one[1]);
    if (!m) return bad("No such week", 404);
    const exp = Math.floor(Date.now() / 1000) + KEY_HOURS * 3600, sig = await signFor(env, one[1], exp);
    const w = publicWeek(m, true);
    return json({ ...w, episodes: w.episodes.map((e: any) => ({ ...e, play: `${w.base}${e.mp4}?exp=${exp}&sig=${sig}`, still: `${w.base}${e.poster}?exp=${exp}&sig=${sig}` })) });
  }
  // An editor watches a scene, checks its sources and approves it (or sends it back to draft). Only approved scenes reach phones.
  const rev = path.match(/^ca\/([^/]+)\/episodes\/([^/]+)\/review$/);
  if (rev && req.method === "POST") {
    if (!env.MEDIA || !WEEK.test(rev[1])) return bad("No such week", 404);
    const m = await readManifest(env, rev[1]);
    const e = m?.episodes?.find((x: any) => x.id === rev[2]);
    if (!e) return bad("No such scene", 404);
    const body = await req.json<any>().catch(() => ({}));
    if (body.status === "approved") {
      const by = s ? approverName(s, body.editor) : "";
      if (!by) return bad("Type your name at the top first: it goes on the approval");
      e.review = { ...e.review, status: "approved", checkedBy: by, checkedOn: new Date().toISOString().slice(0, 10) };
    } else if (body.status === "draft") {
      e.review = { status: "draft" };
    } else return bad("status should be approved or draft");
    await env.MEDIA.put(`ca/${rev[1]}/manifest.json`, JSON.stringify(m, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    return json({ ok: true, review: e.review });
  }
  if (path === "ca" && req.method === "GET") {
    if (!env.MEDIA) return json([]);
    const out = [];
    for (const w of await allWeeks(env)) {
      const m = await readManifest(env, w).catch(() => null);
      if (!m) continue;
      const files = weekFiles(m);
      const missing: string[] = [];
      for (const f of files) if (!(await env.MEDIA.head(`ca/${w}/${f}`))) missing.push(f);
      out.push({ week: w, lang: m.lang, generatedAt: m.generatedAt, scenes: m.episodes.length,
        approved: m.episodes.filter((e: any) => e.review?.status === "approved").length, missing });
    }
    return json(out);
  }
  const put = path.match(/^ca\/([^/]+)\/files\/(.+)$/);
  if (!put || req.method !== "PUT") return null;
  if (!env.MEDIA) return bad("No MEDIA bucket bound. Check r2_buckets in wrangler.jsonc.", 503);
  const [, week, file] = put;
  if (!WEEK.test(week) || !SAFE_REL.test(file)) return bad("Bad week or file name");
  const buf = await req.arrayBuffer();
  if (file === "manifest.json") {
    let m: any;
    try { m = JSON.parse(new TextDecoder().decode(buf)); } catch { return bad("manifest.json doesn't parse"); }
    const errs = checkWeek(m, week);
    if (errs.length) return json({ error: errs[0], errors: errs }, 422);
    // Re-sending a week keeps the desk's approvals for scenes whose video is the same file.
    const old = await readManifest(env, week).catch(() => null);
    for (const e of m.episodes) {
      const was = old?.episodes?.find((x: any) => x.id === e.id && x.mp4 === e.mp4);
      if (was?.review?.status === "approved" && e.review?.status !== "approved") e.review = was.review;
    }
    await env.MEDIA.put(`ca/${week}/manifest.json`, JSON.stringify(m, null, 2), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
    return json({ ok: true, files: weekFiles(m) });
  }
  const m = await readManifest(env, week);
  if (!m) return bad("Upload manifest.json first");
  if (!weekFiles(m).includes(file)) {
    const social = (m.episodes ?? []).some((e: any) => e.mp4Social === file);
    return bad(social ? `${file} is the social cut; the app doesn't use it` : `${file} isn't in the manifest`);
  }
  await env.MEDIA.put(`ca/${week}/${file}`, buf);
  return json({ ok: true });
}
