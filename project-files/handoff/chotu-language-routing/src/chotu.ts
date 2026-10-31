import { AiBlocked, CHAT_ROUTES, type ChatTurn, callChat, chatLang } from "./ai";
import PROMPT from "./chotu-prompt.txt";
import { extraDistress } from "./langs";
import { type Env, HELPLINES, bad, distress, istNow, json } from "./shared";

/**
 * Chotu's two server jobs:
 * 1. Hand phones the on-device model files (`/models`, `/models/files/<name>`). Phones only ever talk to this
 *    server and no Hugging Face account or token is involved. The bytes come from the first place that has them:
 *    the dev folder (`npm run models`), then R2, then the pinned Hugging Face commit, passed straight through.
 * 2. Cloud Chotu (`POST /chotu`), for phones without the on-device model, until launch. Each language the aspirant
 *    can pick for Chotu has its own models (CHAT_ROUTES in ai.ts), so no one provider carries everything.
 *    Logs metadata only (ai.ts); the chat itself is never stored or logged.
 */

// --- Model files ---------------------------------------------------------------------------------

/** Pinned files the phone can download. Same bytes as the Hugging Face commits noted, checked by SHA-256. */
const MODELS = [
  {
    // litert-community/gemma-4-E4B-it-litert-lm @ 2eee7ac325f20eb8c9ac1d0e972f7c84663062da (Apache-2.0, ungated)
    id: "gemma-4-e4b", label: "Chotu Large", file: "gemma-4-E4B-it.litertlm",
    source: "https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/2eee7ac325f20eb8c9ac1d0e972f7c84663062da/gemma-4-E4B-it.litertlm",
    bytes: 3_659_530_240, sha256: "0b2a8980ce155fd97673d8e820b4d29d9c7d99b8fa6806f425d969b145bd52e0", minRamGb: 7.5, noThink: false,
  },
  {
    // litert-community/gemma-4-E2B-it-litert-lm @ b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1 (Apache-2.0, ungated)
    id: "gemma-4-e2b", label: "Chotu Standard", file: "gemma-4-E2B-it.litertlm",
    source: "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1/gemma-4-E2B-it.litertlm",
    bytes: 2_588_147_712, sha256: "181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c", minRamGb: 5.0, noThink: false,
  },
  {
    // litert-community/Qwen3-0.6B @ a3c5d805ae362dff7f580bc25f2dfb9a5a7eaa76 (Apache-2.0, ungated)
    id: "qwen3-0.6b-int4", label: "Chotu Lite", file: "qwen3_0_6b_mixed_int4.litertlm",
    source: "https://huggingface.co/litert-community/Qwen3-0.6B/resolve/a3c5d805ae362dff7f580bc25f2dfb9a5a7eaa76/qwen3_0_6b_mixed_int4.litertlm",
    bytes: 497_516_544, sha256: "7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1", minRamGb: 3.5, noThink: true,
  },
];

type Model = (typeof MODELS)[number];

