-- D1 schema. Local: npm run db:init
CREATE TABLE IF NOT EXISTS seen (url TEXT PRIMARY KEY, seen_on TEXT NOT NULL);

-- News candidates. card_json is a NewsItem in the app's format (with an optional "hi" object).
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  source_text TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  card_json TEXT,
  flags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',      -- draft | approved | rejected
  en_editor TEXT, en_checked_on TEXT,          -- English and Hindi have separate editors
  hi_editor TEXT, hi_checked_on TEXT,
  position INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS candidates_day ON candidates(day, status);

CREATE TABLE IF NOT EXISTS briefs (day TEXT PRIMARY KEY, json TEXT NOT NULL, published_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS pods (id TEXT PRIMARY KEY, bucket TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS members (member_id TEXT PRIMARY KEY, pod_id TEXT NOT NULL, joined_at TEXT NOT NULL);
-- More columns (lead, suspension, the four matching fields, pod state and merges) and the admin, Plus and
-- usage tables are added by ensureSchema() in src/staff.ts on first use, so old databases upgrade in place.

-- UPSC context library: short notes in our own words. embedding is a JSON array (bge-m3), filled lazily.
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,          -- article | act | case | committee | event | concept | card
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT,
  embedding TEXT,
  updated_at TEXT NOT NULL
);

-- Content packs from the content team, and the library they fill (explainers, games, maps, sounds...).
-- Chai cards from a pack go into candidates instead, so they share the news queue and Publish.
CREATE TABLE IF NOT EXISTS packs (id TEXT PRIMARY KEY, manifest TEXT NOT NULL, imported_at TEXT, log TEXT);
CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY,                       -- kind:id, e.g. explainer:article-200
  kind TEXT NOT NULL,                        -- explainer | timeline | match | quiz | map | number | myth | debate | winddown | sound
  pack TEXT,
  title TEXT NOT NULL,
  json TEXT NOT NULL,                        -- the item in the pack's format, file paths as /media/...
  flags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',      -- draft | approved | hidden. In the app once English is approved.
  en_editor TEXT, en_checked_on TEXT,
  hi_editor TEXT, hi_checked_on TEXT,
  updated_at TEXT NOT NULL,
  translations TEXT,                         -- other languages: { "te": upsc-pods/translation@1 file }
  approvals TEXT                             -- other languages: { "te": { "by": name, "on": day } }
);

-- Member reports and Guardian distress alerts, for a human moderator.
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,          -- report | distress
  pod_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  author TEXT,
  text TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

-- Admin console (src/staff.ts creates these on first use too, and adds the newer columns to older tables:
-- members.suspended_until/suspend_reason, pods.lead_member, reports.member_id/notes/handled_by/updated_at).
CREATE TABLE IF NOT EXISTS staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, roles TEXT NOT NULL, key_hash TEXT UNIQUE,
  created_at TEXT NOT NULL, created_by TEXT, last_seen_at TEXT, disabled_at TEXT, langs TEXT);       -- langs: what a language editor approves; key_hash: SHA-256 of a personal key, never the key
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, actor_id TEXT, actor TEXT, action TEXT NOT NULL, target TEXT, detail TEXT);
CREATE INDEX IF NOT EXISTS audit_at ON audit(at);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT, updated_by TEXT);   -- flags, llm
CREATE TABLE IF NOT EXISTS content_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, item_type TEXT NOT NULL, item_id TEXT NOT NULL,
  json TEXT NOT NULL, action TEXT NOT NULL, actor TEXT, at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS content_versions_item ON content_versions(item_type, item_id, id);
CREATE TABLE IF NOT EXISTS llm_calls (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, day TEXT NOT NULL, purpose TEXT NOT NULL,
  model TEXT NOT NULL, status TEXT NOT NULL, ms INTEGER, tokens_in INTEGER, tokens_out INTEGER, error TEXT);   -- never prompts or outputs
CREATE INDEX IF NOT EXISTS llm_calls_day ON llm_calls(day);
CREATE TABLE IF NOT EXISTS daily_counts (day TEXT NOT NULL, metric TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, metric));  -- totals, never who
CREATE TABLE IF NOT EXISTS consents (member_id TEXT NOT NULL, version TEXT NOT NULL, purposes TEXT NOT NULL, at TEXT NOT NULL,
  withdrawn_at TEXT, PRIMARY KEY (member_id, version));
CREATE TABLE IF NOT EXISTS privacy_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, member_hash TEXT NOT NULL,
  via TEXT NOT NULL, status TEXT NOT NULL, at TEXT NOT NULL, done_at TEXT, done_by TEXT, note TEXT);
CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, link TEXT, level TEXT NOT NULL DEFAULT 'info',
  starts_at TEXT NOT NULL, ends_at TEXT, created_by TEXT, created_at TEXT NOT NULL, sent_to_pods_at TEXT, withdrawn_at TEXT);
CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, title TEXT NOT NULL, component TEXT NOT NULL, impact TEXT NOT NULL,
  status TEXT NOT NULL, updates TEXT NOT NULL, started_at TEXT NOT NULL, resolved_at TEXT, created_by TEXT);
