-- "Try one topic" (src/try.ts): what visitors tell us as they go (one-tap questions, the end survey, free text), and an
-- optional contact they chose to leave. No account. A visitor can delete everything they sent from the end screen.
-- The Worker also creates these on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0009_try_feedback.sql
CREATE TABLE IF NOT EXISTS try_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, path_id TEXT NOT NULL,
  question TEXT NOT NULL, answer TEXT, text TEXT, lang TEXT, day TEXT NOT NULL, at TEXT NOT NULL,
  UNIQUE (session_id, path_id, question));
CREATE INDEX IF NOT EXISTS try_feedback_q ON try_feedback(path_id, question);
CREATE TABLE IF NOT EXISTS try_contacts (session_id TEXT PRIMARY KEY, path_id TEXT NOT NULL, contact TEXT NOT NULL, contact_kind TEXT NOT NULL,
  consent_text TEXT NOT NULL, lang TEXT, at TEXT NOT NULL);
-- "You asked, we did": lines the team writes in Admin -> Try one topic, shown to visitors after they send feedback.
CREATE TABLE IF NOT EXISTS try_updates (id INTEGER PRIMARY KEY AUTOINCREMENT, path_id TEXT NOT NULL, text_en TEXT NOT NULL, text_hi TEXT,
  done_on TEXT NOT NULL, hidden INTEGER NOT NULL DEFAULT 0, created_by TEXT, created_at TEXT NOT NULL);
