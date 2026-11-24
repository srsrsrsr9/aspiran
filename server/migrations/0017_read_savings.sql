-- Fewer D1 rows read (24 Nov 2026: the account reached 94% of the free plan's 5 million rows a day).
-- See artefacts/d1-usage-review-2026-11-24.md. Safe to run more than once. The server works before and after it.
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0017_read_savings.sql

-- 1. A change counter for the library. The public library (and every /learn page built from it) asked "has the
--    library changed?" by summing over every approved row: about 1,360 rows read each time. The triggers keep this
--    one row up to date on every insert, update and delete, from the server, the desk or a hand-run SQL command alike.
CREATE TABLE IF NOT EXISTS library_rev (id INTEGER PRIMARY KEY CHECK (id = 1), n INTEGER NOT NULL);
INSERT OR IGNORE INTO library_rev (id, n) VALUES (1, 0);
CREATE TRIGGER IF NOT EXISTS library_rev_insert AFTER INSERT ON library BEGIN UPDATE library_rev SET n = n + 1 WHERE id = 1; END;
CREATE TRIGGER IF NOT EXISTS library_rev_update AFTER UPDATE ON library BEGIN UPDATE library_rev SET n = n + 1 WHERE id = 1; END;
CREATE TRIGGER IF NOT EXISTS library_rev_delete AFTER DELETE ON library BEGIN UPDATE library_rev SET n = n + 1 WHERE id = 1; END;

-- 2. Pages that need a few kinds of library item (the shelf, Try one topic, the website's content) read only those
--    rows instead of the whole table.
CREATE INDEX IF NOT EXISTS library_kind ON library(kind, status, updated_at);

-- 3. The community season total sums one counter over the season's days, not every counter ever kept.
CREATE INDEX IF NOT EXISTS daily_counts_metric ON daily_counts(metric, day);
