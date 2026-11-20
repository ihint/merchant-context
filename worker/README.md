# Merchant Context MCP worker

This Worker serves a public Streamable HTTP MCP endpoint.

- `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight` are free.
- `check_merchant` is a free site diagnostic.
- `refresh_merchant` costs $0.01 USDC through x402 on Base.
- `inspect_merchant` is a paid compatibility alias.

The paid tool checks a fixed set of files on one public HTTPS origin. It does not crawl arbitrary
links or return page bodies.

The Worker exposes free direct HTTP routes under `/v1`.

It also exposes `POST /v1/refresh` for wallets and agents that support standard HTTP x402.
It takes `merchant_url`, `agent_id`, and `approved: true`, charges $0.01 USDC on Base,
and returns the inspection as JSON with the settlement receipt in the `PAYMENT-RESPONSE` header.
Clients may send the three fields as JSON or as query parameters when their x402 discovery step does
not preserve request bodies.

Production: `https://api.merchant.atomandbits.com/v1/refresh`

## Run the checks

```sh
npm install
npm test
npm run typecheck
npm run format:check
npm audit
npx wrangler deploy --dry-run
```

## Call the paid tool

The example requires a separate test wallet funded with enough USDC and ETH on Base. Do not use a
wallet that holds funds beyond the test amount. The client caps the payment at $0.01.

Set these values in your shell. Never save or commit the private key.

```sh
export MERCHANT_CONTEXT_MCP_URL="https://your-deployment.example/mcp"
export MERCHANT_URL="https://merchant.example"
export AGENT_ID="your-agent/stable-id"
export X402_CLIENT_PRIVATE_KEY="0x..."
export ALLOW_X402_PAYMENT="yes"
npm run example:paid
```

The tool result includes the x402 settlement response. The server stores only SHA-256 hashes of the
agent ID, payer address, and signed payment token.

## Production bindings

The service fails closed until all of these exist:

- `X402_NETWORK=base`
- `X402_RECIPIENT`, a public 20-byte EVM address
- `USAGE_DB`, a D1 database with `migrations/0001_verified_calls.sql` applied
- `ATTRIBUTION_SIGNING_KEY`, a Worker secret
- `MERCHANT_RECEIPT_SECRET`, a Worker secret shared only with approved merchant receipt issuers
- `RATE_LIMITER`, set to 60 MCP requests per source IP each minute

The x402 facilitator verifies payment signatures, prevents authorization replay, settles USDC, and
returns the transaction receipt. The tool records a hashed verified-payment row before it returns a
successful result; if that write fails, settlement does not run. After settlement, the Worker reads
the receipt from the MCP result and records the public transaction hash. It does not count a verified
signature as revenue.

## Record payments in Stripe (preview only)

The Worker can record each settled refresh in Stripe as a PaymentIntent. It follows
[Stripe's x402 guide](https://docs.stripe.com/payments/machine/x402). It stays off until
`STRIPE_SECRET_KEY` is set. Production has no such key, and this path is not proved yet.

Setup for the preview Worker:

1. In a Stripe sandbox, request the Stablecoins and Crypto payment method.
2. Create a Base deposit address in that sandbox:

   ```sh
   curl https://api.stripe.com/v1/crypto/deposit_addresses \
     -u "$STRIPE_TEST_KEY:" \
     -H "Stripe-Version: 2026-07-29.preview" \
     -d network=base
   ```

3. Set the preview `X402_RECIPIENT` in `wrangler.jsonc` to that address and deploy with
   `npx wrangler deploy --env preview`.
4. Set the key as a secret. Use a test-mode secret or restricted key that can write PaymentIntents:

   ```sh
   npx wrangler secret put STRIPE_SECRET_KEY --env preview
   ```

5. Pay one refresh from a Base Sepolia wallet. The facilitator settles it, then the Worker creates a
   PaymentIntent in `transaction_verification` mode, keyed by the transaction hash.

Rules the Worker enforces:

- Base Sepolia needs a test-mode key. Base mainnet needs a live-mode key. A mismatch returns 503 on
  the paid and MCP routes.
- The Stripe call runs in the background after settlement. If it fails, the agent still gets its
  paid result, and the log names the HTTP status and Stripe error code. Logs never include the key.
- The money moves on-chain to `X402_RECIPIENT` either way. Stripe accepts the record only when that
  address is a Stripe deposit address.

## Report settled use

Run the aggregate report against the production D1 database:

```sh
npx wrangler d1 execute merchant-context-usage --remote \
  --file scripts/settled-revenue-report.sql
```

The report counts Base mainnet settlements only. `distinct_agent_payer_pairs` is the working paid
agent measure. `distinct_payers` shows how many payer wallets those agents used. Agent IDs are
self-declared, so publish both counts with the on-chain transaction evidence.

## Deploy production

Use a public Base receive address. Do not put a private key or seed phrase in this shell.

```sh
export X402_RECIPIENT="0x..."
export ALLOW_PRODUCTION_DEPLOY="merchant-context"
npm run deploy:production
```

The command requires a clean Git tree, runs every local check, confirms Cloudflare access, reuses or
creates the `merchant-context-usage` D1 database, writes its public binding and receive address to
`wrangler.jsonc`, applies tracked migrations with a backup, deploys, and verifies health, discovery,
the MCP tool list, and the unpaid $0.01 Base challenge. It refuses to run when
`X402_CLIENT_PRIVATE_KEY` is present. Review and commit the resulting config change after the live
checks pass.
