import { type Staff, approverName, can, label, recordVersion } from "./staff";
import { ENGINE_KINDS, ENGINE_SCHEMAS, addLangToPlay, blankFrom, checkPlay, toPlay } from "./engines";
import { INPACK, isLang, langName, liveLangs } from "./langs";
import PT, { type Translation } from "./vendor/pods-templates.cjs";
import { ensureSchema } from "./staff";
import { autoChecks } from "./pipeline";
import { type Env, bad, istDay, json } from "./shared";

/**
 * Content packs from the content team (upsc-pods/pack-manifest@1) and the library they fill.
 *
 * - Chai cards (chai-pack@1) become ordinary candidates in the day's queue, so they go through the
 *   same English and Hindi approval and the same Publish button as news cards.
 * - Everything else (explainers, timelines, games, quiz nights, maps, numbers, myths, two sides,
 *   lamp off, soundscapes) becomes a library item. An item is in the app once English is approved;
 *   its Hindi text ships only after a Hindi editor approves it too.
 * - Sound effects are named by id ("sfx/stamp"); on import each item gets the resolved files, gains
 *   and loop flags under `sounds`, so phones never need the effects list. TRAGIC items get none.
 * - Files (SVGs, audio) are checked against the manifest's SHA-256 and kept in R2, served at /media/.
 */

const SCHEMA_KIND: Record<string, string> = {
  "upsc-pods/explainer@1": "explainer",
  "upsc-pods/timeline@1": "timeline",
  "upsc-pods/match-game@1": "match",
  "upsc-pods/quiz-pack@1": "quiz",
  "upsc-pods/map-card@1": "map",
  "upsc-pods/number-card@1": "number",
  "upsc-pods/myth-card@1": "myth",
  "upsc-pods/two-sides@1": "debate",
  "upsc-pods/winddown@1": "winddown",
  "upsc-pods/sound@1": "sound",
  "upsc-pods/scratch-card@1": "scratch",
  "upsc-pods/stamp-trail@1": "trail",
  "upsc-pods/radio@1": "radio",
  "upsc-pods/assemble@1": "assemble",
  "upsc-pods/chain@1": "chain",
  "upsc-pods/then-now@1": "thennow",
  "upsc-pods/postcard@1": "postcard",
  "upsc-pods/quote@1": "quote",
  "upsc-pods/mock-paper@1": "mock",
  "upsc-pods/long-read@1": "read",
  "upsc-pods/calm-script@1": "calm",
  "upsc-pods/routine-card@1": "routine",
};
/** Where the app may show an approved quote: one per screen at most, never on TRAGIC cards or in distress flows. */
const QUOTE_MOMENTS = ["night", "if-then", "know-yourself", "monday", "finish", "exam-trap"];
/** Manifest entry lists that hold library items. */
const ITEM_LISTS = ["explainers", "timelines", "games", "quizzes", "maps", "numbers", "myths", "debates", "winddown",
  "scratch", "journeys", "radio", "assemble", "chains", "thenNow", "postcards", "quotes", "mocks", "reads", "calm", "routines"];
/** Files the desk never needs: share PNGs are drawn on the phone, the rest are tools for writers. */
const OPTIONAL = /^(share|templates|tools|jobs|_generated)\/|^README\.md$/;
export const KINDS = [...Object.values(SCHEMA_KIND), ...Object.keys(ENGINE_KINDS)];
/** The library kind for a schema: the older one-off types, or one of the engine types. */
export const kindOf = (schema: string): string | undefined => SCHEMA_KIND[schema] ?? ENGINE_SCHEMAS[schema]?.kind;

/** Names for the soundscapes; audio.json only says what each file is for. Editable on the desk. */
const SOUND_NAMES: Record<string, { name: { en: string; hi: string }; about: { en: string; hi: string } }> = {
  monsoon: {
    name: { en: "Monsoon desk", hi: "मानसून की मेज़" },
    about: { en: "Rain on a tin roof with a slow tanpura underneath.", hi: "टीन की छत पर बारिश, नीचे धीमा तानपुरा।" },
  },
  library: {
    name: { en: "Night library", hi: "रात की लाइब्रेरी" },
    about: { en: "A ceiling fan, a quiet room, and a low drone.", hi: "छत का पंखा, शांत कमरा और धीमा स्वर।" },
  },
};

interface LibraryRow {
  id: string;
  kind: string;
  pack: string | null;
  title: string;
  json: string;
  flags: string;
  status: string;
  en_editor: string | null;
  en_checked_on: string | null;
  hi_editor: string | null;
  hi_checked_on: string | null;
  updated_at: string;
  /** Other languages: { te: translation file } and { te: { by, on } }. */
  translations: string | null;
  approvals: string | null;
}
export type { LibraryRow };
export const rowTranslations = (r: LibraryRow): Record<string, Translation> => JSON.parse(r.translations ?? "{}");
export const rowApprovals = (r: LibraryRow): Record<string, { by: string; on: string }> => JSON.parse(r.approvals ?? "{}");

/** The item with one more language laid in from its translation file, play included. */
export function withLanguage(kind: string, data: any, tr: Translation): any {
  const { play, ...base } = data;
  const out = PT.applyTranslation(base, tr);
  delete out._untranslated;
  if (play) {
    out.play = structuredClone(play);
    addLangToPlay(kind, out, tr.lang);
  }
  return out;
}

const SAFE_PACK = /^[\w.-]{1,80}$/;
const SAFE_PATH = /^(?!.*\.\.)[\w.-]+(\/[\w.-]+)*$/;

const TYPES: Record<string, string> = {
  svg: "image/svg+xml",
  json: "application/json; charset=utf-8",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  png: "image/png",
  webp: "image/webp",
  md: "text/markdown; charset=utf-8",
};
const typeOf = (path: string) => TYPES[path.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";

async function sha256(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The project library stamps a C2PA block into SVGs; it is about 7 KB of base64 the phone never needs. */
export function stripSvgMetadata(svg: string): string {
  return svg.replace(/<metadata>[\s\S]*?<\/metadata>/g, "").replace(/ xmlns:c2pa="[^"]*"/g, "");
}

const C2PA_UUID = "d8fec3d61b0e483c92975828877ec481";
const MP4_CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "udta"]);

/**
 * The library also stamps a C2PA box into .m4a files, ahead of the audio data. Removing it and
 * moving the chunk offsets back gives the original bytes.
 */