-- "Request your language": one row per language per device (a SHA-256 of a random id the app makes; no member id, no name).
CREATE TABLE IF NOT EXISTS lang_requests (lang TEXT NOT NULL, who TEXT NOT NULL, helper INTEGER NOT NULL DEFAULT 0, at TEXT NOT NULL, PRIMARY KEY (lang, who));
-- Sign-in accounts (src/auth.ts, migrations/0001_accounts.sql)
CREATE TABLE IF NOT EXISTS accounts (
  uid TEXT PRIMARY KEY,              -- Firebase uid (or dev-<id> in local dev mode)
  provider TEXT NOT NULL,            -- phone | google.com | dev
  phone TEXT,                        -- as Firebase returns it (E.164). Sign-in and staff search only; never shown to members or sent to AI
  email TEXT,                        -- same, for Google sign-in
  member_id TEXT UNIQUE,             -- the member id pods, consent and Plus use; an existing install's anonymous id is linked on first sign-in
  status TEXT NOT NULL DEFAULT 'active',   -- active | suspended
  status_reason TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,                 -- updated at most every 10 minutes
  app_version TEXT
);
CREATE INDEX IF NOT EXISTS accounts_phone ON accounts(phone);
CREATE INDEX IF NOT EXISTS accounts_email ON accounts(email);
CREATE TABLE IF NOT EXISTS account_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, uid TEXT NOT NULL, action TEXT NOT NULL,
  reason TEXT, actor_id TEXT, actor TEXT);
CREATE INDEX IF NOT EXISTS account_audit_uid ON account_audit(uid, id);
CREATE TABLE IF NOT EXISTS account_tombstones (ident_hash TEXT PRIMARY KEY, reason TEXT, at TEXT NOT NULL);

-- Growth counts (src/metrics.ts, migrations/0002_growth.sql)
CREATE TABLE IF NOT EXISTS installs (
  install_id TEXT PRIMARY KEY,       -- random id made by the app on first open
  platform TEXT,                     -- android | web
  source TEXT,                       -- ?src= / utm_source, or the Play referrer's utm_source
  invite_code TEXT,
  referrer TEXT,                     -- utm source/medium/campaign only
  first_open_at TEXT NOT NULL,
  member_id TEXT                     -- set once the install signs in
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT,
  install_id TEXT,
  name TEXT NOT NULL,                -- first_open, signup, onboarding_done, pod_joined, ritual, chai_read, paid, ...
  props TEXT,                        -- small JSON of codes and numbers
  day TEXT NOT NULL,                 -- IST day
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_name_day ON events(name, day);
CREATE INDEX IF NOT EXISTS events_member ON events(member_id, name, day);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT,
  install_id TEXT,
  moment TEXT NOT NULL,              -- pod_joined, close_day, chotu_chat, quiz, roadmap, chai, day7_q1, day7_q2
  rating INTEGER NOT NULL,           -- 1-3 for ratings; the choice index for the day-7 questions
  day TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_moment ON feedback(moment, day);

-- Cashfree payments (src/payments.ts): one row per order. No phone number or card details are kept.
CREATE TABLE IF NOT EXISTS payments (order_id TEXT PRIMARY KEY, member_id TEXT NOT NULL, amount_inr REAL NOT NULL, founding INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, mode TEXT NOT NULL, cf_payment_id TEXT, created_at TEXT NOT NULL, paid_at TEXT, refunded_at TEXT, refund_inr REAL, refund_note TEXT);
CREATE INDEX IF NOT EXISTS payments_member ON payments(member_id, created_at);

-- Google Play purchases (src/play.ts): one row per purchase token, kept as its SHA-256 only, so a token grants once, to one member.
CREATE TABLE IF NOT EXISTS play_purchases (token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL, product_id TEXT NOT NULL, order_id TEXT,
  status TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0, purchased_at TEXT, created_at TEXT NOT NULL, granted_at TEXT, refunded_at TEXT);
CREATE INDEX IF NOT EXISTS play_purchases_member ON play_purchases(member_id, created_at);

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
-- Password recovery by email (src/password.ts). Only a verified address is used; codes and reset links are kept as hashes.
CREATE TABLE IF NOT EXISTS recovery_emails (
  uid TEXT PRIMARY KEY,                -- password_logins.uid
  email TEXT,                          -- the verified recovery address (lower-case), or null
  pending_email TEXT,                  -- an address waiting for its code
  code_hash TEXT,                      -- SHA-256 of the 6-digit code sent to pending_email
  code_expires INTEGER,                -- ms since 1970
  code_tries INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS recovery_emails_email ON recovery_emails(email);
-- Single-use reset links, 30 minutes. Deleted when used, and when the password changes.
CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, uid TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS password_resets_uid ON password_resets(uid);

-- Open pods (src/rooms.ts): which pre-set rooms a member joined. A member can be in several.
CREATE TABLE IF NOT EXISTS room_members (member_id TEXT NOT NULL, room_id TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY (member_id, room_id));
CREATE INDEX IF NOT EXISTS room_members_room ON room_members(room_id);
