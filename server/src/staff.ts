import { type Env, bad, istDay, tokenOk } from "./shared";

/**
 * Staff accounts, roles, the audit log, settings (feature flags and LLM controls) and counters.
 *
 * Sign-in is a personal key per person. An admin creates it in /admin, it's shown once, and only its
 * SHA-256 hash is stored. The shared secrets still work: ADMIN_TOKEN (or EDITOR_TOKEN when there's no
 * ADMIN_TOKEN) is the owner key, MOD_TOKEN is a moderator. Shared keys have no name, so approving with
 * one still needs a name typed on the desk; a personal key approves under its own name.
 */

export const ROLES = {
  admin: "Admin: everything, including staff, privacy requests, flags and backups",
  editor: "Editor: writes and approves English content, publishes the brief",
  hindi_editor: "Hindi editor: edits content and approves the Hindi",
  language_editor: "Language editor: edits content and approves the languages picked for them (Telugu and others)",
  moderator: "Moderator: reports, the safety queue and members",
} as const;
export type Role = keyof typeof ROLES;

const PERMS: Record<string, Role[]> = {
  content: ["admin", "editor", "hindi_editor", "language_editor"],
  "approve:en": ["admin", "editor"],
  "approve:hi": ["admin", "hindi_editor"],
  publish: ["admin", "editor"],
  moderate: ["admin", "moderator"],
  safety: ["admin", "moderator"],
  members: ["admin", "moderator"],
  analytics: ["admin", "editor", "hindi_editor", "language_editor", "moderator"],
  "llm:view": ["admin", "editor"],
  "llm:control": ["admin"],
  announce: ["admin", "editor"],
  incidents: ["admin"],
  privacy: ["admin"],
  flags: ["admin"],
  staff: ["admin"],
  audit: ["admin"],
  backups: ["admin"],
};
export const PERM_NAMES = Object.keys(PERMS);

export interface Staff {
  id: string;
  /** Null for a shared key: the desk asks for a name before approving. */
  name: string | null;
  roles: Role[];
  shared: boolean;
  /** Languages a language editor approves (beyond English and Hindi). */
  langs: string[];
}

export const can = (s: Staff | null, perm: string): boolean => {
  if (!s) return false;
  // approve:te and the like: an admin, or a language editor picked for that language.
  const lang = perm.match(/^approve:([a-z]{2})$/)?.[1];
  if (lang && lang !== "en" && lang !== "hi") return s.roles.includes("admin") || (s.roles.includes("language_editor") && s.langs.includes(lang));
  return (PERMS[perm] ?? []).some((r) => s.roles.includes(r));
};
export const permsOf = (s: Staff) => PERM_NAMES.filter((p) => can(s, p));

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** A personal key: 32 random bytes as hex, with a prefix so it's recognisable if pasted somewhere. */
export function newKey(): string {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return "upk_" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Who is calling, from the bearer key. Null if nobody. */
export async function staffFrom(req: Request, env: Env): Promise<Staff | null> {
  const owner = env.ADMIN_TOKEN ?? env.EDITOR_TOKEN;
  if (tokenOk(req, owner)) return { id: "owner", name: null, roles: ["admin"], shared: true, langs: [] };
  if (env.ADMIN_TOKEN && tokenOk(req, env.EDITOR_TOKEN)) return { id: "shared-editor", name: null, roles: ["editor", "hindi_editor"], shared: true, langs: [] };
  if (tokenOk(req, env.MOD_TOKEN)) return { id: "shared-mod", name: null, roles: ["moderator"], shared: true, langs: [] };
  const key = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!key.startsWith("upk_") || key.length > 80) return null;
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT id, name, roles, langs FROM staff WHERE key_hash = ? AND disabled_at IS NULL")
    .bind(await sha256Hex(key)).first<{ id: string; name: string; roles: string; langs: string | null }>();
  if (!row) return null;
  await env.DB.prepare("UPDATE staff SET last_seen_at = ? WHERE id = ?").bind(new Date().toISOString(), row.id).run();
  return { id: row.id, name: row.name, roles: JSON.parse(row.roles), shared: false, langs: JSON.parse(row.langs ?? "[]") };
}

