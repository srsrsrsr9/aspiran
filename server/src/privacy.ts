import { type Env, json, bad } from "./shared";
import { bump, ensureSchema, sha256Hex } from "./staff";
import { forgetAccount } from "./auth";
import { anonymiseStatements } from "./metrics";

/**
 * DPDP: consent records, and a member's right to get or erase what the server holds about them.
 * Most of a member's data never leaves their phone or browser; the server holds their sign-in account (phone or
 * email, status), pod membership, consent records, pod messages and private notes, and reports that mention them.
 * Erasure keeps one line: a hash of the member id with the date, so restoring an old backup can erase them again.
 */

export const CONSENT_VERSION = "2026-10";
const validId = (id: unknown) => typeof id === "string" && /^[\w-]{16,64}$/.test(id);

export async function recordConsent(env: Env, body: any): Promise<Response> {
  if (!validId(body?.memberId)) return bad("memberId is required");
  await ensureSchema(env);
  const purposes = Array.isArray(body.purposes) ? body.purposes.map(String).slice(0, 10) : ["pods", "content"];
  const version = String(body.version ?? CONSENT_VERSION).slice(0, 20);
  if (body.withdraw) {
    await env.DB.prepare("UPDATE consents SET withdrawn_at = ? WHERE member_id = ? AND withdrawn_at IS NULL").bind(new Date().toISOString(), body.memberId).run();
    return json({ ok: true, withdrawn: true });
  }
  await env.DB.prepare("INSERT INTO consents (member_id, version, purposes, at) VALUES (?, ?, ?, ?) ON CONFLICT(member_id, version) DO UPDATE SET purposes = excluded.purposes, withdrawn_at = NULL")
    .bind(body.memberId, version, JSON.stringify(purposes), new Date().toISOString()).run();
  await bump(env, "consents");
  return json({ ok: true, version });
}

export async function exportMember(env: Env, memberId: string, via: string, by: string | null = null) {
  await ensureSchema(env);
  const member = await env.DB.prepare("SELECT member_id, pod_id, joined_at, suspended_until, suspend_reason FROM members WHERE member_id = ?").bind(memberId).first<any>();
  const consents = (await env.DB.prepare("SELECT version, purposes, at, withdrawn_at FROM consents WHERE member_id = ?").bind(memberId).all()).results;
  const reports = (await env.DB.prepare("SELECT kind, pod_id, text, reason, status, created_at FROM reports WHERE member_id = ?").bind(memberId).all()).results;
  const account = await env.DB.prepare("SELECT a.uid, a.provider, a.phone, a.email, p.username, a.status, a.created_at, a.last_seen_at, a.app_version FROM accounts a LEFT JOIN password_logins p ON p.uid = a.uid WHERE a.member_id = ?").bind(memberId).first();
  // Usage events and one-tap feedback (metrics.ts): names, days and codes only, never text.
  const events = (await env.DB.prepare("SELECT name, props, day FROM events WHERE member_id = ? ORDER BY id").bind(memberId).all()).results;
  const feedback = (await env.DB.prepare("SELECT moment, rating, day FROM feedback WHERE member_id = ? ORDER BY id").bind(memberId).all()).results;
  let pod: unknown = null;
  if (member?.pod_id) {
    const stub = env.POD.get(env.POD.idFromName(member.pod_id));
    pod = await stub.fetch(`https://pod/export?pod=${encodeURIComponent(member.pod_id)}&member=${encodeURIComponent(memberId)}`).then((r) => r.json()).catch(() => null);
  }
  await logRequest(env, "export", memberId, via, by);
  await bump(env, "data_exports");
  return {
    exportedAt: new Date().toISOString(),
    note: "Everything the UPSC Pods server holds about this member id. Journal, mood, progress and saved cards live only on the member's own device.",
    account, member, consents, reportsAboutTheirMessages: reports, pod, usageEvents: events, feedback,
  };
}

