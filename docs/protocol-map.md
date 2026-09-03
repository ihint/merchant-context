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
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | JSON-RPC messages, resources, prompts, tools, sampling, elicitation, roots, authorization, and transport patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, Workers-based runtime, browser, sandbox, AI Search, MCP tools, payments tools, and remote MCP server guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for verified bots and agents using Cloudflare's Web Bot Auth implementation | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, facilitator discovery, and pay-per-request flows across HTTP and other transports | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-09-03.

- ACP is beta and is maintained by OpenAI and Stripe according to the ACP README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-03.
- ACP lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog version in the README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-03.
- ACP has an `unreleased` changelog directory for current development entries.
  Source: https://api.github.com/repos/agentic-commerce-protocol/agentic-commerce-protocol/contents/changelog
  Checked: 2026-09-03.
- ACP says it was first implemented by OpenAI and Stripe.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-03.
- UCP describes itself as a common language for platforms, agents, and businesses.
  Source: https://ucp.dev/
  Checked: 2026-09-03.
- UCP says it provides building blocks for agentic commerce from discovery to checkout and beyond.
  Source: https://ucp.dev/
  Checked: 2026-09-03.
- UCP says its core capabilities include catalog search and lookup, cart building, identity linking, checkout, and order management.
  Source: https://ucp.dev/
  Checked: 2026-09-03.
- UCP says it is built on REST and JSON-RPC transports, AP2, A2A, and MCP support.
  Source: https://ucp.dev/
  Checked: 2026-09-03.
- UCP `latest` currently resolves to specification version `2026-08-25`.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-03.
- UCP profiles use `/.well-known/ucp` for business profile discovery.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-03.
- UCP states that its Lodging and Food specifications are coming soon.
  Source: https://ucp.dev/
  Checked: 2026-09-03.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-03.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-03.
- IndexNow requires a UTF-8 text key file to prove ownership of the submitted host.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-03.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-09-03.
- Schema.org `Offer` includes `availability`, `itemOffered`, `price`, `priceCurrency`, `seller`, `shippingDetails`, and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-09-03.
- Schema.org `Product` defines any offered product or service.
  Source: https://schema.org/Product
  Checked: 2026-09-03.
- Schema.org `Product` includes `offers` and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Product
  Checked: 2026-09-03.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-09-03.
- MCP specification `2025-06-18` defines the authoritative protocol requirements based on its TypeScript schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-03.
- MCP uses JSON-RPC 2.0 messages for communication between MCP clients and servers.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-03.
- MCP exposes resources, prompts, and tools to AI systems.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-03.
- MCP tools represent arbitrary code execution and require caution.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-03.
- A2A describes itself as an open protocol for communication and interoperability between opaque agentic applications.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-03.
- A2A says agents can use MCP for tools and A2A to communicate with remote agents, local agents, and humans.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-03.
- A2A says it is not a replacement for MCP.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-03.
- A2A announces that it joined the Agentic AI Foundation.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-03.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-03.
- Cloudflare remote MCP docs define remote MCP connections over Streamable HTTP with OAuth authorization.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-03.
- Cloudflare remote MCP docs describe local MCP connections as stdio connections on the same machine.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-03.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory`.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- Cloudflare Web Bot Auth requires the key directory to serve a JWKS over HTTPS.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- Cloudflare Web Bot Auth request signing uses `Signature-Agent`, `Signature-Input`, and `Signature` headers.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- Cloudflare Web Bot Auth says `Signature-Agent` must be an HTTPS structured string and must be included in the `Signature-Input` component list.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- Cloudflare Web Bot Auth describes transitive trust as website owner, bot operator, and end user.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- Cloudflare says its Web Bot Auth implementation does not support every component and parameter defined in RFC 9421.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-03.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-09-03.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-03.
- x402 v2 separates core data structures from scheme logic and transport representation.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- x402 v2 says the HTTP transport carries the `PaymentRequired` object in the base64-encoded `PAYMENT-REQUIRED` response header.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- x402 v2 lists `exact`, `upto`, `batch-settlement`, and `auth-capture` as scheme families under `specs/schemes/`.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- x402 v2 facilitator APIs are standardized as HTTP endpoints for payment verification and settlement.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- x402 v2 `/verify` is read-only and must not commit payment state or write onchain state.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- x402 v2 includes `/supported` for facilitator-supported schemes, networks, and extensions.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-03.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and has no standard use convention.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-03.
- MDN says no browser supports a special 402 flow and browsers display it as a generic `4xx` status code.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-03.
- RFC 9110 reserves status code 402 as `Payment Required`.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-09-03.

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
