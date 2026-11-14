// "Try one topic": the open sample of the app (web app route #try). A visitor with no account works through one whole
// syllabus topic, a topic path (aspiran/topic-path@1, content/topic-paths/), from a warm-up guess to cards in their review.
//
//   GET  /try                 the approved topic paths, as { items: [{ id, title, node, languages }] }
//   GET  /try/<id>            one approved path, with only the languages an editor approved (as /library does)
//   GET  /try/<id>?preview=1  with a desk key (Authorization: Bearer ...): the newest version, draft or not, marked draft,
//                             so editors can walk it before approving. Never served to visitors.
//
// Feedback, because the sample is also how we listen. No account, no member id; a random session id from the browser.
//   POST /try/feedback        { sessionId, pathId, question, answer?, text?, lang }: one answer, replaced if asked again
//   POST /try/contact         { sessionId, pathId, contact, consent: true, consentText }: only if they chose to leave one
//   POST /try/forget          { sessionId }: deletes everything that session sent (the end screen's button)
//   GET  /try/summary?path=   chip answers only, as counts, once at least MIN_SHOWN people answered (never free text)
//
// Like the Free Shelf, this needs no account and follows the library flag: if Ops pause the library, /try pauses too.

import { type LibraryRow, publicLibrary } from "./content";
import { staffFrom, flags, ensureSchema, sha256Hex } from "./staff";
import { type Env, HELPLINES, bad, distress, istDay, json } from "./shared";
import { extraDistress } from "./langs";

type Item = { id: string; kind: string; languages: string[]; data: any };

async function approvedPaths(env: Env): Promise<Item[]> {
  const data = await (await publicLibrary(env, ["topic-path"])).json<{ items: Item[] }>();
  return data.items.filter((i) => i.kind === "topic-path");
}

const SESSION = /^[a-z0-9]{16,40}$/;
const QUESTION = /^[a-z0-9:_-]{1,48}$/;
const str = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, n);
/** Answers per network per day: far above one person's demo, far below a flood. */
const PER_NETWORK = 300;
/** Rows one session can hold: every question in a path, with room to spare. */
const PER_SESSION = 80;
/** Counts show on the end screen only once this many people answered that question. */
export const MIN_SHOWN = 20;

async function underCap(req: Request, env: Env): Promise<boolean> {
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  const k = "try:" + (await sha256Hex(ip + ":" + istDay())).slice(0, 24);
  const row = await env.DB.prepare("INSERT INTO web_rate (k, day, n) VALUES (?, ?, 1) ON CONFLICT(k, day) DO UPDATE SET n = n + 1 RETURNING n")
    .bind(k, istDay()).first<{ n: number }>();
  return (row?.n ?? 1) <= PER_NETWORK;
}

async function feedback(req: Request, env: Env, path: string): Promise<Response> {
  const b = await req.json<any>().catch(() => null);
  if (!b || !SESSION.test(String(b.sessionId ?? ""))) return bad("sessionId is required");
  if (String(b.company ?? "")) return json({ ok: true }); // the hidden field only bots fill
  await ensureSchema(env);
  if (path === "/try/forget") {
    const a = await env.DB.prepare("DELETE FROM try_feedback WHERE session_id = ?").bind(b.sessionId).run();
    const c = await env.DB.prepare("DELETE FROM try_contacts WHERE session_id = ?").bind(b.sessionId).run();
    return json({ ok: true, deleted: (a.meta.changes ?? 0) + (c.meta.changes ?? 0) });
  }
  const pathId = str(b.pathId, 64);
  if (!/^[\w-]{3,64}$/.test(pathId)) return bad("pathId is required");
  if (!(await underCap(req, env))) return json({ error: "That's a lot of answers from one place today. Thank you; try again tomorrow." }, 429);
  const now = new Date();
  const lang = b.lang === "hi" ? "hi" : "en";

  if (path === "/try/contact") {
    let contact = str(b.contact, 80), kind = "";
    if (b.consent !== true) return bad("Tick the box to say we can contact you.");
    const digits = contact.replace(/[^\d+]/g, "");
    if (/^\S+@\S+\.\S+$/.test(contact)) kind = "email";
    else if (/^(\+?91)?[6-9]\d{9}$/.test(digits)) { kind = "phone"; contact = "+91" + digits.slice(-10); }
    else return bad("That doesn't look like an Indian mobile number or an email.");
    await env.DB.prepare(`INSERT INTO try_contacts (session_id, path_id, contact, contact_kind, consent_text, lang, at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET contact = excluded.contact, contact_kind = excluded.contact_kind, consent_text = excluded.consent_text, at = excluded.at`)
      .bind(b.sessionId, pathId, contact, kind, str(b.consentText, 600), lang, now.toISOString()).run();
    return json({ ok: true, kind });
  }

  const question = String(b.question ?? "");
  if (!QUESTION.test(question)) return bad("question is required");
  let answer = b.answer == null ? null : str(Array.isArray(b.answer) ? b.answer.join("|") : b.answer, 200);
  const text = b.text == null ? null : str(b.text, 1500);
  // Free text follows the crisis protocol: the helplines show at once, and the row is marked CARE for a human to see.
  const care = !!text && distress(text, await extraDistress(env).catch(() => [] as string[]));
  if (care) answer = "CARE";
  if (!answer && !text) return bad("An answer or some text is required");
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM try_feedback WHERE session_id = ?").bind(b.sessionId).first<{ n: number }>();
  if ((n?.n ?? 0) >= PER_SESSION) return json({ ok: true, capped: true });
  await env.DB.prepare(`INSERT INTO try_feedback (session_id, path_id, question, answer, text, lang, day, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, path_id, question) DO UPDATE SET answer = excluded.answer, text = excluded.text, lang = excluded.lang, at = excluded.at`)
    .bind(b.sessionId, pathId, question, answer, text, lang, istDay(now), now.toISOString()).run();
  return json(care ? { ok: true, care: true, helplines: HELPLINES } : { ok: true });
}

