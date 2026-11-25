import { type Env, istDay } from "./shared";
import { bump, ensureSchema, sha256Hex } from "./staff";

/**
 * Day-long cut-offs for free members and visitors (owner's decision, 24 Nov 2026, artefacts/decisions-2026-11-24.md
 * "AI" point 2). Online Chotu for them is a marketing cost, so someone who is clearly abusing it is stopped for the
 * rest of the day (IST), for any one of:
 * - volume: more than 100 messages in a day;
 * - speed: messages faster than one every 2 seconds for a whole minute (31 within 60 seconds);
 * - accounts: more than 3 accounts using Chotu on one device within a week;
 * - off-topic: a long run of messages (8 in a row) that have nothing to do with study, as marked by the model.
 * The person sees one calm, plain line (CUT_LINE), never an accusation. Plus members are never cut off here: their
 * limit is the hidden monthly one (plus.ts plusRoutes). Each cut-off adds to the admin count "ai_cutoff:<reason>".
 * Only counts, times and hashes are kept; never what anyone wrote.
 */

export const GUARD = { maxPerDay: 100, burst: 31, burstMs: 60_000, maxAccountsPerDevice: 3, deviceDays: 7, offTopicRun: 8 };
export type CutReason = "volume" | "speed" | "accounts" | "offtopic";

export const CUT_LINE = {
  en: "Chotu is resting for the rest of today. Your notes, practice and Chai are all still here, and Chotu is back tomorrow.",
  hi: "छोटू आज बाकी दिन आराम कर रहा है। आपके नोट्स, प्रैक्टिस और चाय सब यहीं हैं, और छोटू कल फिर मिलेगा।",
};

/** The model ends a reply with this when the message had nothing to do with study. Never shown: always stripped. */
export const OFF_MARKER = "[[OFF]]";
const OFF = /\[{1,2}\s*off\s*\]{1,2}/gi;
export function takeOffMarker(text: string): { text: string; offTopic: boolean } {
  const offTopic = OFF.test(text);
  OFF.lastIndex = 0;
  return { text: text.replace(OFF, "").replace(/[ \t]+\n/g, "\n").trim(), offTopic };
}

interface Row { n: number; recent: string | null; offtopic: number; cut: string | null }

/** Pure: given a key's row for today and the time now, what it becomes and whether that cuts it off. Tested in test/coach.mjs. */
export function nextRow(row: Row | null, now: number): { row: Row; cut: CutReason | null } {
  const n = (row?.n ?? 0) + 1;
  let recent: number[] = [];
  try { recent = JSON.parse(row?.recent ?? "[]").filter((x: unknown) => typeof x === "number"); } catch { /* start again */ }
  recent = [...recent, now].slice(-GUARD.burst);
  const cut: CutReason | null = n > GUARD.maxPerDay ? "volume"
    : recent.length >= GUARD.burst && now - recent[0] <= GUARD.burstMs ? "speed" : null;
  return { row: { n, recent: JSON.stringify(recent), offtopic: row?.offtopic ?? 0, cut: row?.cut ?? cut }, cut };
}

/** Who is asking, as guard keys: the member (or the network, for a visitor) and, if the app sent one, the device. */
export async function guardKeys(member: string | null, ip: string, installId: unknown): Promise<{ key: string; device: string | null }> {
  const key = member ? "m:" + member : "v:" + (await sha256Hex("guard:" + ip + ":" + istDay())).slice(0, 24);
  const device = /^[\w-]{8,64}$/.test(String(installId ?? "")) ? "d:" + (await sha256Hex("device:" + installId)).slice(0, 24) : null;
  return { key, device };
}

async function cutOff(env: Env, k: string, day: string, reason: CutReason) {
  await env.DB.prepare("INSERT INTO ai_guard (k, day, n, cut) VALUES (?, ?, 0, ?) ON CONFLICT(k, day) DO UPDATE SET cut = COALESCE(ai_guard.cut, excluded.cut)").bind(k, day, reason).run();
  await bump(env, "ai_cutoff:" + reason).catch(() => {});
}

/**
 * Before a model is asked: counts this message and returns the reason if this person is cut off for today (already, or
 * by this message), else null. A failure here never stops a chat.
 */
export async function guardBefore(env: Env, keys: { key: string; device: string | null }, member: string | null, now = Date.now()): Promise<CutReason | null> {
  try {
    await ensureSchema(env);
    const day = istDay();
    const get = (k: string) => env.DB.prepare("SELECT n, recent, offtopic, cut FROM ai_guard WHERE k = ? AND day = ?").bind(k, day).first<Row>();
    if (keys.device) {
      const d = await get(keys.device);
      if (d?.cut) return d.cut as CutReason;
      if (member) {
        await env.DB.prepare("INSERT INTO device_members (device, member_id, day) VALUES (?, ?, ?) ON CONFLICT(device, member_id) DO UPDATE SET day = excluded.day").bind(keys.device, member, day).run();
        const since = new Date(Date.parse(day + "T00:00:00Z") - (GUARD.deviceDays - 1) * 86400_000).toISOString().slice(0, 10);
        const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM device_members WHERE device = ? AND day >= ?").bind(keys.device, since).first<{ n: number }>();
        if ((c?.n ?? 0) > GUARD.maxAccountsPerDevice) { await cutOff(env, keys.device, day, "accounts"); return "accounts"; }
      }
    }
    const old = await get(keys.key);
    if (old?.cut) return old.cut as CutReason;
    const { row, cut } = nextRow(old, now);
    await env.DB.prepare("INSERT INTO ai_guard (k, day, n, recent, offtopic, cut) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(k, day) DO UPDATE SET n = excluded.n, recent = excluded.recent, cut = COALESCE(ai_guard.cut, excluded.cut)")
      .bind(keys.key, day, row.n, row.recent, row.offtopic, row.cut).run();
    if (cut) { await bump(env, "ai_cutoff:" + cut).catch(() => {}); return cut; }
    return null;
  } catch (e) {
    console.log("guard failed", String(e));
    return null;
  }
}

/** After a reply: an off-topic message adds to the run, any other resets it. A long run cuts off from the next message. */
export async function guardAfter(env: Env, key: string, offTopic: boolean): Promise<void> {
  try {
    const day = istDay();
    const r = await env.DB.prepare(`UPDATE ai_guard SET offtopic = ${offTopic ? "offtopic + 1" : "0"} WHERE k = ? AND day = ? RETURNING offtopic`).bind(key, day).first<{ offtopic: number }>();
    if (offTopic && (r?.offtopic ?? 0) >= GUARD.offTopicRun) await cutOff(env, key, day, "offtopic");
  } catch (e) { console.log("guard failed", String(e)); }
}

/** Nightly: guard rows and device links older than 8 days go (nothing in them is needed after a week). */
export async function pruneGuard(env: Env) {
  await ensureSchema(env);
  const cut = new Date(Date.now() - 8 * 86400_000).toISOString().slice(0, 10);
  const a = await env.DB.prepare("DELETE FROM ai_guard WHERE day < ?").bind(cut).run();
  const b = await env.DB.prepare("DELETE FROM device_members WHERE day < ?").bind(cut).run();
  return { guard: a.meta?.changes ?? 0, devices: b.meta?.changes ?? 0 };
}
