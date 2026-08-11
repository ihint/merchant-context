import { describe, expect, it } from "vitest";
import {
  isMerchantOwnedAction,
  normalizeMerchantRecord,
  stableEvidenceHash,
} from "../src/record";

export const publicRecord = {
  version: "0.1",
  merchant: { name: "Shop", canonical_url: "https://shop.example" },
  offers: [
    {
      id: "one",
      name: "One",
      description: "First",
      canonical_url: "https://shop.example/one",
      availability: "available",
      updated_at: "2026-08-10T12:00:00Z",
    },
  ],
  policies: [{ name: "Returns", url: "https://shop.example/returns" }],
  actions: [
    {
      name: "checkout",
      method: "POST",
      url: "https://shop.example/buy",
      human_confirmation_required: true,
    },
    {
      name: "contact",
      method: "GET",
      url: "https://other.example/contact",
      human_confirmation_required: false,
    },
  ],
  provenance: {
    generated_at: "2026-08-10T12:00:00Z",
    source_urls: ["https://shop.example/about"],
  },
} as const;

describe("merchant record normalization", () => {
  it("preserves evidence and unknown fields while rejecting foreign actions", async () => {
    const record = await normalizeMerchantRecord(publicRecord, {
      fetchedOrigin: "https://shop.example",
      observedAt: "2026-08-10T12:00:00Z",
      expiresAt: "2099-08-11T12:00:00Z",
    });
    expect(record.evidence.map((item) => item.url)).toEqual([
      "https://shop.example/about",
      "https://shop.example/merchant-context.json",
    ]);
    expect(record.offers[0].price.state).toBe("unknown");
    expect(record.actions).toHaveLength(1);
    expect(record.actions[0].url).toBe("https://shop.example/buy");
  });

  it("binds the canonical origin to the fetched origin", async () => {
    await expect(
      normalizeMerchantRecord(publicRecord, {
        fetchedOrigin: "https://other.example",
      }),
    ).rejects.toThrow("does not match");
  });

  it("hashes normalized objects independent of key insertion order", async () => {
    expect(await stableEvidenceHash({ b: 2, a: 1 })).toBe(
      await stableEvidenceHash({ a: 1, b: 2 }),
    );
    expect(
      isMerchantOwnedAction("https://shop.example/buy", [
        "https://shop.example",
      ]),
    ).toBe(true);
    expect(
      isMerchantOwnedAction("https://shop.example.evil.test/buy", [
        "https://shop.example",
      ]),
    ).toBe(false);
  });
});