export function stripMp4C2pa(src: Uint8Array): Uint8Array {
  const dv = new DataView(src.buffer, src.byteOffset, src.byteLength);
  const hex = (a: Uint8Array) => [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
  const kept: Uint8Array[] = [];
  let at = -1, removed = 0;
  for (let i = 0; i + 8 <= src.length;) {
    const n = dv.getUint32(i);
    if (n < 8 || i + n > src.length) return src;
    const type = String.fromCharCode(...src.subarray(i + 4, i + 8));
    if (type === "uuid" && hex(src.subarray(i + 8, i + 24)) === C2PA_UUID) { at = i; removed = n; }
    else kept.push(src.subarray(i, i + n));
    i += n;
  }
  if (!removed) return src;
  const out = new Uint8Array(src.length - removed);
  let o = 0;
  for (const k of kept) { out.set(k, o); o += k.length; }
  const ov = new DataView(out.buffer);
  const fix = (s: number, e: number) => {
    for (let j = s; j + 8 <= e;) {
      const n = ov.getUint32(j);
      if (n < 8) return;
      const type = String.fromCharCode(...out.subarray(j + 4, j + 8));
      if (MP4_CONTAINERS.has(type)) fix(j + 8, j + n);
      else if (type === "stco" || type === "co64") {
        const count = ov.getUint32(j + 12);
        for (let k = 0; k < count; k++) {
          if (type === "stco") {
            const q = j + 16 + k * 4, v = ov.getUint32(q);
            if (v > at) ov.setUint32(q, v - removed);
          } else {
            const q = j + 16 + k * 8, v = ov.getBigUint64(q);
            if (v > BigInt(at)) ov.setBigUint64(q, v - BigInt(removed));
          }
        }
      }
      j += n;
    }
  };
  fix(0, out.length);
  return out;
}

const media = (pack: string, path: string | null | undefined) => (path ? `/media/${pack}/${path}` : null);

// --- Public ---------------------------------------------------------------------------

/**
 * Approved library items for phones. A language ships only if it's live and an editor for it approved
 * this item: Hindi needs a Hindi editor, Telugu (and the rest) a language editor. Other texts are removed.
 */
export async function publicLibrary(env: Env): Promise<Response> {
  await ensureSchema(env);
  const live = await liveLangs(env);
  const { results } = await env.DB.prepare(
    "SELECT * FROM library WHERE en_editor IS NOT NULL AND status = 'approved' ORDER BY kind, updated_at DESC",
  ).all<LibraryRow>();
  const items = results.map((r) => {
    let data = JSON.parse(r.json);
    const approvals = rowApprovals(r), trs = rowTranslations(r);
    const langs = ["en"];
    if (r.hi_editor && live.includes("hi")) langs.push("hi");
    const review: Record<string, unknown> = {
      status: "approved",
      en: { checkedBy: r.en_editor, checkedOn: r.en_checked_on },
      hi: r.hi_editor ? { checkedBy: r.hi_editor, checkedOn: r.hi_checked_on } : null,
    };
    for (const lang of live) {
      if (INPACK.includes(lang) || !approvals[lang] || !trs[lang]) continue;
      data = withLanguage(r.kind, data, trs[lang]);
      langs.push(lang);
      review[lang] = { checkedBy: approvals[lang].by, checkedOn: approvals[lang].on };
    }
    keepLangs(data, langs);
    if (data.provenance) delete data.provenance.source;
    data.review = review;
    data.languages = langs;
    return { id: r.id, kind: r.kind, updatedAt: r.updated_at, hindi: langs.includes("hi"), languages: langs, data };
  });
  return new Response(JSON.stringify({ items }), {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-cache" },
  });
}

/** Removes every language text not in `keep` from { en, hi, te, ... } objects. */
export function keepLangs(node: any, keep: string[]) {
  if (Array.isArray(node)) return node.forEach((x) => keepLangs(x, keep));
  if (!node || typeof node !== "object") return;
  if ("en" in node) for (const k of Object.keys(node)) if (k !== "en" && isLang(k) && !keep.includes(k)) delete node[k];
  Object.values(node).forEach((x) => keepLangs(x, keep));
}

export async function serveMedia(env: Env, key: string): Promise<Response> {
  if (!env.MEDIA) return bad("No MEDIA bucket bound", 503);
  if (!SAFE_PATH.test(key)) return bad("Bad path");
  const obj = await env.MEDIA.get(key);
  if (!obj) return bad("Not found", 404);
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? typeOf(key),
      "cache-control": "public, max-age=86400",
      "access-control-allow-origin": "*",
      // Opened directly, a file can't run scripts on the desk's origin.
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; media-src 'self'; sandbox",
      "x-content-type-options": "nosniff",
      etag: obj.httpEtag,
    },
  });
}

// --- Desk API (the editor token is already checked) --------------------------------------

export async function contentApi(req: Request, env: Env, path: string, s: Staff): Promise<Response | null> {
  const who = label(s);
  // Upload one file of a pack. manifest.json goes first; every later file must match its hash.
  const put = path.match(/^packs\/([^/]+)\/files\/(.+)$/);
  if (put && req.method === "PUT") return uploadPackFile(env, put[1], put[2], await req.arrayBuffer());

  const imp = path.match(/^packs\/([^/]+)\/import$/);
  if (imp && req.method === "POST") return importPack(env, imp[1]);

  if (path === "packs" && req.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, imported_at, log FROM packs ORDER BY id DESC").all();
    return json(results.map((r: any) => ({ ...r, log: JSON.parse(r.log ?? "[]") })));
  }

  // A single file from the desk (a new illustration or sound), stored under its own hash.
  const up = path.match(/^uploads\/([\w.-]+)$/);
  if (up && req.method === "PUT") {
    if (!env.MEDIA) return bad("No MEDIA bucket bound", 503);
    const ext = up[1].split(".").pop()!.toLowerCase();
    if (!["svg", "ogg", "m4a", "png", "webp"].includes(ext)) return bad("SVG, PNG, WebP, OGG or M4A only");
    let bytes: Uint8Array = new Uint8Array(await req.arrayBuffer());
    if (bytes.length > 4_000_000) return bad("Keep files under 4 MB");
    if (ext === "svg") {
      const svg = stripSvgMetadata(new TextDecoder().decode(bytes));
      if (/<script|on\w+\s*=|javascript:/i.test(svg)) return bad("SVGs can't contain scripts");
      bytes = new TextEncoder().encode(svg);
    }
    const key = `desk/${(await sha256(bytes)).slice(0, 16)}.${ext}`;
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: typeOf(key) } });
    return json({ path: "/media/" + key });
  }

  // One translation file at a time, from the desk's Library tab.
  if (path === "library/translation" && req.method === "POST") {
    const tr = await req.json<any>().catch(() => null);
    const r = await attachTranslation(env, tr);
    if (r.ok) await recordVersion(env, "library", r.id!, JSON.stringify(tr), `translation ${tr.lang} (file)`, who);
    return r.ok ? json(r) : bad(r.message);
  }
  if (path === "library" && req.method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM library ORDER BY status = 'hidden', kind, updated_at DESC").all<LibraryRow>();
    return json(results.map((r) => ({ ...r, data: JSON.parse(r.json), flags: JSON.parse(r.flags), json: undefined })));
  }

  if (path === "library/new" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const kind = String(body.kind);
    let data: any;
    if (TEMPLATES[kind]) data = structuredClone(TEMPLATES[kind]);
    else if (ENGINE_KINDS[kind]) {
      // Engine types start from the newest item of the same type, with every text emptied.
      const like = await env.DB.prepare("SELECT json FROM library WHERE kind = ? ORDER BY updated_at DESC LIMIT 1").bind(kind).first<{ json: string }>();
      if (!like) return bad("Import a pack with a sample of this type first; new drafts copy its shape");
      data = blankFrom(JSON.parse(like.json));
    } else return bad("kind must be one of " + [...Object.keys(TEMPLATES), ...Object.keys(ENGINE_KINDS)].join(", "));
    data.id = `${kind}-${Date.now().toString(36)}`;
    await prepareEdit(env, kind, data);
    await upsertItem(env, kind, null, data, ["Written on the desk", ...checkItem(kind, data)], who);
    return json({ id: `${kind}:${data.id}` });
  }

  const item = path.match(/^library\/([\w:.-]+?)(?:\/(approve|unapprove|hide|show|delete))?$/);
  if (item && req.method === "POST") {
    const [, id, action] = item;
    const body = await req.json<any>().catch(() => ({}));
    const row = await env.DB.prepare("SELECT * FROM library WHERE id = ?").bind(id).first<LibraryRow>();
    if (!row) return bad("No such item", 404);
    const editor = approverName(s, body.editor);
    const version = (json: string, what: string) => recordVersion(env, "library", id, json, what, who);
    switch (action ?? "edit") {
      case "edit": {
        if (!body.data || typeof body.data !== "object") return bad("data must be the item's JSON");
        const soundNotes: string[] = [];
        const data = await prepareEdit(env, row.kind, body.data, soundNotes);
        if (data.schema && kindOf(data.schema) !== row.kind) return bad("The schema doesn't match this item's kind");
        data.id = JSON.parse(row.json).id;
        const flags = [...soundNotes, ...checkItem(row.kind, data)];
        // Any edit clears both approvals, so nothing changes after an editor signed it off.
        await env.DB.prepare(
          `UPDATE library SET json = ?, title = ?, flags = ?, status = 'draft', en_editor = NULL, en_checked_on = NULL,
           hi_editor = NULL, hi_checked_on = NULL, approvals = NULL, updated_at = ? WHERE id = ?`,
        ).bind(JSON.stringify(data), titleOf(row.kind, data), JSON.stringify([...flags, ...staleFlags(data, rowTranslations(row))]), new Date().toISOString(), id).run();
        await version(JSON.stringify(data), "edit");
        return json({ ok: true, flags });
      }
      case "approve": {
        if (!editor) return bad("Add your name first; it shows in the app.");
        const lang = isLang(body.lang) ? body.lang : "en";
        if (!INPACK.includes(lang)) return approveLanguage(env, s, row, lang, editor, version);
        if (!can(s, `approve:${lang}`)) return bad(lang === "hi" ? "Only a Hindi editor can approve the Hindi." : "Only an editor can approve the English.", 403);
        if (lang === "hi" && !row.en_editor) return bad("Approve the English first.");
        await env.DB.prepare(`UPDATE library SET status = 'approved', ${lang}_editor = ?, ${lang}_checked_on = ? WHERE id = ?`)
          .bind(editor, istDay(), id).run();
        await version(row.json, `approve ${lang} (${editor})`);
        return json({ ok: true });
      }
      case "unapprove":
        if (isLang(body.lang) && !INPACK.includes(body.lang)) {
          // Takes back one language only.
          const a = rowApprovals(row);
          delete a[body.lang];
          await env.DB.prepare("UPDATE library SET approvals = ? WHERE id = ?").bind(JSON.stringify(a), id).run();
          await version(row.json, `unapprove ${body.lang}`);
          return json({ ok: true });
        }
        await env.DB.prepare("UPDATE library SET status = 'draft', en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL, approvals = NULL WHERE id = ?").bind(id).run();
        await version(row.json, "unapprove");
        return json({ ok: true });
      case "hide":
        await env.DB.prepare("UPDATE library SET status = 'hidden' WHERE id = ?").bind(id).run();
        await version(row.json, "hide");
        return json({ ok: true });
      case "show":
        await env.DB.prepare("UPDATE library SET status = CASE WHEN en_editor IS NULL THEN 'draft' ELSE 'approved' END WHERE id = ?").bind(id).run();
        await version(row.json, "show");
        return json({ ok: true });
      case "delete":
        if (row.en_editor) return bad("Unapprove it first.");
        await env.DB.prepare("DELETE FROM library WHERE id = ?").bind(id).run();
        // The versions stay, so a deleted item can be brought back from Content in /admin.
        await version(row.json, "delete");
        return json({ ok: true });
    }
  }

  // A Chai card written by hand on the desk, from the card template.
  if (path === "cards/new" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const day = /^\d{4}-\d{2}-\d{2}$/.test(body.day ?? "") ? body.day : istDay();
    const id = `w${Date.now().toString(36)}`;
    const card = { ...structuredClone(CARD_TEMPLATE), id };
    await env.DB.prepare(
      `INSERT INTO candidates (id, day, source_name, source_url, title, source_text, score, card_json, flags, created_at)
       VALUES (?, ?, 'Desk', '', 'New card', '', 50, ?, '["Written on the desk: fill in every zone, then approve"]', ?)`,
    ).bind(id, day, JSON.stringify(card), new Date().toISOString()).run();
    await recordVersion(env, "card", id, JSON.stringify(card), "new", who);
    return json({ id });
  }

  return null;
}

