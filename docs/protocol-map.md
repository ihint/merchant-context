# Agentic Commerce Protocol Map

No single standard owns the full path from discovery to payment. Treat each layer as a separate claim.

| Need | Common system | What it covers | What it does not prove |
| --- | --- | --- | --- |
| Public web discovery | HTML, `robots.txt`, `sitemap.xml`, JSON-LD | Crawl access, page discovery, structured facts | Live stock, authority, or checkout support |
| Product discovery in ChatGPT | [Agentic Commerce Protocol](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol) | Product data and agent-to-business commerce flows | Support in every buyer agent |
| Google and Gemini commerce | [Universal Commerce Protocol](https://ucp.dev/) | Discovery, checkout, and post-purchase capability exchange | Automatic support outside participating channels |
| Search update notice | [IndexNow](https://www.indexnow.org/documentation) | Tells participating search engines that URLs changed | Ranking or indexing |
| General tool access | [Model Context Protocol](https://modelcontextprotocol.io/) | Typed tools and resources for AI clients | Commerce semantics or safe payment by itself |
| Agent-to-agent calls | [Agent2Agent Protocol](https://a2a-protocol.org/) | Agent discovery, tasks, and messages | Merchant catalog or checkout semantics by itself |
| Agent identity at the edge | [Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Signed HTTP messages for agent verification | Permission to buy or spend |
| Paid machine requests | HTTP 402 systems such as x402 or managed pay-per-use tools | Payment requirements for a request | Product fit, buyer consent, or order recovery |

## Terms

The standards use several terms for the same side of a transaction:

- **Buyer agent**, **shopping agent**, and **consumer agent** mean an agent acting for a buyer.
- **Merchant**, **business**, and **seller** mean the party offering the good or service.
- **Merchant agent** is useful product language, but it is not yet one fixed cross-protocol role.
- **Merchant of record** is a legal and payment role. Do not use it as a synonym for merchant agent.

## Implementation order

1. Publish correct facts on stable URLs.
2. Make the offer decision-ready.
3. Add one real action path.
4. Add the protocol required by the channel you are testing.
5. Add agent identity, scoped authority, logs, and recovery.

This order keeps a merchant useful while standards change.
