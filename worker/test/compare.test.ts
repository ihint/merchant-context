import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { compare_offers } from "../src/compare";

const unknown = {
  state: "unknown",
  reason: "not published",
  evidence: [
    {
      url: "https://a.example/context",
      observed_at: "2026-08-11T00:00:00Z",
      expires_at: null,
      freshness: "fresh",
    },
  ],
};

function resolution(
  origin: string,
  status: "resolved" | "unknown",
  offerIds: string[],
): MerchantResolution {
  return {
    status,
    merchant: { origin },
    offers: offerIds.map((id) => ({ id, price: unknown })),
    record: {
      version: status === "resolved" ? "1" : "unknown",
      source_url: `${origin}/merchant-context.json`,
      observed_at: "2026-08-11T00:00:00Z",
      expires_at: "2026-08-12T00:00:00Z",
      stale: false,
    },
  } as unknown as MerchantResolution;
}

describe("compare_offers", () => {
  it("keeps unknowns and uses stable origin and offer tie-breaks", () => {
    const compared = compare_offers([
      resolution("https://a.example", "resolved", ["z", "a"]),
    ]);
    expect(compared.offers.map((item) => item.offer.id)).toEqual(["a", "z"]);
    expect(compared.offers[0].offer.price).toEqual(unknown);
  });

  it("lists a merchant with no record instead of dropping it", () => {
    const compared = compare_offers([
      resolution("https://b.example", "unknown", []),
      resolution("https://a.example", "resolved", ["a"]),
    ]);

    expect(compared.merchants).toEqual([
      expect.objectContaining({
        origin: "https://a.example",
        status: "resolved",
        offer_count: 1,
      }),
      expect.objectContaining({
        origin: "https://b.example",
        status: "unknown",
        offer_count: 0,
      }),
    ]);
    expect(compared.offers.map((item) => item.origin)).toEqual([
      "https://a.example",
    ]);
  });

  it("compares each origin once when two URLs share it", () => {
    const compared = compare_offers([
      resolution("https://a.example", "resolved", ["a"]),
      resolution("https://a.example", "resolved", ["a"]),
    ]);

    expect(compared.merchants).toHaveLength(1);
    expect(compared.offers).toHaveLength(1);
  });
});
