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
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, and pay-per-request flows | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-09-01.

- ACP describes ACP as an interaction model and open standard for connecting buyers, their AI agents, and businesses to complete purchases.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-01.
- ACP is currently beta and is maintained by OpenAI and Stripe.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-01.
- ACP lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog snapshot.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-01.
- UCP describes itself as the common language for platforms, agents, and businesses.
  Source: https://ucp.dev/
  Checked: 2026-09-01.
- UCP provides building blocks for agentic commerce from discovery to checkout and beyond.
  Source: https://ucp.dev/
  Checked: 2026-09-01.
- UCP states that it uses REST and JSON-RPC transports and has AP2, A2A, and MCP support built in.
  Source: https://ucp.dev/
  Checked: 2026-09-01.
- UCP `latest` points to specification version `2026-08-25`.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-01.
- UCP says it is expanding to Lodging and Food and that detailed specifications are coming soon.
  Source: https://ucp.dev/
  Checked: 2026-09-01.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-01.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-01.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-09-01.
- Schema.org `Offer` includes properties such as `availability`, `itemOffered`, and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-09-01.
- Schema.org `Product` includes `offers` and `hasMerchantReturnPolicy` properties for merchant listing data.
  Source: https://schema.org/Product
  Checked: 2026-09-01.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-09-01.
- MCP specification `2025-06-18` defines protocol requirements based on its schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-01.
- MCP exposes tools and capabilities to AI systems, but it is not a commerce protocol by itself.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-01.
- A2A describes itself as an open standard for different AI agents to communicate, collaborate, and solve complex problems together.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-01.
- A2A says users connect agents to tools and data through MCP and to other agents through A2A.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-01.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-01.
- Cloudflare Agents docs say each hosted agent session has durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-01.
- Cloudflare remote MCP docs describe remote MCP connections over Streamable HTTP with OAuth authorization.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-01.
- Cloudflare Web Bot Auth verifies bot identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-01.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory` that serves a JWKS.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-01.
- Cloudflare Web Bot Auth relies on IETF drafts for HTTP message signature directories and Web Bot Auth architecture.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-01.
- Cloudflare says its Web Bot Auth implementation currently does not support the `bs` or `sf` parameter for non-ASCII serialization.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-01.
- Cloudflare is experimenting with transitive trust for bot operator identity through the `Forwarded` header.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-01.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-09-01.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-01.
- x402 protocol version 2 separates core types, scheme-specific logic, and transport-specific representation.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-01.
- x402 protocol version 2 defines HTTP, MCP, and A2A as example transport mechanisms.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-01.
- x402 protocol version 2 lists `exact`, `upto`, and `batch-settlement` as extensible payment schemes.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-01.
- x402 protocol version 2 says the canonical HTTP location for `PaymentRequired` is the base64-encoded `PAYMENT-REQUIRED` response header.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-01.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and has no standard use convention.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-01.
- RFC 9110 lists `402 Payment Required` as reserved for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-09-01.

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
