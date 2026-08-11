import { describe, expect, it, vi } from "vitest";
import {
  normalizeMerchantRecord,
  type NormalizedMerchantRecord,
} from "../src/record";
import { resolveMerchant } from "../src/resolver";

const publicRecord = {
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
  policies: [],
  actions: [
    {
      name: "checkout",
      method: "POST",
      url: "https://shop.example/buy",
      human_confirmation_required: true,
    },
  ],
  provenance: {
    generated_at: "2026-08-10T12:00:00Z",
    source_urls: ["https://shop.example/about"],
  },
} as const;

const minter = {
  mint: vi.fn(async () => ({
    token: "token",
    expires_at: "2099-01-01T00:00:00Z",
    query_parameter: "merchant_context_session" as const,
  })),
};

describe("resolveMerchant", () => {
  it.each(["hit", "stale_hit"] as const)(
    "uses a %s without fetching",
    async (kind) => {
      const record = await normalized(
        kind === "stale_hit" ? "2026-01-01T00:00:00Z" : "2099-01-01T00:00:00Z",
      );
      const fetcher = vi.fn<typeof fetch>();
      const result = await resolveMerchant("https://shop.example/path", {
        store: { get: vi.fn(async () => record), put: vi.fn() },
        sessionMinter: minter,
        fetcher,
        now: () => new Date("2026-08-11T00:00:00Z"),
      });
      expect(result.record.cache).toBe(kind);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("fetches only the free public record on a miss and caches it", async () => {
    const put = vi.fn();
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(publicRecord), { status: 200 }),
    );
    const result = await resolveMerchant("https://shop.example", {
      store: { get: vi.fn(async () => null), put },
      sessionMinter: minter,
      fetcher,
      now: () => new Date("2026-08-11T00:00:00Z"),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://shop.example/merchant-context.json",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
    expect(put).toHaveBeenCalledOnce();
    expect(result.record.cache).toBe("miss");
    expect(result.record.observed_at).toBe("2026-08-10T12:00:00Z");
  });
});

async function normalized(
  expiresAt: string,
): Promise<NormalizedMerchantRecord> {
  return normalizeMerchantRecord(publicRecord, {
    fetchedOrigin: "https://shop.example",
    observedAt: "2026-08-10T00:00:00Z",
    expiresAt,
  });
}
