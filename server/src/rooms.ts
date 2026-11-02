import { type Env, bad, istWeek, json } from "./shared";
import { bump, ensureSchema, flags, getSetting } from "./staff";
import { logEvent } from "./metrics";
import { type MatchFields, matchFields } from "./community";

/**
 * Open pods (sell-first plan, W3): pre-set rooms anyone can join on day 1, like Slack channels. A member can be in
 * several. Each room is a PodRoom Durable Object named by its id ("room-..."), so chat, the study room, Chotu's host
 * rituals and the AI study friends (still labelled AI) all work as they do in a pod.
 *
 * Until the community reaches `signupThreshold` sign-ups (500 by default, setting "growth"), rooms are the only pods:
 * /pods/join refuses new matched members and the apps show the room list. At or above it the matched 8-person pods
 * switch on, and the rooms stay as the public layer.
 *
 * Rooms against rooms: Friday's Quiz Night has the same five questions in every room, and /rooms/leaderboard ranks
 * the rooms by their one shared score. People are never ranked, named or counted on it. Each room also has a pinned
 * question for the day (POST /pin on the room, from the 07:00 "pins" job in community.ts).
 *
 * Photos in "Send to pod": POST /rooms/photo puts one JPEG in R2 (MEDIA, pod-photos/) for [PHOTO_DAYS] days, seen only
 * by members of that room or pod (GET /rooms/photo/<id>), then swept. Answer Studio's evaluation still keeps nothing:
 * this is a separate upload the member chooses, after the review.
 */

export interface OpenRoom { id: string; name: string; group: "language" | "attempt" | "goal" | "optional" | "region"; note: string }

export const OPEN_ROOMS: OpenRoom[] = [
  { id: "room-hindi-medium", name: "Hindi medium", group: "language", note: "हिंदी माध्यम के साथी। Notes, doubts and answer writing in Hindi." },
  { id: "room-english-medium", name: "English medium", group: "language", note: "Doubts, notes and daily targets in English." },
  { id: "room-telugu", name: "Telugu", group: "language", note: "తెలుగు మాధ్యమం. Study together in Telugu." },
  { id: "room-first-attempt", name: "First attempt", group: "attempt", note: "Starting out. Where to begin, what to skip, how to plan." },
  { id: "room-repeaters", name: "Repeaters", group: "attempt", note: "Second attempt and beyond. Fix what leaked last time." },
  { id: "room-working", name: "Working aspirants", group: "attempt", note: "Studying around a job. Mornings, commutes and weekends." },
  { id: "room-prelims-2027", name: "Prelims 2027 sprint", group: "goal", note: "Daily MCQs, PYQ habits and the countdown to Prelims 2027." },
  { id: "room-mains-writing", name: "Mains answer writing", group: "goal", note: "Post an answer, review two. Answer hour runs here too." },
  { id: "room-opt-psir", name: "Optional: PSIR", group: "optional", note: "Political Science and International Relations." },
  { id: "room-opt-sociology", name: "Optional: Sociology", group: "optional", note: "Thinkers, Indian society and answer practice." },
  { id: "room-opt-geography", name: "Optional: Geography", group: "optional", note: "Maps, models and diagrams." },
  { id: "room-opt-anthropology", name: "Optional: Anthropology", group: "optional", note: "Physical, social and Indian anthropology." },
  { id: "room-opt-history", name: "Optional: History", group: "optional", note: "Ancient to modern, with sources and maps." },
  { id: "room-north", name: "North", group: "region", note: "Delhi, UP, Rajasthan, Punjab, Haryana, the hill states and J&K." },
  { id: "room-south", name: "South", group: "region", note: "Telangana, AP, Karnataka, Tamil Nadu and Kerala." },
  { id: "room-east-ne", name: "East and Northeast", group: "region", note: "Bihar, Jharkhand, Odisha, Bengal and the Northeast." },
  { id: "room-west-central", name: "West and Central", group: "region", note: "Maharashtra, Gujarat, Goa, MP and Chhattisgarh." },
];
export const isOpenRoom = (id: string) => OPEN_ROOMS.some((r) => r.id === id);

export const DEFAULT_GROWTH = { signupThreshold: 500 };

