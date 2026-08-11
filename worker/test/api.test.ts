import { describe, expect, it, vi } from "vitest";

import { handleFreeApiRequest } from "../src/api";
import type { MerchantService } from "../src/service";

describe("direct Merchant Context API", () => {
  it("calls the free resolver with a non-secret client id", async () => {
    const resolve = vi.fn().mockResolvedValue({
      status: "resolved",
      record: { cache: "hit" },
    });
    const response = await handleFreeApiRequest(
      request("/v1/resolve", {
        merchant_url: "https://merchant.example",
        client_id: "direct-http/test",
      }),
      { resolve } as unknown as MerchantService,
    );

    expect(response?.status).toBe(200);
    expect(resolve).toHaveBeenCalledWith("https://merchant.example", {
      clientId: "direct-http/test",
    });
  });

  it("does not trust a public internal client id", async () => {
    const resolve = vi.fn().mockResolvedValue({ status: "resolved" });
    await handleFreeApiRequest(
      request("/v1/resolve", {
        merchant_url: "https://merchant.example",
        client_id: "internal/spoofed",
      }),
      { resolve } as unknown as MerchantService,
    );

    expect(resolve).toHaveBeenCalledWith("https://merchant.example", {
      clientId: "internal/spoofed",
    });
  });

  it("keeps paid refresh outside the free route handler", async () => {
    const response = await handleFreeApiRequest(
      request("/v1/refresh", {
        merchant_url: "https://merchant.example",
        client_id: "direct-http/test",
      }),
      {} as MerchantService,
    );

    expect(response).toBeNull();
  });

  it("does not accept an unsigned completion beacon", async () => {
    const recordEvent = vi.fn();
    const recordCompletion = vi.fn();
    const response = await handleFreeApiRequest(
      request("/v1/events", {
        merchant_context_session: "a".repeat(30),
        event: "action_completed",
      }),
      { recordEvent, recordCompletion } as unknown as MerchantService,
    );

    expect(response?.status).toBe(400);
    expect(recordEvent).not.toHaveBeenCalled();
    expect(recordCompletion).not.toHaveBeenCalled();
  });
});

function request(path: string, body: unknown): Request {
  return new Request(`https://api.example${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
