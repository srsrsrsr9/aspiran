import { AiBlocked, type ChatTurn, JEETU_ROUTES, callChat, chatLang } from "./ai";
import { cleanFacts, factsBlock, parseJeetu, scrub } from "./coach";
import PROMPT from "./jeetu-prompt.txt";
import { extraDistress } from "./langs";
import { jeetuAccess } from "./plus";
import { type Env, HELPLINES, bad, distress, istNow, json } from "./shared";
import { ensureSchema, flags } from "./staff";

/**
 * Jeetu · AI, the method coach from the trailer (artefacts/jeetu-2026-11-14.md). Chotu does the content; Jeetu only
 * the method: answer first, review before you forget, "How sure?", write → mark → second opinion → rewrite.
 *
 * POST /jeetu {messages: [{role, content}], facts?, context: {language?}, memberId?}. messages may be empty when facts
 * are sent (the "Want Jeetu's take?" tap): Jeetu then makes a plan from the facts. Before any model is called the
 * server checks, in order: the `jeetu` flag, distress (care reply, never a model), quiet hours (23:30 to 07:00 IST),
 * then ranks, results and feelings (one fixed line each, never a model), then access: Jeetu is Plus only, with a
 * small taste for free members in their first 14 days (plus.ts jeetuAccess). The reply is {reply, plan} where plan
 * is {items: [{what, when, minutes}] (1 to 3), why} or null (coach.ts). The chat itself is never stored or logged.
 * POST /jeetu/report {messageId, reason, text}: one reply to the safety queue (shown with Chotu's reports).
 */

const MAX_TURNS = 8;
const MAX_CHARS = 1500;

/** True from 23:30 to 07:00 IST. */
export function quietHours(d = new Date()): boolean {
  const t = istNow(d), hm = t.getUTCHours() * 60 + t.getUTCMinutes();
  return hm >= 23 * 60 + 30 || hm < 7 * 60;
}

/** Ranks, results, cut-offs and selection chances: nobody can know, so no model is asked. */
export const RANKS = [
  "rank", "selection", "selected", "my chance", "chances", "cut-off", "cutoff", "cut off", "will i clear", "will i pass",
  "can i clear", "will i crack", "can i crack", "result", "results", "percentile", "topper", "merit list",
  "रैंक", "चयन", "सिलेक्शन", "रिज़ल्ट", "रिजल्ट", "नतीजा", "नतीजे", "कट-ऑफ", "कटऑफ", "क्लियर होगा", "पास होगा",
];
/** Feelings: they deserve a person, not Jeetu. Distress words are caught before this, by the shared list. */
export const FEELINGS = [
  "i feel", "i'm feeling", "im feeling", "feeling low", "feeling down", "sad", "depressed", "anxious", "anxiety", "lonely",
  "stressed", "scared", "afraid", "crying", "demotivated", "frustrated", "overwhelmed", "burnt out",
  "burnout", "burned out", "panic", "nervous", "tension", "give up", "quit", "hopeless", "udaas", "dar lag", "ghabra",
  "उदास", "अकेला", "अकेली", "तनाव", "डर", "घबराहट", "घबरा", "रोना", "रो रहा", "रो रही", "हिम्मत", "परेशान",
];
export const has = (text: string, words: string[]) => {
  const t = ` ${text.toLowerCase()} `;
  // Latin words match on word edges ("rank" not "frankly"); Devanagari as a plain substring.
  return words.some((w) => /^[\x00-\x7f]+$/.test(w) ? new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(t) : t.includes(w));
};

/** The fixed lines the server answers with itself. */
export const LINES = {
  quiet: { en: "It's late, beta. Close the day and sleep; the method works better rested. I'm back at seven.", hi: "रात हो गई, बेटा। दिन बंद करो और सो जाओ; आराम से पढ़ाई ज़्यादा टिकती है। सुबह सात बजे मिलते हैं।" },
  ranks: { en: "Nobody can know that, beta. Not me, not anyone. What we can look at is where marks leak: answer first, say how sure you were, and review what you missed.", hi: "यह कोई नहीं जान सकता, बेटा। न मैं, न कोई और। हम यह देख सकते हैं कि नंबर कहाँ छूट रहे हैं: पहले जवाब, फिर बताओ कितने पक्के थे, और जो छूटा उसे दोहराओ।" },
  plusOnly: { en: "Jeetu's free taste for new members has ended.", hi: "नए सदस्यों के लिए जीतू का मुफ़्त स्वाद पूरा हो गया है।" },
  feelings: { en: "That deserves a real person, beta, not me. Talk to someone you trust: your pod, a friend, family. I'm here for the method whenever you want it.", hi: "इसके लिए कोई असली इंसान चाहिए, बेटा, मैं नहीं। किसी भरोसे वाले से बात करो: अपना पॉड, कोई दोस्त, घर वाले। तरीक़े की बात करनी हो तो मैं यहीं हूँ।" },
};

