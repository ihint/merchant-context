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
        free: {
          resolve: {
            method: "POST",
            url: "https://merchant.atomandbits.com/v1/resolve",
          },
        },
        paid_refresh: {
          method: "POST",
          url: "https://merchant.atomandbits.com/v1/refresh",
          price_usd: 0.01,
          payment: "x402",
          network: "base",
          approval_required: true,
        },
      },
      ucp: {
        profile_url: "https://merchant.atomandbits.com/.well-known/ucp",
        version: "2026-04-08",
        capabilities: [],
      },
      tools: [
        { name: "resolve_merchant", price_usd: 0, payment: "none" },
        { name: "search_merchants", price_usd: 0, payment: "none" },
        { name: "compare_offers", price_usd: 0, payment: "none" },
        { name: "get_safe_actions", price_usd: 0, payment: "none" },
        { name: "preflight", price_usd: 0, payment: "none" },
        {
          name: "check_merchant",
          price_usd: 0,
          payment: "none",
          role: "diagnostic",
        },
        {
          name: "refresh_merchant",
          price_usd: 0.01,
          payment: "x402",
          approval_required: true,
        },
        {
          name: "inspect_merchant",
          price_usd: 0.01,
          payment: "x402",
          approval_required: true,
          role: "compatibility_alias",
        },
      ],
    });
  });
});