/** Total sign-ups: every account ever made on the server. */
export async function signups(env: Env): Promise<number> {
  await ensureSchema(env);
  return (await env.DB.prepare("SELECT COUNT(*) AS n FROM accounts").first<{ n: number }>())?.n ?? 0;
}

/**
 * Day 1 (teaching plan: nobody starts alone): the rooms a new member is put in before they pick any. Their
 * language, their attempt and their goal, from the four matching fields. They can leave any of them.
 */
export function starterRooms(f: MatchFields): string[] {
  const lang = f.lang === "hindi" ? "room-hindi-medium" : f.lang === "telugu" ? "room-telugu" : "room-english-medium";
  const attempt = f.stage === "repeat" || f.attempt_band === "2-3" || f.attempt_band === "4+" ? "room-repeaters" : "room-first-attempt";
  const goal = f.stage === "mains" ? "room-mains-writing" : f.stage === "interview" ? null : "room-prelims-2027";
  return [lang, attempt, goal].filter((r): r is string => !!r);
}

/** Puts a member in their starter rooms once, the first time they're in none. Returns the rooms joined. */
async function startRooms(env: Env, memberId: string, f: MatchFields, mine: Set<string>): Promise<string[]> {
  if (mine.size || !(await flags(env)).pod_join) return [];
  const ids = starterRooms(f);
  const first = await env.DB.prepare("INSERT OR IGNORE INTO room_starters (member_id, rooms, at) VALUES (?, ?, ?)")
    .bind(memberId, ids.join(","), new Date().toISOString()).run();
  if (!first.meta.changes) return [];
  const at = new Date().toISOString();
  await env.DB.batch(ids.map((id) => env.DB.prepare("INSERT OR IGNORE INTO room_members (member_id, room_id, joined_at) VALUES (?, ?, ?)").bind(memberId, id, at)));
  await bump(env, "room_starts");
  await logEvent(env, "rooms_started", { memberId }, { rooms: ids.join(",") });
  ids.forEach((id) => mine.add(id));
  return ids;
}

/** "open" below the threshold (rooms only), "matched" at or above it (matched pods on, rooms stay). */
export async function podMode(env: Env): Promise<{ mode: "open" | "matched"; signups: number; threshold: number }> {
  const g = await getSetting(env, "growth", DEFAULT_GROWTH);
  const n = await signups(env);
  return { mode: n >= g.signupThreshold ? "matched" : "open", signups: n, threshold: g.signupThreshold };
}

/** A room needs this many answers in the week before it goes on the board, so two lucky taps don't top it. */
export const BOARD_MIN_ANSWERS = 10;
export const PHOTO_DAYS = 7;
const PHOTO_MAX_BYTES = 1_500_000;
const PHOTO_PREFIX = "pod-photos/";

