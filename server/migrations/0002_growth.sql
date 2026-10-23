-- Growth counts (src/metrics.ts). The Worker also creates these on first use (ensureSchema in src/staff.ts);
-- running this by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0002_growth.sql
-- What happened, never what was said: no mood, journal or chat text is ever stored here. Deleting an account
-- clears the member and install links on these rows (anonymiseStatements in src/metrics.ts).
CREATE TABLE IF NOT EXISTS installs (
  install_id TEXT PRIMARY KEY,       -- random id made by the app on first open
  platform TEXT,                     -- android | web
  source TEXT,                       -- ?src= / utm_source, or the Play referrer's utm_source
  invite_code TEXT,
  referrer TEXT,                     -- utm source/medium/campaign only
  first_open_at TEXT NOT NULL,
  member_id TEXT                     -- set once the install signs in
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT,
  install_id TEXT,
  name TEXT NOT NULL,                -- first_open, signup, onboarding_done, pod_joined, ritual, chai_read, paid, ...
  props TEXT,                        -- small JSON of codes and numbers
  day TEXT NOT NULL,                 -- IST day
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_name_day ON events(name, day);
CREATE INDEX IF NOT EXISTS events_member ON events(member_id, name, day);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT,
  install_id TEXT,
  moment TEXT NOT NULL,              -- pod_joined, close_day, chotu_chat, quiz, roadmap, chai, day7_q1, day7_q2
  rating INTEGER NOT NULL,           -- 1-3 for ratings; the choice index for the day-7 questions
  day TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_moment ON feedback(moment, day);
