import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = new URL(
  process.env.MERCHANT_CONTEXT_MCP_URL ??
    "https://api.merchant.atomandbits.com/mcp",
);
const merchantUrl =
  process.env.MERCHANT_URL ?? "https://merchant.atomandbits.com";
const expectedTools = [
  "get_service_info",
  "check_merchant",
  "inspect_merchant",
];

const client = new Client({
  name: "merchant-context-public-smoke",
  version: "1.0.0",
});

try {
  await client.connect(new StreamableHTTPClientTransport(endpoint));

  const listed = await client.listTools();
  const toolNames = listed.tools.map((tool) => tool.name);

  if (JSON.stringify(toolNames) !== JSON.stringify(expectedTools)) {
    throw new Error(`Unexpected tools: ${toolNames.join(", ")}`);
  }

  const result = await client.callTool({
    name: "check_merchant",
    arguments: { merchant_url: merchantUrl },
  });
  const content = result.content;

  if (!Array.isArray(content) || content[0]?.type !== "text") {
    throw new Error("Free check returned no text result");
  }

  const report = JSON.parse(content[0].text);

  if (
    report.origin !== new URL(merchantUrl).origin ||
    typeof report.summary?.score !== "number" ||
    !Array.isArray(report.checks) ||
    report.checks.length !== 6
  ) {
    throw new Error("Free check returned an invalid report");
  }

  console.log(
    JSON.stringify({
      endpoint: endpoint.origin + endpoint.pathname,
      merchant: report.origin,
      score: report.summary.score,
      tools: toolNames,
    }),
  );
} finally {
  await client.close();
}