// --- Packs --------------------------------------------------------------------------------

async function uploadPackFile(env: Env, pack: string, path: string, buf: ArrayBuffer): Promise<Response> {
  if (!env.MEDIA) return bad("No MEDIA bucket bound. Check r2_buckets in wrangler.jsonc.", 503);
  if (!SAFE_PACK.test(pack) || !SAFE_PATH.test(path)) return bad("Bad pack or file name");
  if (path === "manifest.json") {
    let m: any;
    try { m = JSON.parse(new TextDecoder().decode(buf)); } catch { return bad("manifest.json doesn't parse"); }
    if (m.schema !== "upsc-pods/pack-manifest@1") return bad("Not a pack manifest (schema should be upsc-pods/pack-manifest@1)");
    if (m.packId !== pack) return bad(`This manifest is for pack ${m.packId}`);
    await env.DB.prepare("INSERT INTO packs (id, manifest) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET manifest = excluded.manifest")
      .bind(pack, JSON.stringify(m)).run();
    return json({ ok: true, files: m.files.length });
  }
  const row = await env.DB.prepare("SELECT manifest FROM packs WHERE id = ?").bind(pack).first<{ manifest: string }>();
  if (!row) return bad("Upload manifest.json first");
  const entry = JSON.parse(row.manifest).files.find((f: any) => f.path === path);
  if (!entry) return bad(`${path} isn't in the manifest`);
  let bytes: Uint8Array = new Uint8Array(buf);
  let ok = (await sha256(bytes)) === entry.sha256;
  if (path.endsWith(".svg")) {
    // Accept the file with or without the library's C2PA stamp; keep it without.
    const clean = new TextEncoder().encode(stripSvgMetadata(new TextDecoder().decode(bytes)));
    ok ||= (await sha256(clean)) === entry.sha256;
    bytes = clean;
  } else if (!ok && /\.(m4a|mp4)$/.test(path)) {
    const clean = stripMp4C2pa(bytes);
    ok = (await sha256(clean)) === entry.sha256;
    bytes = clean;
  }
  if (!ok) return bad(`${path} doesn't match the manifest's checksum. Re-export the pack.`, 422);
  await env.MEDIA.put(`${pack}/${path}`, bytes, { httpMetadata: { contentType: typeOf(path) } });
  return json({ ok: true });
}

async function readJson(env: Env, pack: string, path: string) {
  const obj = await env.MEDIA!.get(`${pack}/${path}`);
  if (!obj) throw new Error(`${path} wasn't uploaded`);
  return JSON.parse(await obj.text());
}

async function importPack(env: Env, pack: string): Promise<Response> {
  if (!env.MEDIA) return bad("No MEDIA bucket bound", 503);
  const row = await env.DB.prepare("SELECT manifest FROM packs WHERE id = ?").bind(pack).first<{ manifest: string }>();
  if (!row) return bad("Upload the pack first", 404);
  const m = JSON.parse(row.manifest);
  const log: string[] = [];
  const warnings: string[] = [];

  // Every content file must be here. Share PNGs, templates and writer tools are optional.
  const skipped: Record<string, number> = {};
  for (const f of m.files as { path: string }[]) {
    if (await env.MEDIA.head(`${pack}/${f.path}`)) continue;
    if (OPTIONAL.test(f.path)) { const top = f.path.split("/")[0]; skipped[top] = (skipped[top] ?? 0) + 1; }
    else log.push(`Missing ${f.path}`);
  }
  if (log.length) return json({ ok: false, log }, 422);
  for (const [top, n] of Object.entries(skipped)) warnings.push(`${top}: ${n} file${n > 1 ? "s" : ""} not uploaded (the app doesn't need them)`);

  const e = m.entry ?? {};
  const sfx = e.sfx ? await loadSfx(env, pack, e.sfx, m.files) : null;
  if (sfx) log.push(`Sound effects: ${Object.keys(sfx.effects).length} available`);
  if (e.chaiPack) {
    const chai = await readJson(env, pack, e.chaiPack);
    if (chai.schema !== "upsc-pods/chai-pack@1") throw new Error(`${e.chaiPack}: expected upsc-pods/chai-pack@1`);
    let n = 0;
    for (const [i, c] of chai.cards.entries()) {
      const r = await upsertCard(env, pack, chai.date ?? m.createdOn ?? istDay(), c, i + 1);
      log.push(`Chai card ${c.id}: ${r}`);
      n++;
    }
    log.push(`${n} Chai cards are in the queue for ${chai.date}`);
  }
  const importItem = async (p: string, note?: string) => {
    const data = await readJson(env, pack, p);
    const kind = kindOf(data.schema);
    if (!kind) { warnings.push(`${p}: unknown schema ${data.schema}, skipped`); return; }
    const notes: string[] = [];
    const fixed = withMediaPaths(kind, pack, kind === "mock" ? normalizeMock(data) : kind === "read" ? normalizeRead(data) : data, notes);
    resolveSounds(fixed, sfx, notes);
    const play = toPlay(kind, fixed);
    if (play) fixed.play = play;
    warnings.push(...notes.map((w) => `${p}: ${w}`));
    const r = await upsertItem(env, kind, pack, fixed, [note ?? `From pack ${pack}: ${data.review?.note ?? "draft"}`, ...notes, ...checkItem(kind, fixed)]);
    log.push(`${kind} ${data.id}: ${r}`);
  };
  for (const key of ITEM_LISTS) for (const p of (e[key] ?? []) as string[]) await importItem(p);
  // Wave 2: thirty types on nine engines, every sample written by a model from a source text.
  for (const p of (e.wave2?.samples ?? []) as string[]) {
    await importItem(p, "Written by a model from a source text: check every fact against the source before approving");
  }
  // Packs a model wrote from a source text (tools/generate.mjs): drafts like the rest, flagged for a fact check.
  if (e.generatedTest && (await env.MEDIA.head(`${pack}/${e.generatedTest}`))) {
    const report = await readJson(env, pack, e.generatedTest);
    const dir = e.generatedTest.replace(/[^/]+$/, "");
    for (const res of report.results ?? []) {
      const p = `${dir}${res.id}.json`;
      if (res.status !== "ok" || !(await env.MEDIA.head(`${pack}/${p}`))) continue;
      await importItem(p, "Written by a model from a source text: check every fact against the source before approving");
    }
  }
  if (e.audio) {
    const audio = await readJson(env, pack, e.audio);
    const dir = e.audio.replace(/[^/]+$/, "");
    for (const [name, a] of Object.entries<any>(audio.files ?? {})) {
      if (!/soundscape/i.test(a.use ?? "")) continue;
      const known = SOUND_NAMES[name];
      const data = {
        schema: "upsc-pods/sound@1",
        id: name,
        name: known?.name ?? { en: name, hi: name },
        about: known?.about ?? { en: a.use, hi: a.use },
        seconds: a.seconds,
        loop: a.loop !== false,
        files: { ogg: media(pack, `${dir}${name}.ogg`), m4a: media(pack, `${dir}${name}.m4a`) },
        review: { status: "draft" },
      };
      const r = await upsertItem(env, "sound", pack, data, [known ? `From pack ${pack}` : "Give this sound a name in both languages"]);
      log.push(`sound ${name}: ${r}`);
    }
  }
  // Translation files (content/<type>/<item>.te.json) attach to the item they translate.
  for (const f of m.files as { path: string }[]) {
    if (!/\.[a-z]{2}\.json$/.test(f.path) || OPTIONAL.test(f.path)) continue;
    const tr = await readJson(env, pack, f.path).catch(() => null);
    if (tr?.schema !== "upsc-pods/translation@1") continue;
    const r = await attachTranslation(env, tr);
    (r.ok ? log : warnings).push(`${f.path}: ${r.message}`);
  }
  for (const p of (e.reels ?? []) as string[]) warnings.push(`${p}: reels are exported as MP4 for social media, not shown in the app`);

  await env.DB.prepare("UPDATE packs SET imported_at = ?, log = ? WHERE id = ?")
    .bind(new Date().toISOString(), JSON.stringify([...log, ...warnings]), pack).run();
  return json({ ok: true, log, warnings });
}

