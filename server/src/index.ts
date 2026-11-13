import { publicLibrary, serveMedia } from "./content";
import { autoPick, chaiDigest, deskApi, modApi, postRitual, publish } from "./desk";
import DESK_HTML from "./desk.html";
import { runPipeline } from "./pipeline";
import { adminApi } from "./admin";
import { chotuChat, modelsRoute } from "./chotu";
import { extraDistress, publicLangs } from "./langs";
import { REQUESTABLE, requestLanguage } from "./requests";
import ADMIN_HTML from "./admin.html";
import { createBackup } from "./backups";
import { CONSENT_VERSION, privacyRoute, recordConsent } from "./privacy";
import { bump, ensureSchema, flags } from "./staff";
import { statusData, statusHtml } from "./status";
// The same starter bank the phone bundles, so the web app's practice matches.
import BANK from "../../android/app/src/main/assets/prelims_bank.json";
import { type Env, bad, istDay, istNow, json } from "./shared";
import { communityRoute, runJob } from "./community";
import { podMode, roomsRoute } from "./rooms";
import { answersRoute } from "./answers";
import { interviewRoute } from "./interview";
import { plusRoute, useAllowance } from "./plus";
import { caMediaGate, publicCa } from "./ca";
import { paymentsRoute } from "./payments";
import { playRoute, playVoided } from "./play";
import { activeResult, resultDays } from "./results";
import { authRoute, isContentRoute, isMemberRoute, memberGate, publicAuthConfig } from "./auth";
import { passwordRoute } from "./password";
import { logFirst, metricsRoute } from "./metrics";
import { roadmapRoute } from "./roadmap";

