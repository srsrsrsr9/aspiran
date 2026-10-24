-- Password recovery by email (src/password.ts). Only a verified address is used; codes and reset links are kept as
-- hashes. The Worker also creates these on first use (ensureSchema in src/staff.ts), so running this by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0006_password_recovery.sql
CREATE TABLE IF NOT EXISTS recovery_emails (
  uid TEXT PRIMARY KEY,                -- password_logins.uid
  email TEXT,                          -- the verified recovery address (lower-case), or null
  pending_email TEXT,                  -- an address waiting for its code
  code_hash TEXT,                      -- SHA-256 of the 6-digit code sent to pending_email
  code_expires INTEGER,                -- ms since 1970
  code_tries INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS recovery_emails_email ON recovery_emails(email);
-- Single-use reset links, 30 minutes. Deleted when used, and when the password changes.
CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS password_resets_uid ON password_resets(uid);
