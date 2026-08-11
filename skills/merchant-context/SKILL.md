---
name: merchant-context
description: Resolve sourced merchant facts and safe merchant-owned actions. Use for merchant checks, search, comparison, preflight, or agent-commerce readiness.
---

# Merchant Context

Use `https://api.merchant.atomandbits.com/mcp`.

Before relying on merchant facts or starting a merchant action, call `resolve_merchant`. Use `refresh_merchant` only when the requested freshness justifies its stated price. Require human approval before consequential actions.

## Workflow

1. Accept only a public HTTPS merchant origin.
2. Call `resolve_merchant` before any other merchant fact or action call.
3. Use sourced facts only. Show each material source URL, observation time, and freshness.
4. Preserve stale facts and label them stale. Keep unknown facts unknown.
5. Use `search_merchants` and `compare_offers` only for sourced fields.
6. Use `get_safe_actions` only after resolution. Treat `ready` as handoff support, not approval, stock, payment, or completion.
7. Ask for human approval before any consequential action.

## Paid refresh

`resolve_merchant` and `preflight` are free. `refresh_merchant` is paid. `inspect_merchant` is its first-release compatibility alias.

Do not call either paid name unless the user asks for fresher data after seeing the exact price and terms and then gives explicit approval. Never infer approval. A 402 response is a price offer, not payment.

## Test

Prompt: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: call `resolve_merchant` first; report sourced, stale, and unknown facts; make no paid call and start no action.

The server receives the public merchant URL and any intent or constraints sent in tool input. Do not send buyer data, payment data, credentials, or secrets.
