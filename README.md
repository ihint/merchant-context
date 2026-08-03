# Merchant Context

Merchant Context is an open project for making offers easier for buyer agents to find, compare, and act on.

It starts with a practical question:

> Can an agent tell what you sell, who it is for, what it costs, which rules apply, and what action comes next without guessing?

This repo contains:

- an [agentic commerce readiness checklist](CHECKLIST.md);
- a [draft merchant-context schema](schema/merchant-context.schema.json);
- a [worked SaaS example](examples/saas.json); and
- a [map of the main commerce and discovery standards](docs/protocol-map.md).

## Status

This is an early public draft from [Atom & Bits](https://atomandbits.com). It is not a new payment or checkout protocol. It does not certify ACP, UCP, MCP, A2A, x402, or Web Bot Auth support.

The goal is to give merchants one testable context layer that can map to those systems as they mature.

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

## Contributing

Issues, examples, and corrections are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](LICENSE).