/** File references become /media/ paths; explainer scenes get a structured state the app can draw. */
function withMediaPaths(kind: string, pack: string, d: any, warnings: string[]) {
  const out = structuredClone(d);
  if (out.illustration) out.illustration = media(pack, out.illustration);
  if (kind === "map" && out.base) out.base = media(pack, out.base);
  if (kind === "explainer") {
    if (out.audio?.bed) out.audio.bed = media(pack, out.audio.bed);
    if (out.audio?.motif) out.audio.motif = media(pack, out.audio.motif);
    out.scenes = compileScenes(out, warnings);
  }
  if (kind === "winddown" && out.audio?.file) out.audio.file = media(pack, out.audio.file);
  // The Hidden Why names its drawing by scene; a missing file leaves a plain paper background.
  if (kind === "hidden-why" && !out.illustration && /^[a-z0-9-]+$/.test(out.scene ?? "")) out.illustration = media(pack, `illustrations/hidden-why/${out.scene}.svg`);
  return out;
}

interface SoundFile { ogg: string | null; m4a: string | null; gain: number; loop: boolean; seconds?: number }
interface Sfx { pack: string; effects: Record<string, SoundFile> }

async function loadSfx(env: Env, pack: string, path: string, files: { path: string }[]): Promise<Sfx> {
  const lib = await readJson(env, pack, path);
  const have = new Set(files.map((f) => f.path));
  // Paths in sfx.json are relative to its folder or the one above ("sfx/chime.ogg" from audio/sfx/).
  const dir = path.replace(/[^/]+$/, "");
  const up = dir.replace(/[^/]+\/$/, "");
  const find = (p?: string) => (p ? [dir + p, up + p].find((c) => have.has(c)) ?? null : null);
  const effects: Sfx["effects"] = {};
  for (const [id, f] of Object.entries<any>(lib.effects ?? {})) {
    effects[id] = { ogg: media(pack, find(f.ogg)), m4a: media(pack, find(f.m4a)), gain: Number(f.gain ?? 0.5), loop: !!f.loop, seconds: f.seconds };
  }
  return { pack, effects };
}

/**
 * Items name sounds by role ("stamp": "sfx/stamp") plus an optional looping bed in mood.bed
 * ("static", or "scape" for a postcard's own scape). Resolve them to files once, here.
 */
