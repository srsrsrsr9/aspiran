import { DurableObject } from "cloudflare:workers";
import { anonymise } from "./anonymise";
import { type Env, HELPLINES, distress, istDay, istNow, newId } from "./shared";
import { extraDistress } from "./langs";
import { bump, flags } from "./staff";
import { AiBlocked, callGroq } from "./ai";
import { fillPrompt } from "./chotu";
import { HOST_SCHEDULE } from "./community";
import { type QuizQ, friendLevel, friendPosts, inQuietHours, isStudyWin, reaction } from "./friends";

/**
 * One pod of up to 8 members (matched starts are 6 to 8): chat, chai pings, ritual posts and a shared study room.
 * Uses hibernatable WebSockets, so an idle pod costs nothing.
 *
 * Client → server: hello is implicit (member and name come from the URL), then
 *   {type:"say", text, clientId} · {type:"chai_ping"} · {type:"report", id, reason}
 *   {type:"room_start", minutes} · {type:"room_join"} · {type:"room_leave"}
 *   {type:"say", kind:"favour"|"offer", ...} for the favours strip (nothing counted or ranked)
 *   {type:"ask_lead", text} · {type:"lead_reply", to, text}: private notes between a member and the pod lead
 *   {type:"goal_set", text, target} (lead, or anyone while there's no lead) · {type:"goal_add", n}: one shared bar
 *   {type:"claim", ritual}: a person runs this week's ritual, so Chotu stays out of it
 *   {type:"quiz_answer", q, choice} · {type:"thanks", id}
 *   A "say" that mentions @Chotu also goes to Chotu: only that message, names swapped for Member A/B,
 *   after the distress check. Chotu's reply is posted to the pod, labelled AI.
 * Server → client:
 *   {type:"history", messages, online, room, lead, youAreLead, private, goal, quiz, thanked, thankedYou}
 *   {type:"msg", message} · {type:"presence", online} · {type:"private", message}
 *   {type:"room", room} · {type:"hidden", id} · {type:"care", helplines} · {type:"error", message}
 *   {type:"goal", goal} · {type:"quiz", quiz} · {type:"quiz_result", q, right, answerIndex, explanation}
 *   {type:"thanked", id} · {type:"thanks_received"} · {type:"moved", to}
 *
 * Chotu hosts (POST /host from the half-hourly cron): at most 2 posts a day, none from 23:30 to 07:00 IST,
 * never about any one member. Chotu is never a member and never counted.
 *
 * Pod friends (POST /friends from the same cron, src/friends.ts): four AI study friends, labelled "· AI", with member
 * ids "friend:...". They post in the pod only, never privately, are never counted or thanked, keep quiet hours, and
 * do less as more real people join. They cheer a plain study win in general words, never a message about feelings.
 */

type Kind = "chat" | "ping" | "ritual" | "system" | "favour" | "offer" | "chotu" | "quiz" | "friend" | "friend_quiz";
const HUMAN_KINDS = ["chat", "favour", "offer"];
const CHOTU = "Chotu · AI";
const HOST_SLOTS = ["goal", "answer_hour", "quiz", "wins"];
const CHOTU_REPLIES_PER_DAY = 20;

