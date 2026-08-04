# Merchant Context

Merchant Context is an open project for making offers easier for buyer agents to find, compare, and act on.

It starts with a practical question:

> Can an agent tell what you sell, who it is for, what it costs, which rules apply, and what action comes next without guessing?

This repo contains:

- an [agentic commerce readiness checklist](CHECKLIST.md);
- a [draft merchant-context schema](schema/merchant-context.schema.json);
- a [worked SaaS example](examples/saas.json); and
- a [map of the main commerce and discovery standards](docs/protocol-map.md).

## Canonical sources

- Product and machine brief: https://merchant.atomandbits.com/llms.txt
- Version 0.1 schema: https://merchant.atomandbits.com/schema/merchant-context-v0.1.json
- Open source and history: https://github.com/ihint/merchant-context

The domain schema and [`schema/merchant-context.schema.json`](schema/merchant-context.schema.json)
must stay semantically equal. Versioned releases preserve old contracts.

## Status

This is an early public draft from [Atom & Bits](https://atomandbits.com). It is not a new payment or checkout protocol. It does not certify ACP, UCP, MCP, A2A, x402, or Web Bot Auth support.

The goal is to give merchants one testable context layer that can map to those systems as they mature.

Agent and framework builders can follow the
[first 100 paid integrations](https://github.com/ihint/merchant-context/issues/6). The issue states
the launch gates and will list the verified endpoint when it is safe to call.

## Quick start

1. Work through [CHECKLIST.md](CHECKLIST.md).
2. Copy [examples/saas.json](examples/saas.json).
3. Replace every sample value with a fact from your own site or system.
4. Keep prices, stock, policies, and action URLs current.
5. Run `python3 scripts/validate.py` before publishing.

## Design rules

- Facts beat slogans.
- A URL is not an API.
- Agents must not infer price, stock, policy, or authority.
- Each claim should name its source and update time.
- A purchase or other high-impact action should state when human approval is required.
- Existing standards win. Map to them instead of inventing a private dialect.

## Agent service

The [`worker`](worker) directory contains the hosted MCP service under test. It exposes:

- `get_service_info`, a free tool that states the checks, price, payment network, and source;
- `inspect_merchant`, a $0.01 x402 tool that checks six fixed public discovery paths; and
- `POST /v1/inspect`, the same $0.01 inspection through standard HTTP x402 clients; and
- `/.well-known/merchant-context`, a public service record for agents and registries.

The inspector accepts public HTTPS origins only. It blocks local and IP targets, checks each
redirect, caps response size and time, and returns no page body. The payment path records hashes,
not wallet addresses or signed payment tokens.

We will list the production endpoint here after payment settlement, usage storage, and a live paid
call pass their checks.

Run its local checks:

```sh
cd worker
npm install
npm test
npm run typecheck
npx wrangler deploy --dry-run
```

## Contributing

Issues, examples, and corrections are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