export async function forgetMember(env: Env, memberId: string, via: string, by: string | null = null) {
  await ensureSchema(env);
  const member = await env.DB.prepare("SELECT pod_id FROM members WHERE member_id = ?").bind(memberId).first<{ pod_id: string }>();
  let pod: any = null;
  if (member?.pod_id) {
    const stub = env.POD.get(env.POD.idFromName(member.pod_id));
    pod = await stub.fetch(`https://pod/forget?pod=${encodeURIComponent(member.pod_id)}&member=${encodeURIComponent(memberId)}`, { method: "POST" }).then((r) => r.json()).catch(() => null);
  }
  await env.DB.batch([
    ...(member ? [env.DB.prepare("UPDATE pods SET size = MAX(size - 1, 0), lead_member = CASE WHEN lead_member = ? THEN NULL ELSE lead_member END WHERE id = ?").bind(memberId, member.pod_id)] : []),
    env.DB.prepare("DELETE FROM members WHERE member_id = ?").bind(memberId),
    env.DB.prepare("DELETE FROM consents WHERE member_id = ?").bind(memberId),
    // Reports stay for the safety record, without the words or who wrote them.
    env.DB.prepare("UPDATE reports SET member_id = NULL, author = '(deleted member)', text = NULL WHERE member_id = ?").bind(memberId),
    // Usage counts stay; the link to the person goes.
    ...anonymiseStatements(env, memberId),
  ]);
  await forgetAccount(env, memberId);
  await logRequest(env, "delete", memberId, via, by);
  await bump(env, "data_deletions");
  return { deleted: true, wasInPod: !!member, pod };
}

async function logRequest(env: Env, kind: string, memberId: string, via: string, by: string | null) {
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO privacy_requests (kind, member_hash, via, status, at, done_at, done_by) VALUES (?, ?, ?, 'done', ?, ?, ?)")
    .bind(kind, await sha256Hex(memberId), via, now, now, by).run();
}

/** After restoring a backup: erase again everyone who asked to be erased. */
export async function reapplyErasures(env: Env): Promise<number> {
  const erased = new Set((await env.DB.prepare("SELECT member_hash FROM privacy_requests WHERE kind = 'delete'").all<{ member_hash: string }>()).results.map((r) => r.member_hash));
  if (!erased.size) return 0;
  const ids = new Set<string>();
  for (const t of ["members", "consents", "reports", "events"]) {
    const { results } = await env.DB.prepare(`SELECT DISTINCT member_id FROM ${t} WHERE member_id IS NOT NULL`).all<{ member_id: string }>();
    for (const r of results) if (erased.has(await sha256Hex(r.member_id))) ids.add(r.member_id);
  }
  for (const id of ids) {
    // Their pod chat came back with the restore too.
    const m = await env.DB.prepare("SELECT pod_id FROM members WHERE member_id = ?").bind(id).first<{ pod_id: string }>();
    if (m?.pod_id) await env.POD.get(env.POD.idFromName(m.pod_id)).fetch(`https://pod/forget?pod=${encodeURIComponent(m.pod_id)}&member=${encodeURIComponent(id)}`, { method: "POST" }).catch(() => {});
    await env.DB.batch([
      env.DB.prepare("DELETE FROM members WHERE member_id = ?").bind(id),
      env.DB.prepare("DELETE FROM consents WHERE member_id = ?").bind(id),
      env.DB.prepare("UPDATE reports SET member_id = NULL, author = '(deleted member)', text = NULL WHERE member_id = ?").bind(id),
      ...anonymiseStatements(env, id),
    ]);
  }
  return ids.size;
}

/** Self-serve, from the apps: the member id is the member's own secret. */
export async function privacyRoute(req: Request, env: Env, action: string): Promise<Response> {
  const body = await req.json<any>().catch(() => ({}));
  if (!validId(body.memberId)) return bad("memberId is required");
  if (action === "export") return json(await exportMember(env, body.memberId, "self-serve"));
  if (action === "delete") return json(await forgetMember(env, body.memberId, "self-serve"));
  return bad("Not found", 404);
}
