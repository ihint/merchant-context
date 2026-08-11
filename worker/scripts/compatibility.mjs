import { pathToFileURL } from "node:url";

export const FREE_TOOLS = [
  "resolve_merchant",
  "search_merchants",
  "compare_offers",
  "get_safe_actions",
  "preflight",
];
export const PAID_TOOLS = ["refresh_merchant", "inspect_merchant"];

export async function checkCompatibility({
  endpoint,
  merchantUrl,
  clientFactory = defaultClientFactory,
}) {
  const { client, close } = await clientFactory(endpoint);
  try {
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name);
    const missing = FREE_TOOLS.filter((name) => !names.includes(name));
    const resolver = listed.tools.find(
      (tool) => tool.name === "resolve_merchant",
    );
    let resolution = null;
    if (resolver) {
      resolution = await client.callTool({
        name: "resolve_merchant",
        arguments: resolverArguments(resolver.inputSchema, merchantUrl),
      });
      assertResolverShape(resolution);
    }
    return {
      endpoint,
      tools: names,
      missing,
      paidToolsPresent: PAID_TOOLS.filter((name) => names.includes(name)),
      resolutionChecked: Boolean(resolver),
    };
  } finally {
    await close();
  }
}

export function resolverArguments(schema, merchantUrl) {
  const properties = schema?.properties ?? {};
  const client = "internal/compatibility";
  if ("merchant_url" in properties)
    return {
      merchant_url: merchantUrl,
      ...(properties.client_id ? { client_id: client } : {}),
    };
  if ("merchant" in properties) return { merchant: merchantUrl };
  if ("origin" in properties) return { origin: merchantUrl };
  if ("url" in properties) return { url: merchantUrl };
  throw new Error("resolve_merchant has no recognized merchant URL input");
}

export function assertResolverShape(result) {
  if (result?.isError)
    throw new Error("resolve_merchant returned an MCP error");
  const structured = result?.structuredContent;
  const text = result?.content?.find((item) => item.type === "text")?.text;
  let value = structured;
  if (!value && text) {
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error("resolve_merchant did not return JSON");
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("resolve_merchant returned no object");
  const hasIdentity = [
    "origin",
    "merchant",
    "merchant_origin",
    "resolution",
    "record",
  ].some((key) => key in value);
  if (!hasIdentity)
    throw new Error(
      "resolve_merchant result has no merchant identity or resolution",
    );
}

async function defaultClientFactory(endpoint) {
  const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all([
    import("@modelcontextprotocol/sdk/client/index.js"),
    import("@modelcontextprotocol/sdk/client/streamableHttp.js"),
  ]);
  const client = new Client({
    name: "merchant-context-compatibility",
    version: "0.1.0",
  });
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  return { client, close: () => client.close() };
}

async function main() {
  const endpoint =
    process.env.MERCHANT_CONTEXT_MCP_URL ??
    "https://api.merchant.atomandbits.com/mcp";
  const merchantUrl =
    process.env.MERCHANT_CONTEXT_TEST_MERCHANT ??
    "https://merchant.atomandbits.com";
  const report = await checkCompatibility({ endpoint, merchantUrl });
  console.log(JSON.stringify(report, null, 2));
  if (report.missing.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