export function resolveSounds(d: any, sfx: Sfx | null, warnings: string[]) {
  if (!d.sfx && !d.mood?.bed) return d;
  if (String(d.tone ?? "").toUpperCase() === "TRAGIC") { delete d.sounds; return d; }
  if (!sfx) { warnings.push("Uses sound effects, but no sound library has been imported yet"); return d; }
  const pick = (ref: string) => {
    const id = String(ref).replace(/^sfx\//, "");
    return sfx.effects[id] ?? sfx.effects[`bed-${id}`] ?? null;
  };
  const sounds: Record<string, SoundFile> = {};
  for (const [role, ref] of Object.entries<any>(d.sfx ?? {})) {
    if (!ref || typeof ref !== "string") continue;
    const s = pick(ref);
    if (s) sounds[role] = s; else warnings.push(`Unknown sound "${ref}" for ${role}`);
  }
  const bed = d.mood?.bed === "scape" ? d.scape : d.mood?.bed;
  if (bed) {
    const s = pick(bed);
    if (s) sounds.bed = { ...s, loop: true }; else warnings.push(`Unknown background sound "${bed}"`);
  }
  d.sounds = sounds;
  return d;
}

/** The newest imported sound library, for items written on the desk. */
async function latestSfx(env: Env): Promise<Sfx | null> {
  const { results } = await env.DB.prepare("SELECT id, manifest FROM packs ORDER BY imported_at DESC").all<{ id: string; manifest: string }>();
  for (const row of results) {
    const m = JSON.parse(row.manifest);
    if (m.entry?.sfx && env.MEDIA && (await env.MEDIA.head(`${row.id}/${m.entry.sfx}`))) return loadSfx(env, row.id, m.entry.sfx, m.files);
  }
  return null;
}

/**
 * The explainer export describes each scene's state in words ("2 highlighted, others dimmed").
 * Turn that into numbers once, here, so every phone draws the same thing. Unknown wording is
 * reported to the editor instead of guessed at.
 */
export function compileScenes(ex: any, warnings: string[] = []) {
  const parts = Object.keys(ex.elements ?? {}).filter((k) => k !== "tiles" && k !== "endCard");
  const nTiles = ex.elements?.tiles?.length ?? 0;
  const dim = ex.motion?.dimmedOpacity ?? 0.28;
  let prev: any = {
    parts: Object.fromEntries(parts.map((p) => [p, { opacity: 1, dx: [0, 0] }])),
    tiles: Array(nTiles).fill(0),
    tileSub: -1,
    end: 0,
  };
  const word = (v: string) => (v === "dimmed" ? dim : v === "hidden" ? 0 : v === "shown" ? 1 : null);
  return (ex.scenes ?? []).map((s: any, i: number) => {
    const f: any = {
      parts: Object.fromEntries(parts.map((p) => [p, { opacity: prev.parts[p].opacity === 0 ? 0 : 1, dx: [prev.parts[p].dx[1], prev.parts[p].dx[1]] }])),
      tiles: [...prev.tiles],
      tileSub: -1,
      end: prev.end,
    };
    for (const [k, v] of Object.entries<any>(s.state ?? {})) {
      if (k === "tiles") {
        const hi = typeof v === "string" ? v.match(/^(\d+) highlighted, others dimmed$/) : null;
        if (v === "hidden") f.tiles.fill(0);
        else if (v === "all shown") f.tiles.fill(1);
        else if (hi) f.tiles = f.tiles.map((_: number, j: number) => (j === Number(hi[1]) ? 1 : dim));
        else warnings.push(`Scene ${i}: don't know how to show tiles "${v}"`);
      } else if (k === "tileSub") {
        f.tileSub = Number(v);
      } else if (k === "end") {
        const w = word(v);
        if (w === null) warnings.push(`Scene ${i}: end "${v}"`); else f.end = w;
      } else if (k === "everything else" && v === "hidden") {
        parts.forEach((p) => (f.parts[p].opacity = 0));
        f.tiles.fill(0);
      } else if (k === "sound") {
        // Audio timing comes from explainer.audio.
      } else if (parts.includes(k)) {
        if (typeof v === "string") {
          const w = word(v);
          if (w === null) warnings.push(`Scene ${i}: ${k} "${v}"`); else f.parts[k].opacity = w;
        } else if (typeof v?.x === "string") {
          const mv = v.x.match(/^(-?\d+(?:\.\d+)?)\s*->\s*(-?\d+(?:\.\d+)?)/);
          if (mv) f.parts[k].dx = [Number(mv[1]), Number(mv[2])];
          else warnings.push(`Scene ${i}: ${k} x "${v.x}"`);
        }
      } else {
        warnings.push(`Scene ${i}: unknown state "${k}"`);
      }
    }
    prev = f;
    return { ...s, frame: f };
  });
}

// --- Chai cards → news candidates -------------------------------------------------------------

const examTypeOf = (chip: string | undefined) =>
  /both|दोनों/i.test(chip ?? "") ? "both" : /mains|मुख्य|मेन्स/i.test(chip ?? "") ? "mains" : "prelims";

function cardText(l: any) {
  const ec = l?.examCorner;
  return {
    chips: l.lensChips ?? [],
    headline: l.headline ?? "",
    summary: l.summary ?? "",
    whyForUpsc: l.whyItMatters ?? [],
    mcq: ec?.type === "mcq" ? {
      question: ec.question,
      options: ec.options,
      answerIndex: ec.answerIndex,
      explanation: String(ec.feedbackRight ?? "").replace(/^(Right|सही)[.।]\s*/, ""),
    } : null,
    mainsPrompt: ec?.mainsPrompt ?? null,
    keyFacts: l.keyFacts ?? [],
    chotu: l.chotuJoke ?? null,
    takeaway: l.takeaway ?? null,
  };
}

/** chai-pack@1 card → the app's NewsItem, with the extra zones (illustration, takeaway). */
export function chaiToNewsItem(c: any, pack: string, day: string) {
  const tone = String(c.tone ?? "neutral").toLowerCase();
  const en = cardText(c.en);
  const chips = en.chips;
  const item: any = {
    id: `${day}-${c.id}`,
    tone,
    gsPaper: chips[0] ?? "GS",
    topic: chips[1] ?? "",
    examType: examTypeOf(chips[2]),
    staticLink: chips[3] ?? "",
    chips,
    headline: en.headline,
    summary: en.summary,
    whyForUpsc: en.whyForUpsc,
    examCorner: { mcq: en.mcq, mainsPrompt: en.mainsPrompt, keyFacts: en.keyFacts, pyq: c.pyq ?? null },
    sources: c.sources ?? [],
    chotu: tone === "light" ? en.chotu : null,
    takeaway: en.takeaway,
    illustration: media(pack, c.illustration),
    shareable: c.shareable !== false && tone !== "tragic",
    writtenBy: "editors",
  };
  if (c.hi) {
    const hi = cardText(c.hi);
    item.hi = { ...hi, chotu: tone === "light" ? hi.chotu : null };
  }
  return item;
}

async function upsertCard(env: Env, pack: string, day: string, c: any, position: number) {
  const card = chaiToNewsItem(c, pack, day);
  const id = card.id.replace(/[^\w-]/g, "-");
  const text = [card.headline, card.summary, ...card.whyForUpsc, card.hi?.headline, card.hi?.summary].filter(Boolean).join("\n");
  const flags = [`From pack ${pack}: ${c.review?.note ?? "draft"}`, ...autoChecks(card, text)];
  const old = await env.DB.prepare("SELECT card_json FROM candidates WHERE id = ?").bind(id).first<{ card_json: string }>();
  if (old?.card_json === JSON.stringify(card)) return "unchanged";
  if (old) {
    await env.DB.prepare(
      `UPDATE candidates SET card_json = ?, title = ?, source_text = ?, flags = ?, status = 'draft',
       en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL WHERE id = ?`,
    ).bind(JSON.stringify(card), card.headline, text, JSON.stringify(flags), id).run();
    return "updated, approvals cleared";
  }
  await env.DB.prepare(
    `INSERT INTO candidates (id, day, source_name, source_url, title, source_text, score, card_json, flags, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 100, ?, ?, ?, ?)`,
  ).bind(id, day, `Content pack ${pack}`, "", card.headline, text, JSON.stringify(card), JSON.stringify(flags), position, new Date().toISOString()).run();
  return "added as a draft";
}

// --- Library items ----------------------------------------------------------------------------

export function titleOf(kind: string, d: any): string {
  const t = d.title?.en ?? d.place?.en ?? d.name?.en ?? d.question?.en ?? d.lead?.en ?? d.claims?.[0]?.en?.claim ?? d.text?.en?.start ?? (d.en?.person ? `${d.en.person}: ${d.en.when ?? "a day"}` : undefined);
  return String(t ?? `${kind} ${d.id}`).slice(0, 140);
}

/**
 * Mock papers written from the template (stem, statements, ask, options, why and one shared `answer`) become
 * the shape the apps play: {topic, en: {question, options, answerIndex, explanation}, hi: {...}}. Papers already
 * in that shape pass through. `timer` ({default: "off", counts: "up"}) is kept: such a paper never counts down,
 * and `minutes` is then only the suggested time (1.2 minutes a question unless the paper gives one).
 */
/** Readable topics for syllabus node ids the template uses; others become "Some words" from the id. */
const NODE_NAMES: Record<string, string> = {
  "pol-fd": "Fundamental Duties", "pol-fr": "Fundamental Rights", "pol-dpsp": "Directive Principles", "pol-pm-com": "PM and Council of Ministers",
  "pol-state-exec": "State executive", "pol-const-bodies": "Constitutional bodies", "pol-federal": "Federalism", "pol-fiscal": "Centre-state finances",
  "pol-local": "Local government", "pol-statutory": "Statutory bodies", "pol-history": "Constitutional history", "pol-comparison": "Borrowed features",
  "pol-features": "Features and Preamble",
};

export function normalizeMock(d: any): any {
  if (!Array.isArray(d?.questions)) return d;
  const roman = ["I", "II", "III", "IV"];
  const lang = (m: any, l: string, format: string) => {
    if (!m || "question" in m) return m;
    const st: string[] = (m.statements ?? []).filter((s: any) => String(s ?? "").trim());
    const labelled = st.some((s) => /^\s*([A-Z0-9]{1,2}[.)]|Statement|कथन)/.test(s));
    const lines = st.map((s, i) => labelled ? s
      : format.startsWith("statement-i") ? `${l === "hi" ? "कथन" : "Statement"} ${roman[i] ?? i + 1}: ${s}` : `${i + 1}. ${s}`);
    return { question: [m.stem, ...lines, m.ask].filter((x) => String(x ?? "").trim()).join("\n"), options: m.options ?? [], explanation: m.why ?? "" };
  };
  d.questions = d.questions.map((q: any) => {
    if (q.en && "question" in q.en) return q;
    const topic = q.topic ?? NODE_NAMES[q.node] ?? (q.node ? String(q.node).replace(/^[a-z]+-/, "").replace(/-/g, " ").replace(/^./, (c: string) => c.toUpperCase()) : "");
    const out: any = { topic, format: q.format, difficulty: q.difficulty };
    for (const l of Object.keys(q)) {
      if (q[l] && typeof q[l] === "object" && !Array.isArray(q[l]) && ("stem" in q[l] || "options" in q[l])) out[l] = { ...lang(q[l], l, q.format ?? ""), answerIndex: q.answer };
    }
    return out;
  });
  if (!(d.minutes > 0)) d.minutes = Math.ceil(d.questions.length * 1.2);
  if (d.marking && d.marking.blank === 0) delete d.marking.blank;
  if (!d.note) d.note = { en: "Practice paper written by our editors. Not an official UPSC paper.", hi: "हमारे संपादकों का अभ्यास पेपर। यह UPSC का आधिकारिक पेपर नहीं है।" };
  return d;
}

