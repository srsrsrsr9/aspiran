import { AiBlocked, callClaude } from "./ai";
import { type LibraryRow, checkItem, kindOf, prepareEdit, rowApprovals, rowTranslations, staleFlags, titleOf, upsertItem } from "./content";
import { INPACK, deskLangs, isLang, langName } from "./langs";
import { type Staff, can, label, llmControls, recordVersion } from "./staff";
import { type Env, bad, json } from "./shared";
import PT, { type Translation } from "./vendor/pods-templates.cjs";
import BUNDLE_JSON from "./vendor/templates.json";

/**
 * The desk's Author tab: paste a source (text, a link or a PDF), pick up to three content types, press
 * Generate. Each type is written by Claude with the content team's own prompt, schema and checks
 * (src/vendor/, from content/templates/bundle.json), repaired once if a check fails, then saved as a
 * library draft with every problem flagged by path. Languages beyond English and Hindi are a second
 * pass per draft, translated from the English into the content team's translation-file format.
 *
 * Without a Claude key the same flow works by hand: Copy prompt, paste it into Claude, paste the reply back.
 * Nothing here publishes. Every draft waits for an editor per language, as before.
 */

const BUNDLE = BUNDLE_JSON as any;
const MAX_TYPES = 3;
/** Types that need files the desk can't make here (narration, video, sound beds), or that belong to the news queue. */
const NOT_HERE = new Set(["chai-pack", "explainer", "reel", "radio", "winddown", "narrated-classic"]);

interface TypeInfo { key: string; title: string; family: string; kind: string; translate: boolean; hint: string }
const TYPES: TypeInfo[] = (BUNDLE.registry.types as any[])
  .filter((r) => BUNDLE.types[r.key] && !NOT_HERE.has(r.key) && kindOf(r.schema))
  .map((r) => ({
    key: r.key, title: r.title, family: r.family, kind: kindOf(r.schema)!,
    translate: !["precis", "translate-it", "usage-fix"].includes(r.key),
    hint: String(BUNDLE.types[r.key].brief ?? "").split("\n").find((l: string) => l.trim() && !l.startsWith("#"))?.trim().slice(0, 160) ?? "",
  }));
const TYPE = Object.fromEntries(TYPES.map((t) => [t.key, t]));

// --- Source: text, a link (fetched here) or a PDF ------------------------------------------------

interface Source { text: string; pdf: string | null; from: string }

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?|\[?f[cd])/i;

async function readSource(body: any): Promise<Source | string> {
  const text = String(body.source ?? "").trim();
  if (body.pdf) {
    const pdf = String(body.pdf).replace(/^data:application\/pdf;base64,/, "");
    if (pdf.length > 14_000_000) return "Keep PDFs under about 10 MB.";
    return { text, pdf, from: "PDF" };
  }
  const url = /^https?:\/\/\S+$/i.test(text) ? text : String(body.url ?? "").trim();
  if (url) {
    let u: URL;
    try { u = new URL(url); } catch { return "That link doesn't look right."; }
    if (!/^https?:$/.test(u.protocol) || PRIVATE_HOST.test(u.hostname)) return "Only public http(s) links.";
    const r = await fetch(u.toString(), { headers: { "user-agent": "UPSC-Pods-desk/1.0", accept: "text/html,application/pdf,text/plain" }, signal: AbortSignal.timeout(15_000), redirect: "follow" })
      .catch((e) => e as Error);
    if (r instanceof Error || !r.ok) return `Couldn't open the link${r instanceof Error ? "" : ` (${r.status})`}. Paste the text instead.`;
    const type = r.headers.get("content-type") ?? "";
    if (type.includes("pdf")) {
      const bytes = new Uint8Array(await r.arrayBuffer());
      if (bytes.length > 10_000_000) return "That PDF is over 10 MB.";
      let bin = "";
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { text: "", pdf: btoa(bin), from: u.toString() };
    }
    const raw = (await r.text()).slice(0, 2_000_000);
    const plain = type.includes("html") ? htmlToText(raw) : raw;
    if (plain.length < 200) return "That page had almost no text (it may need a login or JavaScript). Paste the text instead.";
    return { text: plain.slice(0, 60_000), pdf: null, from: u.toString() };
  }
  if (text.length < 80) return "Paste a bit more: a paragraph or two at least.";
  return { text: text.slice(0, 60_000), pdf: null, from: "pasted text" };
}

