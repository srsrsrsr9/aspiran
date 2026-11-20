-- The day-3 email of "Try one topic" (src/try.ts): with the visitor's consent, one email three days later asks 5 of
-- their cards again. The address is deleted once that email is sent, or when they cancel; the rest is anonymous.
-- The Worker also creates this on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0015_try_recall.sql
CREATE TABLE IF NOT EXISTS try_recall (code TEXT PRIMARY KEY, session_id TEXT NOT NULL, path_id TEXT NOT NULL, email TEXT, lang TEXT NOT NULL,
  cards TEXT NOT NULL, consent_text TEXT NOT NULL, created_at TEXT NOT NULL, due_day TEXT NOT NULL, sent_at TEXT, tries INTEGER NOT NULL DEFAULT 0,
  opened_at TEXT, answered_at TEXT, kept INTEGER, of_n INTEGER, stopped_at TEXT);
CREATE INDEX IF NOT EXISTS try_recall_due ON try_recall(due_day, sent_at);
CREATE INDEX IF NOT EXISTS try_recall_session ON try_recall(session_id);
