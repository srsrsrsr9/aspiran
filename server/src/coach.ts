/**
 * What Chotu and Jeetu share (artefacts/chotu-jeetu-behaviour-rules-2026-11-22.md): the app's facts about a member's
 * own study, the hidden "offer Jeetu" marker in Chotu's replies, and Jeetu's plan. Pure functions, so the tests can
 * run them without a server (test/coach.mjs).
 *
 * The app keeps the record and does the counting; these facts are what it sends. The models only read them, as
 * data: every number is used as given, and nothing inside the facts is ever followed as an instruction.
 */

export type Fact = string | number | boolean | null | Fact[] | { [k: string]: Fact };
export type Facts = { [k: string]: Fact };

export const FACTS_LIMITS = { maxChars: 4000, maxKeys: 40, maxItems: 12, maxString: 200, maxDepth: 3 };
const KEY = /^[A-Za-z_][\w]{0,39}$/;

/** One string, single line, no prompt slots or markers, at most maxString characters. */
const cleanString = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/[{}[\]`<>]/g, "").replace(/\s+/g, " ").trim().slice(0, FACTS_LIMITS.maxString);

function cleanValue(v: unknown, depth: number): Fact | undefined {
  if (v === null) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") { const s = cleanString(v); return s ? s : undefined; }
  if (depth >= FACTS_LIMITS.maxDepth) return undefined;
  if (Array.isArray(v)) {
    const out = v.slice(0, FACTS_LIMITS.maxItems).map((x) => cleanValue(x, depth + 1)).filter((x): x is Fact => x !== undefined);
    return out.length ? out : undefined;
  }
  if (typeof v === "object") {
    const out: Facts = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>).slice(0, FACTS_LIMITS.maxKeys)) {
      if (!KEY.test(k)) continue;
      const c = cleanValue(x, depth + 1);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

/**
 * The facts a client sent, cleaned: `{ok: true, facts}` (null if none were sent or nothing usable was left), or
 * `{ok: false}` if `facts` isn't an object at all. Unknown shapes inside are dropped rather than refused, so an
 * older or newer app never breaks a chat. Over the size cap, keys are dropped from the end until it fits.
 */
export function cleanFacts(raw: unknown): { ok: true; facts: Facts | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, facts: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "facts must be an object" };
  const c = cleanValue(raw, 0) as Facts | undefined;
  if (!c) return { ok: true, facts: null };
  const keys = Object.keys(c);
  while (keys.length && JSON.stringify(c).length > FACTS_LIMITS.maxChars) delete c[keys.pop()!];
  return { ok: true, facts: keys.length ? c : null };
}

/** The facts as lines for a prompt: "- week: minutes 340, questions 85". Empty when there are none. */
export function factsBlock(facts: Facts | null): string {
  if (!facts) return "";
  const show = (v: Fact): string => Array.isArray(v) ? v.map(show).join("; ")
    : v && typeof v === "object" ? Object.entries(v).map(([k, x]) => `${k.replace(/_/g, " ")} ${show(x)}`).join(", ")
    : String(v);
  return Object.entries(facts).map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${show(v)}`).join("\n");
}

/** True when the facts show a pattern worth Jeetu's look: planned and missed 3+ times, or a topic under 50% for 2+ weeks. */
export function factsPattern(facts: Facts | null): boolean {
  if (!facts) return false;
  if (typeof facts.missed_plans === "number" && facts.missed_plans >= 3) return true;
  const stuck = Array.isArray(facts.stuck_topics) ? facts.stuck_topics : [];
  return stuck.some((s) => !!s && typeof s === "object" && !Array.isArray(s)
    && typeof s.accuracy === "number" && s.accuracy < 50 && typeof s.weeks === "number" && s.weeks >= 2);
}

/** Chotu ends a reply with this when he offers Jeetu. Never shown: the server strips it and sets offerJeetu. */
export const JEETU_MARKER = "[[JEETU]]";
const MARKER = /\[{1,2}\s*jeetu\s*\]{1,2}/gi;

/** The reply without the marker, and whether it was there. */
export function takeJeetuMarker(text: string): { text: string; offerJeetu: boolean } {
  const offerJeetu = MARKER.test(text);
  MARKER.lastIndex = 0;
  return { text: text.replace(MARKER, "").replace(/[ \t]+\n/g, "\n").replace(/\s+$/, "").trim(), offerJeetu };
}

/**
 * Lines neither of them may say (spec §3): guilt, empty cheer and streak talk. A sentence carrying one is dropped;
 * if that leaves nothing, the reply is kept as it was (the model's other rules still apply) and the drop is noted.
 */
export const BANNED = [
  /you['’]?ve got this/i, /don['’]?t worry/i, /just stay positive/i, /\bhustle\b/i, /don['’]?t give up/i,
  /i['’]?m disappointed/i, /you disappointed me/i, /i missed you/i, /you haven['’]?t studied/i, /you missed (it|your|the|a)\b/i,
  /\bin a row\b/i, /\bstreak\b/i, /don['’]?t break (it|the)/i, /no pain,? no gain/i,
  /चिंता मत (करो|करें|कीजिए)/, /हार मत मानो/, /लगातार \d+ दिन/,
];
export function scrub(text: string): { text: string; dropped: number } {
  const parts = text.split(/(?<=[.!?।])\s+/);
  const kept = parts.filter((p) => !BANNED.some((b) => b.test(p)));
  const dropped = parts.length - kept.length;
  return dropped && kept.join(" ").trim() ? { text: kept.join(" ").trim(), dropped } : { text, dropped: 0 };
}

// --- Jeetu's plan --------------------------------------------------------------------------------------------------

export interface PlanItem { what: string; when: string; minutes: number }
export interface Plan { items: PlanItem[]; why: string }

const line = (v: unknown, n: number) => typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "";

/** A plan the apps can show, or null: 1 to 3 items, each with what, when and whole minutes (5 to 240), and one why line. */
export function cleanPlan(raw: unknown): Plan | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const items = (Array.isArray(r.items) ? r.items : []).map((x: any): PlanItem | null => {
    const what = line(x?.what, 120), when = line(x?.when, 40);
    const minutes = Math.round(Number(x?.minutes));
    if (!what || !when || !Number.isFinite(minutes) || minutes < 5 || minutes > 240) return null;
    return { what, when, minutes };
  }).filter((x): x is PlanItem => !!x).slice(0, 3);
  const why = line(r.why, 200).split(/(?<=[.!?।])\s/)[0] ?? "";
  return items.length && why ? { items, why } : null;
}

/**
 * Jeetu's reply, which the prompt asks for as one JSON object {"reply": "...", "plan": {...} | null}. Models
 * sometimes wrap it in a code fence or add a sentence around it, so the first {...} is taken. Not JSON at all:
 * the text is the reply and there's no plan.
 */
export function parseJeetu(text: string): { reply: string; plan: Plan | null } {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const o = JSON.parse(text.slice(start, end + 1));
      const plan = cleanPlan(o?.plan);
      const reply = line(o?.reply, 600) || plan?.why || "";
      if (reply) return { reply, plan };
    } catch { /* not JSON: fall through */ }
  }
  return { reply: text.replace(/```(json)?/g, "").trim(), plan: null };
}