function htmlToText(html: string): string {
  const main = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  return main
    .replace(/<(script|style|noscript|svg|nav|footer|header|aside|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h\d|li|tr|br)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

// --- Prompts --------------------------------------------------------------------------------

function jobFor(key: string, src: Source, notes: string) {
  const t = BUNDLE.types[key];
  const fill = PT.fillSchema(t.schema, t.config);
  const prompt = PT.buildPrompt(
    { system: BUNDLE.systemPrompt, brief: t.brief, title: TYPE[key].title },
    { source: src.pdf ? (src.text ? src.text + "\n\n" : "") + "(The source is the attached PDF.)" : src.text, config: t.config, notes },
  );
  return { t, fill, prompt, api: PT.apiSchema(fill) };
}

/** One block to paste into Claude when the server has no key. */
const pasteable = (system: string, user: string, schema: unknown) =>
  `${system}\n\n---\n\n${user}\n\nReply with one JSON object only, matching this JSON schema:\n${JSON.stringify(schema)}`;

const parseReply = (reply: unknown): any => {
  if (reply && typeof reply === "object") return reply;
  const t = String(reply ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  return JSON.parse(a >= 0 && b > a ? t.slice(a, b + 1) : t);
};

const repairNote = (errors: string[]) =>
  `Your JSON has these problems:\n${errors.map((e) => "- " + e).join("\n")}\n\nFix them and return the whole JSON object again. Keep every fact from the source; shorten wording to meet word limits.`;

// --- Writing with Claude ----------------------------------------------------------------------

async function writeWithClaude(env: Env, key: string, src: Source, notes: string) {
  const job = jobFor(key, src, notes);
  const first: any[] = src.pdf
    ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: src.pdf } }, { type: "text", text: job.prompt.user }]
    : [{ type: "text", text: job.prompt.user }];
  const messages: any[] = [{ role: "user", content: first }];
  let fill: any = null, errors: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { message, text } = await callClaude(env, "author", { system: job.prompt.system, messages, schema: job.api });
    if (message.stop_reason === "refusal") throw new Error("Claude declined to write this one");
    if (message.stop_reason === "max_tokens") throw new Error("The reply ran out of room; try a shorter source");
    try { fill = JSON.parse(text); errors = PT.validate(fill, job.fill, { generated: true }).errors; } catch { fill = null; errors = ["The reply was not valid JSON."]; }
    if (!errors.length || attempt === 2) break;
    // Append-only repair turn: the reply goes back unchanged, then the list of problems.
    messages.push({ role: "assistant", content: message.content }, { role: "user", content: repairNote(errors) });
  }
  if (!fill) throw new Error(errors[0] ?? "No reply");
  return finishPack(key, fill, src, { generator: "desk author", model: (await llmControls(env)).authorModel });
}

/** fill -> full pack, checked against the template and the source. */
function finishPack(key: string, fill: any, src: Source, provenance: Record<string, unknown>) {
  const t = BUNDLE.types[key];
  const pack = PT.assemble(key, fill, t.config);
  pack.id = `${String(pack.id || key).replace(/[^\w-]/g, "-").slice(0, 50)}-${Date.now().toString(36)}`;
  pack.provenance = { ...provenance, template: key, createdOn: new Date().toISOString().slice(0, 10), from: src.from,
    // Kept so later edits are checked against the same source. Never sent to phones.
    source: src.text.slice(0, 60_000) };
  const r = PT.validate(pack, t.schema, { generated: true, source: src.pdf ? undefined : src.text });
  const flags = [...r.errors, ...r.warnings.map((w) => "Check: " + w)];
  if (src.pdf) flags.push("Check: numbers weren't matched against the PDF automatically; check them by eye");
  return { pack, flags };
}

