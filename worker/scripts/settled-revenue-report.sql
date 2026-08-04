SELECT
  COUNT(*) AS settled_calls,
  COUNT(DISTINCT payer_hash) AS distinct_payers,
  COUNT(DISTINCT agent_hash || ':' || payer_hash) AS distinct_agent_payer_pairs,
  MIN(settled_at) AS first_settlement_at,
  MAX(settled_at) AS latest_settlement_at
FROM verified_calls
WHERE network = 'eip155:8453'
  AND transaction_hash IS NOT NULL
  AND settled_at IS NOT NULL;
