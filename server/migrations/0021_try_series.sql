-- K4: the five short study emails after the demo, only for visitors who tick that box (src/try-series.ts).
-- The server also creates this on first use (staff.ts). Safe to run twice.
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0021_try_series.sql
CREATE TABLE IF NOT EXISTS try_series (code TEXT PRIMARY KEY, session_id TEXT NOT NULL, recall_code TEXT, email TEXT, lang TEXT NOT NULL,
  consent_text TEXT NOT NULL, created_at TEXT NOT NULL, start_day TEXT NOT NULL, step INTEGER NOT NULL DEFAULT 0, tries INTEGER NOT NULL DEFAULT 0,
  last_sent_at TEXT, stopped_at TEXT, done_at TEXT);
CREATE INDEX IF NOT EXISTS try_series_session ON try_series(session_id);
CREATE INDEX IF NOT EXISTS try_series_recall ON try_series(recall_code);
