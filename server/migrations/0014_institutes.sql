-- Aspiran for coaching centres (src/institutes.ts, artefacts/coaching-centres-plan-2026-11-14.md). Behind the
-- `institutes` flag, off by default. Every table carries institute_id, and every route checks the caller's own
-- membership and role first. The server also creates these on first use (institutes.ts INST_SCHEMA), same SQL.
CREATE TABLE IF NOT EXISTS institutes (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, brand_color TEXT, logo_key TEXT,
  ai_first_answer INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, created_by TEXT);
-- role: owner | admin | teacher | student. status: active | removed | left. One active institute per member (checked in code).
CREATE TABLE IF NOT EXISTS inst_members (institute_id TEXT NOT NULL, member_id TEXT NOT NULL, role TEXT NOT NULL, display_name TEXT NOT NULL,
  batch_id TEXT, status TEXT NOT NULL DEFAULT 'active', joined_at TEXT NOT NULL, consent_at TEXT, left_at TEXT, last_active_at TEXT,
  PRIMARY KEY (institute_id, member_id));
CREATE INDEX IF NOT EXISTS inst_members_member ON inst_members(member_id, status);
CREATE TABLE IF NOT EXISTS inst_batches (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, name TEXT NOT NULL, exam_year INTEGER,
  created_at TEXT NOT NULL, archived_at TEXT);
CREATE INDEX IF NOT EXISTS inst_batches_inst ON inst_batches(institute_id);
-- Invite codes: a role, an optional batch, a use limit and an end date.
CREATE TABLE IF NOT EXISTS inst_codes (code TEXT PRIMARY KEY, institute_id TEXT NOT NULL, role TEXT NOT NULL, batch_id TEXT, created_by TEXT,
  created_at TEXT NOT NULL, expires_at TEXT, max_uses INTEGER NOT NULL DEFAULT 1, uses INTEGER NOT NULL DEFAULT 0, revoked_at TEXT);
CREATE INDEX IF NOT EXISTS inst_codes_inst ON inst_codes(institute_id);
-- Batch chat and announcements (kind chat | announcement). batch_id NULL on an announcement = the whole institute.
CREATE TABLE IF NOT EXISTS inst_messages (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, name TEXT NOT NULL,
  role TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, at TEXT NOT NULL, hidden_at TEXT, hidden_by TEXT, reported_at TEXT, report_reason TEXT);
CREATE INDEX IF NOT EXISTS inst_messages_batch ON inst_messages(institute_id, batch_id, at);
-- Doubts: open | answered | resolved. node_id is a syllabus topic (the garden's ids); ref_id one of the institute's questions.
CREATE TABLE IF NOT EXISTS inst_doubts (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, name TEXT NOT NULL,
  node_id TEXT, ref_id TEXT, text TEXT NOT NULL, photo_key TEXT, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inst_doubts_inst ON inst_doubts(institute_id, status, updated_at);
-- role: student | teacher | ai (the AI first answer, labelled AI).
CREATE TABLE IF NOT EXISTS inst_doubt_replies (id TEXT PRIMARY KEY, doubt_id TEXT NOT NULL, institute_id TEXT NOT NULL, member_id TEXT,
  name TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inst_doubt_replies_doubt ON inst_doubt_replies(doubt_id, at);
-- Study plans for a batch or one student, and their items by day (topic | practice | test | note | task).
CREATE TABLE IF NOT EXISTS inst_plans (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, member_id TEXT, title TEXT NOT NULL,
  starts_on TEXT NOT NULL, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inst_plans_inst ON inst_plans(institute_id);
CREATE TABLE IF NOT EXISTS inst_plan_items (id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, institute_id TEXT NOT NULL, day TEXT NOT NULL,
  kind TEXT NOT NULL, node_id TEXT, content_id TEXT, title TEXT NOT NULL, note TEXT, sort INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS inst_plan_items_plan ON inst_plan_items(plan_id, day);
CREATE TABLE IF NOT EXISTS inst_plan_done (item_id TEXT NOT NULL, member_id TEXT NOT NULL, institute_id TEXT NOT NULL, done_at TEXT NOT NULL,
  PRIMARY KEY (item_id, member_id));
-- The institute's own notes and question sets (kind note | practice | test). json: a note {en:{body}, hi?} or a
-- quiz in the content-pack shape {questions:[{en:{question, options, answerIndex, explanation}, hi?}]}.
CREATE TABLE IF NOT EXISTS inst_content (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, batch_id TEXT, kind TEXT NOT NULL, title TEXT NOT NULL,
  paper TEXT, node_id TEXT, json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inst_content_inst ON inst_content(institute_id, status);
-- One go at a question set: marked on the server. answers: [{q, chosen, right}].
CREATE TABLE IF NOT EXISTS inst_attempts (id TEXT PRIMARY KEY, institute_id TEXT NOT NULL, content_id TEXT NOT NULL, member_id TEXT NOT NULL,
  node_id TEXT, kind TEXT NOT NULL, right_n INTEGER NOT NULL, total INTEGER NOT NULL, answers TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS inst_attempts_member ON inst_attempts(institute_id, member_id, at);
