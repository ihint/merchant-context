import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { MemoryCatalog, normalizeOrigin } from "../src/catalog";

describe("catalog", () => {
  it("normalizes keys and lists them in stable order", async () => {
    const make = (origin: string) =>
      ({ merchant: { origin }, actions: [] }) as unknown as MerchantResolution;
    const catalog = new MemoryCatalog([
      make("https://b.example/path"),
      make("https://a.example"),
    ]);
    expect((await catalog.list()).map((item) => item.merchant.origin)).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(await catalog.get("https://B.EXAMPLE/other")).not.toBeNull();
  });

  it("rejects non-HTTPS origins", () => {
    expect(() => normalizeOrigin("http://shop.example")).toThrow();
  });

  it("does not store client attribution sessions", async () => {
    const resolution = {
      merchant: { origin: "https://shop.example" },
      actions: [
        {
          id: "buy",
          attribution: { token: "client-bound-token" },
        },
      ],
    } as unknown as MerchantResolution;
    const catalog = new MemoryCatalog([resolution]);

    expect((await catalog.get("https://shop.example"))?.actions[0]).toEqual({
      id: "buy",
    });
  });
});