/**
 * A long read written from the long-read template ({ en: { dek, sections: [{ head, body }], keyFacts, examAngle, debate,
 * selfCheck }, hi: {...} }) in the reader's shape: sections per language with headings, the self-check as recall
 * prompts, and the key facts, exam angle and debate as closing sections. Items already in the reader's shape pass through.
 */
export function normalizeRead(d: any): any {
  if (!d?.en?.sections || d.sections) return d;
  const heads: Record<string, [string, string, string]> = { en: ["Key facts", "How the exam uses it", "Both sides"], hi: ["मुख्य तथ्य", "परीक्षा में कैसे आता है", "दोनों पक्ष"] };
  const sections: Record<string, any[]> = {}, recall: Record<string, string[]> = {}, dek: Record<string, string> = {};
  for (const l of Object.keys(d)) {
    const v = d[l];
    if (!v || typeof v !== "object" || Array.isArray(v) || !Array.isArray(v.sections)) continue;
    const [kf, ea, db] = heads[l] ?? heads.en;
    sections[l] = [
      ...v.sections.map((s: any) => ({ heading: String(s.head ?? s.heading ?? ""), body: String(s.body ?? "") })),
      v.keyFacts?.length && { heading: kf, body: v.keyFacts.map((x: string) => "• " + x).join("\n\n") },
      v.examAngle && { heading: ea, body: String(v.examAngle) },
      v.debate && { heading: db, body: String(v.debate) },
    ].filter(Boolean);
    recall[l] = (v.selfCheck ?? []).map(String);
    if (v.dek) dek[l] = String(v.dek);
    delete d[l];
  }
  d.sections = sections;
  d.recall = recall;
  if (Object.keys(dek).length) d.dek = dek;
  d.topic ??= NODE_NAMES[d.node] ?? (d.node ? String(d.node).replace(/^[a-z]+-/, "").replace(/-/g, " ").replace(/^./, (c: string) => c.toUpperCase()) : "");
  return d;
}

/** Cheap checks shown to the editor as flags. They never block approval. */
export function checkItem(kind: string, d: any): string[] {
  if (ENGINE_KINDS[kind]) return [...checkPlay(kind, d), ...engineTextFlags(d)];
  const flags: string[] = [];
  const missingHi: string[] = [];
  const walk = (n: any, path: string) => {
    if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (!n || typeof n !== "object") return;
    if ("en" in n && !("hi" in n)) missingHi.push(path || "top");
    for (const [k, v] of Object.entries(n)) if (k !== "review") walk(v, path ? `${path}.${k}` : k);
  };
  walk(d, "");
  if (missingHi.length) flags.push(`No Hindi for: ${missingHi.slice(0, 5).join(", ")}`);
  const qs = kind === "quiz" || kind === "mock" ? d.questions ?? [] : [];
  qs.forEach((q: any, i: number) => {
    for (const l of ["en", "hi"]) {
      const m = q[l];
      if (m && !(m.answerIndex >= 0 && m.answerIndex < (m.options?.length ?? 0))) flags.push(`Question ${i + 1} (${l}): answer is out of range`);
    }
    if (q.en && q.hi && q.en.answerIndex !== q.hi.answerIndex) flags.push(`Question ${i + 1}: English and Hindi answers differ`);
  });
  if (kind === "match" && (d.pairs?.length ?? 0) < (d.roundSize ?? 6)) flags.push("Fewer pairs than one round needs");
  if (kind === "debate" && ((d.for?.en?.length ?? 0) < 2 || (d.against?.en?.length ?? 0) < 2)) flags.push("Two Sides needs at least 2 points each way");
  if (kind === "explainer" && !(d.scenes?.length > 0)) flags.push("No scenes");
  if (kind === "winddown") d.shareable = false;
  const count = (n: any) => (Array.isArray(n) ? n.length : 0);
  if (kind === "scratch" && count(d.cards) < 1) flags.push("Add at least one card to scratch");
  if (kind === "trail" && count(d.stations) < 2) flags.push("A stamp trail needs at least 2 stations");
  if (kind === "radio" && (count(d.stations) < 2 || count(d.stations) > 4)) flags.push("Radio needs 2 to 4 stations");
  if (kind === "assemble" && count(d.pieces) < 3) flags.push("Snap together needs at least 3 pieces");
  if (kind === "chain" && count(d.links) < 3) flags.push("A domino chain needs at least 3 links");
  if (kind === "thennow") {
    if (!(d.from?.year < d.to?.year)) flags.push("Then and now: the first year must come before the second");
    (d.metrics ?? []).forEach((x: any, i: number) => {
      if (typeof x.from !== "number" || typeof x.to !== "number") flags.push(`Metric ${i + 1} needs both real data points`);
    });
  }
  if (kind === "postcard" && count(d.facts?.en) !== count(d.facts?.hi)) flags.push("English and Hindi have different numbers of facts");
  if (kind === "quote") {
    // Approving a quote is the check against the named edition (playbook C18).
    if (!d.text?.en?.trim()) flags.push("The quote is empty");
    if ((d.text?.en ?? "").split(/\s+/).length > 40) flags.push("Keep a quote to a sentence or two");
    if (!d.author || !d.source || !d.edition) flags.push("Add the author, book and the edition you checked it against");
    if (!QUOTE_MOMENTS.includes(d.useFor)) flags.push("Pick a moment: " + QUOTE_MOMENTS.join(", "));
    d.shareable = false;
  }
  if (kind === "mock") {
    // A mock paper: timed, with UPSC-style negative marking. Approval means every answer was checked.
    if (count(d.questions) < 10) flags.push(`Only ${count(d.questions)} questions; a mock needs at least 10`);
    if (!(d.minutes > 0)) flags.push("Set the time in minutes");
    if (!(d.marking?.right > 0) || !(d.marking?.wrong <= 0)) flags.push("Set marks for right (positive) and wrong (zero or negative)");
    (d.questions ?? []).forEach((q: any, i: number) => { if (!q.en?.explanation?.trim()) flags.push(`Question ${i + 1} has no explanation`); });
    d.shareable = false;
  }
  if (kind === "read") {
    if (count(d.sections?.en) < 1) flags.push("Add at least one section");
    if (count(d.sections?.en) !== count(d.sections?.hi)) flags.push("English and Hindi have different numbers of sections");
    if (!d.sources?.en?.trim()) flags.push("Add the sources");
  }
  if (kind === "calm") {
    // Playbook G: calm never replaces help, and sound makes no health claims.
    if (!d.support?.en?.trim()) flags.push("Add the support line (the helpline comes first)");
    if (!(d.minutes > 0 && d.minutes <= 10)) flags.push("Keep a calm script between 1 and 10 minutes");
    if (d.pace && [d.pace.inhale, d.pace.exhale].some((n: any) => !(n > 0 && n <= 10))) flags.push("Breath pace needs inhale and exhale in seconds (1 to 10)");
    const claim = /brain ?waves?|alpha|theta|cure|heal|treat|anxiety disorder|depression|insomnia|guaranteed/i;
    if (claim.test(JSON.stringify(d.beats ?? []) + JSON.stringify(d.title ?? {}))) flags.push("Remove health or brainwave claims");
    d.shareable = false;
  }
  if (kind === "routine") {
    if (count(d.en?.blocks) < 3) flags.push("A routine card needs at least 3 blocks");
    if (!d.en?.dontCopy?.trim()) flags.push("Say what not to copy (their life isn't yours)");
    if (!d.sources?.length && !d.sources?.en) flags.push("Add the sources for this routine");
  }
  if (String(d.tone ?? "").toUpperCase() === "TRAGIC") {
    delete d.sounds;
    d.shareable = false;
  }
  return flags;
}

