import { describe, expect, it } from "vitest";

import { handlePublicRequest } from "../src/http";

describe("public HTTP surface", () => {
  it("publishes an agent-readable service record", async () => {
    const response = handlePublicRequest(
      new Request(
        "https://merchant.atomandbits.com/.well-known/merchant-context",
      ),
    );

    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toContain("application/json");
    expect(response?.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response?.json()).resolves.toMatchObject({
      name: "Merchant Context",
      operator: "Atom & Bits",
      mcp: {
        transport: "streamable-http",
        url: "https://merchant.atomandbits.com/mcp",
      },
      http: {
        method: "POST",
        url: "https://merchant.atomandbits.com/v1/inspect",
        price_usd: 0.01,
        payment: "x402",
        network: "base",
      },
      tools: [
        { name: "get_service_info", price_usd: 0, payment: "none" },
        { name: "inspect_merchant", price_usd: 0.01, payment: "x402" },
      ],
    });
  });
});
