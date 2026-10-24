-- Google Play purchases (src/play.ts): one row per purchase token, kept as its SHA-256 only, so a token grants once, to one member.
-- The Worker also creates this on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0007_play_purchases.sql
CREATE TABLE IF NOT EXISTS play_purchases (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL, product_id TEXT NOT NULL, order_id TEXT,
  status TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0, purchased_at TEXT, created_at TEXT NOT NULL, granted_at TEXT, refunded_at TEXT);
CREATE INDEX IF NOT EXISTS play_purchases_member ON play_purchases(member_id, created_at);