/** Approves one language beyond English and Hindi, once its translation is complete and English is approved. */
async function approveLanguage(env: Env, s: Staff, row: LibraryRow, lang: string, editor: string,
  version: (json: string, what: string) => Promise<void>): Promise<Response> {
  if (!can(s, `approve:${lang}`)) return bad(`Only a ${langName(lang)} editor can approve the ${langName(lang)}.`, 403);
  if (!row.en_editor) return bad("Approve the English first.");
  const trs = rowTranslations(row);
  const tr = trs[lang];
  if (!tr) return bad(`There's no ${langName(lang)} for this item yet.`);
  const { play: _p, ...base } = JSON.parse(row.json);
  const errors = PT.validateTranslation(base, tr, null).errors;
  if (errors.length) return bad(`Fix the ${langName(lang)} first: ${errors.slice(0, 3).join("; ")}`);
  const a = rowApprovals(row);
  a[lang] = { by: editor, on: istDay() };
  tr.review = { ...tr.review, status: "approved", checkedBy: editor, checkedOn: istDay() };
  await env.DB.prepare("UPDATE library SET approvals = ?, translations = ? WHERE id = ?").bind(JSON.stringify(a), JSON.stringify(trs), row.id).run();
  await version(row.json, `approve ${lang} (${editor})`);
  return json({ ok: true });
}

/**
 * Attaches a translation file (upsc-pods/translation@1) to the library item it names. It lands as a draft:
 * that language's approval is cleared and its problems are flagged for the language editor.
 */
export async function attachTranslation(env: Env, tr: any): Promise<{ ok: boolean; message: string; id?: string }> {
  if (tr?.schema !== "upsc-pods/translation@1" || !isLang(tr.lang) || INPACK.includes(tr.lang) || !tr.pack?.id || !tr.strings)
    return { ok: false, message: "not a translation file (upsc-pods/translation@1, for a language other than English or Hindi)" };
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT * FROM library WHERE id LIKE ?").bind(`%:${tr.pack.id}`).all<LibraryRow>();
  const row = results.find((r) => JSON.parse(r.json).id === tr.pack.id);
  if (!row) return { ok: false, message: `no library item ${tr.pack.id} yet; import its English first` };
  const data = JSON.parse(row.json);
  if (tr.pack.schema && data.schema && tr.pack.schema !== data.schema) return { ok: false, message: `it's for ${tr.pack.schema}, but ${row.id} is ${data.schema}` };
  const { play: _p, sounds: _s, ...base } = data;
  const v = PT.validateTranslation(base, tr, null);
  const name = langName(tr.lang);
  const trs = rowTranslations(row), approvals = rowApprovals(row);
  trs[tr.lang] = { ...tr, review: { ...(tr.review ?? {}), status: "draft", checkedBy: null, checkedOn: null } };
  delete approvals[tr.lang];
  const flags = (JSON.parse(row.flags) as string[]).filter((f) => !f.replace(/^Check: /, "").startsWith(name + ":"));
  flags.push(...v.errors.map((x: string) => `${name}: ${x}`), ...v.warnings.map((x: string) => `Check: ${name}: ${x}`));
  await env.DB.prepare("UPDATE library SET translations = ?, approvals = ?, flags = ? WHERE id = ?")
    .bind(JSON.stringify(trs), JSON.stringify(approvals), JSON.stringify([...new Set(flags)]), row.id).run();
  const n = Object.keys(tr.strings).length;
  return { ok: true, id: row.id, message: `${name} added to ${row.id} (${n} texts${v.errors.length ? `, ${v.errors.length} to fix` : ""}); needs a ${name} editor` };
}

/** Flags for translations whose English has changed since: those strings fall back to English until redone. */
export function staleFlags(data: any, trs: Record<string, Translation>): string[] {
  const { play: _p, ...base } = data;
  return Object.values(trs).flatMap((tr) => {
    const n = PT.englishStrings(base).filter((x) => tr.strings[x.path]?.en !== x.en).length;
    return n ? [`${langName(tr.lang)}: ${n} text${n > 1 ? "s need" : " needs"} translating again (English changed)`] : [];
  });
}

export async function upsertItem(env: Env, kind: string, pack: string | null, data: any, flags: string[], who = "Pack import") {
  const id = `${kind}:${data.id}`;
  const now = new Date().toISOString();
  const body = JSON.stringify(data);
  const old = await env.DB.prepare("SELECT json FROM library WHERE id = ?").bind(id).first<{ json: string }>();
  if (old?.json === body) return "unchanged";
  if (old) {
    await env.DB.prepare(
      `UPDATE library SET json = ?, title = ?, flags = ?, pack = ?, status = 'draft', en_editor = NULL, en_checked_on = NULL,
       hi_editor = NULL, hi_checked_on = NULL, approvals = NULL, updated_at = ? WHERE id = ?`,
    ).bind(body, titleOf(kind, data), JSON.stringify(flags), pack, now, id).run();
    await recordVersion(env, "library", id, body, pack ? `import ${pack}` : "update", who);
    return "updated, approvals cleared";
  }
  await env.DB.prepare(
    "INSERT INTO library (id, kind, pack, title, json, flags, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)",
  ).bind(id, kind, pack, titleOf(kind, data), body, JSON.stringify(flags), now).run();
  await recordVersion(env, "library", id, body, pack ? `import ${pack}` : "new", who);
  return "added as a draft";
}

// --- Templates for writing new items on the desk ----------------------------------------------

const en_hi = (en: string, hi = "") => ({ en, hi });
const REVIEW = { status: "draft", checkedBy: null, checkedOn: null, note: "Written on the desk." };

const CARD_TEMPLATE = {
  id: "",
  tone: "neutral",
  gsPaper: "GS2",
  topic: "Polity",
  examType: "prelims",
  staticLink: "Article ...",
  chips: ["GS2", "Polity", "Prelims", "Article ..."],
  headline: "",
  summary: "",
  whyForUpsc: ["", ""],
  examCorner: { mcq: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }, mainsPrompt: null, keyFacts: [], pyq: null },
  sources: [{ name: "", url: "https://" }],
  chotu: null,
  takeaway: "",
  illustration: null,
  shareable: true,
  writtenBy: "editors",
  hi: {
    chips: ["GS2", "राजव्यवस्था", "प्रारंभिक", "अनुच्छेद ..."],
    headline: "", summary: "", whyForUpsc: ["", ""],
    mcq: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" },
    mainsPrompt: null, keyFacts: [], chotu: null, takeaway: "",
  },
};

