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
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/latest/) | Discovery, catalog search and lookup, cart building, identity linking, checkout, order management, policies, payment handlers, REST, MCP, A2A, embedded-protocol, and post-purchase capability exchange | Automatic support outside participating platforms, agents, and businesses |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Notifies participating search engines that URLs were added, updated, or deleted | Ranking, indexing, or proof that a submitted URL was crawled |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | Typed tools, resources, prompts, JSON-RPC messaging, transport, authorization, and security patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, durable identity, local SQL storage, real-time connections, scheduled work, recoverable execution, Browser, Sandbox, AI Search, MCP tools, payments tools, and remote MCP server guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for verified bots and agents using Cloudflare's Web Bot Auth implementation | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, verification, settlement, pay-per-request flows, and transport-specific signaling for HTTP, MCP, and A2A | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved by HTTP and not defined by a common HTTP payment convention | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-09-07.

- ACP is beta and is maintained by OpenAI and Stripe according to the ACP README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-07.
- ACP describes itself as an interaction model and open standard for connecting buyers, AI agents, and businesses to complete purchases.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-07.
- ACP uses date-based versions and lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, examples, and changelog snapshot in the README.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-07.
- ACP says OpenAI and Stripe first implemented ACP and links to OpenAI Commerce and Stripe Agentic Commerce documentation.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-09-07.
- ACP's changelog directory contains released entries through `2026-04-17.md` and an `unreleased/` directory.
  Source: https://api.github.com/repos/agentic-commerce-protocol/agentic-commerce-protocol/contents/changelog
  Checked: 2026-09-07.
- UCP latest currently resolves to the `2026-08-25` specification.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP profile discovery uses `/.well-known/ucp` for businesses, and platforms advertise a profile URL per request with `UCP-Agent`.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP profiles declare protocol version, services, optional capabilities, payment handlers, and optional signing keys.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP supports REST over HTTP/1.1 or higher, with `application/json` requests and responses and standard HTTP verbs and status codes.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP supports MCP over JSON-RPC with `tools/call`, UCP payloads in `params.arguments`, and response payloads in `structuredContent`.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP allows a business to expose an A2A agent that supports UCP as an A2A Extension.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP defines standard capabilities for cart, checkout, identity linking, and order.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- UCP policies cover business rules such as return terms, warranty, and subscription terms in a core `policies[]` array.
  Source: https://ucp.dev/latest/
  Checked: 2026-09-07.
- IndexNow accepts one URL by query string or up to 10,000 URLs by POST JSON.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-07.
- IndexNow says HTTP 200 only means the search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-09-07.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-09-07.
- Schema.org `Offer` includes properties such as `availability`, `itemOffered`, `shippingDetails`, and `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-09-07.
- Schema.org `Product` can carry `hasMerchantReturnPolicy` as a value for product-level return policy data.
  Source: https://schema.org/Product
  Checked: 2026-09-07.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-09-07.
- Schema.org `MerchantReturnPolicy` includes properties such as `applicableCountry`, `returnPolicyCategory`, and `merchantReturnDays`.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-09-07.
- MCP specification `2025-06-18` defines the authoritative protocol requirements based on its TypeScript schema.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-07.
- MCP exposes tools and capabilities to AI systems, but it is not a commerce protocol by itself.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-07.
- MCP uses JSON-RPC 2.0 messages to communicate between hosts, clients, and servers.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-09-07.
- A2A describes itself as an open standard for communication and collaboration between AI agents.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-07.
- A2A says it is for agent-to-agent communication and MCP is for agent-to-tool communication.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-09-07.
- A2A's latest blog says A2A was accepted as a Growth Stage project at the Agentic AI Foundation.
  Source: https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/
  Checked: 2026-09-07.
- Cloudflare Agents docs describe a Cloudflare-hosted runtime with durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-07.
- Cloudflare Agents docs list Browser, Sandbox, AI Search, MCP tools, payments, and Code Mode as agent tool capabilities.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-09-07.
- Cloudflare remote MCP docs describe building and deploying remote MCP servers on Cloudflare.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-07.
- Cloudflare remote MCP docs describe remote MCP connections over Streamable HTTP with OAuth authorization, and local MCP connections over stdio.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-09-07.
- Cloudflare Web Bot Auth verifies bot identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-07.
- Cloudflare Web Bot Auth relies on IETF drafts for key directories and Web Bot Auth architecture.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-07.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory` that serves a JWKS.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-07.
- Cloudflare Web Bot Auth request signing uses `Signature-Input`, `Signature`, and `Signature-Agent` headers.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-07.
- Cloudflare Web Bot Auth says messages fail verification when `Signature-Agent` is not an HTTPS structured string, uses later dictionary form, or is not included in `Signature-Input`.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-09-07.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-09-07.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-07.
- x402's README lists reference SDK packages for EVM, SVM, AVM, Aptos, Stellar, TVM, Hedera, Keeta, HTTP clients, HTTP frameworks, paywalls, extensions, and MCP.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-07.
- x402's README says payment schemes include `exact`, `upto`, and `batch-settlement`, with scheme specifications under `specs/schemes/`.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-09-07.
- x402 version 2 separates core types, scheme-and-network-specific logic, and transport-specific representation for HTTP, MCP, and A2A.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-07.
- x402 version 2 says HTTP carries the canonical `PaymentRequired` wire representation as a base64-encoded `PAYMENT-REQUIRED` response header.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-07.
- x402 version 2 defines a facilitator as a service that handles payment verification and blockchain settlement.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-07.
- x402 version 2 says its core data structures are independent of both transport mechanism and payment scheme.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-09-07.
- MDN says HTTP `402 Payment Required` is nonstandard, reserved for future use, and has no standard use convention.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-07.
- MDN says no browser supports a 402 and browsers display it as a generic `4xx` status code.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-09-07.
- RFC 9110 reserves `402 Payment Required` for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-09-07.

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
