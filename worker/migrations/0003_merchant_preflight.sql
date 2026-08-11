CREATE TABLE merchant_records (
  origin TEXT PRIMARY KEY,
  record_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE merchant_catalog (
  origin TEXT PRIMARY KEY,
  resolution_json TEXT NOT NULL
);

CREATE TABLE merchant_context_sessions (
  session_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  merchant_origin TEXT NOT NULL,
  record_version TEXT NOT NULL,
  action_id TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1))
);

CREATE TABLE merchant_preflight_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL CHECK (event_name IN ('resolved', 'referred', 'action_started', 'action_completed', 'action_failed', 'merchant_claimed', 'fact_corrected')),
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  merchant_origin TEXT NOT NULL,
  record_version TEXT NOT NULL,
  action_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('internal', 'unverified', 'outside_verified')),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  receipt_id TEXT,
  CHECK (verified = 0 OR (event_name = 'action_completed' AND provenance = 'outside_verified' AND receipt_id IS NOT NULL)),
  CHECK (provenance != 'outside_verified' OR verified = 1)
);

CREATE UNIQUE INDEX merchant_preflight_receipt_id_idx
ON merchant_preflight_events (receipt_id) WHERE receipt_id IS NOT NULL;

CREATE INDEX merchant_preflight_session_event_idx
ON merchant_preflight_events (session_id, event_name);

CREATE INDEX merchant_preflight_occurred_at_idx
ON merchant_preflight_events (occurred_at);

CREATE TABLE merchant_preflight_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  cache_status TEXT CHECK (cache_status IN ('hit', 'miss', 'stale_hit')),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  internal INTEGER NOT NULL DEFAULT 0 CHECK (internal IN (0, 1)),
  observed_at TEXT NOT NULL
);

CREATE INDEX merchant_preflight_measurements_observed_at_idx
ON merchant_preflight_measurements (observed_at);
