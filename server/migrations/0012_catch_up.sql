-- Catch-up, 13 Nov 2026: tables the server has always created for itself as it starts (staff.ts and others) but that
-- were never written down here. Nothing changes on the live database: every statement is IF NOT EXISTS. From now on
-- `npm run check:schema` fails if the server makes a table or column these files don't record.

CREATE TABLE IF NOT EXISTS content_pulls (member_id TEXT NOT NULL, day TEXT NOT NULL, route TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (member_id, day, route));
CREATE TABLE IF NOT EXISTS entitlements (member_id TEXT PRIMARY KEY, plan TEXT NOT NULL, source TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, cancelled_at TEXT, trial_used INTEGER NOT NULL DEFAULT 0, test INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS gifts (code TEXT PRIMARY KEY, plan TEXT NOT NULL, created_at TEXT NOT NULL, redeemed_by TEXT, redeemed_at TEXT, test INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS interview_uses (member_id TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (member_id, day));
CREATE TABLE IF NOT EXISTS mock_scores (mock_id TEXT NOT NULL, pct INTEGER NOT NULL, day TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pod_merge_optouts (merge_id TEXT NOT NULL, member_id TEXT NOT NULL, PRIMARY KEY (merge_id, member_id));
CREATE TABLE IF NOT EXISTS pod_merges (id TEXT PRIMARY KEY, from_pod TEXT NOT NULL, to_pod TEXT NOT NULL, status TEXT NOT NULL, reason TEXT, created_at TEXT NOT NULL, decided_at TEXT, decided_by TEXT, merge_on TEXT, done_at TEXT);
CREATE TABLE IF NOT EXISTS room_starters (member_id TEXT PRIMARY KEY, rooms TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS scholarships (id TEXT PRIMARY KEY, pod_id TEXT NOT NULL, nominated_by TEXT NOT NULL, member_id TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS usage (member_id TEXT NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (member_id, day, kind));
