import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { compare_offers } from "../src/compare";

describe("compare_offers", () => {
  it("keeps unknowns and uses stable origin and offer tie-breaks", () => {
    const unknown = { state: "unknown", reason: "not published", evidence: [{ url: "https://a.example/context", observed_at: "2026-08-11T00:00:00Z", expires_at: null, freshness: "fresh" }] };
    const resolution = {
      merchant: { origin: "https://a.example" },
      offers: [{ id: "z", price: unknown }, { id: "a", price: unknown }],
      record: { version: "1", source_url: "https://a.example/context", observed_at: "2026-08-11T00:00:00Z", expires_at: "2026-08-12T00:00:00Z", stale: false },
    } as unknown as MerchantResolution;
    const compared = compare_offers([resolution]);
    expect(compared.map((item) => item.offer.id)).toEqual(["a", "z"]);
    expect(compared[0].offer.price).toEqual(unknown);
  });
});
