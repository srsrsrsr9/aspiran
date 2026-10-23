import { devTokenAllowed } from "./auth-dev";
import { type Env, bad, json } from "./shared";

/**
 * Cinematic current affairs (W7): a week in seven short vertical scenes (upsc-pods/ca-week@1), rendered by the motion
 * workstream and uploaded here from the desk (scripts/import-ca.mjs). Files live in R2 under ca/<week>/ and are served
 * at /media/ca/<week>/ like any pack file; the manifest's paths are relative to that folder.
 *
 * Phones read GET /ca (the weeks) and GET /ca/<week> (one week). Only scenes an editor marked approved go out; a local
 * dev server also hands drafts to debug builds that ask (?drafts=1), which show them with a DRAFT tag.
 */

export const CA_SCHEMA = "upsc-pods/ca-week@1";
const WEEK = /^\d{4}-\d{2}$/;
const SAFE_ID = /^[\w.-]{1,80}$/;
const SAFE_REL = /^(?!.*\.\.)[\w.-]+(\/[\w.-]+)*$/;

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

/** Desk: PUT ca/<week>/files/<path> (manifest.json first, then the files it names) and GET ca. */
export async function caDeskApi(req: Request, env: Env, path: string): Promise<Response | null> {
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
    await env.MEDIA.put(`ca/${week}/manifest.json`, buf, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
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
