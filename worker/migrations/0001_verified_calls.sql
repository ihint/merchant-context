CREATE TABLE verified_calls (
  payment_hash TEXT PRIMARY KEY,
  payer_hash TEXT NOT NULL,
  agent_hash TEXT NOT NULL,
  merchant_origin TEXT NOT NULL,
  network TEXT NOT NULL,
  observed_at TEXT NOT NULL
);

CREATE INDEX verified_calls_payer_observed_at_idx
ON verified_calls (payer_hash, observed_at);

CREATE INDEX verified_calls_observed_at_idx
ON verified_calls (observed_at);
