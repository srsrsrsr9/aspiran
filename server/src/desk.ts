import { authorApi } from "./author";
import { contentApi } from "./content";
import { coverage } from "./coverage";
import { caDeskApi } from "./ca";
import { addNote, listNotes } from "./library";
import { addCandidate, autoChecks } from "./pipeline";
import { type Env, bad, istDay, json } from "./shared";
import { type Staff, approverName, audit, auditDetail, can, label, recordVersion, requireStaff } from "./staff";
import seedNotes from "../seed/notes.json";

/**
 * The news desk: an editor approves every card before it reaches a pod. English and Hindi are
 * approved separately, by their own editors. Also holds the moderator queue and the notes library.
 */

const MAX_CARDS = 7;

interface CandidateRow {
  id: string;
  day: string;
  source_name: string;
  source_url: string;
  title: string;
  source_text: string;
  score: number;
  card_json: string;
  flags: string;
  status: string;
  en_editor: string | null;
  en_checked_on: string | null;
  hi_editor: string | null;
  hi_checked_on: string | null;
  position: number | null;
}

// --- Publishing and rituals -----------------------------------------------------

/** Builds the day's brief from approved cards. A card needs English approval; Hindi ships only if approved. */
export async function publish(env: Env, day = istDay()) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM candidates WHERE day = ? AND status = 'approved' AND en_editor IS NOT NULL
     ORDER BY COALESCE(position, 999), score DESC LIMIT ?`,
  ).bind(day, MAX_CARDS).all<CandidateRow>();
  if (!results.length) return { published: false, reason: "No approved cards for " + day };
  const items = results.map((r) => {
    const card = JSON.parse(r.card_json);
    card.checkedBy = r.en_editor;
    card.checkedOn = r.en_checked_on;
    if (card.hi && r.hi_editor) {
      card.hi.checkedBy = r.hi_editor;
      card.hi.checkedOn = r.hi_checked_on;
    } else {
      delete card.hi;
    }
    if (card.tone !== "light") delete card.chotu;
    return card;
  });
  const brief = { date: day, sample: false, items };
  await env.DB.prepare("INSERT OR REPLACE INTO briefs (day, json, published_at) VALUES (?, ?, ?)")
    .bind(day, JSON.stringify(brief), new Date().toISOString()).run();
  return { published: true, cards: items.length };
}

export type Ritual = "chai" | "quiz" | "mains" | "close";

export async function ritualText(env: Env, kind: Ritual): Promise<string | null> {
  const day = istDay();
  const row = await env.DB.prepare("SELECT json FROM briefs WHERE day = ?").bind(day).first<{ json: string }>();
  const brief = row ? JSON.parse(row.json) : null;
  switch (kind) {
    case "chai":
      return brief ? `Today's Chai is up ☕ ${brief.items.length} card${brief.items.length === 1 ? "" : "s"}, about ${Math.max(5, brief.items.length + 2)} minutes.` : null;
    case "quiz":
      return "Quiz o'clock. 5 Prelims questions are waiting in Practice, about 5 minutes.";
    case "mains": {
      const prompt = brief?.items.find((i: any) => i.examCorner?.mainsPrompt)?.examCorner.mainsPrompt;
      return prompt ? `Today's Mains question: ${prompt}` : "Today's Mains question is in Practice. One answer, 150 words.";
    }
    case "close":
      return "Close the day: one line on what you did today. Your mood stays on your phone.";
  }
}

/**
 * Chotu's ritual posts go through each pod's host gate (pod.ts): at most 2 Chotu posts a day, none from
 * 23:30 to 07:00 IST. Returns how many pods actually got the post.
 */
