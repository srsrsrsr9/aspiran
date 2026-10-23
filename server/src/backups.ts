import { reapplyErasures } from "./privacy";
import { type Env } from "./shared";
import { ensureSchema } from "./staff";

/**
 * Database backups to the BACKUPS bucket (never served publicly). One JSON file per backup.
 * A daily one runs with the 05:30 cron and the last 30 are kept; admins can make one any time.
 *
 * Restore replaces content and community data. It never touches staff accounts, the audit log,
 * privacy requests, settings or LLM usage, and everyone who asked to be erased is erased again.
 * A backup is taken first, so a restore can itself be undone.
 * Pod chat (messages, private notes to the lead, and who leads) is read from each pod's Durable Object
 * into the same file under `podChat`, and written back on a restore.
 */

const BACKED_UP = ["candidates", "briefs", "pods", "members", "notes", "packs", "library", "reports", "content_versions",
  "consents", "announcements", "incidents", "seen", "daily_counts", "settings", "staff", "audit", "privacy_requests", "llm_calls"];
const RESTORED = ["candidates", "briefs", "pods", "members", "notes", "packs", "library", "reports", "content_versions",
  "consents", "announcements", "incidents", "seen", "daily_counts"];
const KEEP_DAILY = 30;
const podStub = (env: Env, id: string) => env.POD.get(env.POD.idFromName(id));

export async function createBackup(env: Env, reason: string): Promise<{ key: string; rows: number; bytes: number }> {
  if (!env.BACKUPS) throw new Error("No BACKUPS bucket bound. Check r2_buckets in wrangler.jsonc.");
  await ensureSchema(env);
  const tables: Record<string, unknown[]> = {};
  let rows = 0;
  for (const t of BACKED_UP) {
    // Staff key hashes stay out of backup files.
    const sql = t === "staff" ? "SELECT id, name, email, roles, created_at, created_by, last_seen_at, disabled_at FROM staff" : `SELECT * FROM ${t}`;
    const r = await env.DB.prepare(sql).all().catch(() => ({ results: [] as unknown[] }));
    tables[t] = r.results;
    rows += r.results.length;
  }
  const podChat: Record<string, unknown> = {};
  for (const p of tables.pods as { id: string }[]) {
    const d = await podStub(env, p.id).fetch(`https://pod/dump?pod=${encodeURIComponent(p.id)}`).then((r) => r.json<any>()).catch(() => null);
    if (d) { podChat[p.id] = d; rows += d.messages.length + d.private.length; }
  }
  const at = new Date().toISOString();
  const key = `backups/${at.replace(/[:.]/g, "-")}-${reason.replace(/[^\w-]/g, "").slice(0, 30)}.json`;
  const body = JSON.stringify({ schema: "upsc-pods/backup@1", at, reason, tables, podChat });
  await env.BACKUPS.put(key, body, { httpMetadata: { contentType: "application/json" }, customMetadata: { reason, rows: String(rows) } });
  if (reason === "daily") await prune(env);
  return { key, rows, bytes: body.length };
}

async function prune(env: Env) {
  const list = await env.BACKUPS!.list({ prefix: "backups/" });
  const daily = list.objects.filter((o) => o.key.endsWith("-daily.json")).sort((a, b) => b.key.localeCompare(a.key));
  for (const o of daily.slice(KEEP_DAILY)) await env.BACKUPS!.delete(o.key);
}

export async function listBackups(env: Env) {
  if (!env.BACKUPS) return [];
  const list = await env.BACKUPS.list({ prefix: "backups/", include: ["customMetadata"] } as any);
  return list.objects
    .map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded, reason: o.customMetadata?.reason ?? "", rows: Number(o.customMetadata?.rows ?? 0) }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

export const safeBackupKey = (k: string) => /^backups\/[\w.-]+\.json$/.test(k);

export async function restoreBackup(env: Env, key: string) {
  if (!env.BACKUPS) throw new Error("No BACKUPS bucket bound");
  const obj = await env.BACKUPS.get(key);
  if (!obj) throw new Error("No such backup");
  const data = await obj.json<any>();
  if (data?.schema !== "upsc-pods/backup@1") throw new Error("Not a UPSC Pods backup");
  const safety = await createBackup(env, "before-restore");
  const counts: Record<string, number> = {};
  for (const t of RESTORED) {
    const rows: any[] = data.tables?.[t] ?? [];
    // Only columns the table really has, so an old backup still restores after a schema change.
    const cols = new Set((await env.DB.prepare(`PRAGMA table_info(${t})`).all<{ name: string }>()).results.map((c) => c.name));
    const stmts = [env.DB.prepare(`DELETE FROM ${t}`)];
    for (const row of rows) {
      const keys = Object.keys(row).filter((k) => cols.has(k));
      if (!keys.length) continue;
      stmts.push(env.DB.prepare(`INSERT OR REPLACE INTO ${t} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`).bind(...keys.map((k) => row[k])));
    }
    for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
    counts[t] = rows.length;
  }
  // Older backups have no podChat; those pods keep the chat they have now.
  let chats = 0;
  for (const [id, d] of Object.entries<any>(data.podChat ?? {})) {
    const r = await podStub(env, id).fetch(`https://pod/load?pod=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify(d) }).catch(() => null);
    if (r?.ok) chats++;
  }
  counts.podChats = chats;
  const erasedAgain = await reapplyErasures(env);
  return { restored: key, takenFirst: safety.key, counts, erasedAgain };
}