async function translateWithClaude(env: Env, key: string, pack: any, lang: string): Promise<{ tr: Translation; flags: string[] }> {
  const base = translatable(pack);
  const p = PT.buildTranslationPrompt(base, lang, BUNDLE.translatePrompt, BUNDLE.languageNotes[lang] ?? "", BUNDLE.types[key].schema);
  const { message, text } = await callClaude(env, "author", { system: p.system, messages: [{ role: "user", content: p.user }], schema: p.schema });
  if (message.stop_reason !== "end_turn") throw new Error(`The ${langName(lang)} reply stopped early (${message.stop_reason})`);
  return checkTranslation(key, pack, PT.makeTranslation(base, lang, JSON.parse(text), { generator: "desk author", model: (await llmControls(env)).authorModel }));
}

/** The pack without the parts that are built from it (play, sounds) or private (the source). */
function translatable(pack: any) {
  const { play: _p, sounds: _s, ...base } = pack;
  if (base.provenance) base.provenance = { ...base.provenance, source: undefined };
  return base;
}

function checkTranslation(key: string, pack: any, tr: Translation) {
  const v = PT.validateTranslation(translatable(pack), tr, BUNDLE.types[key].schema, { generated: true });
  const name = langName(tr.lang);
  return { tr, flags: [...v.errors.map((e) => `${name}: ${e}`), ...v.warnings.map((w) => `Check: ${name}: ${w}`)] };
}

// --- Saving and showing drafts -----------------------------------------------------------------

async function saveDraft(env: Env, key: string, pack: any, flags: string[], who: string, trs: Record<string, Translation> = {}) {
  const kind = TYPE[key].kind;
  await prepareEdit(env, kind, pack);
  await upsertItem(env, kind, null, pack, [`Written in Author (${TYPE[key].title})`, ...flags, ...checkItem(kind, pack)], who);
  const id = `${kind}:${pack.id}`;
  if (Object.keys(trs).length) await env.DB.prepare("UPDATE library SET translations = ? WHERE id = ?").bind(JSON.stringify(trs), id).run();
  return id;
}

