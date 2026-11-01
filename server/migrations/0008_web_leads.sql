-- The website's Chotu (src/web.ts): what visitors tell it as they scroll, and the daily cap on its replies.
-- The Worker also creates these on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0008_web_leads.sql
CREATE TABLE IF NOT EXISTS web_leads (visitor_id TEXT PRIMARY KEY, name TEXT, details TEXT NOT NULL, contact TEXT, contact_kind TEXT,
  lang TEXT, consent_at TEXT, source TEXT, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS web_leads_seen ON web_leads(last_seen);
CREATE TABLE IF NOT EXISTS web_rate (k TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (k, day));