const TEMPLATES: Record<string, any> = {
  timeline: {
    schema: "upsc-pods/timeline@1", id: "", title: en_hi(""), illustration: null,
    events: [{ date: "1950-01-26", key: true, en: { title: "", body: "" }, hi: { title: "", body: "" } }],
    review: REVIEW,
  },
  match: {
    schema: "upsc-pods/match-game@1", id: "", roundSize: 6,
    pairs: Array.from({ length: 6 }, () => ({ article: "", en: "", hi: "" })),
    review: REVIEW,
  },
  quiz: {
    schema: "upsc-pods/quiz-pack@1", id: "",
    questions: [{ en: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }, hi: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" } }],
    review: REVIEW,
  },
  map: {
    schema: "upsc-pods/map-card@1", id: "", base: "/media/... (upload a schematic SVG with no national borders)",
    canvas: { width: 320, height: 220 }, lead: en_hi(""),
    pins: [{ id: "a", x: 100, y: 100, en: { label: "", fact: "" }, hi: { label: "", fact: "" } }],
    find: { prompt: en_hi("Find it: tap ..."), target: { shape: "ellipse", cx: 160, cy: 110, rx: 16, ry: 10 }, hint: en_hi(""), right: en_hi("") },
    review: REVIEW,
  },
  number: {
    schema: "upsc-pods/number-card@1", id: "", value: 0, unit: en_hi(""), lead: en_hi(""),
    chart: { type: "bars", axisStart: 0, axisEnd: 100, reference: null, bars: [{ en: "", hi: "", v: 0, hero: true }] },
    whatItMeans: { en: [""], hi: [""] }, sources: en_hi("Sources: "),
    review: REVIEW,
  },
  myth: {
    schema: "upsc-pods/myth-card@1", id: "",
    verdictLabels: { en: { MYTH: "MYTH", FACT: "FACT", HALF: "HALF-TRUE" }, hi: { MYTH: "झूठ", FACT: "सच", HALF: "आधा सच" } },
    claims: [{ verdict: "MYTH", en: { claim: "", correction: "" }, hi: { claim: "", correction: "" } }],
    source: en_hi(""),
    review: REVIEW,
  },
  debate: {
    schema: "upsc-pods/two-sides@1", id: "", paper: "GS2", question: en_hi(""),
    for: { en: ["", ""], hi: ["", ""] }, against: { en: ["", ""], hi: ["", ""] }, outline: { en: ["Introduction: ", "Body: ", "Way forward: "], hi: ["भूमिका: ", "मुख्य भाग: ", "आगे का रास्ता: "] },
    sources: en_hi(""),
    review: REVIEW,
  },
  explainer: {
    schema: "upsc-pods/explainer@1", id: "", title: en_hi("Ek Minute · ", "एक मिनट · "), staticLink: "", linkedFromChips: [],
    tone: "NEUTRAL", canvas: { width: 360, height: 400 },
    elements: { tiles: [{ x: 22, y: 124, w: 150, h: 96, icon: "check", label: en_hi(""), sub: null }], endCard: { x: 22, y: 124, w: 316, h: 206, title: en_hi(""), subtitle: en_hi("Ek Minute · UPSC Pods", "एक मिनट · UPSC Pods") } },
    motion: { dimmedOpacity: 0.28 },
    audio: { bed: null, motif: null, narration: null },
    scenes: [{ index: 0, seconds: 6, caption: en_hi(""), state: { tiles: "all shown", end: "hidden" } }],
    review: REVIEW,
  },
  sound: {
    schema: "upsc-pods/sound@1", id: "", name: en_hi(""), about: en_hi(""), seconds: 36, loop: true,
    files: { ogg: "/media/... (upload)", m4a: "/media/... (upload)" },
    review: REVIEW,
  },
  scratch: {
    schema: "upsc-pods/scratch-card@1", id: "", tone: "NEUTRAL", title: en_hi("Scratch the stain", "दाग़ खुरचिए"), texture: "chai-stain",
    mood: { bed: null, sfx: true, motion: "gentle" }, sfx: { scrape: "sfx/scrape", reveal: "sfx/chime" },
    cards: [{ en: { tease: "", answer: "", detail: "" }, hi: { tease: "", answer: "", detail: "" } }],
    sources: en_hi(""), review: REVIEW,
  },
  trail: {
    schema: "upsc-pods/stamp-trail@1", id: "", tone: "NEUTRAL", title: en_hi(""), item: en_hi("Bill", "विधेयक"),
    mood: { bed: null, sfx: true, motion: "crisp" }, sfx: { move: "sfx/whoosh", stamp: "sfx/stamp", end: "motif" },
    stations: [1, 2].map(() => ({ en: { name: "", stamp: "", rule: "" }, hi: { name: "", stamp: "", rule: "" } })),
    takeaway: en_hi(""), sources: en_hi(""), review: REVIEW,
  },
  radio: {
    schema: "upsc-pods/radio@1", id: "", tone: "LIGHT", title: en_hi("Chai stall radio", "चाय की टपरी का रेडियो"), desk: en_hi(""),
    mood: { bed: "static", sfx: true, motion: "gentle" }, sfx: { tune: "sfx/tune", end: "motif" },
    stations: [92.7, 98.3].map((freq) => ({ freq, en: { callsign: "", lines: ["", ""] }, hi: { callsign: "", lines: ["", ""] } })),
    signoff: en_hi(""), sources: en_hi(""), review: REVIEW,
  },
  assemble: {
    schema: "upsc-pods/assemble@1", id: "", tone: "NEUTRAL", title: en_hi(""), prompt: en_hi("Put these in order.", "इन्हें सही क्रम में रखिए।"),
    mood: { bed: null, sfx: true, motion: "crisp" }, sfx: { pick: "sfx/tap", snap: "sfx/snap", wrong: "sfx/nudge", done: "sfx/chime" },
    pieces: [1, 2, 3].map(() => ({ en: { text: "", note: "" }, hi: { text: "", note: "" } })),
    explain: en_hi(""), sources: en_hi(""), review: REVIEW,
  },
  chain: {
    schema: "upsc-pods/chain@1", id: "", tone: "NEUTRAL", title: en_hi(""),
    mood: { bed: null, sfx: true, motion: "crisp" }, sfx: { fall: "sfx/domino", end: "sfx/chime" },
    links: [1, 2, 3].map(() => en_hi("")),
    breakIt: { en: { question: "Where can policy soften this chain?", answer: "" }, hi: { question: "नीति इस कड़ी को कहाँ कमज़ोर कर सकती है?", answer: "" } },
    sources: en_hi(""), review: REVIEW,
  },
  thennow: {
    schema: "upsc-pods/then-now@1", id: "", tone: "NEUTRAL", title: en_hi(""),
    mood: { bed: null, sfx: true, motion: "gentle" }, sfx: { tick: "sfx/tick", end: "sfx/chime" },
    from: { year: 1951 }, to: { year: 2011 },
    metrics: [{ en: { label: "", unit: "" }, hi: { label: "", unit: "" }, from: 0, to: 0, max: 100 }],
    takeaway: en_hi(""), note: en_hi(""), sources: en_hi(""), review: REVIEW,
  },
  postcard: {
    schema: "upsc-pods/postcard@1", id: "", tone: "NEUTRAL", place: en_hi(""), greeting: en_hi("Greetings from ", " से नमस्ते"), stamp: en_hi(""),
    scape: "waves", mood: { bed: "scape", sfx: true, motion: "gentle" }, sfx: { flip: "sfx/page", stamp: "sfx/stamp" },
    facts: { en: ["", "", ""], hi: ["", "", ""] }, sources: en_hi(""), review: REVIEW,
  },
  mock: {
    schema: "upsc-pods/mock-paper@1", id: "", title: en_hi(""), paper: "GS1", minutes: 120,
    // UPSC Prelims: GS1 is +2 / -0.66 per question; CSAT is +2.5 / -0.83.
    marking: { right: 2, wrong: -0.66 },
    note: en_hi("Practice paper written by our editors. Not an official UPSC paper.", "हमारे संपादकों का अभ्यास पेपर। यह UPSC का आधिकारिक पेपर नहीं है।"),
    questions: [{ topic: "", en: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" }, hi: { question: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" } }],
    review: REVIEW,
  },
  read: {
    schema: "upsc-pods/long-read@1", id: "", title: en_hi(""), topic: "", gsPaper: "GS2", minutes: 15,
    sections: { en: [{ heading: "", body: "" }], hi: [{ heading: "", body: "" }] },
    recall: { en: [""], hi: [""] }, sources: en_hi(""), review: REVIEW,
  },
  quote: {
    schema: "upsc-pods/quote@1", id: "", text: en_hi(""), author: "", source: "", chapter: "", edition: "",
    useFor: "night", readMore: null, review: REVIEW,
  },
  winddown: {
    schema: "upsc-pods/winddown@1", id: "", seconds: 120, theme: "always dark",
    audio: { file: null, gain: 0.45, onlyIfSoundOn: true },
    text: { en: { start: "", cue: "", button: "", end: "" }, hi: { start: "", cue: "", button: "", end: "" } },
    review: REVIEW,
  },
};

/** Explainer edits on the desk come back with prose states; compile them again on save. */
export async function prepareEdit(env: Env, kind: string, data: any, warnings: string[] = []) {
  if (kind === "explainer") data.scenes = compileScenes(data);
  if (kind === "mock") normalizeMock(data);
  if (kind === "read") normalizeRead(data);
  if (data.sfx || data.mood?.bed) resolveSounds(data, await latestSfx(env), warnings);
  const play = toPlay(kind, data);
  if (play) data.play = play; else delete data.play;
  return data;
}

/** English text that's still empty, and Hindi that's missing, anywhere in an engine item. */
function engineTextFlags(d: any): string[] {
  let blank = 0, noHindi = 0;
  const empties = (v: any): number =>
    typeof v === "string" ? (v.trim() ? 0 : 1) : Array.isArray(v) ? v.reduce((n, x) => n + empties(x), 0)
      : v && typeof v === "object" ? Object.values(v).reduce<number>((n, x) => n + empties(x), 0) : 0;
  const walk = (v: any) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    if ("en" in v) {
      blank += empties(v.en);
      if (v.hi == null || (typeof v.hi === "string" && !v.hi.trim())) noHindi++;
    }
    for (const [k, x] of Object.entries(v)) if (k !== "play" && k !== "sounds" && k !== "en" && k !== "hi") walk(x);
  };
  walk(d);
  const flags: string[] = [];
  if (blank) flags.push(`${blank} English text${blank > 1 ? "s are" : " is"} still empty`);
  if (noHindi) flags.push(`${noHindi} part${noHindi > 1 ? "s have" : " has"} no Hindi yet`);
  return flags;
}
