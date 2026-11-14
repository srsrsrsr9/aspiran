-- The daily fact watch (src/factwatch.ts): last value seen for each watched fact, and a new value waiting for a second day.
CREATE TABLE IF NOT EXISTS fact_watch (id TEXT PRIMARY KEY, value TEXT NOT NULL, candidate TEXT, candidate_since TEXT, checked_at TEXT,
  status TEXT, note TEXT, quote TEXT);
