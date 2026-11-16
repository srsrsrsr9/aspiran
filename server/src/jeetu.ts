import { AiBlocked, CHAT_ROUTES, type ChatTurn, callChat, chatLang } from "./ai";
import PROMPT from "./jeetu-prompt.txt";
import { extraDistress } from "./langs";
import { useAllowance } from "./plus";
import { type Env, HELPLINES, bad, distress, istNow, json } from "./shared";
import { ensureSchema, flags } from "./staff";

/**
 * Jeetu · AI, the method coach from the trailer (artefacts/jeetu-2026-11-14.md). Chotu does the content; Jeetu only
 * the method: answer first, review before you forget, "How sure?", write → mark → second opinion → rewrite.
 *
 * POST /jeetu {messages: [{role, content}], context: {language?}, memberId?}. Before any model is called the server
 * checks, in order: the `jeetu` flag, quiet hours (23:30 to 07:00 IST), distress (care reply, never a model), then
 * ranks, results and feelings (one fixed line each, never a model). The chat itself is never stored or logged.
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
  feelings: { en: "That deserves a real person, beta, not me. Talk to someone you trust: your pod, a friend, family. I'm here for the method whenever you want it.", hi: "इसके लिए कोई असली इंसान चाहिए, बेटा, मैं नहीं। किसी भरोसे वाले से बात करो: अपना पॉड, कोई दोस्त, घर वाले। तरीक़े की बात करनी हो तो मैं यहीं हूँ।" },
};

export async function jeetuRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/jeetu/report" && req.method === "POST") {
    const b = await req.json<any>().catch(() => ({}));
    const id = String(b.messageId ?? "");
    if (!/^[\w-]{8,64}$/.test(id)) return bad("messageId is required");
    await ensureSchema(env);
    await env.DB.prepare("INSERT INTO reports (kind, pod_id, message_id, author, text, reason, created_at) VALUES ('chotu', 'jeetu', ?, 'Jeetu · AI', ?, ?, ?)")
      .bind(id, String(b.text ?? "").slice(0, 2000), String(b.reason ?? "Reported").slice(0, 300), new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (path !== "/jeetu" || req.method !== "POST") return null;

  if (!(await flags(env)).jeetu) return json({ error: "Jeetu is switched off for now.", off: true }, 503);
  const body = await req.json<any>().catch(() => null);
  if (!body || !Array.isArray(body.messages)) return bad("messages is required");
  const turns: ChatTurn[] = body.messages.slice(-MAX_TURNS)
    .map((t: any) => ({ role: t?.role === "assistant" ? "assistant" : "user", content: String(t?.content ?? "").slice(0, MAX_CHARS) } as ChatTurn))
    .filter((t: ChatTurn) => t.content.trim());
  if (!turns.length || turns[turns.length - 1].role !== "user") return bad("The last message must be from the user");

  const ctx = body.context ?? {};
  const lang = chatLang(ctx.language);
  const hi = lang === "hi" ? "hi" : "en";
  const fixed = (key: keyof typeof LINES) => json({ reply: LINES[key][hi], fixed: key, ai: true, who: "Jeetu · AI" });

  // Distress first, on every user turn: the care reply, never a model.
  const extra = await extraDistress(env).catch(() => [] as string[]);
  if (turns.some((t) => t.role === "user" && distress(t.content, extra))) return json({ care: true, helplines: HELPLINES });
  if (quietHours()) return json({ reply: LINES.quiet[hi], quiet: true, fixed: "quiet", ai: true, who: "Jeetu · AI" });
  const last = turns[turns.length - 1].content;
  if (has(last, RANKS)) return fixed("ranks");
  if (has(last, FEELINGS)) return fixed("feelings");

  if (/^[\w-]{16,64}$/.test(String(body.memberId ?? ""))) {
    const allow = await useAllowance(env, body.memberId, "chotu");
    if (!allow.ok) return json({ error: "Jeetu's out of turns for today. Come back tomorrow.", limit: true, offline: true }, 429);
  }
  const now = istNow();
  const name = { en: "English", hi: "Hindi", te: "Telugu" }[lang];
  const system = PROMPT.replace("{{app_language}}", name).replace("{{local_time_ist}}", now.toISOString().slice(11, 16) + " IST");
  try {
    // Same switch ("chotu" in Admin → AI controls), models and logging as cloud Chotu.
    const { text, model } = await callChat(env, "chotu", [{ role: "system", content: system }, ...turns], CHAT_ROUTES[lang]);
    return json({ reply: text, model, lang, ai: true, who: "Jeetu · AI" });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ error: "Jeetu is offline right now.", offline: true }, 503);
    if (lang !== "en") {
      try {
        const { text, model } = await callChat(env, "chotu", [{ role: "system", content: system + "\n\nAnswer in English." }, ...turns], CHAT_ROUTES.en);
        return json({ reply: text, model, lang: "en", ai: true, who: "Jeetu · AI", fallback: true });
      } catch { /* fall through */ }
    }
    return json({ error: "Jeetu couldn't answer just now. Try again in a minute.", offline: false }, 502);
  }
}
