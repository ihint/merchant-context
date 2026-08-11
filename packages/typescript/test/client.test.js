import assert from "node:assert/strict";
import test from "node:test";
import { MerchantPreflightClient } from "../src/index.js";

test("resolve sends the free resolver shape", async () => {
  let request;
  const client = new MerchantPreflightClient({ baseUrl: "https://example.test/v1/", fetch: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ origin: "https://shop.test" }), { status: 200 });
  }});
  await client.resolveMerchant("https://shop.test");
  assert.equal(request.url, "https://example.test/v1/resolve");
  assert.deepEqual(JSON.parse(request.init.body), { merchant_url: "https://shop.test" });
});

test("refresh cannot spend without explicit approval", async () => {
  const client = new MerchantPreflightClient({ fetch: async () => { throw new Error("must not fetch"); } });
  await assert.rejects(client.refreshMerchant("https://shop.test"), /approved: true/);
});
