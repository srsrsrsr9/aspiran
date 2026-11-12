-- When a pod lead's free year of Plus began (plus.ts). The server also creates this table by itself on start.
CREATE TABLE IF NOT EXISTS pod_lead_plus (member_id TEXT PRIMARY KEY, started_at TEXT NOT NULL);
