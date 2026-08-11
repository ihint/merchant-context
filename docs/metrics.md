# Distribution and conversion metrics

The north-star metric is verified outside agent sessions that resolve a merchant and proceed to a merchant-owned action.

Internal tests stay marked internal.

Registry views, repository activity, smoke tests, and self-funded payments do not count as outside use.

Measure:

- cache hit rate;
- cached and uncached latency;
- outside client count;
- weekly repeat outside clients;
- preflight coverage in integrated clients;
- referral rate;
- action-start rate;
- verified completion rate;
- paid refresh rate;
- merchant claim rate; and
- revenue tied to fresh evidence, service plans, or verified outcomes.

Run `worker/scripts/preflight-metrics.sql` against D1 for event, cache, repeat-client, and paid-refresh counts.

Keep payment, settlement, and revenue reports separate from event counts.
