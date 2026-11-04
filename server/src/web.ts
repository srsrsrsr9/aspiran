import { AiBlocked, CHAT_ROUTES, type ChatTurn, callChat, chatLang } from "./ai";
import { extraDistress } from "./langs";
import { type Env, HELPLINES, bad, distress, istDay, istNow, json } from "./shared";
import { ensureSchema, sha256Hex } from "./staff";

/**
 * The website (aspiran.in) talks to two routes here:
 * - POST /web/chotu: Chotu · AI as the site's guide. Short replies, a daily cap per visitor and per network,
 *   quiet from 23:30 to 07:00 IST like the app, and the same distress check before any model is called.
 * - POST /web/lead: what a visitor tells Chotu as they scroll (name, attempt, medium...), saved as it comes in.
 *   A phone number or email is kept only with the visitor's yes to the one-line notice next to the box.
 * - The chat itself is saved (owner, 4 Nov 2026) in web_chats: the visitor's message and Chotu's reply, kept 180 days
 *   (pruneWebChats, run nightly). Messages that look like distress are never saved; the visitor is shown help instead.
 * Staff read the list at GET /admin/api/web/leads and a chat at GET /admin/api/web/chats/<visitor> (admin.ts).
 * The privacy policy (public/legal/privacy.html) says so.
 */

const MAX_TURNS = 8;
const MAX_CHARS = 600;
const PER_VISITOR = 15; // AI replies a day
const PER_NETWORK = 60; // AI replies a day from one IP (shared Wi-Fi, hostels)

const DETAIL_KEYS = ["name", "attempt", "medium", "stage", "optional", "city", "year", "hours", "worry", "sleep", "recall", "calibration", "pluck", "chai", "path"] as const;

const PROMPT = `You are Chotu · AI, a small clay chai cup and the AI study buddy inside Aspiran, a study app for UPSC aspirants in India.
Right now you are on Aspiran's website, walking beside a visitor as they scroll the home page.

How you talk:
- Warm, playful, curious, a little cheeky. Short: 2 to 4 sentences, under 70 words. No lists, no headings, no markdown.
- Answer in the visitor's language. Hindi, English or Hinglish are all fine; match them.
- You are an AI and say so if asked. You can be wrong; say "check this" for facts that matter.
- If you know the visitor's name, use it now and then, not every time.
- At most one question back to them per reply, and only if it helps (their attempt, medium, optional, what's hard).

What you can do:
- Explain what Aspiran is and how it works, using only the facts below. Never invent features, prices or dates.
- Give a taste of help: a short, clear answer to one UPSC doubt, then say the app does this properly with practice that brings it back later.
- Never write a full Mains answer or essay for them. Offer a skeleton idea at most, and say they should try first.

What you never do:
- Never predict ranks, results or chances of selection. Never comment on marks, ranks or results.
- Never respond to feelings about prep, stress or results beyond one kind line: say you're an AI, and their pod (real people) is where that belongs.
- Never ask for passwords, Aadhaar, payment details or documents.
- Never name or criticise coaching institutes or other apps.

Facts about Aspiran (use only these):
- Small pods of 6 to 8 aspirants at the same stage. Alone first, then together: you answer alone, then compare and discuss.
- The syllabus is a map of stars. Each topic goes from Met (read once) to Can recall (passed a check a week or more later) to Can use (wrote an answer on it).
- A short daily review that brings back old topics just before you would forget them. It ends every day; nothing piles up into guilt.
- Mains answer writing from week two: a 2-minute skeleton drill, write by hand, mark it yourself first, then see the AI's marks next to yours, then rewrite the weakest part.
- Chai: a few current-affairs cards a day, each tied to a syllabus topic, with "Keep for Mains" to save a usable example.
- CSAT: a check in week one; extra practice only if you need it.
- Your own space: notes (typed or spoken), a journal, your to-dos, and sleep. Aspiran doesn't touch it; it's yours.
- No streaks, no leaderboards, no public scores, no rank predictions, no notifications that chase you. You are compared only with your own past self.
- Hindi and English. Android first; the website will say when it opens.
- Free to join. Plus is ₹9,999 a year; the first 300 people who buy on the website pay ₹999 for the first year.
- AI is always labelled AI. Content is a draft until editors check it.

What you know about this visitor (may be empty):
{{visitor}}

India time now: {{time}}.`;

const QUIET_LINE = {
  en: "It's past 11:30 at night, so I'm resting, and you should too. Sleep is part of the syllabus. Leave your details below and I'll be here from 7 in the morning.",
  hi: "रात के 11:30 बज चुके हैं, तो मैं आराम कर रहा हूँ, और आपको भी करना चाहिए। नींद भी सिलेबस का हिस्सा है। नीचे अपनी जानकारी छोड़ दीजिए, सुबह 7 बजे से मैं यहीं हूँ।",
};

