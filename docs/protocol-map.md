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
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/) | Discovery, catalog search and lookup, cart building, identity linking, checkout, order management, native checkout, embedded checkout, AP2 payments, A2A/MCP compatibility, and post-purchase capability exchange | Automatic support outside participating platforms, agents, and businesses |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Notifies participating search engines that URLs were added, updated, or deleted | Ranking, indexing, or proof that a submitted URL was crawled |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | Typed tools, resources, prompts, JSON-RPC messages, transports, and authorization patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, durable identity, local SQL storage, real-time connections, scheduled work, Browser, Sandbox, AI Search, MCP tools, payments tools, and remote MCP server guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages, `Signature-Agent`, key directories, and Cloudflare verified-bot checks | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, payment schemes, facilitator endpoints, and transport-specific payment signaling | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-08-14.

- ACP is beta and is maintained by OpenAI and Stripe according to the ACP README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-14.
- ACP uses date-based versions and lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog snapshot in the README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-14.
- ACP changelog entries include `2025-09-29.md`, `2025-12-12.md`, `2026-01-16.md`, `2026-01-30.md`, `2026-04-17.md`, and `unreleased` in the GitHub contents API.
  Source: https://api.github.com/repos/agentic-commerce-protocol/agentic-commerce-protocol/contents/changelog
  Checked: 2026-08-14.
- UCP describes itself as a common language for platforms, agents, and businesses.
  Source: https://ucp.dev/
  Checked: 2026-08-14.
- UCP states that it covers discovery/search through final sale and post-purchase support.
  Source: https://ucp.dev/
  Checked: 2026-08-14.
- UCP states that core capabilities include catalog search and lookup, cart building, identity linking, checkout, and order management.
  Source: https://ucp.dev/
  Checked: 2026-08-14.
- UCP states that it has REST and JSON-RPC transports and built-in support for AP2, A2A, and MCP.
  Source: https://ucp.dev/
  Checked: 2026-08-14.
- UCP states that it is expanding to lodging and food and that detailed specifications are coming soon.
  Source: https://ucp.dev/
  Checked: 2026-08-14.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-14.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-14.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-08-14.
- Schema.org `Offer` includes properties such as `availability`, `itemOffered`, `hasMerchantReturnPolicy`, `price`, `seller`, and `shippingDetails`.
  Source: https://schema.org/Offer
  Checked: 2026-08-14.
- Schema.org `Product` defines any offered product or service.
  Source: https://schema.org/Product
  Checked: 2026-08-14.
- Schema.org `Product` includes properties such as `offers`, `gtin`, `hasMerchantReturnPolicy`, `review`, and `sku`.
  Source: https://schema.org/Product
  Checked: 2026-08-14.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-08-14.
- MCP specification `2025-06-18` defines the authoritative protocol requirements based on its schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-14.
- MCP uses JSON-RPC 2.0 messages and exposes tools and capabilities to AI systems.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-14.
- MCP is not a commerce protocol by itself.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-14.
- A2A describes itself as an open standard for communication and collaboration between AI agents.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-14.
- A2A says MCP is for agent-to-tool communication and A2A is for agent-to-agent communication.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-14.
- A2A says it is not a replacement for MCP.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-14.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-08-14.
- Cloudflare Agents docs state that each hosted agent session has durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-08-14.
- Cloudflare remote MCP docs describe building and deploying remote MCP servers on Cloudflare.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-08-14.
- Cloudflare remote MCP docs state that remote MCP clients connect over Streamable HTTP and use OAuth to authorize access to user-account resources.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-08-14.
- Cloudflare Web Bot Auth verifies bot identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-14.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory`.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-14.
- Cloudflare Web Bot Auth uses a `Signature-Agent` header pointing to the key directory.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-14.
- Cloudflare describes Web Bot Auth transitive trust as experimental and based on the RFC 7239 `Forwarded` header.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-14.
- Cloudflare says its Web Bot Auth implementation does not support every component and parameter defined in RFC 9421.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-14.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-08-14.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-14.
- x402's typical HTTP flow uses `402 Payment Required`, a base64 `PAYMENT-REQUIRED` response header, `PAYMENT-SIGNATURE`, `/verify`, and `/settle`.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-14.
- x402 v2 separates core data structures, payment-scheme logic, and transport representation.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-14.
- x402 v2 says its core protocol can be implemented over HTTP, MCP, A2A, and custom request-response transports.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-14.
- x402 v2 says facilitator APIs are currently standardized as HTTP endpoints for `/verify`, `/settle`, and `/supported`.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-14.
- x402 specs include `x402-specification-v1.md`, `x402-specification-v2.md`, `transports-v1`, `transports-v2`, `schemes`, and `extensions` in the GitHub contents API.
  Source: https://api.github.com/repos/x402-foundation/x402/contents/specs
  Checked: 2026-08-14.
- RFC 9110 says the `402 Payment Required` status code is reserved for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-08-14.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and has no standard use convention.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-08-14.
- MDN says browsers display HTTP 402 as a generic 4xx status code.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-08-14.

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
