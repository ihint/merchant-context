ALTER TABLE verified_calls
ADD COLUMN transaction_hash TEXT;

ALTER TABLE verified_calls
ADD COLUMN settled_at TEXT;

CREATE UNIQUE INDEX verified_calls_transaction_hash_idx
ON verified_calls (transaction_hash)
WHERE transaction_hash IS NOT NULL;

CREATE INDEX verified_calls_settled_at_idx
ON verified_calls (settled_at)
WHERE settled_at IS NOT NULL;
