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
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/) | Discovery, service profiles, catalog search and lookup, cart building, identity linking, checkout, order management, policies, payment-handler negotiation, and post-purchase capability exchange | Automatic support outside participating platforms, agents, and businesses |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Notifies participating search engines that URLs were added, updated, or deleted | Ranking, indexing, or proof that a submitted URL was crawled |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | JSON-RPC protocol, typed tools, resources, prompts, transport, and authorization patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, durable identity, local SQL storage, real-time connections, scheduled work, recoverable execution, browser, sandbox, AI Search, MCP tools, payments tools, and remote MCP server guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for verified bots and agents using Cloudflare's Web Bot Auth implementation | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, schemes, facilitator APIs, discovery, and pay-per-request flows | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-09-14.

- ACP is beta and is maintained by OpenAI and Stripe according to the ACP README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-14.
- ACP describes itself as an interaction model and open standard for connecting buyers, their AI agents, and businesses to complete purchases.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-14.
- ACP uses date-based versions and lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog snapshot in the README and changelog directory.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Source: https://api.github.com/repos/agentic-commerce-protocol/agentic-commerce-protocol/contents/changelog
  Checked: 2026-09-14.
- ACP says OpenAI and Stripe first implemented ACP and points developers to OpenAI and Stripe agentic-commerce documentation.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-14.
- UCP `/latest/` resolves to the `2026-08-25` specification.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-14.
- UCP profile documents are machine-readable discovery documents; businesses publish their profile at `/.well-known/ucp`, and platforms publish their profile at the URI advertised in `UCP-Agent`.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP requires profile `ucp.version`, `ucp.services`, and `ucp.payment_handlers`; `ucp.capabilities` is optional.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP supports HTTP/1.1 or higher with RESTful patterns and `application/json` requests and responses.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP supports MCP over JSON-RPC using `tools/call`; operation names go in `params.name`, UCP payloads go in `params.arguments`, and UCP responses go in `structuredContent`.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP says a business may expose an A2A agent that supports UCP as an A2A Extension.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP standard capabilities include Cart, Checkout, Identity Linking, and Order.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP policies can carry return terms, warranty terms, subscription terms, and custom policy types in a core `policies[]` array.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP `ucp.request_constraints` lets a business advertise additional rules it will enforce on the next platform request, and platforms may use those constraints for optional preflight checks.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- UCP represents quantities and amounts as JSON integers and says implementations should avoid binary floating-point arithmetic when moving UCP values into external systems.
  Source: https://ucp.dev/latest/specification/overview/
  Checked: 2026-09-14.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-14.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-14.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-09-14.
- Schema.org `Offer` includes properties such as `availability`, `itemOffered`, `priceCurrency`, `priceValidUntil`, `shippingDetails`, and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-09-14.
- Schema.org `Product` includes `hasMerchantReturnPolicy` and merchant-listing examples that combine `Offer`, `availability`, `price`, `hasMerchantReturnPolicy`, and `shippingDetails`.
  Source: https://schema.org/Product
  Checked: 2026-09-14.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-09-14.
- MCP specification `2025-06-18` defines the authoritative protocol requirements based on its TypeScript schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-14.
- MCP uses JSON-RPC 2.0 messages and exposes resources, prompts, and tools.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-14.
- MCP exposes tools and capabilities to AI systems, but it is not a commerce protocol by itself.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-14.
- A2A describes itself as an open standard for communication and collaboration between AI agents.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-14.
- A2A says agents can use it to delegate subtasks, exchange information, and coordinate actions.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-14.
- A2A says it is for agent-to-agent communication and is not a replacement for MCP.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-14.
- A2A's home page banner links to a blog item saying A2A joins the Agentic AI Foundation.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-14.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-14.
- Cloudflare Agents docs say each hosted agent session has durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-14.
- Cloudflare remote MCP docs describe building and deploying remote MCP servers on Cloudflare.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-14.
- Cloudflare remote MCP docs distinguish remote MCP over Streamable HTTP with OAuth from local MCP over stdio.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-14.
- Cloudflare Web Bot Auth verifies bot and agent identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare Web Bot Auth relies on IETF drafts for HTTP message signature key directories and Web Bot Auth architecture.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory` that serves a JWKS including the public key derived from the signing key.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare Web Bot Auth requires signed requests to construct `Signature-Input`, `Signature`, and `Signature-Agent` headers.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare says its Web Bot Auth implementation does not support every component and parameter defined in RFC 9421.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare describes transitive trust as the chain website owner to bot operator to end user and says it is experimenting with the `Forwarded` header to carry operator identity through that chain.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- Cloudflare recommends including a Web Bot Auth `nonce`, but says it currently does not validate nonces or keep a replay-prevention database and instead recommends short `expires` values.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-14.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now pointing to the foundation repo.
  Source: https://github.com/coinbase/x402
  Checked: 2026-09-14.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-14.
- x402 README says payment schemes include `exact`, `upto`, and `batch-settlement` under `specs/schemes/`.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-14.
- x402 v2 says the protocol separates transport-independent types, scheme-and-network logic, and transport-specific representation such as HTTP, MCP, and A2A.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-14.
- x402 v2 lists `exact`, `upto`, `batch-settlement`, and `auth-capture` scheme or per-network bindings under `specs/schemes/`.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-14.
- x402 v2 says facilitator APIs are currently standardized as HTTP `POST /verify` and `POST /settle` endpoints.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-14.
- x402 v2 defines payment-flow models including the default `authorization` flow, plus `upfront` and `escrow` flows that settle before resource execution.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-14.
- x402 README says production mainnet routes should choose a facilitator model explicitly and should not assume the public x402.org facilitator is the default production path for mainnet EVM routes.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-14.
- x402's HTTP flow uses `402 Payment Required`, `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `/verify`, and `/settle`.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-14.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and has no standard use convention.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-14.
- MDN says no browser supports 402 and an error will be displayed as a generic `4xx` status code.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-14.
- RFC 9110 reserves status code 402 for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-09-14.

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
