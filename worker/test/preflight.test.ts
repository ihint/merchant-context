import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { preflight } from "../src/preflight";

describe("preflight", () => {
  it("selects a matching action without changing its input", () => {
    const resolution = fixture();
    const result = preflight(
      resolution,
      { action_type: "checkout" },
      {
        allowed_authority: ["submit"],
        human_confirmation_available: true,
      },
    );
    expect(result.decision).toBe("needs_confirmation");
    expect(result.approval_required).toBe(true);
    expect(result.selected_safe_action?.id).toBe("buy");
    expect(resolution.selected_action).toBeNull();
  });

  it("blocks when required human confirmation is unavailable", () => {
    const result = preflight(
      fixture(),
      { action_type: "checkout" },
      { human_confirmation_available: false },
    );

    expect(result.decision).toBe("blocked");
    expect(result.approval_required).toBe(true);
  });

  it("requires confirmation and blocks stale evidence outside the limit", () => {
    const resolution = fixture();
    resolution.record.stale = true;
    resolution.record.expires_at = "2026-08-01T00:00:00Z";
    expect(
      preflight(resolution, {}, {}, new Date("2026-08-11T00:00:00Z")).decision,
    ).toBe("needs_confirmation");
    expect(
      preflight(
        resolution,
        {},
        { human_confirmation_available: true, max_stale_seconds: 1 },
        new Date("2026-08-11T00:00:00Z"),
      ).decision,
    ).toBe("blocked");
  });
});

function fixture(): MerchantResolution {
  const source = {
    url: "https://shop.example/merchant-context.json",
    observed_at: "2026-08-10T00:00:00Z",
    expires_at: "2099-01-01T00:00:00Z",
    freshness: "fresh" as const,
  };
  const unknown = <T>() => ({
    state: "unknown" as const,
    reason: "Not stated.",
    evidence: [],
  });
  return {
    contract_version: "2026-08-11",
    status: "resolved",
    merchant: {
      name: { state: "known", value: "Shop", evidence: [source] },
      legal_name: unknown<string>(),
      origin: "https://shop.example",
      aliases: [],
    },
    facts: [],
    offers: [],
    policies: [],
    supported_geography: unknown<string[]>(),
    actions: [
      {
        id: "buy",
        type: "checkout",
        method: "POST",
        url: "https://shop.example/buy",
        required_inputs: [],
        allowed_authority: "submit",
        human_confirmation_required: true,
        expires_at: "2099-01-01T00:00:00Z",
        idempotency: {
          supported: null,
          key_header: null,
          instructions: "Unknown.",
        },
        recovery: {
          url: "https://shop.example",
          instructions: "Contact merchant.",
        },
        attribution: {
          token: "token",
          expires_at: "2099-01-01T00:00:00Z",
          query_parameter: "merchant_context_session",
        },
      },
    ],
    selected_action: null,
    approval_required: false,
    next_steps: [],
    record: {
      version: "0.1",
      evidence_hash: "hash",
      source_url: source.url,
      observed_at: source.observed_at,
      expires_at: source.expires_at,
      stale: false,
      cache: "hit",
    },
  };
}
