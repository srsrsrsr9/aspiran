-- Open pods (src/rooms.ts): which pre-set rooms a member joined. A member can be in several. Run once on production:
--   npx wrangler d1 execute upsc-pods --env production --remote --file=migrations/0005_rooms.sql
CREATE TABLE IF NOT EXISTS room_members (member_id TEXT NOT NULL, room_id TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY (member_id, room_id));
CREATE INDEX IF NOT EXISTS room_members_room ON room_members(room_id);
