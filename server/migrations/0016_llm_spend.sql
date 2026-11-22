-- Who each model call was for, which provider answered, and its estimated cost (owner, 22 Nov 2026: Groq is paid
-- and its spend is watched by group). `who` is visitor, free, plus, pod, institute or team. The cost is our estimate
-- from list prices in src/ai.ts; Groq's console has the real bill, split by project.
-- The Worker also adds these on first use (ensureSchema in src/staff.ts). Running it by hand is optional:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0016_llm_spend.sql
ALTER TABLE llm_calls ADD COLUMN provider TEXT;
ALTER TABLE llm_calls ADD COLUMN who TEXT;
ALTER TABLE llm_calls ADD COLUMN cost_usd REAL;