export async function postRitual(env: Env, kind: Ritual) {
  const text = await ritualText(env, kind);
  if (!text) return 0;
  const { results } = await env.DB.prepare("SELECT id FROM pods WHERE size > 0 AND merged_into IS NULL").all<{ id: string }>().catch(() => env.DB.prepare("SELECT id FROM pods").all<{ id: string }>());
  let n = 0;
  for (const { id } of results) {
    const stub = env.POD.get(env.POD.idFromName(id));
    const res = await stub.fetch(`https://pod/host?pod=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ slot: kind, text }) });
    if (res.ok && (await res.json<{ posted: boolean }>()).posted) n++;
  }
  return n;
}

// --- API --------------------------------------------------------------------------

/** Every desk change is written to the audit log with who made it. */
export async function deskApi(req: Request, env: Env, path: string): Promise<Response> {
  const s = await requireStaff(req, env, "content");
  if (s instanceof Response) return s;
  const peek = req.method === "POST" ? await req.clone().json().catch(() => null) : null;
  const res = await deskInner(req, env, path, s);
  if (req.method !== "GET" && res.ok) await audit(env, s, `desk: ${req.method} ${path}`, path, auditDetail(peek));
  return res;
}

async function deskInner(req: Request, env: Env, path: string, s: Staff): Promise<Response> {
  if (path === "coverage" && req.method === "GET") return json(await coverage(env));
  // Content packs, the library and hand-written cards read their own bodies (some are file uploads).
  const content = (await authorApi(req, env, path, s)) ?? (await caDeskApi(req, env, path)) ?? (await contentApi(req, env, path, s));
  if (content) return content;
  const url = new URL(req.url);
  const body = req.method === "POST" ? await req.json<any>().catch(() => ({})) : {};
  const editor = approverName(s, body.editor);
  const who = label(s);
  const now = istDay();

  if (path === "queue" && req.method === "GET") {
    const day = url.searchParams.get("day") ?? now;
    const { results } = await env.DB.prepare("SELECT * FROM candidates WHERE day = ? ORDER BY status = 'rejected', COALESCE(position, 999), score DESC").bind(day).all<CandidateRow>();
    const brief = await env.DB.prepare("SELECT published_at FROM briefs WHERE day = ?").bind(day).first<{ published_at: string }>();
    return json({
      day,
      publishedAt: brief?.published_at ?? null,
      candidates: results.map((r) => ({ ...r, card: JSON.parse(r.card_json), flags: JSON.parse(r.flags), card_json: undefined, source_text: r.source_text.slice(0, 3000) })),
    });
  }

  if (path === "stories" && req.method === "POST") {
    // An editor adds a story by hand, e.g. from a newspaper: our own summary, their link.
    if (!body.title || !body.sourceUrl) return bad("title and sourceUrl are required");
    const id = await addCandidate(env, { title: String(body.title), sourceName: String(body.sourceName || "Editor"), sourceUrl: String(body.sourceUrl), text: String(body.text ?? "") });
    return json({ id });
  }

  const card = path.match(/^cards\/([\w-]+)(?:\/(\w[\w-]*))?$/);
  if (card && req.method === "POST") {
    const [, id, action] = card;
    const row = await env.DB.prepare("SELECT * FROM candidates WHERE id = ?").bind(id).first<CandidateRow>();
    if (!row) return bad("No such card", 404);
    const c = JSON.parse(row.card_json);
    switch (action ?? "edit") {
      case "edit": {
        // Any edit clears both approvals, so nothing changes after an editor signed it off.
        const next = { ...body.card, id, sources: c.sources, checkedBy: null, checkedOn: null };
        if (next.tone !== "light") next.chotu = null;
        if (next.hi && next.tone !== "light") next.hi.chotu = null;
        const flags = autoChecks(next, row.source_text);
        await env.DB.prepare("UPDATE candidates SET card_json = ?, flags = ?, en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL WHERE id = ?")
          .bind(JSON.stringify(next), JSON.stringify(flags), id).run();
        await recordVersion(env, "card", id, JSON.stringify(next), "edit", who);
        return json({ ok: true, flags });
      }
      case "approve": {
        if (!editor) return bad("Add your name first; it shows on the card.");
        const lang = body.lang === "hi" ? "hi" : "en";
        if (!can(s, `approve:${lang}`)) return bad(lang === "hi" ? "Only a Hindi editor can approve the Hindi." : "Only an editor can approve the English.", 403);
        if (lang === "hi" && !c.hi) return bad("This card has no Hindi version yet.");
        if (lang === "en" && !c.summary) return bad("Write a summary before approving.");
        await env.DB.prepare(`UPDATE candidates SET status = 'approved', ${lang}_editor = ?, ${lang}_checked_on = ? WHERE id = ?`)
          .bind(editor, now, id).run();
        await recordVersion(env, "card", id, row.card_json, `approve ${lang} (${editor})`, who);
        // Approved cards grow the context library.
        if (lang === "en" && c.examCorner?.keyFacts?.length) {
          await addNote(env, { id: `card-${id}`, kind: "card", title: c.headline, body: [c.summary, ...c.examCorner.keyFacts].join(" "), source: c.sources?.[0]?.url });
        }
        return json({ ok: true });
      }
      case "unapprove":
        await env.DB.prepare("UPDATE candidates SET en_editor = NULL, en_checked_on = NULL, hi_editor = NULL, hi_checked_on = NULL, status = 'draft' WHERE id = ?").bind(id).run();
        await recordVersion(env, "card", id, row.card_json, "unapprove", who);
        return json({ ok: true });
      case "reject":
        await env.DB.prepare("UPDATE candidates SET status = 'rejected' WHERE id = ?").bind(id).run();
        await recordVersion(env, "card", id, row.card_json, "reject", who);
        return json({ ok: true });
      case "strip-joke":
        c.chotu = null;
        if (c.hi) c.hi.chotu = null;
        await env.DB.prepare("UPDATE candidates SET card_json = ? WHERE id = ?").bind(JSON.stringify(c), id).run();
        await recordVersion(env, "card", id, JSON.stringify(c), "remove joke", who);
        return json({ ok: true });
      case "position":
        await env.DB.prepare("UPDATE candidates SET position = ? WHERE id = ?").bind(Number(body.position) || null, id).run();
        return json({ ok: true });
    }
    return bad("Unknown action");
  }

  if (["publish", "pipeline", "ritual"].includes(path) && !can(s, "publish")) return bad("Only an editor can publish.", 403);
  if (path === "publish" && req.method === "POST") {
    const result = await publish(env, body.day ?? now);
    if (result.published) await postRitual(env, "chai");
    return json(result);
  }
  if (path === "pipeline" && req.method === "POST") {
    const { runPipeline } = await import("./pipeline");
    return json({ log: await runPipeline(env, now) });
  }
  if (path === "ritual" && req.method === "POST") {
    const kind = body.kind as Ritual;
    if (!["chai", "quiz", "mains", "close"].includes(kind)) return bad("kind must be chai, quiz, mains or close");
    return json({ pods: await postRitual(env, kind) });
  }

  if (path === "notes" && req.method === "GET") return json(await listNotes(env));
  if (path === "notes" && req.method === "POST") {
    if (!body.title || !body.body) return bad("title and body are required");
    return json({ id: await addNote(env, { kind: String(body.kind || "concept"), title: String(body.title), body: String(body.body), source: body.source ?? null }) });
  }
  if (path === "notes/seed" && req.method === "POST") {
    for (const n of seedNotes as any[]) await addNote(env, n);
    return json({ added: (seedNotes as any[]).length });
  }
  const note = path.match(/^notes\/([\w-]+)$/);
  if (note && req.method === "DELETE") {
    await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(note[1]).run();
    return json({ ok: true });
  }
  return bad("Not found", 404);
}

/** Moderator queue: member reports and Guardian distress alerts. */
export async function modApi(req: Request, env: Env, path: string): Promise<Response> {
  const s = await requireStaff(req, env, "moderate");
  if (s instanceof Response) return s;
  const peek = req.method === "POST" ? await req.clone().json().catch(() => null) : null;
  const res = await modInner(req, env, path);
  if (req.method !== "GET" && res.ok) await audit(env, s, `moderation: ${req.method} ${path}`, path, auditDetail(peek));
  return res;
}

async function modInner(req: Request, env: Env, path: string): Promise<Response> {
  if (path === "reports" && req.method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM reports WHERE status = 'open' ORDER BY kind = 'distress' DESC, created_at DESC").all();
    return json(results);
  }
  const m = path.match(/^reports\/(\d+)$/);
  if (m && req.method === "POST") {
    const { action } = await req.json<{ action: string }>();
    const row = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(Number(m[1])).first<{ pod_id: string; message_id: string }>();
    if (!row) return bad("No such report", 404);
    if (action === "hide" && row.pod_id !== "chotu") {
      const stub = env.POD.get(env.POD.idFromName(row.pod_id));
      await stub.fetch(`https://pod/hide?pod=${encodeURIComponent(row.pod_id)}`, { method: "POST", body: JSON.stringify({ id: row.message_id }) });
    }
    await env.DB.prepare("UPDATE reports SET status = ? WHERE id = ?").bind(action === "hide" ? "hidden" : "closed", Number(m[1])).run();
    return json({ ok: true });
  }
  // Change a pod's lead (the first member to join leads by default).
  const lead = path.match(/^pods\/([\w-]+)\/lead$/);
  if (lead && req.method === "POST") {
    const { memberId, name } = await req.json<{ memberId: string; name?: string }>();
    const member = await env.DB.prepare("SELECT 1 FROM members WHERE member_id = ? AND pod_id = ?").bind(memberId, lead[1]).first();
    if (!member) return bad("That member isn't in this pod", 404);
    const stub = env.POD.get(env.POD.idFromName(lead[1]));
    await stub.fetch(`https://pod/lead?pod=${encodeURIComponent(lead[1])}`, { method: "POST", body: JSON.stringify({ memberId, name: name ?? "Pod lead" }) });
    await env.DB.prepare("UPDATE pods SET lead_member = ? WHERE id = ?").bind(memberId, lead[1]).run().catch(() => {});
    return json({ ok: true });
  }
  return bad("Not found", 404);
}
