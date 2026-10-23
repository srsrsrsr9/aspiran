-- Username and password sign-in (src/password.ts), an alternative to Google. The Worker also creates these on first
-- use (ensureSchema in src/staff.ts), so running this by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0004_password_login.sql
-- Passwords are stored only as PBKDF2-SHA256 hashes with a per-user salt. accounts.provider is "password" for these.
CREATE TABLE IF NOT EXISTS password_logins (
  username TEXT PRIMARY KEY,           -- 3-30 of a-z 0-9 _ . (lower-case)
  uid TEXT NOT NULL UNIQUE,            -- accounts.uid ("pw-" + random)
  pw_hash TEXT NOT NULL,               -- pbkdf2-sha256$<iterations>$<salt>$<hash>
  epoch INTEGER NOT NULL DEFAULT 1,    -- bumped on change or reset: older session tokens stop working
  must_change INTEGER NOT NULL DEFAULT 0, -- 1 after staff set a temporary password
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Failed sign-ins per username and per hashed IP, counted for 15 minutes.
CREATE TABLE IF NOT EXISTS login_throttle (k TEXT PRIMARY KEY, fails INTEGER NOT NULL, window_start INTEGER NOT NULL);
-- The key that signs session tokens, made by the Worker on first use. Never sent anywhere.
CREATE TABLE IF NOT EXISTS server_keys (name TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT NOT NULL);