export async function jeetuRoute(req: Request, env: Env, path: string, member: string | null = null): Promise<Response | null> {
  if (path === "/jeetu/report" && req.method === "POST") {
    const b = await req.json<any>().catch(() => ({}));
    const id = String(b.messageId ?? "");
    if (!/^[\w-]{8,64}$/.test(id)) return bad("messageId is required");
    await ensureSchema(env);
    await env.DB.prepare("INSERT INTO reports (kind, pod_id, message_id, author, text, reason, created_at) VALUES ('chotu', 'jeetu', ?, 'Jeetu', ?, ?, ?)")
      .bind(id, String(b.text ?? "").slice(0, 2000), String(b.reason ?? "Reported").slice(0, 300), new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (path !== "/jeetu" || req.method !== "POST") return null;

  if (!(await flags(env)).jeetu) return json({ error: "Jeetu is switched off for now.", off: true }, 503);
  const body = await req.json<any>().catch(() => null);
  const cleaned = cleanFacts(body?.facts);
  if (!cleaned.ok) return bad(cleaned.error);
  const facts = cleaned.facts;
  if (!body || !(Array.isArray(body.messages) || facts)) return bad("messages is required");

  const ctx = body.context ?? {};
  const lang = chatLang(ctx.language);
  const hi = lang === "hi" ? "hi" : "en";
  let turns: ChatTurn[] = (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_TURNS)
    .map((t: any) => ({ role: t?.role === "assistant" ? "assistant" : "user", content: String(t?.content ?? "").slice(0, MAX_CHARS) } as ChatTurn))
    .filter((t: ChatTurn) => t.content.trim());
  // The chip tap sends only facts: ask for Jeetu's take on them.
  if (!turns.length && facts) turns = [{ role: "user", content: hi === "hi" ? "मेरे आँकड़े देखकर बताइए, आगे क्या करूँ?" : "Look at my facts and give me your take: what should I do next?" }];
  if (!turns.length || turns[turns.length - 1].role !== "user") return bad("The last message must be from the user");
  const fixed = (key: keyof typeof LINES) => json({ reply: LINES[key][hi], fixed: key, plan: null, ai: true, who: "Jeetu" });

  // Distress first, on every user turn (and in the facts): the care reply, never a model.
  const extra = await extraDistress(env).catch(() => [] as string[]);
  if (turns.some((t) => t.role === "user" && distress(t.content, extra)) || (facts && distress(JSON.stringify(facts), extra))) return json({ care: true, helplines: HELPLINES });
  if (quietHours()) return json({ reply: LINES.quiet[hi], quiet: true, fixed: "quiet", plan: null, ai: true, who: "Jeetu" });
  const last = turns[turns.length - 1].content;
  if (has(last, RANKS)) return fixed("ranks");
  if (has(last, FEELINGS)) return fixed("feelings");

  // Plus only, with a taste for new free members. Looked at first, counted only once Jeetu has answered.
  const id = member ?? body.memberId;
  const access = await jeetuAccess(env, id, false);
  if (!access.ok) return json({ error: LINES.plusOnly[hi], plusOnly: true, plus: access.plus, tasteEndsAt: access.tasteEndsAt }, 403);
  const who = access.who;
  const now = istNow();
  const name = { en: "English", hi: "Hindi", te: "Telugu" }[lang];
  const system = PROMPT.replace("{{app_language}}", name).replace("{{local_time_ist}}", now.toISOString().slice(11, 16) + " IST")
    .replace("{{facts}}", factsBlock(facts) || "None sent. Don't guess their numbers; ask what they have time for if a plan needs it.");
  const answer = async (text: string, model: string, extraFields: Record<string, unknown> = {}) => {
    const { reply, plan } = parseJeetu(text);
    const after = await jeetuAccess(env, id, true);
    return json({ reply: scrub(reply).text, plan, model, ai: true, who: "Jeetu", ...(after.plus ? {} : { tasteLeft: after.tasteLeft }), ...extraFields });
  };
  try {
    // Same switch ("chotu" in Admin → AI controls) and logging as cloud Chotu; Jeetu's own, stronger models.
    const { text, model } = await callChat(env, "chotu", [{ role: "system", content: system }, ...turns], JEETU_ROUTES[lang], who);
    return await answer(text, model, { lang });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ error: "Jeetu is offline right now.", offline: true }, 503);
    if (lang !== "en") {
      try {
        const { text, model } = await callChat(env, "chotu", [{ role: "system", content: system + "\n\nWrite the text in English." }, ...turns], JEETU_ROUTES.en, who);
        return await answer(text, model, { lang: "en", fallback: true });
      } catch { /* fall through */ }
    }
    return json({ error: "Jeetu couldn't answer just now. Try again in a minute.", offline: false }, 502);
  }
}
