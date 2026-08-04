import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPaymentObservation,
  createMerchantContextServer,
  paymentConfigFromEnv,
} from "../src/mcp";

describe("merchant context MCP server", () => {
  const closeCallbacks: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closeCallbacks.splice(0).map((close) => close()));
    vi.unstubAllGlobals();
  });

  it("advertises a free service record and a priced inspection tool", async () => {
    const server = createMerchantContextServer({
      network: "base-sepolia",
      recipient: "0x0000000000000000000000000000000000000001",
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    closeCallbacks.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "get_service_info",
      "inspect_merchant",
    ]);
    expect(result.tools[1]._meta).toMatchObject({
      "agents-x402/paymentRequired": true,
      "agents-x402/priceUSD": 0.01,
    });
    expect(result.tools[1].annotations).toMatchObject({
      readOnlyHint: true,
      openWorldHint: true,
    });
  });

  it("fails closed when payment settlement is not configured", () => {
    expect(() => paymentConfigFromEnv({})).toThrow(
      "X402_RECIPIENT must be a 20-byte EVM address",
    );
    expect(() =>
      paymentConfigFromEnv({
        X402_RECIPIENT: "0x0000000000000000000000000000000000000001",
        X402_NETWORK: "ethereum",
      }),
    ).toThrow("X402_NETWORK must be base or base-sepolia");
    expect(() =>
      paymentConfigFromEnv({
        X402_RECIPIENT: "0x0000000000000000000000000000000000000001",
        X402_NETWORK: "base",
      }),
    ).toThrow("CDP facilitator credentials are required for Base");
  });

  it("uses the authenticated CDP facilitator for Base mainnet", () => {
    const config = paymentConfigFromEnv({
      CDP_API_KEY_ID: "test-key-id",
      CDP_API_KEY_SECRET: "test-key-secret",
      X402_RECIPIENT: "0x0000000000000000000000000000000000000001",
      X402_NETWORK: "base",
    });

    expect(config.facilitator).toMatchObject({
      url: "https://api.cdp.coinbase.com/platform/v2/x402",
    });
    expect(config.facilitator?.createAuthHeaders).toBeTypeOf("function");
  });

  it("returns x402 payment terms before running the paid tool", async () => {
    const facilitatorFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          kinds: [
            {
              x402Version: 2,
              scheme: "exact",
              network: "eip155:84532",
              extra: {},
            },
          ],
          extensions: [],
          signers: {},
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", facilitatorFetch);
    const server = createMerchantContextServer({
      network: "base-sepolia",
      recipient: "0x0000000000000000000000000000000000000001",
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
    closeCallbacks.push(
      () => client.close(),
      () => server.close(),
    );

    const result = await client.callTool({
      name: "inspect_merchant",
      arguments: {
        merchant_url: "https://merchant.example",
        agent_id: "agent/test/1",
      },
    });

    expect(result.isError).toBe(true);
    expect(result._meta?.["x402/error"]).toMatchObject({
      x402Version: 2,
      error: "PAYMENT_REQUIRED",
      accepts: [
        {
          network: "eip155:84532",
          amount: "10000",
          payTo: "0x0000000000000000000000000000000000000001",
        },
      ],
    });
    expect(facilitatorFetch).toHaveBeenCalledWith(
      "https://x402.org/facilitator/supported",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("reduces a verified payment to non-secret usage identifiers", async () => {
    const payer = "0x1111111111111111111111111111111111111111";
    const token = btoa(
      JSON.stringify({
        x402Version: 2,
        accepted: { network: "eip155:8453" },
        payload: { authorization: { from: payer, nonce: "0xabc" } },
      }),
    );

    const observation = await buildPaymentObservation(token, {
      agentId: "agent/test/1",
      merchantOrigin: "https://merchant.example",
    });

    expect(observation).toMatchObject({
      merchantOrigin: "https://merchant.example",
      network: "eip155:8453",
    });
    expect(observation.agentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(observation.payerHash).toMatch(/^[a-f0-9]{64}$/);
    expect(observation.paymentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(observation)).not.toContain("agent/test/1");
    expect(JSON.stringify(observation)).not.toContain(payer);
    expect(JSON.stringify(observation)).not.toContain(token);
  });
});