const LIMIT_LINE = {
  en: "That's all my chat for today on the website. The app has much more of me. Leave your details and we'll tell you when it opens.",
  hi: "वेबसाइट पर आज के लिए मेरी बातें बस इतनी। ऐप में मैं और ज़्यादा हूँ। अपनी जानकारी छोड़ दीजिए, खुलते ही हम बताएँगे।",
};

// The website wants a quick reply more than the strongest one: Groq first in English, the slower NVIDIA model last.
const WEB_ROUTES = {
  en: [...CHAT_ROUTES.en.filter((h) => h.provider !== "nvidia"), ...CHAT_ROUTES.en.filter((h) => h.provider === "nvidia")],
  hi: CHAT_ROUTES.hi,
};

const isQuiet = (d = istNow()) => {
  const m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return m >= 23 * 60 + 30 || m < 7 * 60;
};

const str = (v: unknown, n: number) => String(v ?? "").replace(/[{}<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const visitorIdOk = (v: unknown) => /^[\w-]{12,64}$/.test(String(v ?? ""));

function cleanDetails(d: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!d || typeof d !== "object") return out;
  for (const k of DETAIL_KEYS) {
    const v = str(d[k], k === "worry" ? 300 : 80);
    if (v) out[k] = v;
  }
  return out;
}

/** Counts one AI reply against a key for today; false once the cap is reached. */
async function takeTurn(env: Env, key: string, cap: number): Promise<boolean> {
  const day = istDay();
  const row = await env.DB.prepare(
    "INSERT INTO web_rate (k, day, n) VALUES (?, ?, 1) ON CONFLICT(k, day) DO UPDATE SET n = n + 1 RETURNING n",
  ).bind(key, day).first<{ n: number }>();
  return (row?.n ?? 1) <= cap;
}

export async function webRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/web/chotu" && req.method === "POST") return webChotu(req, env);
  if (path === "/web/lead" && req.method === "POST") return webLead(req, env);
  return null;
}

async function webChotu(req: Request, env: Env): Promise<Response> {
  const body = await req.json<any>().catch(() => null);
  if (!body || !Array.isArray(body.messages)) return bad("messages is required");
  const lang = chatLang(body.lang) === "hi" ? "hi" : "en";
  const turns: ChatTurn[] = body.messages.slice(-MAX_TURNS)
    .map((t: any) => ({ role: t?.role === "assistant" ? "assistant" : "user", content: String(t?.content ?? "").slice(0, MAX_CHARS) } as ChatTurn))
    .filter((t: ChatTurn) => t.content.trim());
  if (!turns.length || turns[turns.length - 1].role !== "user") return bad("The last message must be from the visitor");

  const extra = await extraDistress(env).catch(() => [] as string[]);
  if (turns.some((t) => t.role === "user" && distress(t.content, extra))) return json({ care: true, helplines: HELPLINES });
  if (isQuiet()) return json({ reply: QUIET_LINE[lang], quiet: true, ai: false });

  await ensureSchema(env);
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  const net = "ip:" + (await sha256Hex(ip + ":" + istDay())).slice(0, 24);
  const who = visitorIdOk(body.visitorId) ? "v:" + body.visitorId : net;
  if (!(await takeTurn(env, who, PER_VISITOR)) || !(await takeTurn(env, net, PER_NETWORK))) {
    return json({ reply: LIMIT_LINE[lang], limit: true, ai: false });
  }

  const details = cleanDetails(body.details);
  const visitor = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join("; ") || "nothing yet";
  const now = istNow();
  const system = PROMPT.replace("{{visitor}}", visitor).replace("{{time}}", now.toISOString().slice(11, 16));
  try {
    const { text } = await callChat(env, "chotu", [{ role: "system", content: system }, ...turns], WEB_ROUTES[lang]);
    await saveTurn(env, body.visitorId, turns[turns.length - 1].content, text.trim(), lang);
    return json({ reply: text.trim(), ai: true });
  } catch (e) {
    if (lang === "hi" && !(e instanceof AiBlocked)) {
      try {
        const { text } = await callChat(env, "chotu", [{ role: "system", content: system + "\nAnswer in simple English." }, ...turns], WEB_ROUTES.en);
        await saveTurn(env, body.visitorId, turns[turns.length - 1].content, text.trim(), "en");
        return json({ reply: text.trim(), ai: true, fallback: true });
      } catch { /* fall through */ }
    }
    return json({ error: "Chotu can't talk just now. Try again in a minute.", offline: true }, 503);
  }
}

