import OpenAI from "openai";

const client = new OpenAI();
const response = await client.responses.create({
  model: process.env.OPENAI_MODEL ?? "gpt-5",
  input: "Resolve https://merchant.atomandbits.com before relying on any merchant fact. Cite sources and freshness. Keep unknown facts unknown. Do not refresh or act.",
  tools: [{
    type: "mcp",
    server_label: "merchant_context",
    server_url: "https://api.merchant.atomandbits.com/mcp",
    allowed_tools: ["resolve_merchant", "search_merchants", "compare_offers", "get_safe_actions", "preflight"],
    require_approval: "never"
  }]
});

console.log(response.output_text);
