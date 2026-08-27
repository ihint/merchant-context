# Agentic Commerce Protocol Map

No single standard owns the full path from discovery to payment.

Treat each layer as a separate claim.

Do not claim support for a protocol until a live endpoint or file passes a test.

## Current map

| Need | Common system | What it covers | What it does not prove |
| --- | --- | --- | --- |
| Public web discovery | HTML, `robots.txt`, `sitemap.xml`, Schema.org JSON-LD | Crawl access, page discovery, and structured public facts | Live stock, authority, or checkout support |
| Merchant listings | [Schema.org `Offer`](https://schema.org/Offer), [`Product`](https://schema.org/Product), and [`MerchantReturnPolicy`](https://schema.org/MerchantReturnPolicy) | Machine-readable offers, price, availability, item, seller, shipping, and returns data | Agent consent, checkout execution, or real-time correctness by itself |
| Product discovery in ChatGPT | [Agentic Commerce Protocol](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) | Agentic checkout, delegated payment, feed, cart, orders, authentication, MCP-related extensions, OpenAPI specs, JSON Schemas, examples, and changelog snapshots | Support in every buyer agent or every merchant system |
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/) | Discovery, catalog search and lookup, cart building, identity linking, checkout, order management, native checkout, embedded checkout, and post-purchase capability exchange | Automatic support outside participating platforms, agents, and businesses |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Notifies participating search engines that URLs were added, updated, or deleted | Ranking, indexing, or proof that a submitted URL was crawled |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | Typed tools, resources, prompts, transport, and authorization patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, Workers-based runtime, browser, sandbox, AI Search, MCP tools, payments tools, and remote MCP server guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for verified bots and agents using Cloudflare's Web Bot Auth implementation | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, and pay-per-request flows across HTTP, MCP, A2A, or other request-response transports | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-08-27.

- ACP is beta and is maintained by OpenAI and Stripe according to the ACP README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-27.
- ACP lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog snapshot.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-27.
- ACP says OpenAI and Stripe first implemented ACP and provide production-ready reference implementations.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-27.
- UCP describes itself as the common language for platforms, agents, and businesses.
  Source: https://ucp.dev/
  Checked: 2026-08-27.
- UCP version selector lists `2026-08-25` as the current dated specification.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-08-27.
- UCP states that its active specification covers Shopping, Payment, identity, discovery, governance, negotiation, and signatures.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-08-27.
- UCP says it is built on REST and JSON-RPC transports with AP2, A2A, and MCP support built in.
  Source: https://ucp.dev/
  Checked: 2026-08-27.
- UCP states that Lodging and Food specifications are coming soon.
  Source: https://ucp.dev/
  Checked: 2026-08-27.
- UCP roadmap says planned priorities may change and are not delivery commitments.
  Source: https://ucp.dev/documentation/roadmap/
  Checked: 2026-08-27.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-27.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-27.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-08-27.
- Schema.org `Offer` includes properties such as `availability`, `itemOffered`, and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-08-27.
- Schema.org `Product` defines any offered product or service.
  Source: https://schema.org/Product
  Checked: 2026-08-27.
- Schema.org `Product` includes `offers` for offers or demands tied to the item.
  Source: https://schema.org/Product
  Checked: 2026-08-27.
- Schema.org `Product` includes `hasMerchantReturnPolicy` as a pending extension property.
  Source: https://schema.org/Product
  Checked: 2026-08-27.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-08-27.
- MCP specification `2025-06-18` defines authoritative protocol requirements based on its TypeScript schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-27.
- MCP exposes resources, prompts, and tools to AI systems.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-27.
- MCP is not a commerce protocol by itself.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-27.
- A2A describes itself as an open standard for communication and collaboration between AI agents.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-27.
- A2A says it helps agents discover each other, delegate tasks, and share results.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-27.
- A2A says it is not a replacement for MCP.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-27.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-08-27.
- Cloudflare remote MCP docs describe remote MCP over Streamable HTTP with OAuth authorization.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-08-27.
- Cloudflare Web Bot Auth verifies bot identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-27.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory`.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-27.
- Cloudflare says transitive trust and the `Forwarded` header are experimental and may change.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-27.
- Cloudflare says its Web Bot Auth implementation does not support every component and parameter defined in RFC 9421.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-27.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-08-27.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-27.
- x402 v2 separates core types, scheme-specific logic, and transport-specific representation.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-27.
- x402 v2 lists `exact`, `upto`, and `batch-settlement` as payment schemes.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-27.
- x402 v2 says transport-specific implementations can map x402 response types to HTTP status codes or JSON-RPC error codes.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-27.
- x402 v2 says x402 can integrate across HTTP, MCP, A2A, and custom request-response transports.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-27.
- RFC 9110 defines status code `402 Payment Required` as reserved for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-08-27.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and handled by browsers as a generic 4xx status.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-08-27.

## Terms

The standards use several terms for the same side of a transaction:

- **Buyer agent**, **shopping agent**, and **consumer agent** mean an agent acting for a buyer.
- **Merchant**, **business**, and **seller** mean the party offering the good or service.
- **Merchant agent** is useful product language, but it is not yet one fixed cross-protocol role.
- **Merchant of record** is a legal and payment role.
- Do not use merchant of record as a synonym for merchant agent.

## Implementation order

1. Publish correct facts on stable URLs.
2. Make the offer decision-ready.
3. Add one real action path.
4. Add the protocol required by the channel you are testing.
5. Add agent identity, scoped authority, logs, and recovery.

This order keeps a merchant useful while standards change.