const parsePath = (p: string) => [...p.matchAll(/\.([^.[\]]+)|\[(\d+)\]/g)].map((m) => (m[1] !== undefined ? m[1] : Number(m[2])));
const getAt = (o: any, segs: (string | number)[]) => segs.reduce((a, k) => (a == null ? undefined : a[k]), o);
function setAt(o: any, segs: (string | number)[], v: unknown) {
  const last = segs[segs.length - 1];
  const holder = getAt(o, segs.slice(0, -1));
  if (holder == null || typeof holder !== "object") throw new Error("No such field");
  holder[last] = v;
}
/** $.a.en.b[2] -> $.a.hi.b[2] */
const inLang = (path: string, lang: string) => path.replace(/\.en(?=\.|\[|$)/, "." + lang);
/** Any language's path, or a translation file's $.strings["..."] key, back to the English path. */
const toEnglishPath = (p: string) => {
  const s = p.match(/^\$\.strings\["(.+?)"\]/)?.[1];
  return s ?? p.replace(/^(\$[^ :]*?)\.(hi|te|mr|ta|bn|kn)(?=\.|\[|:|$)/, "$1.en");
};
/** "$.items[2].en.event" -> "Item 3 · event" */
function niceLabel(path: string) {
  return path.replace(/^\$\.?/, "").replace(/\.en(?=\.|\[|$)/, "").replace(/^en\.?/, "")
    .replace(/([a-zA-Z]+)\[(\d+)\]/g, (_, k, i) => `${k} ${Number(i) + 1}`).split(".").filter(Boolean).join(" · ") || "text";
}

async function draftView(env: Env, row: LibraryRow) {
  const pack = JSON.parse(row.json);
  const key = String(pack.schema ?? "").replace(/^upsc-pods\//, "").replace(/@\d+$/, "");
  const trs = rowTranslations(row), approvals = rowApprovals(row);
  const flags: string[] = JSON.parse(row.flags);
  const langs = (await deskLangs(env)).filter((l) => INPACK.includes(l) || trs[l]);
  const strings = PT.englishStrings(translatable(pack));
  const issues = (path: string) => flags.filter((f) => {
    const p = toEnglishPath(f.replace(/^Check: /, "").replace(/^[A-Z][a-z]+: (?=\$)/, "").split(":")[0]);
    return p === path || (p.length > 2 && path.startsWith(p + ".")) || (p.length > 2 && path.startsWith(p + "["));
  });
  const rows = strings.map((s) => {
    const extra: Record<string, { text: string; stale: boolean } | null> = {};
    for (const l of langs) if (!INPACK.includes(l)) {
      const e = trs[l]?.strings[s.path];
      extra[l] = e ? { text: e.text, stale: e.en !== s.en } : null;
    }
    const hi = getAt(pack, parsePath(inLang(s.path, "hi")));
    return { path: s.path, label: niceLabel(s.path), en: s.en, hi: typeof hi === "string" ? hi : null, extra, keep: s.keep, fresh: s.native, register: s.register ?? "content", issues: issues(s.path) };
  });
  const matched = new Set(rows.flatMap((r) => r.issues));
  return {
    id: row.id, kind: row.kind, type: key, typeTitle: TYPE[key]?.title ?? row.kind, title: row.title, status: row.status, langs,
    approvals: { en: row.en_editor, hi: row.hi_editor, ...Object.fromEntries(Object.entries(approvals).map(([l, a]) => [l, a.by])) },
    rows, general: flags.filter((f) => !matched.has(f)), from: pack.provenance?.from ?? null,
  };
}

async function loadRow(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM library WHERE id = ?").bind(id).first<LibraryRow>();
}

// --- Suggest types ---------------------------------------------------------------------------

function guessTypes(text: string): string[] {
  const out: string[] = [];
  const years = new Set(text.match(/\b(1[6-9]\d\d|20\d\d)\b/g) ?? []);
  if (years.size >= 4) out.push("timeline-shuffle");
  if (/\b(scheme|yojana|mission|abhiyan)\b/i.test(text)) out.push("scheme-snapshot");
  if (/\b(index|ranking|ranked)\b/i.test(text)) out.push("index-card");
  if (/\b(court|judgment|bench|v\.|vs\.)\b/i.test(text)) out.push("landmark-case");
  if (/\b(versus|compared with|whereas|unlike)\b/i.test(text)) out.push("versus");
  if (/\barticle \d+|\bschedule\b|\bamendment\b/i.test(text)) out.push("assertion-reason");
  out.push("flashcards", "two-truths", "odd-one-out");
  return [...new Set(out)].filter((k) => TYPE[k]).slice(0, MAX_TYPES);
}

async function suggestTypes(env: Env, src: Source): Promise<{ types: string[]; how: string }> {
  if (!env.ANTHROPIC_API_KEY) return { types: guessTypes(src.text), how: "guessed from the text (no Claude key)" };
  const menu = TYPES.map((t) => `- ${t.key}: ${t.title}. ${t.hint}`).join("\n");
  const system = "You pick formats for UPSC study content. Given a source, choose the 1 to 3 formats from the menu that fit its facts best, best first. Prefer formats the source has enough material for.\n\nMenu:\n" + menu;
  const content: any[] = src.pdf
    ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: src.pdf } }, { type: "text", text: "Pick formats for the attached PDF." }]
    : [{ type: "text", text: `<source>\n${src.text.slice(0, 20_000)}\n</source>\n\nPick formats for this source.` }];
  const schema = { type: "object", additionalProperties: false, required: ["types"], properties: { types: { type: "array", items: { type: "string", enum: TYPES.map((t) => t.key) } } } };
  const { text } = await callClaude(env, "author", { system, messages: [{ role: "user", content }], schema, maxTokens: 2000 });
  const types = [...new Set((JSON.parse(text).types ?? []) as string[])].filter((k) => TYPE[k]).slice(0, MAX_TYPES);
  return { types: types.length ? types : guessTypes(src.text), how: "picked by Claude" };
}

// --- API (perm "content", checked by the desk) -------------------------------------------------

export async function authorApi(req: Request, env: Env, path: string, s: Staff): Promise<Response | null> {
  if (!path.startsWith("author/")) return null;
  const who = label(s);
  const body = req.method === "POST" ? await req.json<any>().catch(() => ({})) : {};
  const extraLangs = async (want: unknown) => {
    const desk = await deskLangs(env);
    return (Array.isArray(want) ? want : []).filter((l): l is string => isLang(l) && !INPACK.includes(l) && desk.includes(l));
  };

  if (path === "author/types" && req.method === "GET") {
    const c = await llmControls(env);
    const langs = (await deskLangs(env)).map((code) => ({ code, name: langName(code), native: PT.LANGS[code].native, inPack: INPACK.includes(code), canApprove: can(s, `approve:${code}`) }));
    return json({
      types: TYPES.map(({ hint: _h, ...t }) => t), langs, maxTypes: MAX_TYPES,
      claude: { key: !!env.ANTHROPIC_API_KEY, on: c.enabled && c.purposes.author, model: c.authorModel },
      templatesFrom: BUNDLE.createdOn,
    });
  }

  if (path === "author/suggest" && req.method === "POST") {
    const src = await readSource(body);
    if (typeof src === "string") return bad(src);
    try { return json(await suggestTypes(env, src)); }
    catch (e) { return json({ types: guessTypes(src.text), how: `guessed from the text (${(e as Error).message})` }); }
  }

  // Paste, pick, Generate. Types run side by side; each draft is saved even if another fails.
  if (path === "author/generate" && req.method === "POST") {
    const src = await readSource(body);
    if (typeof src === "string") return bad(src);
    const notes = String(body.notes ?? "").slice(0, 600);
    let types: string[] = Array.isArray(body.types) ? body.types.filter((k: string) => TYPE[k]) : [];
    if (body.types === "suggest" || !types.length) types = (await suggestTypes(env, src).catch(() => ({ types: guessTypes(src.text) }))).types;
    types = [...new Set(types)].slice(0, MAX_TYPES);
    const langs = await extraLangs(body.langs);
    const results = await Promise.allSettled(types.map(async (key) => {
      const { pack, flags } = await writeWithClaude(env, key, src, notes);
      const trs: Record<string, Translation> = {};
      const trFlags: string[] = [];
      if (TYPE[key].translate) for (const l of langs) {
        try { const t = await translateWithClaude(env, key, pack, l); trs[l] = t.tr; trFlags.push(...t.flags); }
        catch (e) { trFlags.push(`${langName(l)}: not translated (${(e as Error).message}). Use Translate again on the draft.`); }
      }
      return saveDraft(env, key, pack, [...flags, ...trFlags], who, trs);
    }));
    const drafts = [], failed = [];
    for (const [i, r] of results.entries()) {
      if (r.status === "fulfilled") drafts.push(await draftView(env, (await loadRow(env, r.value))!));
      else failed.push({ type: types[i], title: TYPE[types[i]].title, error: (r.reason as Error).message, blocked: r.reason instanceof AiBlocked });
    }
    if (!drafts.length && failed.every((f) => f.blocked)) return bad(failed[0]?.error ?? "Claude is off", 503);
    return json({ drafts, failed });
  }

  // Without a key: the exact prompt to paste into Claude, and the reply pasted back.
  if (path === "author/prompt" && req.method === "POST") {
    const key = String(body.type);
    if (!TYPE[key]) return bad("Pick a content type");
    const src = await readSource(body);
    if (typeof src === "string") return bad(src);
    if (src.pdf) return bad("Copy prompt needs text: paste the PDF's text, or attach the PDF in Claude yourself.");
    const job = jobFor(key, src, String(body.notes ?? ""));
    return json({ paste: pasteable(job.prompt.system, job.prompt.user, job.api) });
  }
  if (path === "author/fill" && req.method === "POST") {
    const key = String(body.type);
    if (!TYPE[key]) return bad("Pick a content type");
    const src = await readSource(body);
    if (typeof src === "string") return bad(src);
    let fill: any;
    try { fill = parseReply(body.reply); } catch { return bad("That reply isn't JSON. Copy Claude's whole answer."); }
    const job = jobFor(key, src, "");
    const fillErrors = PT.validate(fill, job.fill, { generated: true }).errors;
    let out;
    try { out = finishPack(key, fill, src, { generator: "desk author (pasted)" }); }
    catch (e) { return bad(`Couldn't build the ${TYPE[key].title} from that reply: ${(e as Error).message}`); }
    const id = await saveDraft(env, key, out.pack, [...new Set([...fillErrors, ...out.flags])], who);
    return json({ drafts: [await draftView(env, (await loadRow(env, id))!)], failed: [] });
  }

  const m = path.match(/^author\/draft\/([\w:.-]+?)(?:\/(translate|translate-prompt|translation))?$/);
  if (!m) return null;
  const row = await loadRow(env, m[1]);
  if (!row) return bad("No such draft", 404);
  const pack = JSON.parse(row.json);
  const key = String(pack.schema ?? "").replace(/^upsc-pods\//, "").replace(/@\d+$/, "");
  if (!TYPE[key]) return bad("This item wasn't written from a template; edit it in Library.");

  if (!m[2] && req.method === "GET") return json(await draftView(env, row));

  // Inline edits from the side-by-side view: [{ path, lang, text }].
  if (!m[2] && req.method === "POST") {
    const edits: { path: string; lang: string; text: string }[] = Array.isArray(body.edits) ? body.edits : [];
    const trs = rowTranslations(row), approvals = rowApprovals(row);
    let packChanged = false;
    const touched = new Set<string>();
    for (const e of edits) {
      if (typeof e?.path !== "string" || typeof e.text !== "string" || !isLang(e.lang)) continue;
      if (INPACK.includes(e.lang)) {
        if (e.lang !== "en" && !can(s, "content")) continue;
        try { setAt(pack, parsePath(inLang(e.path, e.lang)), e.text); packChanged = true; } catch { return bad(`Can't find ${e.path}`); }
      } else touched.add(e.lang);
    }
    // Translation edits are keyed by the English as it is after this save.
    const english = new Map(PT.englishStrings(translatable(pack)).map((x) => [x.path, x.en]));
    for (const e of edits) {
      if (!isLang(e?.lang) || INPACK.includes(e.lang) || typeof e.text !== "string") continue;
      const en = english.get(e.path);
      if (en == null) continue;
      trs[e.lang] ??= PT.makeTranslation(translatable(pack), e.lang, {});
      trs[e.lang].strings[e.path] = { en, text: e.text };
      trs[e.lang].review = { status: "draft", checkedBy: null, checkedOn: null };
    }
    const src: Source = { text: pack.provenance?.source ?? "", pdf: null, from: pack.provenance?.from ?? "" };
    const t = BUNDLE.types[key];
    await prepareEdit(env, row.kind, pack);
    const r = PT.validate(translatable(pack), t.schema, { source: src.text || undefined });
    const trFlags = Object.values(trs).flatMap((tr) => checkTranslation(key, pack, tr).flags);
    const flags = [...r.errors, ...r.warnings.map((w) => "Check: " + w), ...trFlags, ...staleFlags(pack, trs), ...checkItem(row.kind, pack)];
    // English or Hindi edits clear every approval; a translation edit clears only that language.
    for (const l of touched) delete approvals[l];
    const now = new Date().toISOString();
    if (packChanged) {
      await env.DB.prepare(`UPDATE library SET json = ?, title = ?, flags = ?, translations = ?, status = 'draft', en_editor = NULL, en_checked_on = NULL,
        hi_editor = NULL, hi_checked_on = NULL, approvals = NULL, updated_at = ? WHERE id = ?`)
        .bind(JSON.stringify(pack), titleOf(row.kind, pack), JSON.stringify(flags), JSON.stringify(trs), now, row.id).run();
    } else {
      await env.DB.prepare("UPDATE library SET flags = ?, translations = ?, approvals = ?, updated_at = ? WHERE id = ?")
        .bind(JSON.stringify(flags), JSON.stringify(trs), JSON.stringify(approvals), now, row.id).run();
    }
    await recordVersion(env, "library", row.id, JSON.stringify(pack), `author edit (${[...new Set(edits.map((e) => e.lang))].join(", ")})`, who);
    return json(await draftView(env, (await loadRow(env, row.id))!));
  }

  // Translate (again) with Claude, or by hand.
  const lang = String(body.lang ?? "");
  if (m[2] && (!isLang(lang) || INPACK.includes(lang) || !(await deskLangs(env)).includes(lang))) return bad("Pick a language that's switched on (pilot or live)");
  if (m[2] && !TYPE[key].translate) return bad(`${TYPE[key].title} is about one language and isn't translated.`);
  const saveTr = async (t: { tr: Translation; flags: string[] }) => {
    const trs = rowTranslations(row), approvals = rowApprovals(row);
    trs[lang] = t.tr;
    delete approvals[lang];
    const old = (JSON.parse(row.flags) as string[]).filter((f) => !f.replace(/^Check: /, "").startsWith(langName(lang) + ":"));
    await env.DB.prepare("UPDATE library SET translations = ?, approvals = ?, flags = ? WHERE id = ?")
      .bind(JSON.stringify(trs), JSON.stringify(approvals), JSON.stringify([...old, ...t.flags]), row.id).run();
    await recordVersion(env, "library", row.id, row.json, `translation ${lang}`, who);
    return json(await draftView(env, (await loadRow(env, row.id))!));
  };
  if (m[2] === "translate" && req.method === "POST") {
    try { return await saveTr(await translateWithClaude(env, key, pack, lang)); }
    catch (e) { return bad((e as Error).message, e instanceof AiBlocked ? 503 : 502); }
  }
  if (m[2] === "translate-prompt" && req.method === "POST") {
    const p = PT.buildTranslationPrompt(translatable(pack), lang, BUNDLE.translatePrompt, BUNDLE.languageNotes[lang] ?? "", BUNDLE.types[key].schema);
    return json({ paste: pasteable(p.system, p.user, p.schema) });
  }
  if (m[2] === "translation" && req.method === "POST") {
    let reply: any;
    try { reply = parseReply(body.reply); } catch { return bad("That reply isn't JSON. Copy Claude's whole answer."); }
    // A whole translation file (the content team's .te.json) works too.
    const tr = reply?.schema === "upsc-pods/translation@1" ? { ...reply, lang, pack: { id: pack.id, schema: pack.schema } }
      : PT.makeTranslation(translatable(pack), lang, reply, { generator: "desk author (pasted)" });
    return saveTr(checkTranslation(key, pack, tr));
  }
  return null;
}
