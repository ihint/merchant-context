---
name: merchant-context
description: Checks a merchant's public agent-commerce files and reports exact gaps. Use when a user asks about merchant readiness, buyer-agent discovery, llms.txt, UCP, Merchant Context, or public commerce evidence.
---

# Merchant Context

Use the remote MCP server at `https://api.merchant.atomandbits.com/mcp`.

## Default workflow

1. Confirm the target is a public HTTPS merchant URL.
2. Call `check_merchant` first.
3. Report each check as pass or fail.
4. Link to the public URL behind each result when the tool returns it.
5. State the scan time and any limit or uncertainty.
6. Give exact fixes for failed checks.

Treat the result as a public-web observation.
Do not call it certification, endorsement, partnership, or a security review.

## Payment rule

`get_service_info` and `check_merchant` are free.

`inspect_merchant` costs $0.01 USDC on Base.
Do not call it unless the user clearly approves that exact payment.
Before a paid call, state the tool, amount, asset, network, and receive address.
Do not treat a 402 response, signature, validation result, or balance as payment.
Require a successful settlement receipt with a transaction hash and time.

## Failure handling

If the MCP server is unavailable, check the service record at
`https://api.merchant.atomandbits.com/.well-known/merchant-context`.

Do not guess missing merchant facts.
Mark a source as not observed when it cannot be checked.

See [the agent integration guide](../../docs/agent-integration.md) for client setup.
