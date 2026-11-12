-- Website leads: when the "here's the way in" email went out (web.ts). The server also adds this column by itself
-- on start (staff.ts), so running this file is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0011_lead_welcome.sql
ALTER TABLE web_leads ADD COLUMN welcomed_at TEXT;
