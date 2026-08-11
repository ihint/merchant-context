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

-- Cache use and free resolver latency. Internal smoke runs stay separate.
SELECT
  cache_status,
  COUNT(*) AS calls,
  ROUND(AVG(duration_ms), 1) AS average_duration_ms,
  MAX(duration_ms) AS maximum_duration_ms
FROM merchant_preflight_measurements
WHERE operation = 'resolve_merchant'
  AND internal = 0
GROUP BY cache_status
ORDER BY cache_status;

-- Weekly outside clients that returned in more than one UTC week.
SELECT COUNT(*) AS weekly_repeat_outside_clients
FROM (
  SELECT client_id
  FROM merchant_preflight_events
  WHERE provenance != 'internal'
  GROUP BY client_id
  HAVING COUNT(DISTINCT strftime('%Y-%W', occurred_at)) > 1
);

-- Paid refresh evidence stays separate from service and outcome revenue.
SELECT
  COUNT(*) AS paid_refreshes,
  SUM(CASE WHEN settled_at IS NOT NULL THEN 1 ELSE 0 END) AS settled_refreshes
FROM verified_calls;