/** Chip answers as counts, for "what others said" on the end screen. Free text never leaves the admin console. */
async function summary(env: Env, pathId: string): Promise<Response> {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    "SELECT question, answer, COUNT(*) AS n FROM try_feedback WHERE path_id = ? AND answer IS NOT NULL AND answer != 'CARE' GROUP BY question, answer",
  ).bind(pathId).all<{ question: string; answer: string; n: number }>();
  const out: Record<string, { total: number; answers: Record<string, number> }> = {};
  for (const r of results) {
    for (const a of r.answer.split("|")) {
      const q = (out[r.question] ??= { total: 0, answers: {} });
      q.answers[a] = (q.answers[a] ?? 0) + r.n;
    }
    out[r.question].total += r.n;
  }
  for (const k of Object.keys(out)) if (out[k].total < MIN_SHOWN) delete out[k];
  return new Response(JSON.stringify({ questions: out, minShown: MIN_SHOWN }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "max-age=300" },
  });
}

/** "You asked, we did": the latest lines the team wrote, newest first. Written by staff in admin, never by visitors. */
export async function tryUpdates(env: Env, pathId: string, all = false) {
  await ensureSchema(env);
  const { results } = await env.DB.prepare(
    `SELECT id, text_en, text_hi, done_on, hidden, created_by, created_at FROM try_updates WHERE path_id = ? ${all ? "" : "AND hidden = 0"} ORDER BY done_on DESC, id DESC LIMIT ?`,
  ).bind(pathId, all ? 100 : 5).all<any>();
  return results;
}

/** For the admin console: every answer, newest first, and contacts left with consent. */
export async function tryFeedbackRows(env: Env, limit: number) {
  await ensureSchema(env);
  const rows = (await env.DB.prepare(
    "SELECT f.session_id, f.path_id, f.question, f.answer, f.text, f.lang, f.at, c.contact FROM try_feedback f LEFT JOIN try_contacts c ON c.session_id = f.session_id ORDER BY f.at DESC LIMIT ?",
  ).bind(limit).all<any>()).results ?? [];
  const contacts = (await env.DB.prepare("SELECT * FROM try_contacts ORDER BY at DESC LIMIT ?").bind(limit).all<any>()).results ?? [];
  return { rows, contacts };
}

export async function tryRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path !== "/try" && !path.startsWith("/try/")) return null;
  if (req.method === "POST" && ["/try/feedback", "/try/contact", "/try/forget"].includes(path)) return feedback(req, env, path);
  if (req.method !== "GET") return json({ error: "Use GET." }, 405);
  if (path === "/try/summary") return summary(env, str(url.searchParams.get("path"), 64));
  if (path === "/try/updates") {
    const rows = await tryUpdates(env, str(url.searchParams.get("path"), 64));
    return new Response(JSON.stringify({ updates: rows.map((r) => ({ en: r.text_en, hi: r.text_hi, on: r.done_on })) }), {
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "max-age=300" } });
  }
  if (!(await flags(env)).library) return json({ items: [], paused: true });
  const id = decodeURIComponent(path.slice("/try/".length));

  if (path === "/try") {
    const items = (await approvedPaths(env)).map((i) => ({ id: i.data.id, title: i.data.title, node: i.data.node, languages: i.languages }));
    return json({ items });
  }

  if (url.searchParams.has("preview")) {
    const staff = await staffFrom(req, env);
    if (!staff) return json({ error: "Previewing a draft needs a desk key." }, 401);
    // The desk keeps items as "<kind>:<id>"; links use the short id.
    const row = await env.DB.prepare("SELECT * FROM library WHERE kind = 'topic-path' AND (id = ? OR id = ?)").bind(id, `topic-path:${id}`).first<LibraryRow>();
    if (!row) return json({ error: "No topic path with that id. Import it on the desk first." }, 404);
    const data = JSON.parse(row.json);
    return json({ id: data.id ?? row.id, kind: row.kind, draft: row.status !== "approved", status: row.status, languages: ["en", "hi"], data });
  }

  const item = (await approvedPaths(env)).find((i) => i.data.id === id || i.id === id);
  if (!item) return json({ error: "That topic isn't open yet." }, 404);
  return json({ ...item, id: item.data.id ?? item.id, draft: false });
}
