import { decodePaymentRequiredHeader } from "@x402/core/http";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("agents/mcp", () => ({
  McpAgent: class {
    static serve() {
      return { fetch: vi.fn() };
    }
  },
}));

import worker, { type Env } from "../src/index";

describe("Worker HTTP routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serves the paid inspection challenge on the public HTTP route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
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
      ),
    );
    const env = {
      MerchantContextMcp: {} as Env["MerchantContextMcp"],
      RATE_LIMITER: {
        limit: vi.fn().mockResolvedValue({ success: true }),
      } as unknown as RateLimit,
      USAGE_DB: {} as D1Database,
      X402_NETWORK: "base-sepolia",
      X402_RECIPIENT: "0x0000000000000000000000000000000000000001",
    } satisfies Env;
    const context = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      props: {},
    } as unknown as ExecutionContext;

    const response = await worker.fetch(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchant_url: "https://merchant.example",
          agent_id: "agent/test/1",
        }),
      }),
      env,
      context,
    );

    expect(response.status).toBe(402);
    expect(
      decodePaymentRequiredHeader(response.headers.get("payment-required")!),
    ).toMatchObject({
      accepts: [
        {
          amount: "10000",
          network: "eip155:84532",
          payTo: "0x0000000000000000000000000000000000000001",
        },
      ],
    });
  });
});