/** The name an approval is recorded under: the account's own, or the one typed with a shared key. */
// Every approval shows one name in the app and on the Desk: the owner chose this on 4 Nov 2026 so nobody has to type
// or update a name. Who actually pressed Approve is still in the audit log (signed-in staff by name, keys by key).
export const EDITORIAL_NAME = "Editorial team";
export function approverName(_s: Staff, _typed: unknown): string {
  return EDITORIAL_NAME;
}

export const label = (s: Staff) => s.name ?? (s.id === "owner" ? "Owner key" : s.id === "shared-mod" ? "Shared moderator key" : "Shared editor key");

// --- Audit log ------------------------------------------------------------------------------

export async function audit(env: Env, s: Staff | null, action: string, target = "", detail: unknown = null) {
  await ensureSchema(env);
  await env.DB.prepare("INSERT INTO audit (at, actor_id, actor, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(new Date().toISOString(), s?.id ?? "system", s ? label(s) : "System", action, target.slice(0, 200), detail == null ? null : JSON.stringify(detail).slice(0, 1000))
    .run();
}

/** Body fields worth keeping in the audit log: never keys, tokens, or whole content items. */
export function auditDetail(body: any): any {
  if (!body || typeof body !== "object") return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (/key|token|secret|password|data|card|text|body|source|reply|pdf|edits|phrases/i.test(k)) continue;
    out[k] = typeof v === "string" ? v.slice(0, 120) : v;
  }
  return Object.keys(out).length ? out : null;
}

// --- Content versions -----------------------------------------------------------------------

