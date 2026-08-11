import OpenAI from "openai";

const client = new OpenAI();
const model = process.env.OPENAI_MODEL;
if (!model) throw new Error("Set OPENAI_MODEL to a current supported model");
const response = await client.responses.create({
  model,
  input:
    "Resolve https://merchant.atomandbits.com before relying on any merchant fact. Cite sources and freshness. Keep unknown facts unknown. Do not refresh or act.",
  tools: [
    {
      type: "mcp",
      server_label: "merchant_context",
      server_url: "https://api.merchant.atomandbits.com/mcp",
      allowed_tools: [
        "resolve_merchant",
        "search_merchants",
        "compare_offers",
        "get_safe_actions",
        "preflight",
      ],
      require_approval: "never",
    },
  ],
});

console.log(response.output_text);
