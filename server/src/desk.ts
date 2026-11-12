import { authorApi } from "./author";
import { contentApi } from "./content";
import { coverage } from "./coverage";
import { caDeskApi } from "./ca";
import { addNote, listNotes } from "./library";
import { addCandidate, autoChecks } from "./pipeline";
import { type Env, bad, istDay, json } from "./shared";
import { type Hop, callChat } from "./ai";
import { business } from "./payments";
import { mailOn, sendMail } from "./mail";

// The drafts come from Llama on Workers AI; the second read is another family, steady and strict.
const AUTO_HOPS: Hop[] = [
  { provider: "groq", model: "openai/gpt-oss-120b", extra: { temperature: 0, reasoning_effort: "medium", include_reasoning: false, max_completion_tokens: 300 }, timeoutMs: 30_000 },
  { provider: "google", model: "gemini-3.8-flash", extra: { temperature: 0, reasoning_effort: "low", max_tokens: 300 }, timeoutMs: 30_000 },
];
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
    `SELECT * FROM candidates WHERE day = ? AND ((status = 'approved' AND en_editor IS NOT NULL) OR status = 'auto')
     ORDER BY status = 'auto', COALESCE(position, 999), score DESC LIMIT ?`,
  ).bind(day, MAX_CARDS).all<CandidateRow>();
  if (!results.length) return { published: false, reason: "No approved cards for " + day };
  const items = results.map((r) => {
    const card = JSON.parse(r.card_json);
    if (r.status === "auto") {
      // Sent out by the automatic check (autoPick): no editor's name goes on it, so the apps show
      // "Not yet checked by an editor" on the card, in English and in Hindi.
      card.auto = true;
      delete card.checkedBy; delete card.checkedOn;
      if (card.hi) { delete card.hi.checkedBy; delete card.hi.checkedOn; }
    } else {
      card.checkedBy = r.en_editor;
      card.checkedOn = r.en_checked_on;
      if (card.hi && r.hi_editor) {
        card.hi.checkedBy = r.hi_editor;
        card.hi.checkedOn = r.hi_checked_on;
      } else {
        delete card.hi;
      }
    }
    if (card.tone !== "light") delete card.chotu;
    return card;
  });
  const brief = { date: day, sample: false, items };
  await env.DB.prepare("INSERT OR REPLACE INTO briefs (day, json, published_at) VALUES (?, ?, ?)")
    .bind(day, JSON.stringify(brief), new Date().toISOString()).run();
  return { published: true, cards: items.length };
}

/** How many cards the automatic Chai sends out on a day when no editor has been in. */
const AUTO_CARDS = 5;

const AUTO_CHECK = (card: any, source: string) => `You are a strict fact checker for a study app for India's UPSC exam.
Below is a news SOURCE and a short CARD written from it. Decide whether the card may be sent to students with no human check.

Say "pass" only if ALL of these hold:
- Every fact, number, date, name and claim in the card is stated in the source. Nothing is added or guessed.
- The card is neutral: no opinion, no praise or blame of a party, leader, religion, caste, community or region.
- The story is not about deaths, disasters, violence, crime against a person, a court case about an individual, or anything a reader could find upsetting.
- The quiz question (if any) has exactly one correct option, and the source supports it.

Reply with JSON only: {"verdict": "pass" | "fail", "reason": "one short sentence"}

SOURCE:
${source.slice(0, 6000)}

CARD:
${JSON.stringify({ headline: card.headline, summary: card.summary, whyForUpsc: card.whyForUpsc, examCorner: card.examCorner }).slice(0, 4000)}`;

/**
 * The automatic Chai (flag chai_auto, off unless the owner switches it on): at 07:00 IST, if fewer than AUTO_CARDS
 * cards have an editor's approval for the day, the best remaining drafts go out on their own. A draft qualifies only
 * if the pipeline's own checks raised no flag, its tone is light or neutral (serious and tragic always wait for a
 * person), and a second model from a different family reads the card against its source and passes it. These rows get
 * status 'auto', never an editor's name, so every app shows them as "Not yet checked by an editor". An editor can
 * still approve or reject any of them in the Desk afterwards and publish again.
 */
