import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const model = process.env.CLAUDE_MODEL;
if (!model) throw new Error("Set CLAUDE_MODEL to a current supported model");
const message = await client.messages.create(
  {
    model,
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content:
          "Call resolve_merchant first for https://merchant.atomandbits.com. Cite sources and freshness. Do not call refresh_merchant or inspect_merchant. Do not act.",
      },
    ],
    mcp_servers: [
      {
        type: "url",
        name: "merchant-context",
        url: "https://api.merchant.atomandbits.com/mcp",
      },
    ],
    tools: [
      {
        type: "mcp_toolset",
        mcp_server_name: "merchant-context",
        default_config: { enabled: false },
        configs: {
          resolve_merchant: { enabled: true },
          search_merchants: { enabled: true },
          compare_offers: { enabled: true },
          get_safe_actions: { enabled: true },
          preflight: { enabled: true },
        },
      },
    ],
  },
  { headers: { "anthropic-beta": "mcp-client-2025-11-20" } },
);

console.log(JSON.stringify(message.content, null, 2));