import { pruneWebChats, webRoute } from "./web";
import { tryRoute } from "./try";
import { learnRoute } from "./learn";
export { PodRoom } from "./pod";
export { CommonsRoom } from "./commons";
const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    let url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, POST, PUT, DELETE" },
      });
    }
    // aspiran.in subdomains: app.aspiran.in opens the web app, admin.aspiran.in the admin console (and the Desk).
    // The workers.dev address keeps working for the Android app.
    const host = url.hostname;
    if (host === "app.aspiran.in" && path === "/") return Response.redirect(`${url.origin}/app/`, 302);
    if (host === "admin.aspiran.in" && path === "/") return Response.redirect(`${url.origin}/admin`, 302);
    if (host === "app.aspiran.in" && (path === "/admin" || path === "/desk")) return Response.redirect(`https://admin.aspiran.in${path}`, 302);
    // Public topic pages for search (learn.ts): a taste of each syllabus topic, never the library.
    { const r = await learnRoute(req, env, path, ctx); if (r) return r; }
    if (path === "/" || path === "/health") return json({ ok: true, service: "upsc-pods", day: istDay() });
    const count = (metric: string) => ctx.waitUntil(bump(env, metric));

    // --- Sign-in (auth.ts): the session call, the access check, and the gate in front of every member route.
    // Past the gate, memberId (body) and member (query) are the signed-in account's own.
    const auth = await authRoute(req, env, path, url) ?? await passwordRoute(req, env, path, ctx);
    if (auth) return auth;
    if (isMemberRoute(path)) {
      const gated = await memberGate(req, env, path, url);
      if (gated instanceof Response) return gated;
      req = gated;
      url = new URL(req.url);
    }
    // Library, briefs and practice: a daily cap per account. Apps fetch these a few times a day and keep a copy.
    if (isContentRoute(path)) {
      const capped = await contentCap(env, url.searchParams.get("member"), path);
      if (capped) return capped;
    }

    // --- Public status page
    if (path === "/status" || path === "/status.json") {
      const s = await statusData(env);
      if (path === "/status.json") return new Response(JSON.stringify(s), { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "max-age=30" } });
      return new Response(statusHtml(s), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "max-age=30" } });
    }

    // --- What the apps should show: feature switches and live announcements. Read on every app open.
    if (path === "/config") {
      count("app_opens");
      await ensureSchema(env);
      const f = await flags(env);
      const now = new Date().toISOString();
      const announcements = f.announcements
        ? (await env.DB.prepare("SELECT id, title, body, link, level, starts_at FROM announcements WHERE withdrawn_at IS NULL AND starts_at <= ? AND (ends_at IS NULL OR ends_at > ?) ORDER BY starts_at DESC LIMIT 3").bind(now, now).all()).results
        : [];
      // Languages members can pick, and the extra distress phrases the app checks on the device too.
      const results = await resultDays(env);
      return new Response(JSON.stringify({ flags: f, announcements, consentVersion: CONSENT_VERSION, languages: await publicLangs(env), requestable: REQUESTABLE, distress: await extraDistress(env), results, resultNow: activeResult(results), pods: await podMode(env), auth: publicAuthConfig(env, url, f.sign_in_required, f.password_login),
        // Analytics for the web app (metrics.js): the public project token, or null when none is set.
        posthog: /^phc_\w{20,80}$/.test(env.POSTHOG_KEY ?? "") ? { key: env.POSTHOG_KEY, host: env.POSTHOG_HOST || "https://us.i.posthog.com" } : null }), { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-cache" } });
    }

    // --- Growth metrics (metrics.ts): our own events and one-tap feedback. No third-party trackers, never free text.
    // With a sign-in token the member id is the account's own (memberGate); without one, once sign-in is required,
    // events count for the install only, so nobody can file events under someone else's member id.
    let memberTrusted = true;
    if ((path === "/events" || path === "/feedback") && req.method === "POST") {
      if (req.headers.get("authorization")) {
        const gated = await memberGate(req, env, path, url);
        if (gated instanceof Response) return gated;
        req = gated;
      } else memberTrusted = !(await flags(env)).sign_in_required;
    }
    const metrics = await metricsRoute(req, env, path, { memberTrusted });
    if (metrics) return metrics;
    // --- The free roadmap builder: rules plus a syllabus map, nothing stored (roadmap.ts)
    const roadmap = await roadmapRoute(req, path);
    if (roadmap) return roadmap;

    // --- "Request your language": one tap per language, deduped per device. No member id or name (requests.ts).
    if (path === "/languages/request" && req.method === "POST") return requestLanguage(env, await req.json().catch(() => ({})));

    // --- DPDP: consent records, and a member's own export and erasure
    if (path === "/consent" && req.method === "POST") return recordConsent(env, await req.json().catch(() => ({})));
    const privacy = path.match(/^\/privacy\/(export|delete)$/);
    if (privacy && req.method === "POST") return privacyRoute(req, env, privacy[1]);

    // --- Briefs: public, cached by phones for offline reading
    const briefDay = path === "/brief/latest" ? "latest" : path.match(/^\/brief\/(\d{4}-\d{2}-\d{2})$/)?.[1];
    if (briefDay) {
      const row = briefDay === "latest"
        ? await env.DB.prepare("SELECT json FROM briefs ORDER BY day DESC LIMIT 1").first<{ json: string }>()
        : await env.DB.prepare("SELECT json FROM briefs WHERE day = ?").bind(briefDay).first<{ json: string }>();
      if (!row) return bad(briefDay === "latest" ? "No brief yet" : "No brief for that day", 404);
      count("brief_views");
      // Chotu switched off: jokes come out of already-published briefs too, on every app version.
      let body = row.json;
      if (!(await flags(env)).chotu) {
        const brief = JSON.parse(body);
        for (const it of brief.items ?? []) { delete it.chotu; if (it.hi) delete it.hi.chotu; }
        body = JSON.stringify(brief);
      }
      return new Response(body, { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    // --- Practice questions for the web app: Exam Corner MCQs from published briefs (editor-approved),
    // newest first, then the starter bank. Hindi only where a Hindi editor checked the card.
    if (path === "/practice/questions") {
      if (!(await flags(env)).practice) return bad("Practice is paused for now", 503);
      count("practice_views");
      const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 60, 1), 365);
      const { results } = await env.DB.prepare("SELECT day, json FROM briefs ORDER BY day DESC LIMIT ?").bind(days).all<{ day: string; json: string }>();
      const seen = new Set<string>();
      const fromCards: unknown[] = [];
      for (const row of results) {
        for (const it of (JSON.parse(row.json).items ?? []) as any[]) {
          const en = it.examCorner?.mcq;
          if (!en || seen.has(it.id)) continue;
          seen.add(it.id);
          fromCards.push({ id: `card-${it.id}`, cardId: it.id, day: row.day, topic: it.topic, gsPaper: it.gsPaper, en, hi: it.hi?.mcq ?? null });
        }
      }
      const bank = ((BANK as any).questions ?? []).map((q: any) => ({ ...q, hi: q.hi ?? null }));
      return json({ fromCards, bank });
    }

    // --- Content library (approved items only) and the files it points at. Members only (isContentRoute); the Free
    // Shelf's calm scripts and routines stay open to visitors at /library/shelf.
    // "Try one topic" (try.ts): one whole syllabus topic, open to visitors. Approved only, like the shelf.
    { const r = await tryRoute(req, env, path, url); if (r) return r; }
    if (path === "/library/shelf") {
      if (!(await flags(env)).library) return json({ items: [], paused: true });
      const data = await (await publicLibrary(env)).json<{ items: { kind: string }[] }>();
      data.items = data.items.filter((i) => SHELF_KINDS.has(i.kind));
      return json(data);
    }
    if (path === "/library") {
      const f = await flags(env);
      if (!f.library) return json({ items: [], paused: true });
      count("library_views");
      const res = await publicLibrary(env);
      if (f.mocks && f.long_reads) return res;
      const data = await res.json<{ items: { kind: string }[] }>();
      data.items = data.items.filter((i) => (f.mocks || i.kind !== "mock") && (f.long_reads || i.kind !== "read"));
      return json(data);
    }
    if (path.startsWith("/media/")) {
      const key = decodeURIComponent(path.slice("/media/".length));
      const locked = await caMediaGate(env, key, url);
      return locked ?? serveMedia(env, key, req, url.searchParams.has("sig"));
    }
    // --- Cinematic current affairs: the week's scenes (ca.ts), approved only
    { const r = await publicCa(req, env, path); if (r) return r; }

    // --- Chotu: on-device model files, and the cloud fallback (Groq) until launch
    if (path === "/models" || path.startsWith("/models/")) { const r = await modelsRoute(req, env, path); if (r) return r; }
    // Report one Chotu reply (Play's AI-content rule): its id, a reason and that reply only, never the chat.
    if (path === "/chotu/report" && req.method === "POST") {
      const b = await req.json<any>().catch(() => ({}));
      const id = String(b.messageId ?? "");
      if (!/^[\w-]{8,64}$/.test(id)) return bad("messageId is required");
      await ensureSchema(env);
      await env.DB.prepare("INSERT INTO reports (kind, pod_id, message_id, author, text, reason, created_at) VALUES ('chotu', 'chotu', ?, 'Chotu · AI', ?, ?, ?)")
        .bind(id, String(b.text ?? "").slice(0, 2000), String(b.reason ?? "Reported").slice(0, 300), new Date().toISOString()).run();
      return json({ ok: true });
    }
    // --- The website (aspiran.in): Chotu as the guide, and what visitors tell it (web.ts)
    if (path.startsWith("/web/")) { const r = await webRoute(req, env, path); if (r) return r; }
    if (path === "/chotu" && req.method === "POST") {
      // Free cloud turns are counted only when Plus is switched on and the app says who's asking.
      const peek = await req.clone().json<any>().catch(() => ({}));
      if (/^[\w-]{16,64}$/.test(String(peek?.memberId ?? ""))) {
        const allow = await useAllowance(env, peek.memberId, "chotu");
        if (!allow.ok) return json({ error: "Chotu's out of cloud turns for today. It still works offline on your phone.", limit: true, offline: true }, 429);
        ctx.waitUntil(logFirst(env, "first_chotu_chat", peek.memberId));
      }
      return chotuChat(req, env);
    }

    // --- Pods (joining, states, moving), the Commons, the season and the matching fields: community.ts
    const community = await communityRoute(req, env, path, url);
    if (community) return community;
    // --- Open rooms, joined like channels until the sign-up threshold (rooms.ts)
    const rooms = await roomsRoute(req, env, path, url);
    if (rooms) return rooms;
    // --- Answer Studio: rubric feedback on a Mains answer, photo or typed (answers.ts)
    const answers = await answersRoute(req, env, path);
    if (answers) return answers;
    // --- Mock interview board: one AI follow-up per answer (interview.ts)
    const interview = await interviewRoute(req, env, path);
    if (interview) return interview;
    // --- Plus, test mode only and behind the "plus" flag: plus.ts
    // Cashfree: orders, the return check, receipts and the signed webhook (payments.ts)
    const pay = await paymentsRoute(req, env, path, url);
    if (pay) return pay;
    // Google Play purchases from the Android app, behind the "play_billing" flag (play.ts)
    const play = await playRoute(req, env, path);
    if (play) return play;
    const plus = await plusRoute(req, env, path, url);
    if (plus) return plus;
    const ws = path.match(/^\/pods\/([\w-]+)\/ws$/);
    if (ws) {
      const memberId = url.searchParams.get("member") ?? "";
      await ensureSchema(env);
      const member = await env.DB.prepare("SELECT suspended_until FROM members WHERE member_id = ? AND pod_id = ?").bind(memberId, ws[1]).first<{ suspended_until: string | null }>();
      if (!member) return bad("Not a member of this pod", 403);
      if (member.suspended_until && member.suspended_until > new Date().toISOString()) return bad("Your pod chat is paused by a moderator for now.", 403);
      if (!(await flags(env)).pod_chat) return bad("Pod chat is paused for now.", 503);
      const stub = env.POD.get(env.POD.idFromName(ws[1]));
      const fwd = new URL(req.url);
      fwd.searchParams.set("pod", ws[1]);
      return stub.fetch(new Request(fwd.toString(), req));
    }

    // --- News desk and moderation
    if (path === "/desk") return new Response(DESK_HTML, { headers: { "content-type": "text/html; charset=utf-8", ...STAFF_PAGE } });
    // Library ids have colons in them, which the desk page escapes as %3A.
    if (path.startsWith("/desk/api/")) return deskApi(req, env, safeDecode(path.slice("/desk/api/".length)));
    if (path.startsWith("/mod/api/")) return modApi(req, env, path.slice("/mod/api/".length));

    // --- Admin console
    if (path === "/admin") return new Response(ADMIN_HTML, { headers: { "content-type": "text/html; charset=utf-8", ...STAFF_PAGE } });
    if (path.startsWith("/admin/api/")) return adminApi(req, env, path.slice("/admin/api/".length));

    return bad("Not found", 404);
  },

  /**
   * One half-hourly cron runs whatever is due at that IST time (Cloudflare's free plan allows few cron
   * strings). The old daily cron strings still work when run by hand with /__scheduled?cron=...
   */
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
    const OLD: Record<string, string> = { "0 0 * * *": "05:30", "30 1 * * *": "07:00", "30 7 * * *": "13:00", "30 12 * * *": "18:00", "0 16 * * *": "21:30" };
    const at = new Date(event.scheduledTime);
    const ist = istNow(at);
    const hm = OLD[event.cron] ?? ist.toISOString().slice(11, 16);
    const log = (name: string) => (r: unknown) => console.log(name, JSON.stringify(r));
    const fail = (name: string) => (e: unknown) => console.log(name, "failed", String(e));
    if (hm === "05:30") {
      ctx.waitUntil(runPipeline(env).then((l) => console.log(l.join("\n"))));
      ctx.waitUntil(createBackup(env, "daily").then((b) => console.log("backup", b.key), fail("backup")));
      ctx.waitUntil(runJob(env, "merge", at).then(log("merge"), fail("merge")).then(() => runJob(env, "states", at)).then(log("states"), fail("states")));
      // Photos sent to rooms and pods go after 7 days.
      ctx.waitUntil(runJob(env, "photos", at).then(log("photos"), fail("photos")));
      // Website Chotu chats go after 180 days.
      ctx.waitUntil(pruneWebChats(env).then(log("web chats"), fail("web chats")));
      // Purchases refunded through Google Play end the Plus they bought (does nothing until Play Billing is set up).
      ctx.waitUntil(playVoided(env).then(log("play refunds"), fail("play refunds")));
    }
    // Monday 06:00 IST: the weekly batch match, so pods start together.
    if (hm === "06:00" && ist.getUTCDay() === 1) ctx.waitUntil(runJob(env, "match", at).then(log("match"), fail("match")));
    if (hm === "07:00") {
      // Publish what the editor approved, then tell the pods (through the host gate).
      ctx.waitUntil((async () => {
        // The automatic Chai (flag chai_auto): fills the day from checked drafts when no editor has been in.
        const auto = (await flags(env)).chai_auto ? await autoPick(env).catch((e) => { console.log("auto chai failed", String(e)); return null; }) : null;
        const r = await publish(env);
        console.log(JSON.stringify({ ...r, auto }));
        if (r.published) await postRitual(env, "chai");
        await chaiDigest(env, istDay(), auto, r).catch(() => {});
      })()
        // Then each open room's pinned question, from what was just published.
        .then(() => runJob(env, "pins", at)).then(log("pins"), fail("pins")));
    }
    // Chotu's host schedule (Mon goal, Wed/Sat answer hour, Fri quiz, Sun wins) and the welcome/quiet checks.
    if (!OLD[event.cron] || hm !== "05:30") ctx.waitUntil(runJob(env, "host", at).then(log("host"), fail("host")));
  },
} satisfies ExportedHandler<Env>;

