import { describe, expect, it } from "vitest";
import type { CatalogResolution } from "../src/catalog";
import type { MerchantResolution } from "../src/contracts";
import { search_merchants } from "../src/search";
import { searchCurrentMerchants } from "../src/service";

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
    record: {
      stale: false,
      observed_at: "2026-08-11T00:00:00Z",
      expires_at: "2099-01-01T00:00:00Z",
    },
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

  it("recomputes catalog freshness and resolves attribution for the caller", async () => {
    const snapshot = record("https://shop.example", "Bike", 10);
    snapshot.record.expires_at = "2026-08-10T00:00:00Z";
    snapshot.record.stale = false;
    const current = record("https://shop.example", "Bike", 10);
    current.actions = [
      {
        id: "buy",
        type: "checkout",
        attribution: { token: "fresh-caller-token" },
      },
    ] as MerchantResolution["actions"];
    const resolve = async () => current;

    const found = await searchCurrentMerchants(
      [snapshot as unknown as CatalogResolution],
      { freshness: "any" },
      new Date("2026-08-11T00:00:00Z"),
      resolve,
    );

    expect(found[0].resolution.actions[0].attribution.token).toBe(
      "fresh-caller-token",
    );
    expect(
      await searchCurrentMerchants(
        [snapshot as unknown as CatalogResolution],
        { freshness: "fresh" },
        new Date("2026-08-11T00:00:00Z"),
        resolve,
      ),
    ).toEqual([]);
  });
});
