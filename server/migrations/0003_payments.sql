-- Cashfree payments (src/payments.ts): one row per order. No phone number or card details are kept.
-- The Worker also creates this on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0003_payments.sql
CREATE TABLE IF NOT EXISTS payments (order_id TEXT PRIMARY KEY, member_id TEXT NOT NULL, amount_inr REAL NOT NULL, founding INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, mode TEXT NOT NULL, cf_payment_id TEXT, created_at TEXT NOT NULL, paid_at TEXT, refunded_at TEXT, refund_inr REAL, refund_note TEXT);
CREATE INDEX IF NOT EXISTS payments_member ON payments(member_id, created_at);
