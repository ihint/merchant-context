# Merchant preflight contract

Contract version: `2026-08-11`

Merchant Context is a merchant preflight for agent builders.

It is not a destination site, score, payment handler, ranking system, or private commerce protocol.

## Repository seam

`merchant-context` owns the open records, resolver, evidence rules, agent tools, direct HTTP API, attribution token format, and paid refresh.

`ai-merchants` owns the merchant site, same-origin bridge, WebMCP surface, merchant claim flow, referral reports, install page, and release path.

The repositories communicate through public HTTP contracts.

They do not import source from each other.

## Default flow

```text
preflight(merchant, intent, constraints)
  -> resolution
  -> evidence
  -> selected safe action
  -> approval requirement
  -> attribution session
```

`resolve_merchant` and `preflight` are free.

They read a cached record when one exists.

A cache hit makes no merchant fetch and no paid inspection call.

A stale cache hit stays visible and is labeled stale.

A cache miss may fetch the public `/merchant-context.json` record.

It must not call `inspect_merchant`, `refresh_merchant`, x402 settlement, or a merchant action.

`refresh_merchant` is the paid freshness path.

It returns exact x402 terms before payment.

It requires an explicit `approved: true` input before it can inspect, settle, or replace cached evidence.

`inspect_merchant` stays as a compatibility alias during the first release.

## Resolution rules

- Accept public HTTPS origins only.
- Fetch only fixed public discovery files.
- Keep redirects public and capped.
- Keep response bodies and request time bounded.
- Bind the record's canonical merchant origin to the fetched origin.
- Preserve each material source URL and observation time.
- Preserve stale facts and mark them stale.
- Preserve unknown facts as unknown.
- Do not infer price, stock, policy, geography, authority, or completion.
- Reject merchant actions whose URL is not owned by the merchant origin or a declared alias.
- Keep record version and evidence hash stable for the same normalized evidence.

## Neutral search and comparison

`search_merchants` filters cached records by item or service, geography, price, timing, policy, action support, and freshness.

Search order uses sourced match fields and a stable origin tie-break.

Merchant Context adoption, payment, refresh history, and referral volume do not change search order.

`compare_offers` compares sourced fields only.

It shows unknown values.

It does not guess or sell placement.

## Safe actions

`get_safe_actions` returns merchant-owned action URLs only.

Each action states its type, method, exact required inputs, allowed authority, human-confirmation rule, expiry, idempotency rule, recovery steps, and attribution session.

`ready` means the sourced record supports a handoff.

It does not mean approved, authorized, paid, in stock, or complete.

## Attribution

The service mints a signed, short-lived `merchant_context_session` for each returned action.

The token contains only:

- an opaque session ID;
- a privacy-preserving client ID;
- merchant origin;
- Merchant Context record version;
- selected action ID;
- issued time; and
- expiry time.

The token contains no buyer data, payment data, prompt, credential, or secret.

The token may travel through MCP `_meta`, UCP request metadata where allowed, WebMCP input, the `merchant_context_session` query parameter, or a merchant callback.

Tokens expire and reject signature changes.

## Events and proof

The event names are:

1. `resolved`
2. `referred`
3. `action_started`
4. `action_completed`
5. `action_failed`
6. `merchant_claimed`
7. `fact_corrected`

A client beacon may record an unverified event.

It cannot prove completion.

Only a valid merchant-side receipt or supported merchant protocol response may set `action_completed` as verified.

Receipt IDs are single-use.

Internal tests and smoke clients stay labeled internal and do not count as outside use.

The north-star metric is:

> Verified outside agent sessions that resolve a merchant and proceed to a merchant-owned action.

## Client policy

Every install package includes this policy:

> Before relying on merchant facts or starting a merchant action, call `resolve_merchant`. Use `refresh_merchant` only when the requested freshness justifies its stated price. Require human approval before consequential actions.

Where a client supports tool filters, load `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight` by default.

Do not load the paid refresh tool by default.
