-- Marketing (src/marketing.ts, admin → Marketing): lead-magnet and sign-up counts per day, website page views, and the
-- people list. The Worker also creates these on first use (ensureMarketingSchema), so running this by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0017_marketing.sql
CREATE TABLE IF NOT EXISTS mkt_daily (day TEXT NOT NULL, magnet TEXT NOT NULL, src TEXT NOT NULL, step TEXT NOT NULL, n INTEGER NOT NULL,
  PRIMARY KEY (day, magnet, src, step));
CREATE TABLE IF NOT EXISTS mkt_hits (day TEXT NOT NULL, magnet TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (day, magnet));
CREATE TABLE IF NOT EXISTS crm_people (id TEXT PRIMARY KEY, ref TEXT NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'student', name TEXT,
  contact TEXT, contact_kind TEXT, member_id TEXT, stage TEXT NOT NULL DEFAULT 'lead', stage_by TEXT NOT NULL DEFAULT 'auto', source TEXT,
  magnet TEXT, lang TEXT, tags TEXT, notes TEXT, next_follow_up TEXT, last_contacted TEXT, consent_text TEXT, consent_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS crm_people_updated ON crm_people(updated_at);
CREATE INDEX IF NOT EXISTS crm_people_stage ON crm_people(stage, updated_at);
CREATE INDEX IF NOT EXISTS crm_people_follow ON crm_people(next_follow_up);
CREATE INDEX IF NOT EXISTS crm_people_member ON crm_people(member_id);
CREATE INDEX IF NOT EXISTS crm_people_contact ON crm_people(contact);
-- Indexes the nightly rollup needs on tables that already exist.
CREATE INDEX IF NOT EXISTS installs_member ON installs(member_id);
CREATE INDEX IF NOT EXISTS try_contacts_at ON try_contacts(at);