const validId = (v: unknown) => /^[\w-]{16,64}$/.test(String(v ?? ""));
const roomStub = (env: Env, id: string) => env.POD.get(env.POD.idFromName(id));
export const roomPost = (env: Env, id: string, what: string, body?: unknown) =>
  roomStub(env, id).fetch(`https://pod/${what}?pod=${encodeURIComponent(id)}`, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

/** Real members per room (people only; Chotu and the AI friends are never counted). */
export async function roomCounts(env: Env): Promise<Map<string, number>> {
  await ensureSchema(env);
  const { results } = await env.DB.prepare("SELECT room_id, COUNT(*) AS n FROM room_members GROUP BY room_id").all<{ room_id: string; n: number }>();
  return new Map(results.map((r) => [r.room_id, r.n]));
}

/** In this open room, or in this matched pod. */
async function inRoom(env: Env, memberId: string, roomId: string): Promise<boolean> {
  const q = isOpenRoom(roomId)
    ? env.DB.prepare("SELECT 1 FROM room_members WHERE member_id = ? AND room_id = ?")
    : env.DB.prepare("SELECT 1 FROM members WHERE member_id = ? AND pod_id = ?");
  return !!(await q.bind(memberId, roomId).first());
}

/** This week's room board: rooms with enough answers, by their shared score. */
export async function roomBoard(env: Env) {
  const week = istWeek();
  const scores = await Promise.all(OPEN_ROOMS.map(async (r) => {
    const res = await roomStub(env, r.id).fetch(`https://pod/quiz-score?pod=${r.id}`).catch(() => null);
    const s = res?.ok ? await res.json<{ week: string | null; right: number; answered: number; pct: number | null; players: number }>() : null;
    return { id: r.id, name: r.name, group: r.group, ...(s?.week === week ? s : { right: 0, answered: 0, pct: null, players: 0 }) };
  }));
  const ranked = scores.filter((s) => s.answered >= BOARD_MIN_ANSWERS && s.pct !== null)
    .sort((a, b) => (b.pct! - a.pct!) || (b.answered - a.answered) || a.name.localeCompare(b.name));
  return {
    week, minAnswers: BOARD_MIN_ANSWERS,
    rooms: ranked.map(({ id, name, group, pct, answered, players }, i) => ({ rank: i + 1, id, name, group, pct, answered, players })),
    waiting: scores.filter((s) => !ranked.includes(s)).map(({ id, name, answered }) => ({ id, name, answered })),
  };
}

/** Deletes photos past their time (the daily 05:30 job), or every photo one member sent (erasure). */
export async function sweepPhotos(env: Env, opts: { member?: string; now?: number } = {}) {
  if (!env.MEDIA) return { deleted: 0 };
  const now = opts.now ?? Date.now();
  let cursor: string | undefined, deleted = 0;
  do {
    const page = await env.MEDIA.list({ prefix: PHOTO_PREFIX, cursor, include: ["customMetadata"] });
    const gone = page.objects.filter((o) => opts.member ? o.customMetadata?.member === opts.member : Number(o.customMetadata?.expires ?? 0) <= now).map((o) => o.key);
    if (gone.length) { await env.MEDIA.delete(gone); deleted += gone.length; }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return { deleted };
}

interface Activity { unread: number; lastTs: number | null; lastName: string | null; lastText: string | null; online: number }

/**
 * Rooms, open mode, membership, unread counts and recent activity. Routes: /rooms/list, /rooms/join, /rooms/leave
 * and the socket /rooms/<id>/ws. Returns null for other paths.
 */
export async function roomsRoute(req: Request, env: Env, path: string, url: URL): Promise<Response | null> {
  if (path === "/rooms/list" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const memberId = validId(body.memberId) ? String(body.memberId) : "";
    // seen: { roomId: last-read time in ms } from the phone. Unread is what others posted after it.
    const seen = (body.seen && typeof body.seen === "object") ? body.seen as Record<string, unknown> : {};
    await ensureSchema(env);
    const mine = memberId
      ? new Set((await env.DB.prepare("SELECT room_id FROM room_members WHERE member_id = ?").bind(memberId).all<{ room_id: string }>()).results.map((r) => r.room_id))
      : new Set<string>();
    // A member's first visit puts them in their starter rooms (the apps send the matching fields with the list).
    const started = memberId && body.start !== false ? await startRooms(env, memberId, matchFields(body), mine) : [];
    const counts = await roomCounts(env);
    const rooms = await Promise.all(OPEN_ROOMS.map(async (r) => {
      const since = Math.max(0, Number(seen[r.id]) || 0);
      const res = await roomStub(env, r.id).fetch(`https://pod/activity?pod=${r.id}&since=${since}&member=${encodeURIComponent(memberId)}`).catch(() => null);
      const a: Activity = res?.ok ? await res.json<Activity>() : { unread: 0, lastTs: null, lastName: null, lastText: null, online: 0 };
      // Unread only means something in a room you're in, and only once you've opened it.
      return { ...r, members: counts.get(r.id) ?? 0, joined: mine.has(r.id), ...a, unread: mine.has(r.id) ? a.unread : 0 };
    }));
    return json({ ...(await podMode(env)), rooms, started });
  }
  if ((path === "/rooms/join" || path === "/rooms/leave") && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const roomId = String(body.roomId ?? "");
    if (!validId(body.memberId) || !isOpenRoom(roomId)) return bad("memberId and a roomId from /rooms/list are required");
    await ensureSchema(env);
    if (path === "/rooms/leave") {
      await env.DB.prepare("DELETE FROM room_members WHERE member_id = ? AND room_id = ?").bind(body.memberId, roomId).run();
      return json({ ok: true, roomId, joined: false });
    }
    if (!(await flags(env)).pod_join) return bad("Joining is paused for now. Try again later.", 503);
    const r = await env.DB.prepare("INSERT OR IGNORE INTO room_members (member_id, room_id, joined_at) VALUES (?, ?, ?)")
      .bind(body.memberId, roomId, new Date().toISOString()).run();
    if (r.meta.changes) { await bump(env, "room_joins"); await logEvent(env, "room_joined", { memberId: body.memberId }, { room: roomId }); }
    return json({ ok: true, roomId, joined: true, members: (await roomCounts(env)).get(roomId) ?? 1 });
  }
  if (path === "/rooms/leaderboard" && req.method === "GET") return json(await roomBoard(env));
  if (path === "/rooms/photo" && req.method === "POST") {
    const body = await req.json<any>().catch(() => ({}));
    const roomId = String(body.roomId ?? "");
    const data = typeof body.image?.data === "string" ? body.image.data : "";
    if (!validId(body.memberId) || !/^[\w-]{4,64}$/.test(roomId) || body.image?.mime !== "image/jpeg" || !data) return bad("memberId, roomId and image {mime: image/jpeg, data} are required");
    if (!env.MEDIA) return bad("Photos aren't set up on this server", 503);
    if (!(await flags(env)).pod_chat) return bad("Pod chat is paused for now.", 503);
    await ensureSchema(env);
    if (!(await inRoom(env, body.memberId, roomId))) return bad("Join this room first", 403);
    const m = await env.DB.prepare("SELECT suspended_until FROM members WHERE member_id = ?").bind(body.memberId).first<{ suspended_until: string | null }>();
    if (m?.suspended_until && m.suspended_until > new Date().toISOString()) return bad("Your chat is paused by a moderator for now.", 403);
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0)); } catch { return bad("image data must be base64"); }
    if (bytes.length > PHOTO_MAX_BYTES) return bad("That photo is too big. Under 1.5 MB, please.", 413);
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bad("Only JPEG photos");
    const id = crypto.randomUUID().replace(/-/g, "");
    const expires = Date.now() + PHOTO_DAYS * 86400_000;
    await env.MEDIA.put(PHOTO_PREFIX + id + ".jpg", bytes, { httpMetadata: { contentType: "image/jpeg" }, customMetadata: { room: roomId, member: body.memberId, expires: String(expires) } });
    await bump(env, "pod_photos");
    return json({ ok: true, id, ref: "photo:" + id, expiresAt: new Date(expires).toISOString() });
  }
  const photo = path.match(/^\/rooms\/photo\/([0-9a-f]{32})$/);
  if (photo && req.method === "GET") {
    if (!env.MEDIA) return bad("Not found", 404);
    const obj = await env.MEDIA.get(PHOTO_PREFIX + photo[1] + ".jpg");
    if (!obj) return bad("This photo has gone. Photos are kept for 7 days.", 404);
    if (Number(obj.customMetadata?.expires ?? 0) <= Date.now()) return bad("This photo has gone. Photos are kept for 7 days.", 410);
    await ensureSchema(env);
    if (!(await inRoom(env, url.searchParams.get("member") ?? "", obj.customMetadata?.room ?? ""))) return bad("Only members of that room can see this photo", 403);
    return new Response(obj.body, { headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=3600", "access-control-allow-origin": "*" } });
  }
  const ws = path.match(/^\/rooms\/([\w-]+)\/ws$/);
  if (ws) {
    const memberId = url.searchParams.get("member") ?? "";
    if (!isOpenRoom(ws[1])) return bad("No such room", 404);
    await ensureSchema(env);
    if (!(await env.DB.prepare("SELECT 1 FROM room_members WHERE member_id = ? AND room_id = ?").bind(memberId, ws[1]).first())) return bad("Join this room first", 403);
    // A moderator's pause on a member covers rooms too.
    const m = await env.DB.prepare("SELECT suspended_until FROM members WHERE member_id = ?").bind(memberId).first<{ suspended_until: string | null }>();
    if (m?.suspended_until && m.suspended_until > new Date().toISOString()) return bad("Your chat is paused by a moderator for now.", 403);
    if (!(await flags(env)).pod_chat) return bad("Pod chat is paused for now.", 503);
    const fwd = new URL(req.url);
    fwd.searchParams.set("pod", ws[1]);
    return roomStub(env, ws[1]).fetch(new Request(fwd.toString(), req));
  }
  return null;
}
