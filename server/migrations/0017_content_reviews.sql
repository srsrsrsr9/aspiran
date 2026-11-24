-- Owner reviews of content (admin, "Coverage and review"; src/content-review.ts). One row per piece: a 1-5 rating, the
-- issues ticked (factual, translation, tone, formatting, outdated, other), a note, and whether it is marked reviewed.
-- ref is library:<id>, card:<id> or video:<week>:<scene>. item_updated is the piece's own date when it was reviewed, so
-- a later edit shows as "changed since review". Internal to admin: it never makes a piece say "checked by a human editor".
-- The Worker also creates this table on first use. Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0017_content_reviews.sql
CREATE TABLE IF NOT EXISTS content_reviews (ref TEXT PRIMARY KEY, rating INTEGER, issues TEXT NOT NULL DEFAULT '[]', note TEXT,
  status TEXT NOT NULL DEFAULT 'reviewed', reviewer TEXT NOT NULL, reviewer_id TEXT, reviewed_at TEXT NOT NULL, item_updated TEXT);