interface Goal { text: string; target: number; unit: string; done: number; week: string; setBy: "lead" | "chotu" | "member" }
interface Quiz { id: string; week: string; questions: { topic: string; question: string; options: string[]; answerIndex: number; explanation?: string }[]; answers: Record<string, Record<number, number>>; lastWeekPct: number | null }
/** Monday of the IST week, as a day. */
const weekOf = (at = new Date()) => { const d = new Date(istDay(at) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };

interface Message {
  id: string;
  memberId: string;
  name: string;
  text: string;
  ts: number;
  kind: Kind;
  clientId?: string;
  /** Private notes only: the member the note is for. */
  to?: string;
}

interface Attachment {
  memberId: string;
  name: string;
  studying: boolean;
}

interface Room {
  startedAt: number;
  minutes: number;
  startedBy: string;
}

const HISTORY = 100;
const MAX_LEN = 1000;
const PER_MINUTE = 10;

export class PodRoom extends DurableObject<Env> {
  private sql: SqlStorage;
  private recent = new Map<string, number[]>();
  private podId = "";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, member_id TEXT, name TEXT, text TEXT, ts INTEGER, kind TEXT, hidden INTEGER DEFAULT 0)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`);
    // "Ask the lead privately": seen only by the member and the pod lead.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS private (
      id TEXT PRIMARY KEY, from_id TEXT, from_name TEXT, to_id TEXT, text TEXT, ts INTEGER)`);
    // 🙏 thanks: shown on the message, never as a count on a person. They feed the helper's own stamp.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS thanks (msg_id TEXT, from_id TEXT, to_id TEXT, ts INTEGER, PRIMARY KEY (msg_id, from_id))`);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pod = url.searchParams.get("pod");
    if (pod) this.setMeta("pod", pod);
    this.podId = this.getMeta("pod") ?? "";

    if (url.pathname.endsWith("/ws")) {
      if (req.headers.get("upgrade") !== "websocket") return new Response("Expected WebSocket", { status: 426 });
      const memberId = url.searchParams.get("member") ?? "";
      const name = (url.searchParams.get("name") ?? "Member").slice(0, 40);
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ memberId, name, studying: false } satisfies Attachment);
      // The first member to join leads until a moderator changes it (POST /lead). Open rooms (rooms.ts) have no lead.
      if (memberId && !this.getMeta("lead") && !this.podId.startsWith("room-")) {
        this.setMeta("lead", memberId);
        this.setMeta("leadName", name);
        await this.env.DB.prepare("UPDATE pods SET lead_member = ? WHERE id = ?").bind(memberId, this.podId).run().catch(() => {});
      }
      // Someone new: remembered so Chotu can welcome them if nobody has within 2 hours.
      if (memberId && !this.getMeta("seen:" + memberId)) {
        this.setMeta("seen:" + memberId, String(Date.now()));
        if (memberId !== this.getMeta("lead")) this.setJson("newcomers", { ...this.getJson<Record<string, number>>("newcomers", {}), [memberId]: Date.now() });
      }
      server.send(JSON.stringify(this.historyFor(memberId)));
      this.broadcast({ type: "presence", online: this.online() });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname.endsWith("/ritual") && req.method === "POST") {
      // Staff announcements sent to pods. Chotu's own posts go through /host and its limits.
      const { text } = await req.json<{ text: string }>();
      this.post({ id: newId("m"), memberId: "chotu", name: CHOTU, text, ts: Date.now(), kind: "ritual" });
      return new Response("ok");
    }
    if (url.pathname.endsWith("/host") && req.method === "POST") {
      return Response.json({ posted: await this.host(await req.json<any>()) });
    }
    if (url.pathname.endsWith("/friends") && req.method === "POST") {
      return Response.json({ posted: this.friendsTick(await req.json<any>()) });
    }
    if (url.pathname.endsWith("/system") && req.method === "POST") {
      const { text } = await req.json<{ text: string }>();
      this.post({ id: newId("m"), memberId: "system", name: "Pod", text: String(text).slice(0, MAX_LEN), ts: Date.now(), kind: "system" });
      return new Response("ok");
    }
    if (url.pathname.endsWith("/moved") && req.method === "POST") {
      // This forming pod merged into another: everyone connected reconnects there.
      const { to, text } = await req.json<{ to: string; text: string }>();
      this.post({ id: newId("m"), memberId: "system", name: "Pod", text: String(text).slice(0, MAX_LEN), ts: Date.now(), kind: "system" });
      this.setMeta("movedTo", to);
      this.broadcast({ type: "moved", to });
      return new Response("ok");
    }
    if (url.pathname.endsWith("/stay-or-move") && req.method === "POST") {
      // Quiet for 14 days: each member privately chooses. Nobody is moved without asking.
      const { results } = await this.env.DB.prepare("SELECT member_id FROM members WHERE pod_id = ?").bind(this.podId).all<{ member_id: string }>();
      const text = "Your pod has been quiet for two weeks. You can stay, or move to a more active pod with the same stage and language. Nobody moves unless they choose to.";
      for (const { member_id } of results) {
        const m: Message = { id: newId("p"), memberId: "choice", name: "UPSC Pods", text, ts: Date.now(), kind: "system", to: member_id };
        this.sql.exec("INSERT INTO private (id, from_id, from_name, to_id, text, ts) VALUES (?, ?, ?, ?, ?, ?)", m.id, m.memberId, m.name, member_id, m.text, m.ts);
        this.sendTo(member_id, { type: "private", message: m });
      }
      return Response.json({ asked: results.length });
    }
    if (url.pathname.endsWith("/activity")) {
      // The open-room list (rooms.ts): what others posted since the phone last opened this room, and the latest line.
      const since = Number(url.searchParams.get("since")) || 0;
      const me = url.searchParams.get("member") ?? "";
      const unread = this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM messages WHERE ts > ? AND member_id != ? AND hidden = 0 AND kind != 'system'`, since, me).toArray()[0]?.n ?? 0;
      const last = this.sql.exec<{ ts: number; name: string; text: string }>(`SELECT ts, name, text FROM messages WHERE hidden = 0 AND kind != 'system' ORDER BY ts DESC LIMIT 1`).toArray()[0];
      return Response.json({ unread, lastTs: last?.ts ?? null, lastName: last?.name ?? null, lastText: last ? last.text.slice(0, 120) : null, online: this.online().length });
    }
    if (url.pathname.endsWith("/stats")) {
      // For the admin's lurker-to-poster metric: how many different people posted in 14 days. Never who.
      const row = this.sql.exec<{ n: number }>(`SELECT COUNT(DISTINCT member_id) AS n FROM messages WHERE ts > ? AND kind IN ('chat', 'favour', 'offer')`, Date.now() - 14 * 86400_000).toArray()[0];
      return Response.json({ posters14d: row?.n ?? 0 });
    }
    if (url.pathname.endsWith("/lead") && req.method === "POST") {
      const { memberId, name } = await req.json<{ memberId: string; name: string }>();
      this.setMeta("lead", memberId);
      this.setMeta("leadName", String(name ?? "Pod lead").slice(0, 40));
      return new Response("ok");
    }
    if (url.pathname.endsWith("/hide") && req.method === "POST") {
      const { id } = await req.json<{ id: string }>();
      this.sql.exec("UPDATE messages SET hidden = 1 WHERE id = ?", id);
      this.broadcast({ type: "hidden", id });
      return new Response("ok");
    }
    // --- Backups: the pod's whole history out, and back in on a restore.
    if (url.pathname.endsWith("/dump")) {
      return Response.json({
        messages: this.sql.exec("SELECT * FROM messages ORDER BY ts").toArray(),
        private: this.sql.exec("SELECT * FROM private ORDER BY ts").toArray(),
        lead: this.getMeta("lead"), leadName: this.getMeta("leadName"),
      });
    }
    if (url.pathname.endsWith("/load") && req.method === "POST") {
      const d = await req.json<{ messages?: any[]; private?: any[]; lead?: string | null; leadName?: string | null }>();
      this.ctx.storage.transactionSync(() => {
        this.sql.exec("DELETE FROM messages");
        this.sql.exec("DELETE FROM private");
        for (const m of d.messages ?? []) this.sql.exec("INSERT OR REPLACE INTO messages (id, member_id, name, text, ts, kind, hidden) VALUES (?, ?, ?, ?, ?, ?, ?)",
          String(m.id), m.member_id ?? null, m.name ?? null, m.text ?? null, Number(m.ts) || 0, m.kind ?? "chat", m.hidden ? 1 : 0);
        for (const p of d.private ?? []) this.sql.exec("INSERT OR REPLACE INTO private (id, from_id, from_name, to_id, text, ts) VALUES (?, ?, ?, ?, ?, ?)",
          String(p.id), p.from_id ?? null, p.from_name ?? null, p.to_id ?? null, p.text ?? null, Number(p.ts) || 0);
        if (d.lead !== undefined) { this.setMeta("lead", d.lead ?? null); this.setMeta("leadName", d.leadName ?? null); }
      });
      // Anyone connected gets the restored history at once.
      for (const w of this.ctx.getWebSockets()) {
        const a = w.deserializeAttachment() as Attachment;
        try { w.send(JSON.stringify(this.historyFor(a.memberId))); } catch { /* closing */ }
      }
      return Response.json({ messages: d.messages?.length ?? 0, private: d.private?.length ?? 0 });
    }

    // --- Admin: a member's data (export and delete), a private care note, and closing their chat.
    const member = url.searchParams.get("member") ?? "";
    if (url.pathname.endsWith("/export") && member) {
      const messages = this.sql.exec("SELECT id, name, text, ts, kind, hidden FROM messages WHERE member_id = ? ORDER BY ts", member).toArray();
      const notes = this.sql.exec("SELECT id, from_name, to_id = ? AS received, text, ts FROM private WHERE from_id = ? OR to_id = ? ORDER BY ts", member, member, member).toArray();
      return Response.json({ messages, privateNotes: notes, isLead: this.getMeta("lead") === member });
    }
    if (url.pathname.endsWith("/forget") && req.method === "POST" && member) {
      const n = this.sql.exec("DELETE FROM messages WHERE member_id = ?", member).rowsWritten;
      const p = this.sql.exec("DELETE FROM private WHERE from_id = ? OR to_id = ?", member, member).rowsWritten;
      this.sql.exec("DELETE FROM thanks WHERE from_id = ? OR to_id = ?", member, member);
      const quiz = this.getJson<Quiz | null>("quiz", null);
      if (quiz?.answers[member]) { delete quiz.answers[member]; this.setJson("quiz", quiz); }
      if (this.getMeta("lead") === member) { this.setMeta("lead", null); this.setMeta("leadName", null); }
      this.kick(member, "Your data was deleted.");
      return Response.json({ messages: n, privateNotes: p });
    }
    if (url.pathname.endsWith("/care") && req.method === "POST" && member) {
      // From a trained moderator, seen only by this member, with the helplines.
      const { text, from } = await req.json<{ text: string; from?: string }>();
      const m: Message = { id: newId("p"), memberId: "moderator", name: String(from ?? "UPSC Pods care team").slice(0, 40), text: String(text).slice(0, MAX_LEN), ts: Date.now(), kind: "system", to: member };
      this.sql.exec("INSERT INTO private (id, from_id, from_name, to_id, text, ts) VALUES (?, ?, ?, ?, ?, ?)", m.id, m.memberId, m.name, member, m.text, m.ts);
      let delivered = false;
      for (const w of this.ctx.getWebSockets()) {
        if ((w.deserializeAttachment() as Attachment).memberId !== member) continue;
        try { w.send(JSON.stringify({ type: "private", message: m })); w.send(JSON.stringify({ type: "care", helplines: HELPLINES })); delivered = true; } catch { /* closing */ }
      }
      return Response.json({ delivered });
    }
    if (url.pathname.endsWith("/kick") && req.method === "POST" && member) {
      // why=suspended: the account was switched off (auth.ts); the app shows its own full-screen notice.
      if (url.searchParams.get("why") === "suspended") this.kick(member, "Your access has been switched off.", 4403, "account_suspended");
      else this.kick(member, "A moderator paused your chat.");
      return new Response("ok");
    }
    if (url.pathname.endsWith("/close-all") && req.method === "POST") {
      // Pod chat switched off by an admin: everyone is told and disconnected.
      for (const w of this.ctx.getWebSockets()) { try { w.send(JSON.stringify({ type: "error", message: "Pod chat is paused for now." })); w.close(1012, "paused"); } catch { /* closing */ } }
      return new Response("ok");
    }
    return new Response("Not found", { status: 404 });
  }

  private kick(member: string, why: string, code = 4003, reason = "removed") {
    for (const w of this.ctx.getWebSockets()) {
      if ((w.deserializeAttachment() as Attachment).memberId !== member) continue;
      try { w.send(JSON.stringify({ type: "error", message: why, ...(code === 4403 ? { code: reason } : {}) })); w.close(code, reason); } catch { /* closing */ }
    }
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const me = ws.deserializeAttachment() as Attachment;
    let msg: any;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    switch (msg?.type) {
      case "say": {
        const text = String(msg.text ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, MAX_LEN);
        if (!text) return;
        if (!this.allow(me.memberId)) {
          ws.send(JSON.stringify({ type: "error", message: "Slow down a little. Try again in a minute." }));
          return;
        }
        const kind: Kind = msg.kind === "favour" || msg.kind === "offer" ? msg.kind : "chat";
        const m: Message = { id: newId("m"), memberId: me.memberId, name: me.name, text, ts: Date.now(), kind, clientId: msg.clientId };
        this.post(m);
        await bump(this.env, "messages");
        await this.humanPosted(me.memberId);
        const care = await this.guardian(ws, me, m.id, text);
        if (/@chotu\b/i.test(text) && !care) await this.askChotu(ws, text);
        else if (!care && kind === "chat") await this.friendReact(text);
        return;
      }
      case "ask_lead":
      case "lead_reply": {
        const text = String(msg.text ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, MAX_LEN);
        const lead = this.getMeta("lead");
        if (!text || !lead) return;
        if (!this.allow(me.memberId)) {
          ws.send(JSON.stringify({ type: "error", message: "Slow down a little. Try again in a minute." }));
          return;
        }
        // A member writes to the lead; only the lead can write back, and only to one member.
        const to = msg.type === "ask_lead" ? lead : String(msg.to ?? "");
        if (msg.type === "ask_lead" && me.memberId === lead) return;
        if (msg.type === "lead_reply" && (me.memberId !== lead || !to)) return;
        const m: Message = { id: newId("p"), memberId: me.memberId, name: me.name, text, ts: Date.now(), kind: "chat", to, clientId: msg.clientId };
        this.sql.exec("INSERT INTO private (id, from_id, from_name, to_id, text, ts) VALUES (?, ?, ?, ?, ?, ?)", m.id, m.memberId, m.name, to, text, m.ts);
        this.sql.exec("DELETE FROM private WHERE id NOT IN (SELECT id FROM private ORDER BY ts DESC LIMIT 500)");
        for (const w of this.ctx.getWebSockets()) {
          const a = w.deserializeAttachment() as Attachment;
          if (a.memberId === to || a.memberId === me.memberId) {
            try { w.send(JSON.stringify({ type: "private", message: m })); } catch { /* closing */ }
          }
        }
        // Private or not, distress always reaches a trained moderator.
        await this.guardian(ws, me, m.id, text);
        return;
      }
      case "goal_set": {
        const lead = this.getMeta("lead");
        if (lead && me.memberId !== lead) return ws.send(JSON.stringify({ type: "error", message: "The pod lead sets the week's goal." }));
        const target = Math.min(Math.max(Math.round(Number(msg.target) || 0), 1), 1000);
        const text = String(msg.text ?? "").trim().slice(0, 120);
        if (!text) return;
        const old = this.goal();
        const goal: Goal = { text, target, unit: String(msg.unit ?? "").slice(0, 20), done: old ? old.done : 0, week: weekOf(), setBy: lead ? "lead" : "member" };
        this.setJson("goal", goal);
        this.broadcast({ type: "goal", goal });
        return;
      }
      case "goal_add": {
        // One shared bar. Who added what is never stored.
        const goal = this.goal();
        if (!goal) return;
        const n = Math.min(Math.max(Math.round(Number(msg.n) || 0), 1), 50);
        goal.done = Math.min(goal.done + n, goal.target * 3);
        this.setJson("goal", goal);
        this.broadcast({ type: "goal", goal });
        return;
      }
      case "claim": {
        if (!HOST_SLOTS.includes(msg.ritual)) return;
        const c = this.claims();
        if (!c.slots.includes(msg.ritual)) c.slots.push(msg.ritual);
        this.setJson("claims", c);
        this.post({ id: newId("m"), memberId: "system", name: "Pod", text: `${me.name} is running this week's ${String(msg.ritual).replace("_", " ")}. Chotu will stay out of it.`, ts: Date.now(), kind: "system" });
        return;
      }
      case "quiz_answer": {
        const quiz = this.getJson<Quiz | null>("quiz", null);
        const q = Number(msg.q), choice = Number(msg.choice);
        if (!quiz || !quiz.questions[q] || !Number.isInteger(choice)) return;
        const mine = (quiz.answers[me.memberId] ??= {});
        if (mine[q] === undefined) mine[q] = choice;
        this.setJson("quiz", quiz);
        const Q = quiz.questions[q];
        ws.send(JSON.stringify({ type: "quiz_result", q, right: mine[q] === Q.answerIndex, answerIndex: Q.answerIndex, explanation: Q.explanation ?? "" }));
        this.broadcast({ type: "quiz", quiz: this.publicQuiz(quiz) });
        return;
      }
      case "thanks": {
        const row = this.sql.exec<{ member_id: string; kind: string }>("SELECT member_id, kind FROM messages WHERE id = ?", String(msg.id)).toArray()[0];
        if (!row || row.member_id === me.memberId || !HUMAN_KINDS.includes(row.kind)) return;
        this.sql.exec("INSERT OR IGNORE INTO thanks (msg_id, from_id, to_id, ts) VALUES (?, ?, ?, ?)", String(msg.id), me.memberId, row.member_id, Date.now());
        this.broadcast({ type: "thanked", id: String(msg.id) });
        this.sendTo(row.member_id, { type: "thanks_received" });
        return;
      }
      case "chai_ping":
        this.post({ id: newId("m"), memberId: me.memberId, name: me.name, text: `${me.name} sent a chai ping ☕`, ts: Date.now(), kind: "ping" });
        return;
      case "report": {
        const row = this.sql.exec<{ name: string; text: string; member_id: string }>("SELECT name, text, member_id FROM messages WHERE id = ?", String(msg.id)).toArray()[0];
        if (!row) return;
        await this.env.DB.prepare(
          "INSERT INTO reports (kind, pod_id, message_id, author, member_id, text, reason, created_at) VALUES ('report', ?, ?, ?, ?, ?, ?, ?)",
        ).bind(this.podId, String(msg.id), row.name, row.member_id, row.text, String(msg.reason ?? "").slice(0, 200), new Date().toISOString()).run();
        await bump(this.env, "reports");
        ws.send(JSON.stringify({ type: "reported", id: msg.id }));
        return;
      }
      case "room_start": {
        const minutes = [25, 50].includes(Number(msg.minutes)) ? Number(msg.minutes) : 25;
        if (this.room()) return this.join(ws, me);
        const room: Room = { startedAt: Date.now(), minutes, startedBy: me.name };
        this.setMeta("room", JSON.stringify(room));
        await this.ctx.storage.setAlarm(room.startedAt + minutes * 60_000);
        this.post({ id: newId("m"), memberId: "system", name: "Study room", text: `${me.name} started a ${minutes}-minute study session. Join in.`, ts: Date.now(), kind: "system" });
        return this.join(ws, me);
      }
      case "room_join":
        if (this.room()) this.join(ws, me);
        return;
      case "room_leave":
        ws.serializeAttachment({ ...me, studying: false });
        this.broadcastRoom();
        return;
    }
  }

  async webSocketClose(ws: WebSocket) {
    ws.close();
    this.broadcast({ type: "presence", online: this.online(ws) });
    this.broadcastRoom(ws);
  }

  async alarm() {
    const room = this.room();
    if (!room) return;
    this.setMeta("room", null);
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as Attachment;
      if (a.studying) ws.serializeAttachment({ ...a, studying: false });
    }
    this.post({ id: newId("m"), memberId: "system", name: "Study room", text: `Session done. Take a 10-minute break. Water, stretch, no phone scrolling.`, ts: Date.now(), kind: "system" });
    this.broadcastRoom();
  }

  // --- helpers -------------------------------------------------------------

  /** Guardian: a private nudge to the writer, and a quiet alert for a trained human moderator.
   *  Nothing is said in the pod and the bot never replies in chat. */
  private async guardian(ws: WebSocket, me: Attachment, id: string, text: string): Promise<boolean> {
    if (!distress(text, await extraDistress(this.env).catch(() => []))) return false;
    ws.send(JSON.stringify({ type: "care", helplines: HELPLINES }));
    await this.env.DB.prepare(
      "INSERT INTO reports (kind, pod_id, message_id, author, member_id, text, reason, created_at) VALUES ('distress', ?, ?, ?, ?, ?, 'guardian', ?)",
    ).bind(this.podId, id, me.name, me.memberId, text, new Date().toISOString()).run().catch(() => {});
    await bump(this.env, "distress");
    return true;
  }

  // --- Community-first: hosting, goal, quiz, thanks, @Chotu ----------------------------------

  private historyFor(memberId: string) {
    const quiz = this.getJson<Quiz | null>("quiz", null);
    const thanked = this.sql.exec<{ msg_id: string }>("SELECT DISTINCT msg_id FROM thanks").toArray().map((r) => r.msg_id);
    const thankedYou = this.sql.exec("SELECT 1 FROM thanks WHERE to_id = ? LIMIT 1", memberId).toArray().length > 0;
    return {
      type: "history", messages: this.history(), online: this.online(), room: this.room(),
      lead: this.getMeta("leadName"), youAreLead: memberId === this.getMeta("lead"), private: this.privateFor(memberId),
      goal: this.goal(), quiz: quiz ? { ...this.publicQuiz(quiz), mine: quiz.answers[memberId] ?? {} } : null,
      thanked, thankedYou, movedTo: this.getMeta("movedTo"), claims: this.claims().slots,
    };
  }

  private goal(): Goal | null {
    const g = this.getJson<Goal | null>("goal", null);
    return g && g.week === weekOf() ? g : null;
  }

  private claims(): { week: string; slots: string[] } {
    const c = this.getJson<{ week: string; slots: string[] }>("claims", { week: weekOf(), slots: [] });
    return c.week === weekOf() ? c : { week: weekOf(), slots: [] };
  }

  /** The pod's one shared score: right answers out of answers given, and the pod's own last week. Never per person. */
  private publicQuiz(q: Quiz) {
    let right = 0, answered = 0;
    for (const a of Object.values(q.answers)) for (const [i, c] of Object.entries(a)) { answered++; if (q.questions[Number(i)]?.answerIndex === c) right++; }
    return { id: q.id, week: q.week, questions: q.questions.map(({ topic, question, options }) => ({ topic, question, options })), score: { right, answered, pct: answered ? Math.round((right / answered) * 100) : null }, lastWeekPct: q.lastWeekPct };
  }

  /** A person posted: the pod isn't quiet, and if it was the lead, newcomers have been greeted. */
  private async humanPosted(memberId: string) {
    const now = Date.now();
    this.setMeta("lastHuman", String(now));
    if (memberId === this.getMeta("lead")) this.setJson("newcomers", {});
    if (now - Number(this.getMeta("lastHumanWrite") ?? 0) > 10 * 60_000) {
      this.setMeta("lastHumanWrite", String(now));
      await this.env.DB.prepare("UPDATE pods SET last_human_at = ? WHERE id = ?").bind(new Date(now).toISOString(), this.podId).run().catch(() => {});
    }
  }

  /**
   * One host job. Rules: no posts 23:30-07:00 IST; at most 2 a day; a scheduled ritual keeps its place, so other
   * posts leave room for it; a ritual a person claimed (or a goal the lead set) is left alone.
   */
  private async host(job: { slot: string; text?: string; at?: string; state?: string; quiz?: Quiz["questions"]; goal?: { text: string; target: number; unit: string } }): Promise<boolean> {
    const at = job.at ? new Date(job.at) : new Date();
    const ist = istNow(at), hm = ist.toISOString().slice(11, 16), day = istDay(at);
    if (hm >= "23:30" || hm < "07:00") return false;
    const saved = this.getJson<{ day: string; n: number; slots: string[] }>("hostDay", { day, n: 0, slots: [] });
    const t = saved.day === day ? saved : { day, n: 0, slots: [] as string[] };
    const isSlot = HOST_SLOTS.includes(job.slot);
    const slotAhead = HOST_SCHEDULE.some((s) => s.day === ist.getUTCDay() && s.at > hm) && !t.slots.length;
    if (t.n >= 2 || (!isSlot && t.n + (slotAhead ? 1 : 0) >= 2)) return false;

    let text = job.text ?? "";
    let kind: Kind = "ritual";
    if (job.slot === "check") {
      const lastHuman = Number(this.getMeta("lastHuman") ?? 0);
      const newcomers = this.getJson<Record<string, number>>("newcomers", {});
      if (Object.values(newcomers).some((ts) => at.getTime() - ts >= 2 * 3600_000)) {
        text = "Someone new joined the pod. A quick hello goes a long way 👋";
        this.setJson("newcomers", {});
      } else if (job.state === "quiet" && this.getMeta("quietPrompted") !== String(lastHuman)) {
        text = "It's been quiet here for a few days. That happens. If anyone wants company, the study room is one tap away, and the Commons is always open.";
        this.setMeta("quietPrompted", String(lastHuman));
      } else return false;
    } else if (isSlot) {
      if (this.claims().slots.includes(job.slot)) return false;
      if (job.slot === "goal") {
        if (this.goal()?.setBy === "lead") return false;
        if (job.goal) { const goal: Goal = { ...job.goal, done: 0, week: weekOf(at), setBy: "chotu" }; this.setJson("goal", goal); this.broadcast({ type: "goal", goal }); }
      }
      if (job.slot === "quiz") {
        if (!job.quiz?.length) return false;
        const prev = this.getJson<Quiz | null>("quiz", null);
        const quiz: Quiz = { id: newId("q"), week: weekOf(at), questions: job.quiz, answers: {}, lastWeekPct: prev ? this.publicQuiz(prev).score.pct : null };
        this.setJson("quiz", quiz);
        this.broadcast({ type: "quiz", quiz: this.publicQuiz(quiz) });
        kind = "quiz";
      }
    }
    if (!text) return false;
    this.post({ id: newId("m"), memberId: "chotu", name: CHOTU, text, ts: Date.now(), kind });
    this.setJson("hostDay", { day, n: t.n + 1, slots: isSlot ? [...t.slots, job.slot] : t.slots });
    return true;
  }

  /**
   * One friends tick (src/friends.ts decides who says what). The cron sends the pod's real-people count, whether
   * friends are on (flag, no result week) and this week's quiz questions. Each time slot posts once.
   */
  private friendsTick(job: { at?: string; humans?: number; on?: boolean; quiz?: QuizQ[] }): number {
    const at = job.at ? new Date(job.at) : new Date();
    const ist = istNow(at), hm = ist.toISOString().slice(11, 16), day = istDay(at);
    const humans = Math.max(0, Number(job.humans) || 0);
    this.setJson("friendsCtx", { humans, on: !!job.on, day });
    if (!job.on || inQuietHours(hm)) return 0;
    const done = this.getJson<{ day: string; slots: string[] }>("friendsDone", { day, slots: [] });
    const slots = done.day === day ? done.slots : [];
    if (slots.includes(hm)) return 0;
    const seed = Math.floor(Date.parse(day + "T00:00:00Z") / 86_400_000);
    // Today's question stays the same from the 13:00 post to the 18:00 answer.
    let q = this.getJson<{ day: string; q: QuizQ } | null>("friendQuiz", null);
    if ((!q || q.day !== day) && job.quiz?.length) { q = { day, q: job.quiz[seed % job.quiz.length] }; this.setJson("friendQuiz", q); }
    const posts = friendPosts(hm, ist.getUTCDay(), friendLevel(humans), seed, q?.day === day ? q.q : null);
    for (const p of posts) this.post({ id: newId("m"), memberId: p.friend.id, name: p.friend.name, text: p.text, ts: Date.now(), kind: p.kind });
    this.setJson("friendsDone", { day, slots: [...slots, hm] });
    return posts.length;
  }

  /** A plain study win from a person: one friend may cheer, in general words. At most twice a day, 3 hours apart. */
  private async friendReact(text: string) {
    const ctx = this.getJson<{ humans: number; on: boolean; day: string } | null>("friendsCtx", null);
    if (!ctx?.on || friendLevel(ctx.humans) === "rituals" || !isStudyWin(text)) return;
    const now = new Date(), hm = istNow(now).toISOString().slice(11, 16), day = istDay(now);
    if (inQuietHours(hm) || !(await flags(this.env)).pod_friends) return;
    const r = this.getJson<{ day: string; n: number; last: number }>("friendReact", { day, n: 0, last: 0 });
    const n = r.day === day ? r.n : 0;
    if (n >= 2 || now.getTime() - r.last < 3 * 3600_000) return;
    const p = reaction(now.getTime() >> 10);
    this.post({ id: newId("m"), memberId: p.friend.id, name: p.friend.name, text: p.text, ts: Date.now(), kind: "friend" });
    this.setJson("friendReact", { day, n: n + 1, last: now.getTime() });
  }

  /** @Chotu: only this one message goes to the model, with every name in the pod swapped for Member A, B... */
  private async askChotu(ws: WebSocket, text: string) {
    if (!(await flags(this.env)).chotu) return;
    const day = istDay();
    const used = this.getJson<{ day: string; n: number }>("chotuReplies", { day, n: 0 });
    const n = used.day === day ? used.n : 0;
    if (n >= CHOTU_REPLIES_PER_DAY) { ws.send(JSON.stringify({ type: "error", message: "Chotu has answered a lot in this pod today. Try again tomorrow, or ask in Chotu's tab." })); return; }
    const question = anonymise(text, [...this.namesInPod()]).replace(/@chotu\b/gi, "").trim();
    if (!question) return;
    this.setJson("chotuReplies", { day, n: n + 1 });
    const now = istNow();
    const system = fillPrompt({
      mode: "host", local_time_ist: now.toISOString().slice(11, 16) + " IST",
      day_of_week: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getUTCDay()], quiet_hours_start: "23:30",
    }) + "\n\nYou are answering one question in a pod chat. Keep it under 80 words. Never mention or guess who asked.";
    try {
      const { text: reply } = await callGroq(this.env, "chotu", [{ role: "system", content: system }, { role: "user", content: question }]);
      this.post({ id: newId("m"), memberId: "chotu", name: CHOTU, text: reply.slice(0, MAX_LEN), ts: Date.now(), kind: "chotu" });
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", message: e instanceof AiBlocked ? "Chotu is offline right now." : "Chotu couldn't answer just now." }));
    }
  }

  /** Every name seen in this pod: who's connected and who has posted. */
  private namesInPod(): Set<string> {
    const names = new Set(this.attachments().map((a) => a.name));
    for (const r of this.sql.exec<{ name: string }>("SELECT DISTINCT name FROM messages WHERE member_id NOT IN ('chotu', 'system', 'moderator') AND member_id NOT LIKE 'friend:%'").toArray()) names.add(r.name);
    return names;
  }

  private sendTo(memberId: string, event: unknown) {
    for (const w of this.ctx.getWebSockets()) {
      if ((w.deserializeAttachment() as Attachment).memberId !== memberId) continue;
      try { w.send(JSON.stringify(event)); } catch { /* closing */ }
    }
  }

  private getJson<T>(k: string, d: T): T {
    const v = this.getMeta(k);
    if (v == null) return d;
    try { return JSON.parse(v) as T; } catch { return d; }
  }

  private setJson(k: string, v: unknown) {
    this.setMeta(k, v == null ? null : JSON.stringify(v));
  }


  /** The last private notes this member sent or received. */
  private privateFor(memberId: string): Message[] {
    if (!memberId) return [];
    return this.sql
      .exec<{ id: string; from_id: string; from_name: string; to_id: string; text: string; ts: number }>(
        "SELECT * FROM (SELECT * FROM private WHERE from_id = ? OR to_id = ? ORDER BY ts DESC LIMIT 50) ORDER BY ts ASC",
        memberId, memberId,
      )
      .toArray()
      .map((r) => ({ id: r.id, memberId: r.from_id, name: r.from_name, text: r.text, ts: r.ts, kind: "chat" as Kind, to: r.to_id }));
  }

  private join(ws: WebSocket, me: Attachment) {
    ws.serializeAttachment({ ...me, studying: true });
    this.broadcastRoom();
  }

  private room(except?: WebSocket): (Room & { studying: string[] }) | null {
    const raw = this.getMeta("room");
    if (!raw) return null;
    const room = JSON.parse(raw) as Room;
    if (Date.now() > room.startedAt + room.minutes * 60_000) return null;
    const studying = this.attachments(except).filter((a) => a.studying).map((a) => a.name);
    return { ...room, studying: [...new Set(studying)] };
  }

  private broadcastRoom(except?: WebSocket) {
    this.broadcast({ type: "room", room: this.room(except) });
  }

  private post(m: Message) {
    this.sql.exec(
      "INSERT INTO messages (id, member_id, name, text, ts, kind) VALUES (?, ?, ?, ?, ?, ?)",
      m.id, m.memberId, m.name, m.text, m.ts, m.kind,
    );
    // Keep the pod's history small; older messages are dropped, not archived.
    this.sql.exec("DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY ts DESC LIMIT 500)");
    this.broadcast({ type: "msg", message: m });
  }

  private history(): Message[] {
    return this.sql
      .exec<{ id: string; member_id: string; name: string; text: string; ts: number; kind: Kind }>(
        "SELECT * FROM (SELECT id, member_id, name, text, ts, kind FROM messages WHERE hidden = 0 ORDER BY ts DESC LIMIT ?) ORDER BY ts ASC",
        HISTORY,
      )
      .toArray()
      .map((r) => ({ id: r.id, memberId: r.member_id, name: r.name, text: r.text, ts: r.ts, kind: r.kind }));
  }

  private attachments(except?: WebSocket): Attachment[] {
    return this.ctx.getWebSockets().filter((w) => w !== except).map((w) => w.deserializeAttachment() as Attachment);
  }

  /** Presence, not performance: names only, never who finished what. */
  private online(except?: WebSocket): string[] {
    return [...new Set(this.attachments(except).map((a) => a.name))];
  }

  private broadcast(event: unknown) {
    const data = JSON.stringify(event);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {
        // socket already closing
      }
    }
  }

  private allow(memberId: string): boolean {
    const now = Date.now();
    const times = (this.recent.get(memberId) ?? []).filter((t) => now - t < 60_000);
    if (times.length >= PER_MINUTE) return false;
    times.push(now);
    this.recent.set(memberId, times);
    return true;
  }

  private getMeta(k: string): string | null {
    return this.sql.exec<{ v: string }>("SELECT v FROM meta WHERE k = ?", k).toArray()[0]?.v ?? null;
  }

  private setMeta(k: string, v: string | null) {
    if (v === null) this.sql.exec("DELETE FROM meta WHERE k = ?", k);
    else this.sql.exec("INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)", k, v);
  }
}

