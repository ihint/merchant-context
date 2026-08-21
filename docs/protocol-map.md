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
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/) | Discovery, catalog search and lookup, cart building, identity linking, checkout, order management, native checkout, embedded checkout, post-purchase capability exchange, REST and JSON-RPC transports, and built-in AP2, A2A, and MCP support | Automatic support outside participating platforms, agents, and businesses |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Notifies participating search engines that URLs were added, updated, or deleted | Ranking, indexing, or proof that a submitted URL was crawled |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-06-18) | Typed tools, resources, prompts, transport, and authorization patterns for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/latest/) | Agent discovery, agent-to-agent task delegation, message exchange, and collaboration across agent frameworks | Merchant catalog or checkout semantics by itself |
| Cloudflare agent runtime | [Cloudflare Agents](https://developers.cloudflare.com/agents/) and [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/) | Hosted stateful agents, Workers-based runtime, browser, sandbox, AI Search, MCP tools, payments tools, remote MCP servers, OAuth, and Streamable HTTP guidance | Merchant Context support, ACP support, UCP support, or a passing integration for this repo |
| Agent identity at the edge | [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for verified bots and agents using Cloudflare's Web Bot Auth implementation, key directories, `Signature-Agent`, and experimental transitive-trust forwarding | Permission to buy, spend, bypass policy, or identify the end user |
| Paid machine requests | HTTP 402 systems such as [x402](https://github.com/x402-foundation/x402) | Payment requirements, payment payloads, payment schemes, transport representations, verification, settlement, and pay-per-request flows | Product fit, buyer consent, order recovery, or browser-native payment behavior |
| HTTP status semantics | [RFC 9110 section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) and [MDN 402](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402) | The `402 Payment Required` status code is reserved but not defined by HTTP semantics | A standard payment payload format or browser-native payment UI |

## Source checks

Checked 2026-08-21.

- ACP is an interaction model and open standard for connecting buyers, AI agents, and businesses to complete purchases.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-21.
- ACP is maintained by OpenAI and Stripe and is currently in beta.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-21.
- ACP lists `2026-04-17` as the latest stable OpenAPI, JSON Schema, and examples snapshot.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-21.
- ACP's `2026-04-17` snapshot covers cart, feed, orders, authentication, and MCP.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-21.
- ACP has an `unreleased` changelog directory for current development entries.
  Source: https://api.github.com/repos/agentic-commerce-protocol/agentic-commerce-protocol/contents/changelog
  Checked: 2026-08-21.
- ACP says OpenAI and Stripe have first implemented it with production-ready reference implementations.
  Source: https://github.com/agentic-commerce-protocol/agentic-commerce-protocol
  Checked: 2026-08-21.
- UCP describes itself as a common language for platforms, agents, and businesses.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- UCP states that it provides building blocks for agentic commerce from discovery to checkout and beyond.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- UCP says it is built on REST and JSON-RPC transports.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- UCP says AP2, A2A, and MCP support are built in.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- UCP states that it supports catalog search and lookup, cart building, identity linking, checkout, and order management.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- UCP is expanding to lodging and food, with detailed specifications coming soon.
  Source: https://ucp.dev/
  Checked: 2026-08-21.
- IndexNow accepts a single changed URL by query string.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-21.
- IndexNow accepts up to 10,000 URLs per POST.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-21.
- IndexNow says an HTTP 200 response only indicates that a search engine received the URL or URL set.
  Source: https://www.indexnow.org/documentation
  Checked: 2026-08-21.
- Schema.org `Offer` defines an offer to transfer rights to an item or provide a service.
  Source: https://schema.org/Offer
  Checked: 2026-08-21.
- Schema.org `Offer` includes `availability`.
  Source: https://schema.org/Offer
  Checked: 2026-08-21.
- Schema.org `Offer` includes `itemOffered`.
  Source: https://schema.org/Offer
  Checked: 2026-08-21.
- Schema.org `Offer` includes `hasMerchantReturnPolicy`.
  Source: https://schema.org/Offer
  Checked: 2026-08-21.
- Schema.org `MerchantReturnPolicy` provides return-policy information associated with an Organization, Product, or Offer.
  Source: https://schema.org/MerchantReturnPolicy
  Checked: 2026-08-21.
- MCP specification `2025-06-18` states that the TypeScript schema is the source of truth for the protocol.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-21.
- MCP provides a standardized way to connect LLM applications with external data sources and tools.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-21.
- MCP capabilities include sharing contextual information, exposing tools, and building composable integrations and workflows.
  Source: https://modelcontextprotocol.io/specification/2025-06-18
  Checked: 2026-08-21.
- A2A describes itself as an open standard that allows different AI agents to securely communicate, collaborate, and solve complex problems together.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-21.
- A2A says it is for agent-to-agent communication and is not a replacement for MCP.
  Source: https://a2a-protocol.org/latest/
  Checked: 2026-08-21.
- Cloudflare Agents docs describe a Cloudflare-hosted agent runtime with Browser, Sandbox, AI Search, MCP, Payments, and other MCP tools.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-08-21.
- Cloudflare Agents docs say each hosted agent session has durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution.
  Source: https://developers.cloudflare.com/agents/
  Checked: 2026-08-21.
- Cloudflare remote MCP docs say remote MCP clients use Streamable HTTP and OAuth.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-08-21.
- Cloudflare remote MCP docs recommend focused tools, scoped permissions, detailed tool descriptions, and evaluation tests.
  Source: https://developers.cloudflare.com/agents/model-context-protocol/
  Checked: 2026-08-21.
- Cloudflare Web Bot Auth verifies bot identity with cryptographic HTTP message signatures.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- Cloudflare Web Bot Auth requires a key directory at `/.well-known/http-message-signatures-directory`.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- Cloudflare Web Bot Auth requires signed bot requests to include `Signature-Agent`, `Signature-Input`, and `Signature` headers after verification.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- Cloudflare Web Bot Auth says nonce validation is not currently performed by Cloudflare.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- Cloudflare's transitive-trust and `Forwarded` header handling for Web Bot Auth is experimental and may change.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- Cloudflare says its Web Bot Auth implementation does not support every component and parameter defined in RFC 9421.
  Source: https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
  Checked: 2026-08-21.
- x402 moved from `coinbase/x402` to `x402-foundation/x402`, with `coinbase/x402` now a development fork.
  Source: https://github.com/coinbase/x402
  Checked: 2026-08-21.
- x402 describes itself as an open standard for internet-native payments across crypto and fiat forms of value.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-21.
- x402 protocol version 2 separates protocol types, payment logic, and transport representation.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-21.
- x402 protocol version 2 says representation depends on transports such as HTTP, MCP, and A2A.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-21.
- x402 protocol version 2 defines the `PaymentRequired`, `PaymentPayload`, and `SettlementResponse` schemas.
  Source: https://raw.githubusercontent.com/x402-foundation/x402/main/specs/x402-specification-v2.md
  Checked: 2026-08-21.
- x402's HTTP flow uses `402 Payment Required`, a base64 `PAYMENT-REQUIRED` header, a `PAYMENT-SIGNATURE` header, `/verify`, `/settle`, and a `PAYMENT-RESPONSE` header.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-21.
- x402 currently documents `exact`, `upto`, and `batch-settlement` payment schemes.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-21.
- x402 says production mainnet routes should explicitly choose a facilitator model and should not assume the public x402.org facilitator is the default production path.
  Source: https://github.com/x402-foundation/x402
  Checked: 2026-08-21.
- RFC 9110 says the `402 Payment Required` status code is reserved for future use.
  Source: https://httpwg.org/specs/rfc9110.html#status.402
  Checked: 2026-08-21.
- MDN says HTTP `402 Payment Required` is nonstandard and reserved for future use.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-08-21.
- MDN says `402 Payment Required` is reserved but not defined and that implementations vary in response format and contents.
  Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402
  Checked: 2026-08-21.

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
