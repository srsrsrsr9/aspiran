-- Sign-in accounts (auth-build.md). The Worker also creates these on first use (ensureSchema in src/staff.ts),
-- so running this by hand is optional; it is here so the production database can be prepared before deploying:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0001_accounts.sql
-- Our own table decides who may use the app; Firebase only proves who someone is.
CREATE TABLE IF NOT EXISTS accounts (
  uid TEXT PRIMARY KEY,              -- Firebase uid (or dev-<id> in local dev mode)
  provider TEXT NOT NULL,            -- phone | google.com | dev
  phone TEXT,                        -- as Firebase returns it (E.164). Sign-in and staff search only; never shown to members or sent to AI
  email TEXT,                        -- same, for Google sign-in
  member_id TEXT UNIQUE,             -- the member id pods, consent and Plus use; an existing install's anonymous id is linked on first sign-in
  status TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  status_reason TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,                 -- updated at most every 10 minutes
  app_version TEXT
);
CREATE INDEX IF NOT EXISTS accounts_phone ON accounts(phone);
CREATE INDEX IF NOT EXISTS accounts_email ON accounts(email);
-- Every suspend and restore from the admin console, and erasures.
CREATE TABLE IF NOT EXISTS account_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, uid TEXT NOT NULL, action TEXT NOT NULL,
  reason TEXT, actor_id TEXT, actor TEXT);
CREATE INDEX IF NOT EXISTS account_audit_uid ON account_audit(uid, id);
-- A suspended account that erased its data leaves only SHA-256("ident:" + phone or email), so signing up again stays suspended.
CREATE TABLE IF NOT EXISTS account_tombstones (ident_hash TEXT PRIMARY KEY, reason TEXT, at TEXT NOT NULL);
