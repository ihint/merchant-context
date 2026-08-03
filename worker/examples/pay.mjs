import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { withX402Client } from "agents/x402";
import { privateKeyToAccount } from "viem/accounts";

const endpoint = requiredEnv("MERCHANT_CONTEXT_MCP_URL");
const merchantUrl = requiredEnv("MERCHANT_URL");
const agentId = requiredEnv("AGENT_ID");
const privateKey = requiredEnv("X402_CLIENT_PRIVATE_KEY");

if (process.env.ALLOW_X402_PAYMENT !== "yes") {
  throw new Error(
    "Set ALLOW_X402_PAYMENT=yes to approve one payment capped at $0.01",
  );
}

if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("X402_CLIENT_PRIVATE_KEY must be a 32-byte EVM private key");
}

const account = privateKeyToAccount(privateKey);
const client = withX402Client(
  new Client({ name: "merchant-context-example", version: "0.1.0" }),
  {
    account,
    network: "base",
    maxPaymentValue: 10_000n,
  },
);

try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const result = await client.callTool(null, {
    name: "inspect_merchant",
    arguments: {
      merchant_url: merchantUrl,
      agent_id: agentId,
    },
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await client.close();
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}