/** Saves the visitor's last message and Chotu's reply. A failure here never costs the visitor their reply. */
async function saveTurn(env: Env, visitorId: unknown, said: string, reply: string, lang: string) {
  if (!visitorIdOk(visitorId)) return;
  const at = new Date();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO web_chats (visitor_id, at, role, content, lang) VALUES (?, ?, 'visitor', ?, ?)").bind(visitorId, at.toISOString(), said, lang),
    env.DB.prepare("INSERT INTO web_chats (visitor_id, at, role, content, lang) VALUES (?, ?, 'chotu', ?, ?)").bind(visitorId, new Date(at.getTime() + 1).toISOString(), reply, lang),
  ]).catch((e) => console.log("web chat save failed", String(e)));
}

/** One visitor's chat, oldest first. */
export async function webChat(env: Env, visitorId: string) {
  await ensureSchema(env);
  const rows = await env.DB.prepare("SELECT at, role, content, lang FROM web_chats WHERE visitor_id = ? ORDER BY at, id LIMIT 500").bind(visitorId).all<any>();
  return rows.results ?? [];
}

/** Chats newest first, one row per visitor, with what they shared (if anything) and their last message. */
export async function listWebChats(env: Env, limit: number) {
  await ensureSchema(env);
  const rows = await env.DB.prepare(
    `SELECT c.visitor_id, COUNT(*) AS n, MIN(c.at) AS first_at, MAX(c.at) AS last_at, l.name, l.contact,
       (SELECT content FROM web_chats x WHERE x.visitor_id = c.visitor_id AND x.role = 'visitor' ORDER BY x.at DESC LIMIT 1) AS last_said
     FROM web_chats c LEFT JOIN web_leads l ON l.visitor_id = c.visitor_id
     GROUP BY c.visitor_id ORDER BY last_at DESC LIMIT ?`,
  ).bind(limit).all<any>();
  return rows.results ?? [];
}

/** Nightly: chats older than 180 days go. */
export async function pruneWebChats(env: Env) {
  await ensureSchema(env);
  const cutoff = new Date(Date.now() - 180 * 86400_000).toISOString();
  const r = await env.DB.prepare("DELETE FROM web_chats WHERE at < ?").bind(cutoff).run();
  return { deleted: r.meta?.changes ?? 0 };
}

async function webLead(req: Request, env: Env): Promise<Response> {
  const b = await req.json<any>().catch(() => null);
  if (!b || !visitorIdOk(b.visitorId)) return bad("visitorId is required");
  if (String(b.company ?? "")) return json({ ok: true }); // the hidden field only bots fill
  const details = cleanDetails(b.details);
  let contact = str(b.contact, 80);
  let kind = "";
  if (contact) {
    if (b.consent !== true) return bad("Tick the box to say we can message you.");
    const digits = contact.replace(/[^\d+]/g, "");
    if (/^\S+@\S+\.\S+$/.test(contact)) kind = "email";
    else if (/^(\+?91)?[6-9]\d{9}$/.test(digits)) { kind = "phone"; contact = "+91" + digits.slice(-10); }
    else return bad("That doesn't look like an Indian mobile number or an email.");
  }
  await ensureSchema(env);
  const now = new Date().toISOString();
  const prev = await env.DB.prepare("SELECT details FROM web_leads WHERE visitor_id = ?").bind(b.visitorId).first<{ details: string }>();
  const merged = { ...(prev ? JSON.parse(prev.details || "{}") : {}), ...details };
  await env.DB.prepare(
    `INSERT INTO web_leads (visitor_id, name, details, contact, contact_kind, lang, consent_at, source, first_seen, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(visitor_id) DO UPDATE SET name = excluded.name, details = excluded.details,
       contact = COALESCE(excluded.contact, web_leads.contact), contact_kind = COALESCE(excluded.contact_kind, web_leads.contact_kind),
       lang = excluded.lang, consent_at = COALESCE(excluded.consent_at, web_leads.consent_at), last_seen = excluded.last_seen`,
  ).bind(
    b.visitorId, merged.name ?? null, JSON.stringify(merged), contact || null, kind || null,
    b.lang === "hi" ? "hi" : "en", contact ? now : null, str(b.source, 120) || null, now, now,
  ).run();
  return json({ ok: true, saved: Object.keys(merged).length, contact: !!contact });
}

/** For the admin list: newest first, with contact details only for rows that have them. */
export async function listLeads(env: Env, limit: number, onlyContact: boolean) {
  await ensureSchema(env);
  const rows = await env.DB.prepare(
    `SELECT visitor_id, name, details, contact, contact_kind, lang, consent_at, source, first_seen, last_seen FROM web_leads
     ${onlyContact ? "WHERE contact IS NOT NULL" : ""} ORDER BY last_seen DESC LIMIT ?`,
  ).bind(limit).all<any>();
  return (rows.results ?? []).map((r) => ({ ...r, details: JSON.parse(r.details || "{}") }));
}
