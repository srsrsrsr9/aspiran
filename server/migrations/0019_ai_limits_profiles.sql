-- AI decisions of 24 Nov 2026 (artefacts/decisions-2026-11-24.md, "AI"). Safe to run more than once for the tables;
-- the ALTER fails harmlessly if the column is already there. The server also creates all of these on first use
-- (ensureSchema in src/staff.ts), so running this by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0019_ai_limits_profiles.sql

-- 1. Whose model call it was, so a Plus member's month of spend can be added up (the hidden $1.25 a month).
ALTER TABLE llm_calls ADD COLUMN member TEXT;
CREATE INDEX IF NOT EXISTS llm_calls_member ON llm_calls(member, day);

-- 2. Day-long cut-offs for free members and visitors (guard.ts). k is "m:<member>", "v:<network hash>" or
-- "d:<device hash>"; recent holds the last few message times for the speed check; cut is the reason, once cut off.
CREATE TABLE IF NOT EXISTS ai_guard (k TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, recent TEXT,
  offtopic INTEGER NOT NULL DEFAULT 0, cut TEXT, PRIMARY KEY (k, day));
-- Which accounts used Chotu on one device (a hash of the app's install id, never the id itself), for "more than 3
-- accounts on one device in a week". Rows older than 8 days are pruned nightly.
CREATE TABLE IF NOT EXISTS device_members (device TEXT NOT NULL, member_id TEXT NOT NULL, day TEXT NOT NULL,
  PRIMARY KEY (device, member_id));

-- 3. Chotu chats, kept only for members who said yes to the chat notice (consent version "chats-2026-11"). Kept 180
-- days, included in "Download my data", erased with the account.
CREATE TABLE IF NOT EXISTS chotu_chats (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, at TEXT NOT NULL,
  role TEXT NOT NULL, content TEXT NOT NULL, source TEXT NOT NULL, lang TEXT);
CREATE INDEX IF NOT EXISTS chotu_chats_member ON chotu_chats(member_id, at);

-- 4. Each Plus member's study profile, written once a night (profile.ts). facts is the last counts-only facts object
-- the app sent with a Chotu or Jeetu question.
CREATE TABLE IF NOT EXISTS study_profiles (member_id TEXT PRIMARY KEY, facts TEXT, facts_at TEXT, profile TEXT,
  profile_at TEXT, profile_day TEXT, model TEXT);
