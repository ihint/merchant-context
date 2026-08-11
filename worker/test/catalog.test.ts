import { describe, expect, it } from "vitest";
import type { MerchantResolution } from "../src/contracts";
import { MemoryCatalog, normalizeOrigin } from "../src/catalog";

describe("catalog", () => {
  it("normalizes keys and lists them in stable order", async () => {
    const make = (origin: string) => ({ merchant: { origin } }) as unknown as MerchantResolution;
    const catalog = new MemoryCatalog([make("https://b.example/path"), make("https://a.example")]);
    expect((await catalog.list()).map((item) => item.merchant.origin)).toEqual(["https://a.example", "https://b.example"]);
    expect(await catalog.get("https://B.EXAMPLE/other")).not.toBeNull();
  });

  it("rejects non-HTTPS origins", () => {
    expect(() => normalizeOrigin("http://shop.example")).toThrow();
  });
});
