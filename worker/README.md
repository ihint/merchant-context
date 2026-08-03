# Merchant Context MCP worker

This Worker serves a public Streamable HTTP MCP endpoint with two tools:

- `get_service_info` is free.
- `inspect_merchant` costs $0.01 USDC through x402 on Base.

The paid tool checks a fixed set of files on one public HTTPS origin. It does not crawl arbitrary
links or return page bodies.

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
- `RATE_LIMITER`, set to 60 MCP requests per source IP each minute

The x402 facilitator verifies payment signatures, prevents authorization replay, settles USDC, and
returns the transaction receipt. The tool records a hashed verified-payment row before it returns a
successful result; if that write fails, settlement does not run.
