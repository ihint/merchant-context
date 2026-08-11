import { describe, expect, it } from "vitest";
import type { MerchantResolution, SafeAction } from "../src/contracts";
import { get_safe_actions } from "../src/safe-actions";

const action = (url: string): SafeAction => ({
  id: url,
  type: "checkout",
  method: "GET",
  url,
  required_inputs: [],
  allowed_authority: "navigate",
  human_confirmation_required: true,
  expires_at: "2026-08-13T00:00:00Z",
  idempotency: { supported: null, key_header: null, instructions: "Unknown" },
  recovery: {
    url: "https://shop.example/help",
    instructions: "Return to the shop",
  },
  attribution: {
    token: "opaque",
    expires_at: "2026-08-12T00:00:00Z",
    query_parameter: "merchant_context_session",
  },
});

describe("get_safe_actions", () => {
  it("rejects off-origin action URLs", () => {
    const resolution = {
      merchant: { origin: "https://shop.example", aliases: [] },
      actions: [
        action("https://shop.example/buy"),
        action("https://evil.example/buy"),
      ],
    } as unknown as MerchantResolution;
    const result = get_safe_actions(resolution, {
      now: "2026-08-11T00:00:00Z",
    });
    expect(result.actions).toHaveLength(1);
    expect(result.rejected[0].reason).toContain("not owned");
  });
});
