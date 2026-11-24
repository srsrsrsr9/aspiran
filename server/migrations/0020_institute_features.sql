-- Coaching centres: feature switches and the centre's plan (decisions-2026-11-24.md, centres 4, 9 and 12;
-- src/inst-centre.ts). features is JSON of on/off switches (chat, doubts, plans, content, pods; the quick first answer
-- stays in ai_first_answer). pilot_ends_at is the end of the free 30-day pilot, paid_until the end of the paid year,
-- seats the number of students paid for. The server also adds these on first use (institutes.ts INST_ALTERS).
-- Run once; a second run fails on "duplicate column", which is harmless.
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0020_institute_features.sql
ALTER TABLE institutes ADD COLUMN features TEXT;
ALTER TABLE institutes ADD COLUMN pilot_ends_at TEXT;
ALTER TABLE institutes ADD COLUMN paid_until TEXT;
ALTER TABLE institutes ADD COLUMN seats INTEGER;
