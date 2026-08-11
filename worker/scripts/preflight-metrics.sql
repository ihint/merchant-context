-- Verified outside sessions that resolved a merchant and then started a merchant-owned action.
SELECT COUNT(DISTINCT resolved.session_id) AS verified_outside_agent_sessions
FROM merchant_preflight_events AS resolved
WHERE resolved.event_name = 'resolved'
  AND resolved.provenance != 'internal'
  AND EXISTS (
    SELECT 1 FROM merchant_preflight_events AS action
    WHERE action.session_id = resolved.session_id
      AND action.event_name IN ('action_started', 'action_completed')
      AND action.provenance = 'outside_verified'
      AND action.verified = 1
      AND action.occurred_at >= resolved.occurred_at
  );

-- Event totals by proof class. Internal tests remain visible but separate.
SELECT event_name, provenance, verified, COUNT(*) AS event_count
FROM merchant_preflight_events
GROUP BY event_name, provenance, verified
ORDER BY event_name, provenance, verified;

-- Outside funnel. Internal rows never enter these counts.
SELECT
  COUNT(DISTINCT CASE WHEN event_name = 'resolved' THEN session_id END) AS resolved_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'referred' THEN session_id END) AS referred_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'action_started' THEN session_id END) AS started_sessions,
  COUNT(DISTINCT CASE WHEN event_name = 'action_completed' AND verified = 1 THEN session_id END) AS verified_completed_sessions
FROM merchant_preflight_events
WHERE provenance != 'internal';