/**
 * The Desk and Admin pages: never framed, never cached, and only allowed to load their own inline code and talk to
 * this server. Both pages are single files with inline scripts and styles, hence 'unsafe-inline'; what the policy
 * stops is a script or a form pointing anywhere else.
 */
const STAFF_PAGE = {
  "x-frame-options": "DENY", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
};

/** What the Free Shelf shows visitors with no account. */
const SHELF_KINDS = new Set(["calm", "routine", "pause-lines"]);

/** Daily pulls a member may make of each content route; far above what the apps need, far below a scrape. */
const CONTENT_CAP: Record<string, number> = { library: 60, brief: 200, practice: 120 };
async function contentCap(env: Env, member: string | null, path: string): Promise<Response | null> {
  if (!member) return null; // sign-in switched off by Ops: nothing to count against
  const key = path.split("/")[1]; // library, brief or practice
  await ensureSchema(env);
  const day = istDay();
  const row = await env.DB.prepare(
    "INSERT INTO content_pulls (member_id, day, route, n) VALUES (?, ?, ?, 1) ON CONFLICT (member_id, day, route) DO UPDATE SET n = n + 1 RETURNING n",
  ).bind(member, day, key).first<{ n: number }>();
  if ((row?.n ?? 0) <= (CONTENT_CAP[key] ?? 60)) return null;
  return json({ error: "That's a lot of loading for one day. Your saved copy still works; it refreshes tomorrow.", code: "content_cap" }, 429);
}
