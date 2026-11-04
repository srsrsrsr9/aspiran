-- The website's Chotu chats (src/web.ts), kept 180 days. Distress messages are never saved.
-- The Worker also creates this on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0009_web_chats.sql
CREATE TABLE IF NOT EXISTS web_chats (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, at TEXT NOT NULL, role TEXT NOT NULL,
  content TEXT NOT NULL, lang TEXT);
CREATE INDEX IF NOT EXISTS web_chats_visitor ON web_chats(visitor_id, at);
CREATE INDEX IF NOT EXISTS web_chats_at ON web_chats(at);
