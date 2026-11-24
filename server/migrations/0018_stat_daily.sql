-- Analytics roll-up (24 Nov 2026, artefacts/analytics-review-2026-11-24.md). Each finished day's events are counted
-- once a night into small rows here (stat.ts), so Admin → Home reads these instead of the whole events table.
-- Counts only: no member id, install id or text. Safe to run more than once; the server also creates them.
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0018_stat_daily.sql
CREATE TABLE IF NOT EXISTS stat_daily (day TEXT NOT NULL, metric TEXT NOT NULL, key TEXT NOT NULL DEFAULT '', n INTEGER NOT NULL,
  PRIMARY KEY (day, metric, key));
CREATE INDEX IF NOT EXISTS stat_daily_metric ON stat_daily(metric, day);
-- Reads one day's events without the rest of the table (the nightly count, and the D1 review's advice).
CREATE INDEX IF NOT EXISTS events_day ON events(day);