export async function autoPick(env: Env, day = istDay()) {
  const { results } = await env.DB.prepare("SELECT * FROM candidates WHERE day = ? AND status IN ('draft', 'approved', 'auto') ORDER BY score DESC").bind(day).all<CandidateRow>();
  let have = results.filter((r) => (r.status === "approved" && r.en_editor) || r.status === "auto").length;
  const picked: string[] = [], held: string[] = [];
  for (const r of results) {
    if (have >= AUTO_CARDS) break;
    if (r.status !== "draft" || !r.card_json) continue;
    let card: any; let flagged: unknown[] = [];
    try { card = JSON.parse(r.card_json); flagged = JSON.parse(r.flags || "[]"); } catch { continue; }
    if (flagged.length || !card.summary || !card.headline || !["light", "neutral"].includes(card.tone)) { held.push(r.title); continue; }
    let pass = false;
    try {
      const out = await callChat(env, "guard", [{ role: "user", content: AUTO_CHECK(card, r.source_text) }], AUTO_HOPS);
      const m = out.text.match(/\{[\s\S]*\}/);
      pass = !!m && JSON.parse(m[0]).verdict === "pass";
    } catch { pass = false; } // no second check, no auto card
    if (!pass) { held.push(r.title); continue; }
    await env.DB.prepare("UPDATE candidates SET status = 'auto' WHERE id = ? AND status = 'draft'").bind(r.id).run();
    picked.push(card.headline); have++;
  }
  return { picked, held: held.length };
}

/** Tells the owner by email what went out, so nobody has to open the Desk to know. Quietly skipped if mail is off. */
export async function chaiDigest(env: Env, day: string, auto: { picked: string[]; held: number } | null, result: { published: boolean; cards?: number; reason?: string }) {
  const to = (await business(env)).email;
  if (!mailOn(env) || !/^\S+@\S+\.\S+$/.test(to)) return;
  const base = (env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const lines = result.published
    ? [`Today's Chai (${day}) is out: ${result.cards} card${result.cards === 1 ? "" : "s"}.`,
       ...(auto?.picked.length ? ["", "Sent by the automatic check (shown in the app as not yet checked by an editor):", ...auto.picked.map((t) => "- " + t)] : []),
       ...(auto?.held ? ["", `${auto.held} more draft${auto.held === 1 ? " is" : "s are"} waiting for a person in the Desk.`] : [])]
    : [`No Chai went out today (${day}). ${result.reason ?? ""}`, auto ? "The automatic check found no draft it could pass on its own." : "The automatic Chai is switched off (Admin, Flags, chai_auto)."];
  await sendMail(env, { to, subject: result.published ? `Chai out: ${result.cards} cards, ${day}` : `No Chai today, ${day}`, text: [...lines, "", `Desk: ${base.replace("//app.", "//admin.")}/desk`].join("\n") });
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
  const content = (await authorApi(req, env, path, s)) ?? (await caDeskApi(req, env, path, s)) ?? (await contentApi(req, env, path, s));
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
    // day: queue it for a coming morning (a week's stories sent in one go, scripts/import-chai.mjs); today if left out.
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(body.day ?? "")) ? String(body.day) : now;
    const ahead = (Date.parse(day) - Date.parse(now)) / 86400_000;
    if (ahead < 0 || ahead > 21) return bad("day must be today or within the next three weeks");
    if (await env.DB.prepare("SELECT 1 FROM candidates WHERE day = ? AND source_url = ?").bind(day, String(body.sourceUrl)).first()) return json({ id: null, duplicate: true });
    const id = await addCandidate(env, { title: String(body.title), sourceName: String(body.sourceName || "Editor"), sourceUrl: String(body.sourceUrl), text: String(body.text ?? "").slice(0, 12000) }, day);
    return json({ id, day });
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
      case "mains-value":
        // About 1 in 5 cards: the apps add one quiet "worth keeping for GS2" line to these only. A mark, not an edit,
        // so the approvals stay.
        c.highValue = !c.highValue;
        await env.DB.prepare("UPDATE candidates SET card_json = ? WHERE id = ?").bind(JSON.stringify(c), id).run();
        await recordVersion(env, "card", id, JSON.stringify(c), c.highValue ? "high value for Mains" : "not high value", who);
        return json({ ok: true, highValue: c.highValue });
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