/** Passes a remote file through (following redirects), keeping Range so phones can resume. Null if it isn't there. */
async function passThrough(url: string, method: "GET" | "HEAD", req: Request): Promise<Response | null> {
  const range = req.headers.get("range");
  const res = await fetch(url, { method, headers: range ? { range } : {}, redirect: "follow" }).catch(() => null);
  if (!res || !(res.status === 200 || res.status === 206)) return null;
  const headers = new Headers();
  for (const h of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("content-type", "application/octet-stream");
  return new Response(method === "HEAD" ? null : res.body, { status: res.status, headers });
}

/** A model file from the first place that has it: the dev folder, then R2, then the pinned Hugging Face commit. */
async function modelFile(env: Env, m: Model, req: Request): Promise<Response> {
  const method = req.method === "HEAD" ? "HEAD" : "GET";
  if (env.MODEL_FILES_URL) {
    const res = await passThrough(`${env.MODEL_FILES_URL.replace(/\/+$/, "")}/${encodeURIComponent(m.file)}`, method, req);
    if (res) return res;
  }
  const key = `models/${m.file}`;
  const head = env.MEDIA ? await env.MEDIA.head(key) : null;
  if (env.MEDIA && head) {
    if (method === "HEAD") return new Response(null, { headers: { "content-length": String(head.size), "accept-ranges": "bytes", etag: head.httpEtag } });
    const obj = await env.MEDIA.get(key, { range: req.headers });
    if (obj) {
      const headers = new Headers({ "content-type": "application/octet-stream", "accept-ranges": "bytes", etag: obj.httpEtag });
      const r = obj.range as { offset?: number; length?: number } | undefined;
      if (req.headers.has("range") && r && r.offset !== undefined) {
        const length = r.length ?? obj.size - r.offset;
        headers.set("content-range", `bytes ${r.offset}-${r.offset + length - 1}/${obj.size}`);
        headers.set("content-length", String(length));
        return new Response(obj.body, { status: 206, headers });
      }
      headers.set("content-length", String(obj.size));
      return new Response(obj.body, { headers });
    }
  }
  // Same bytes as the pinned commit; the phone checks the SHA-256 before using it either way.
  return (await passThrough(m.source, method, req)) ?? bad("This model file can't be reached right now. Try again later.", 503);
}

// Which models can be downloaded, remembered for 10 minutes so /models doesn't ask Hugging Face every time.
let presentCache: { at: number; ids: string[] } | null = null;

/** `/models` and `/models/files/<name>`. Returns null for other paths. */
export async function modelsRoute(req: Request, env: Env, path: string): Promise<Response | null> {
  if (path === "/models") {
    // Only files that are actually there, so a phone never picks a model it can't download.
    if (!presentCache || Date.now() - presentCache.at > 10 * 60_000) {
      const ok = await Promise.all(MODELS.map(async (m) => {
        const res = await modelFile(env, m, new Request("http://x/", { method: "HEAD" }));
        return res.ok && Number(res.headers.get("content-length")) === m.bytes;
      }));
      presentCache = { at: Date.now(), ids: MODELS.filter((_, i) => ok[i]).map((m) => m.id) };
    }
    const models = MODELS.filter((m) => presentCache!.ids.includes(m.id)).map(({ source: _source, ...m }) => ({ ...m, url: `/models/files/${m.file}` }));
    return new Response(JSON.stringify({ models }), {
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-cache" },
    });
  }
  const m = path.match(/^\/models\/files\/([\w.-]+)$/);
  if (m && (req.method === "GET" || req.method === "HEAD")) {
    const model = MODELS.find((x) => x.file === m[1]);
    if (!model) return bad("Unknown model file", 404);
    return modelFile(env, model, req);
  }
  return null;
}

// --- Cloud Chotu -----------------------------------------------------------------------------------

const MAX_TURNS = 8;
const MAX_CHARS = 2000;

/**
 * Fills {{slots}}. Within a line, a part ("Label: {{slot}}" between " · ", ". " or " / ") whose slot came out
 * empty is dropped; a line left with no filled slot is dropped, so the model only sees what's known.
 */
export function fillPrompt(slots: Record<string, string>): string {
  const SLOT = /\{\{(\w+)\}\}/g;
  const has = (seg: string) => /\{\{\w+\}\}/.test(seg);
  const filled = (seg: string) => [...seg.matchAll(SLOT)].every((x) => (slots[x[1]] ?? "").trim());
  const out: string[] = [];
  for (const line of PROMPT.split("\n")) {
    if (!has(line)) { out.push(line); continue; }
    const parts = line.split(/( · |\. | \/ )/); // even: text, odd: the separator before the next part
    let kept = "", anyFilled = false;
    for (let i = 0; i < parts.length; i += 2) {
      if (has(parts[i]) && !filled(parts[i])) continue;
      if (has(parts[i])) anyFilled = true;
      kept += (kept ? parts[i - 1] : "") + parts[i];
    }
    if (!anyFilled) continue;
    const bullet = line.match(/^\s*- /)?.[0];
    if (bullet && !kept.startsWith(bullet)) kept = bullet + kept;
    if (line.trimEnd().endsWith(".") && !kept.trimEnd().endsWith(".")) kept += ".";
    out.push(kept.replace(SLOT, (_, k) => slots[k].trim()));
  }
  return out.join("\n").trim();
}

/**
 * POST /chotu {mode: "talk" | "prep" | "plan" ("chat"/"explain" also accepted), messages: [{role, content}],
 * context: {language?, chotu_language?, notes?}}. chotu_language ("en", "hi" or "te") picks the models; without it
 * the app language does.
 * The phone checks for distress before sending; this checks again and never calls the model on a match.
 */
export async function chotuChat(req: Request, env: Env): Promise<Response> {
  const body = await req.json<any>().catch(() => null);
  if (!body || !Array.isArray(body.messages)) return bad("messages is required");
  const turns: ChatTurn[] = body.messages.slice(-MAX_TURNS)
    .map((t: any) => ({ role: t?.role === "assistant" ? "assistant" : "user", content: String(t?.content ?? t?.text ?? "").slice(0, MAX_CHARS) } as ChatTurn))
    .filter((t: ChatTurn) => t.content.trim());
  if (!turns.length || turns[turns.length - 1].role !== "user") return bad("The last message must be from the user");

  const extra = await extraDistress(env).catch(() => [] as string[]);
  if (turns.some((t) => t.role === "user" && distress(t.content, extra))) {
    return json({ care: true, helplines: HELPLINES });
  }

  // Slots the app can fill today; the rest are dropped. Time and day come from the server's clock (IST).
  const ctx = body.context ?? {};
  const str = (v: unknown, n: number) => String(v ?? "").replace(/[{}]/g, "").slice(0, n);
  const now = istNow();
  const lang = chatLang(ctx.chotu_language ?? ctx.language);
  const prompt = fillPrompt({
    mode: ["talk", "prep", "plan"].includes(body.mode) ? body.mode : body.mode === "explain" ? "prep" : "talk",
    // Chotu answers in the language picked for it, if one was picked; otherwise in the app's.
    app_language: ctx.chotu_language ? { en: "English", hi: "Hindi", te: "Telugu" }[lang] : str(ctx.language, 40),
    // nickname and stage are never filled: they stay on the phone, even if a client sends them.
    local_time_ist: now.toISOString().slice(11, 16) + " IST",
    day_of_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getUTCDay()],
    quiet_hours_start: "23:30",
    retrieved_notes: str(ctx.notes, 4000),
  });
  try {
    const { text, model } = await callChat(env, "chotu", [{ role: "system", content: prompt }, ...turns], CHAT_ROUTES[lang]);
    return json({ reply: text, model, lang, ai: true });
  } catch (e) {
    if (e instanceof AiBlocked) return json({ error: "Chotu is offline right now.", offline: true }, 503);
    return json({ error: "Chotu couldn't answer just now. Try again in a minute.", offline: false }, 502);
  }
}
