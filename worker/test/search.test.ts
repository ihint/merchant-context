import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { search_merchants } from "../src/search";

const known = <T>(value: T) => ({
  state: "known" as const,
  value,
  evidence: [],
});
const record = (
  origin: string,
  name: string,
  amount: number,
): MerchantResolution =>
  ({
    status: "resolved",
    merchant: { origin, aliases: [] },
    supported_geography: known(["US"]),
    policies: [],
    actions: [],
    offers: [
      {
        id: "offer",
        name: known(name),
        description: known(""),
        geography: { state: "unknown", reason: "not stated", evidence: [] },
        price: known({ amount, currency: "USD" }),
        timing: known("today"),
      },
    ],
    record: { stale: false, observed_at: "2026-08-11T00:00:00Z" },
  }) as unknown as MerchantResolution;

describe("search_merchants", () => {
  it("filters sourced fields and uses an origin tie-break", () => {
    const found = search_merchants(
      [
        record("https://b.example", "Bike", 20),
        record("https://a.example", "Bike", 10),
      ],
      {
        item_or_service: "bike",
        geography: "US",
        maximum_price: { amount: 20, currency: "USD" },
        timing: "today",
      },
    );
    expect(found.map((item) => item.origin)).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
  });
});
