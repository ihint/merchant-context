import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const message = await client.messages.create({
  model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
  max_tokens: 1200,
  messages: [{ role: "user", content: "Call resolve_merchant first for https://merchant.atomandbits.com. Cite sources and freshness. Do not call refresh_merchant or inspect_merchant. Do not act." }],
  mcp_servers: [{ type: "url", name: "merchant-context", url: "https://api.merchant.atomandbits.com/mcp" }]
}, { headers: { "anthropic-beta": "mcp-client-2025-04-04" } });

console.log(JSON.stringify(message.content, null, 2));