export async function recordVersion(env: Env, type: "card" | "library", id: string, json: string, action: string, actor: string) {
  await ensureSchema(env);
  await env.DB.prepare("INSERT INTO content_versions (item_type, item_id, json, action, actor, at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(type, id, json, action, actor.slice(0, 80), new Date().toISOString()).run();
}

// --- Settings: feature flags and LLM controls -----------------------------------------------

export const FLAG_INFO = {
  pod_join: "New members can join pods",
  pod_chat: "Pod chat, pings and the study room",
  chotu: "Chotu's jokes on light Chai cards",
  mocks: "Mock papers",
  long_reads: "Long reads",
  library: "Content library (explainers, games, maps and the rest)",
  practice: "Practice questions on the web",
  announcements: "Announcement banners in the apps",
  pod_friends: "Pod friends: four AI study friends of Chotu (labelled · AI) who post in small pods. Never counted as members, never private, quiet 23:30-07:00, fewer posts as real people join",
  plus: "Plus: free limits, value-moment offers in Prep, trial, and yearly Plus on the web (Cashfree once its keys are set, test mode until then). Off until launch",
  play_billing: "Google Play Billing for Plus in the Android app (plus_yearly, a year at ₹9,999). Needs the plus flag, PLAY_SERVICE_ACCOUNT_JSON and an app built with PLAY_BILLING on. Off until Play Console is set up",
  password_login: "Username and password sign-in, next to Continue with Google (staff can reset forgotten passwords from Accounts; members with a recovery email can reset their own). Off stops new sign-ups and sign-ins; people already signed in stay signed in",
  sign_in_required: "Member features need a signed-in, active account. Switch off only while older app versions (without sign-in) are being replaced: then calls without a sign-in work as before, and suspended accounts are still refused",
} as const;
export type Flag = keyof typeof FLAG_INFO;
/** Everything starts on, except Plus and Play Billing, which stay off until the founder switches them on. */
export const DEFAULT_FLAGS: Record<Flag, boolean> = { ...Object.fromEntries(Object.keys(FLAG_INFO).map((k) => [k, true])), plus: false, play_billing: false,
  // Google only for now (owner, 1 Nov 2026): username sign-in stays built but hidden until switched on in Admin → Flags.
  password_login: false } as any;

export const DRAFT_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.1-8b-instruct-fast", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
export const AUTHOR_MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"];
export interface LlmControls {
  enabled: boolean;
  /** evaluate: Answer Studio's rubric feedback (answers.ts). */
  purposes: { draft: boolean; guard: boolean; embed: boolean; author: boolean; chotu: boolean; evaluate: boolean };
  draftModel: string;
  /** Claude model for the desk's Author tab (needs ANTHROPIC_API_KEY). */
  authorModel: string;
  dailyCallCap: number;
  dailyTokenCap: number;
  maxTokens: number;
  temperature: number;
}
export const DEFAULT_LLM: LlmControls = {
  enabled: true,
  purposes: { draft: true, guard: true, embed: true, author: true, chotu: true, evaluate: true },
  draftModel: DRAFT_MODELS[0],
  authorModel: AUTHOR_MODELS[0],
  dailyCallCap: 300,
  dailyTokenCap: 400_000,
  maxTokens: 2500,
  temperature: 0.3,
};

export async function getSetting<T>(env: Env, key: string, fallback: T): Promise<T> {
  await ensureSchema(env);
  const row = await env.DB.prepare("SELECT json FROM settings WHERE key = ?").bind(key).first<{ json: string }>();
  if (!row) return structuredClone(fallback);
  const saved = JSON.parse(row.json);
  return fallback && typeof fallback === "object" && !Array.isArray(fallback) ? { ...structuredClone(fallback), ...saved } : saved;
}

export async function setSetting(env: Env, key: string, value: unknown, by: string) {
  await ensureSchema(env);
  await env.DB.prepare("INSERT INTO settings (key, json, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
    .bind(key, JSON.stringify(value), new Date().toISOString(), by).run();
}

export const flags = (env: Env) => getSetting<Record<Flag, boolean>>(env, "flags", DEFAULT_FLAGS);
export const llmControls = async (env: Env) => {
  const c = await getSetting<LlmControls>(env, "llm", DEFAULT_LLM);
  // Settings saved before a purpose existed keep its default.
  c.purposes = { ...DEFAULT_LLM.purposes, ...c.purposes };
  return c;
};

// --- Counters: daily totals only, never who ------------------------------------------------

export async function bump(env: Env, metric: string, n = 1) {
  try {
    await ensureSchema(env);
    await env.DB.prepare("INSERT INTO daily_counts (day, metric, n) VALUES (?, ?, ?) ON CONFLICT(day, metric) DO UPDATE SET n = n + excluded.n")
      .bind(istDay(), metric, n).run();
  } catch { /* counting never breaks a request */ }
}

// --- Schema ---------------------------------------------------------------------------------

let schemaReady: Promise<void> | null = null;

/** Creates the admin tables on first use, so an existing local database upgrades itself. Same SQL as schema.sql. */
export function ensureSchema(env: Env): Promise<void> {
  schemaReady ??= (async () => {
    await env.DB.batch(ADMIN_SCHEMA.map((s) => env.DB.prepare(s)));
    for (const alter of ALTERS) await env.DB.prepare(alter).run().catch(() => {}); // already there
  })().catch((e) => { schemaReady = null; throw e; });
  return schemaReady;
}

export const ADMIN_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, roles TEXT NOT NULL, key_hash TEXT UNIQUE,
    created_at TEXT NOT NULL, created_by TEXT, last_seen_at TEXT, disabled_at TEXT, langs TEXT)`,
  `CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor_id TEXT, actor TEXT, action TEXT NOT NULL, target TEXT, detail TEXT)`,
  `CREATE INDEX IF NOT EXISTS audit_at ON audit(at)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT, updated_by TEXT)`,
  `CREATE TABLE IF NOT EXISTS content_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id TEXT NOT NULL,
    json TEXT NOT NULL, action TEXT NOT NULL, actor TEXT, at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS content_versions_item ON content_versions(item_type, item_id, id)`,
  `CREATE TABLE IF NOT EXISTS llm_calls (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, day TEXT NOT NULL, purpose TEXT NOT NULL,
    model TEXT NOT NULL, status TEXT NOT NULL, ms INTEGER, tokens_in INTEGER, tokens_out INTEGER, error TEXT)`,
  `CREATE INDEX IF NOT EXISTS llm_calls_day ON llm_calls(day)`,
  `CREATE TABLE IF NOT EXISTS daily_counts (day TEXT NOT NULL, metric TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, metric))`,
  `CREATE TABLE IF NOT EXISTS consents (member_id TEXT NOT NULL, version TEXT NOT NULL, purposes TEXT NOT NULL, at TEXT NOT NULL,
    withdrawn_at TEXT, PRIMARY KEY (member_id, version))`,
  `CREATE TABLE IF NOT EXISTS privacy_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, member_hash TEXT NOT NULL,
    via TEXT NOT NULL, status TEXT NOT NULL, at TEXT NOT NULL, done_at TEXT, done_by TEXT, note TEXT)`,
  `CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, link TEXT, level TEXT NOT NULL DEFAULT 'info',
    starts_at TEXT NOT NULL, ends_at TEXT, created_by TEXT, created_at TEXT NOT NULL, sent_to_pods_at TEXT, withdrawn_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, title TEXT NOT NULL, component TEXT NOT NULL, impact TEXT NOT NULL,
    status TEXT NOT NULL, updates TEXT NOT NULL, started_at TEXT NOT NULL, resolved_at TEXT, created_by TEXT)`,
  // Plus (test mode until real payments exist): what a member has, and what they've used of the free tier.
  `CREATE TABLE IF NOT EXISTS entitlements (member_id TEXT PRIMARY KEY, plan TEXT NOT NULL, source TEXT NOT NULL, starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL, cancelled_at TEXT, trial_used INTEGER NOT NULL DEFAULT 0, test INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS usage (member_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (member_id, day, kind))`,
  `CREATE TABLE IF NOT EXISTS gifts (code TEXT PRIMARY KEY, plan TEXT NOT NULL, created_at TEXT NOT NULL, redeemed_by TEXT, redeemed_at TEXT, test INTEGER NOT NULL DEFAULT 1)`,
  // Opt-in mock bands: anonymous, no member id. Only the paper, the percent and the day.
  `CREATE TABLE IF NOT EXISTS mock_scores (mock_id TEXT NOT NULL, pct INTEGER NOT NULL, day TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS mock_scores_by_mock ON mock_scores (mock_id, pct)`,
  `CREATE TABLE IF NOT EXISTS scholarships (id TEXT PRIMARY KEY, pod_id TEXT NOT NULL, nominated_by TEXT NOT NULL, member_id TEXT NOT NULL, at TEXT NOT NULL)`,
  // "Request your language": one row per language per device. who = SHA-256 of a random id the app makes; never a member id or name.
  `CREATE TABLE IF NOT EXISTS lang_requests (lang TEXT NOT NULL, who TEXT NOT NULL, helper INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL, PRIMARY KEY (lang, who))`,
  // Sign-in (auth.ts, migrations/0001_accounts.sql): who may use the app. Phone/email only for sign-in and staff search.
  `CREATE TABLE IF NOT EXISTS accounts (uid TEXT PRIMARY KEY, provider TEXT NOT NULL, phone TEXT, email TEXT, member_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active', status_reason TEXT, created_at TEXT NOT NULL, last_seen_at TEXT, app_version TEXT)`,
  `CREATE INDEX IF NOT EXISTS accounts_phone ON accounts(phone)`,
  `CREATE INDEX IF NOT EXISTS accounts_email ON accounts(email)`,
  `CREATE TABLE IF NOT EXISTS account_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, uid TEXT NOT NULL, action TEXT NOT NULL,
    reason TEXT, actor_id TEXT, actor TEXT)`,
  `CREATE INDEX IF NOT EXISTS account_audit_uid ON account_audit(uid, id)`,
  `CREATE TABLE IF NOT EXISTS account_tombstones (ident_hash TEXT PRIMARY KEY, reason TEXT, at TEXT NOT NULL)`,
  // Username and password sign-in (password.ts, migrations/0004_password_login.sql). PBKDF2 hashes only.
  `CREATE TABLE IF NOT EXISTS password_logins (username TEXT PRIMARY KEY, uid TEXT NOT NULL UNIQUE, pw_hash TEXT NOT NULL,
    epoch INTEGER NOT NULL DEFAULT 1, must_change INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_throttle (k TEXT PRIMARY KEY, fails INTEGER NOT NULL, window_start INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS server_keys (name TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT NOT NULL)`,
  // Password recovery by email (password.ts, migrations/0006_password_recovery.sql). Codes and reset tokens are hashed.
  `CREATE TABLE IF NOT EXISTS recovery_emails (uid TEXT PRIMARY KEY, email TEXT, pending_email TEXT, code_hash TEXT, code_expires INTEGER,
    code_tries INTEGER NOT NULL DEFAULT 0, verified_at TEXT, updated_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS recovery_emails_email ON recovery_emails(email)`,
  `CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS password_resets_uid ON password_resets(uid)`,
  // Growth metrics (metrics.ts): our own events, no third-party trackers. Never free text (no mood, journal or chat).
  `CREATE TABLE IF NOT EXISTS installs (install_id TEXT PRIMARY KEY, platform TEXT, source TEXT, invite_code TEXT, referrer TEXT,
    first_open_at TEXT NOT NULL, member_id TEXT)`,
  `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT, install_id TEXT, name TEXT NOT NULL, props TEXT,
    day TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS events_name_day ON events(name, day)`,
  `CREATE INDEX IF NOT EXISTS events_member ON events(member_id, name, day)`,
  `CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT, install_id TEXT, moment TEXT NOT NULL,
    rating INTEGER NOT NULL, day TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS feedback_moment ON feedback(moment, day)`,
  // Cashfree payments (payments.ts): one row per order. No phone number or card details are kept.
  `CREATE TABLE IF NOT EXISTS payments (order_id TEXT PRIMARY KEY, member_id TEXT NOT NULL, amount_inr REAL NOT NULL, founding INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL, mode TEXT NOT NULL, cf_payment_id TEXT, created_at TEXT NOT NULL, paid_at TEXT, refunded_at TEXT, refund_inr REAL, refund_note TEXT)`,
  `CREATE INDEX IF NOT EXISTS payments_member ON payments(member_id, created_at)`,
  // Google Play purchases (play.ts): one row per purchase token, kept as its SHA-256 only, so a token grants once, to one member.
  `CREATE TABLE IF NOT EXISTS play_purchases (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL, product_id TEXT NOT NULL, order_id TEXT,
    status TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0, purchased_at TEXT, created_at TEXT NOT NULL, granted_at TEXT, refunded_at TEXT)`,
  `CREATE INDEX IF NOT EXISTS play_purchases_member ON play_purchases(member_id, created_at)`,
  // Open pods (rooms.ts): which pre-set rooms a member joined. A member can be in several.
  `CREATE TABLE IF NOT EXISTS room_members (member_id TEXT NOT NULL, room_id TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY (member_id, room_id))`,
  `CREATE INDEX IF NOT EXISTS room_members_room ON room_members(room_id)`,
  // Day 1: the starter rooms a member was put in, once (rooms.ts startRooms).
  `CREATE TABLE IF NOT EXISTS room_starters (member_id TEXT PRIMARY KEY, rooms TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS interview_uses (member_id TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (member_id, day))`,
  // Content pulls per member per day (index.ts contentCap): a member reads freely; a scraper hits the cap.
  `CREATE TABLE IF NOT EXISTS content_pulls (member_id TEXT NOT NULL, day TEXT NOT NULL, route TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (member_id, day, route))`,
  // Pods v2 (community.ts): two thin pods join up. The app proposes, Ops approves, any member can stay where they are.
  `CREATE TABLE IF NOT EXISTS pod_merges (id TEXT PRIMARY KEY, from_pod TEXT NOT NULL, to_pod TEXT NOT NULL, status TEXT NOT NULL,
    reason TEXT, created_at TEXT NOT NULL, decided_at TEXT, decided_by TEXT, merge_on TEXT, done_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS pod_merge_optouts (merge_id TEXT NOT NULL, member_id TEXT NOT NULL, PRIMARY KEY (merge_id, member_id))`,
  // The website (web.ts): what a visitor tells Chotu as they scroll, and the daily cap on Chotu's website replies.
  `CREATE TABLE IF NOT EXISTS web_leads (visitor_id TEXT PRIMARY KEY, name TEXT, details TEXT NOT NULL, contact TEXT, contact_kind TEXT,
    lang TEXT, consent_at TEXT, source TEXT, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS web_leads_seen ON web_leads(last_seen)`,
  `CREATE TABLE IF NOT EXISTS web_rate (k TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (k, day))`,
  // The website's Chotu chats (owner, 4 Nov 2026), one row per message, kept 180 days. Distress messages are never saved.
  `CREATE TABLE IF NOT EXISTS web_chats (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, at TEXT NOT NULL, role TEXT NOT NULL,
    content TEXT NOT NULL, lang TEXT)`,
  `CREATE INDEX IF NOT EXISTS web_chats_visitor ON web_chats(visitor_id, at)`,
  `CREATE INDEX IF NOT EXISTS web_chats_at ON web_chats(at)`,
  // "Try one topic" (try.ts): visitors' answers as they go, and a contact only if they chose to leave one.
  `CREATE TABLE IF NOT EXISTS try_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, path_id TEXT NOT NULL,
    question TEXT NOT NULL, answer TEXT, text TEXT, lang TEXT, day TEXT NOT NULL, at TEXT NOT NULL, UNIQUE (session_id, path_id, question))`,
  `CREATE INDEX IF NOT EXISTS try_feedback_q ON try_feedback(path_id, question)`,
  `CREATE TABLE IF NOT EXISTS try_contacts (session_id TEXT PRIMARY KEY, path_id TEXT NOT NULL, contact TEXT NOT NULL, contact_kind TEXT NOT NULL,
    consent_text TEXT NOT NULL, lang TEXT, at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS try_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, path_id TEXT NOT NULL, text_en TEXT NOT NULL, text_hi TEXT,
    done_on TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, created_by TEXT, created_at TEXT NOT NULL)`,
];

const ALTERS = [
  "ALTER TABLE members ADD COLUMN suspended_until TEXT",
  "ALTER TABLE members ADD COLUMN suspend_reason TEXT",
  "ALTER TABLE pods ADD COLUMN lead_member TEXT",
  "ALTER TABLE reports ADD COLUMN member_id TEXT",
  "ALTER TABLE reports ADD COLUMN notes TEXT",
  "ALTER TABLE reports ADD COLUMN handled_by TEXT",
  "ALTER TABLE reports ADD COLUMN updated_at TEXT",
  "ALTER TABLE staff ADD COLUMN langs TEXT",
  // Languages beyond English and Hindi: { te: translation file } and { te: { by, on } }.
  "ALTER TABLE library ADD COLUMN translations TEXT",
  "ALTER TABLE library ADD COLUMN approvals TEXT",
  // Community-first: the four matching fields (the rest of the profile stays on the phone), and pod states.
  "ALTER TABLE members ADD COLUMN stage TEXT",
  "ALTER TABLE members ADD COLUMN attempt_band TEXT",
  "ALTER TABLE members ADD COLUMN lang TEXT",
  "ALTER TABLE members ADD COLUMN time_band TEXT",
  "ALTER TABLE pods ADD COLUMN state TEXT",
  "ALTER TABLE pods ADD COLUMN opens_on TEXT",
  "ALTER TABLE pods ADD COLUMN last_human_at TEXT",
  "ALTER TABLE pods ADD COLUMN quiet_asked_at TEXT",
  "ALTER TABLE pods ADD COLUMN merged_into TEXT",
  // Day 1: joined the closest pod because their exact group had none yet; offered a move when one forms.
  "ALTER TABLE members ADD COLUMN closest INTEGER",
];

/** Staff check for an API area: 401 with no key, 403 without the permission. */
export async function requireStaff(req: Request, env: Env, perm: string): Promise<Staff | Response> {
  const s = await staffFrom(req, env);
  if (!s) return bad(env.EDITOR_TOKEN || env.ADMIN_TOKEN ? "Wrong or missing key." : "Set ADMIN_TOKEN or EDITOR_TOKEN in .dev.vars (local) or with `wrangler secret put` first.", env.EDITOR_TOKEN || env.ADMIN_TOKEN ? 401 : 503);
  if (!can(s, perm)) return bad("Your role can't do that.", 403);
  return s;
}
