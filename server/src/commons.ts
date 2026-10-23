import { DurableObject } from "cloudflare:workers";
import type { Env } from "./shared";

/**
 * The Commons: always-open silent study rooms. Presence only: no chat, no names, no DMs between strangers.
 * One Durable Object per room. A member opens a WebSocket while they study and closes it when they stop;
 * everyone in the room sees only how many people are there.
 *
 * Client → server: nothing is read except {type:"ping"} (kept alive). Anything else is ignored.
 * Server → client: {type:"presence", count}
 */

export const COMMONS_ROOMS = [
  { id: "library-hall-hi", name: "Library Hall · Hindi", note: "Silent study, Hindi medium" },
  { id: "library-hall-en", name: "Library Hall · English", note: "Silent study, English medium" },
  { id: "night-owls", name: "Night Owls", note: "For late sessions. Lamp low, phones down" },
  { id: "working", name: "Working professionals", note: "Before and after office hours" },
] as const;

export class CommonsRoom extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.endsWith("/ws")) {
      if (req.headers.get("upgrade") !== "websocket") return new Response("Expected WebSocket", { status: 426 });
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      // Only so a suspended account's seat can be closed (auth.ts). Never sent to anyone.
      pair[1].serializeAttachment({ memberId: url.searchParams.get("member") ?? "" });
      this.broadcast();
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname.endsWith("/count")) return Response.json({ count: this.count() });
    if (url.pathname.endsWith("/kick") && req.method === "POST") {
      const member = url.searchParams.get("member");
      let closed = 0;
      for (const w of this.ctx.getWebSockets()) {
        if (!member || (w.deserializeAttachment() as { memberId?: string } | null)?.memberId !== member) continue;
        try { w.send(JSON.stringify({ type: "error", code: "account_suspended", message: "Your access has been switched off." })); w.close(4403, "account_suspended"); closed++; } catch { /* closing */ }
      }
      if (closed) this.broadcast();
      return Response.json({ closed });
    }
    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    // Presence only: there is nothing to say here. A ping just gets the current count back.
    try {
      if (JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw))?.type === "ping") ws.send(JSON.stringify({ type: "presence", count: this.count() }));
    } catch { /* ignored */ }
  }

  async webSocketClose(ws: WebSocket) {
    ws.close();
    this.broadcast(ws);
  }

  private count(except?: WebSocket) {
    return this.ctx.getWebSockets().filter((w) => w !== except).length;
  }

  private broadcast(except?: WebSocket) {
    const data = JSON.stringify({ type: "presence", count: this.count(except) });
    for (const w of this.ctx.getWebSockets()) {
      if (w === except) continue;
      try { w.send(data); } catch { /* closing */ }
    }
  }
}
