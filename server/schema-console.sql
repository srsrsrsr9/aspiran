CREATE TABLE IF NOT EXISTS seen (url TEXT PRIMARY KEY, seen_on TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS candidates (id TEXT PRIMARY KEY, day TEXT NOT NULL, source_name TEXT NOT NULL, source_url TEXT NOT NULL, title TEXT NOT NULL, source_text TEXT NOT NULL, score REAL NOT NULL DEFAULT 0, card_json TEXT, flags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', en_editor TEXT, en_checked_on TEXT, hi_editor TEXT, hi_checked_on TEXT, position INTEGER, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS candidates_day ON candidates(day, status);
CREATE TABLE IF NOT EXISTS briefs (day TEXT PRIMARY KEY, json TEXT NOT NULL, published_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pods (id TEXT PRIMARY KEY, bucket TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS members (member_id TEXT PRIMARY KEY, pod_id TEXT NOT NULL, joined_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, source TEXT, embedding TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS packs (id TEXT PRIMARY KEY, manifest TEXT NOT NULL, imported_at TEXT, log TEXT);
CREATE TABLE IF NOT EXISTS library (id TEXT PRIMARY KEY, kind TEXT NOT NULL, pack TEXT, title TEXT NOT NULL, json TEXT NOT NULL, flags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'draft', en_editor TEXT, en_checked_on TEXT, hi_editor TEXT, hi_checked_on TEXT, updated_at TEXT NOT NULL, translations TEXT, approvals TEXT);
CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, pod_id TEXT NOT NULL, message_id TEXT NOT NULL, author TEXT, text TEXT, reason TEXT, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, roles TEXT NOT NULL, key_hash TEXT UNIQUE, created_at TEXT NOT NULL, created_by TEXT, last_seen_at TEXT, disabled_at TEXT, langs TEXT);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor_id TEXT, actor TEXT, action TEXT NOT NULL, target TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS audit_at ON audit(at);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT, updated_by TEXT);
CREATE TABLE IF NOT EXISTS content_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id TEXT NOT NULL, json TEXT NOT NULL, action TEXT NOT NULL, actor TEXT, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS content_versions_item ON content_versions(item_type, item_id, id);
CREATE TABLE IF NOT EXISTS llm_calls (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, day TEXT NOT NULL, purpose TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, ms INTEGER, tokens_in INTEGER, tokens_out INTEGER, error TEXT);
CREATE INDEX IF NOT EXISTS llm_calls_day ON llm_calls(day);
CREATE TABLE IF NOT EXISTS daily_counts (day TEXT NOT NULL, metric TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, metric));
CREATE TABLE IF NOT EXISTS consents (member_id TEXT NOT NULL, version TEXT NOT NULL, purposes TEXT NOT NULL, at TEXT NOT NULL, withdrawn_at TEXT, PRIMARY KEY (member_id, version));
CREATE TABLE IF NOT EXISTS privacy_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, member_hash TEXT NOT NULL, via TEXT NOT NULL, status TEXT NOT NULL, at TEXT NOT NULL, done_at TEXT, done_by TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, link TEXT, level TEXT NOT NULL DEFAULT 'info', starts_at TEXT NOT NULL, ends_at TEXT, created_by TEXT, created_at TEXT NOT NULL, sent_to_pods_at TEXT, withdrawn_at TEXT);
CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, title TEXT NOT NULL, component TEXT NOT NULL, impact TEXT NOT NULL, status TEXT NOT NULL, updates TEXT NOT NULL, started_at TEXT NOT NULL, resolved_at TEXT, created_by TEXT);
CREATE TABLE IF NOT EXISTS lang_requests (lang TEXT NOT NULL, who TEXT NOT NULL, helper INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL, PRIMARY KEY (lang, who));
CREATE TABLE IF NOT EXISTS installs (install_id TEXT PRIMARY KEY, platform TEXT, source TEXT, invite_code TEXT, referrer TEXT, first_open_at TEXT NOT NULL, member_id TEXT);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT, install_id TEXT, name TEXT NOT NULL, props TEXT, day TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS events_name_day ON events(name, day);
CREATE INDEX IF NOT EXISTS events_member ON events(member_id, name, day);
CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT, install_id TEXT, moment TEXT NOT NULL, rating INTEGER NOT NULL, day TEXT NOT NULL, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS feedback_moment ON feedback(moment, day);
CREATE TABLE IF NOT EXISTS payments (order_id TEXT PRIMARY KEY, member_id TEXT NOT NULL, amount_inr REAL NOT NULL, founding INTEGER NOT NULL DEFAULT 0,   status TEXT NOT NULL, mode TEXT NOT NULL, cf_payment_id TEXT, created_at TEXT NOT NULL, paid_at TEXT, refunded_at TEXT, refund_inr REAL, refund_note TEXT);
CREATE INDEX IF NOT EXISTS payments_member ON payments(member_id, created_at);


CREATE TABLE IF NOT EXISTS password_logins (
  username TEXT PRIMARY KEY,           -- 3-30 of a-z 0-9 _ . (lower-case)
  uid TEXT NOT NULL UNIQUE,            -- accounts.uid ("pw-" + random)
  pw_hash TEXT NOT NULL,               -- pbkdf2-sha256$<iterations>$<salt>$<hash>
  epoch INTEGER NOT NULL DEFAULT 1,    -- bumped on change or reset: older session tokens stop working
  must_change INTEGER NOT NULL DEFAULT 0, -- 1 after staff set a temporary password
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Failed sign-ins per username and per hashed IP, counted for 15 minutes.
CREATE TABLE IF NOT EXISTS login_throttle (k TEXT PRIMARY KEY, fails INTEGER NOT NULL, window_start INTEGER NOT NULL);
-- The key that signs session tokens, made by the Worker on first use. Never sent anywhere.
CREATE TABLE IF NOT EXISTS server_keys (name TEXT PRIMARY KEY, value TEXT NOT NULL, created_at TEXT NOT NULL);
