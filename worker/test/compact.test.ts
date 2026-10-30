import { describe, expect, it } from "vitest";

import {
  compactComparison,
  compactResolution,
  compactSearch,
  EVIDENCE_RULE,
} from "../src/compact";
import { compare_offers } from "../src/compare";
import type { MerchantResolution } from "../src/contracts";
import { resolveMerchant } from "../src/resolver";
import { search_merchants } from "../src/search";

const record = {
  version: "0.1",
  merchant: {
    name: "Merchant Example",
    canonical_url: "https://merchant.example",
  },
  offers: [
    {
      id: "offer-1",
      name: "Example offer",
      description: "A test offer",
      canonical_url: "https://merchant.example/offer",
      availability: "available",
      updated_at: "2026-08-03T20:00:00Z",
    },
  ],
  policies: [],
  actions: [],
  provenance: {
    generated_at: "2026-08-03T20:00:00Z",
    source_urls: ["https://merchant.example", "https://merchant.example/faq"],
  },
};

async function resolved(): Promise<MerchantResolution> {
  return resolveMerchant("https://merchant.example", {
    store: { get: async () => null, put: async () => undefined },
    sessionMinter: {
      mint: async () => ({
        token: "signed-session",
        expires_at: "2026-08-04T00:00:00Z",
        query_parameter: "merchant_context_session",
      }),
    },
    fetcher: async () => new Response(JSON.stringify(record)),
    now: () => new Date("2026-08-03T21:00:00Z"),
  });
}

// Puts record.evidence back on every sourced field that has none.
function expand(value: unknown, evidence: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => expand(item, evidence));
  if (value === null || typeof value !== "object") return value;
  const object = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, expand(item, evidence)]),
  );
  return "state" in object && !("evidence" in object)
    ? { ...object, evidence }
    : object;
}

describe("compact output", () => {
  it("lists shared evidence once and loses nothing", async () => {
    const full = await resolved();
    const compact = compactResolution(full);
    const { evidence, evidence_rule, ...compactRecord } =
      compact.record as typeof compact.record & {
        evidence: unknown;
        evidence_rule: string;
      };

    expect(evidence).toEqual(full.merchant.name.evidence);
    expect(evidence_rule).toBe(EVIDENCE_RULE);
    expect(compact.merchant.name).not.toHaveProperty("evidence");
    expect(compact.offers[0].price).not.toHaveProperty("evidence");
    expect(expand({ ...compact, record: compactRecord }, evidence)).toEqual(
      full,
    );
    expect(JSON.stringify(compact).length).toBeLessThan(
      JSON.stringify(full).length / 2,
    );
  });

  it("keeps a field's own evidence when it differs", async () => {
    const full = await resolved();
    const own = [
      {
        url: "https://merchant.example/price",
        observed_at: "2026-08-03T20:00:00Z",
        expires_at: null,
        freshness: "fresh" as const,
      },
    ];
    full.offers[0].price = { state: "unknown", reason: "x", evidence: own };

    const compact = compactResolution(full);

    expect(compact.offers[0].price).toEqual({
      state: "unknown",
      reason: "x",
      evidence: own,
    });
  });

  it("names matching offers by id instead of repeating them in search", async () => {
    const results = search_merchants([await resolved()], {
      item_or_service: "example",
    });

    const compact = compactSearch(results);

    expect(compact[0]).not.toHaveProperty("matching_offers");
    expect(compact[0].matching_offer_ids).toEqual(["offer-1"]);
  });

  it("puts shared evidence on each compared merchant once", async () => {
    const comparison = compare_offers([await resolved()]);

    const compact = compactComparison(comparison);

    expect(compact.merchants[0].record).toHaveProperty("evidence");
    expect(compact.offers[0].offer.name).not.toHaveProperty("evidence");
  });
});
