import { describe, expect, it } from "vitest";

import {
  parseWranglerConfig,
  productionInputs,
  verifyEndpointWithRetry,
  withProductionBindings,
} from "../scripts/deploy.mjs";

describe("production deploy guard", () => {
  it("reads Wrangler JSONC with trailing commas", () => {
    expect(
      parseWranglerConfig('{"vars":{"TRAFFIC_PROVENANCE":"outside",},}'),
    ).toEqual({ vars: { TRAFFIC_PROVENANCE: "outside" } });
  });

  it("requires the exact deploy approval and a valid nonzero Base address", () => {
    expect(() => productionInputs({})).toThrow(
      "Set ALLOW_PRODUCTION_DEPLOY=merchant-context",
    );

    expect(() =>
      productionInputs({
        ALLOW_PRODUCTION_DEPLOY: "merchant-context",
        X402_RECIPIENT: "0x0",
      }),
    ).toThrow("X402_RECIPIENT must be a public 20-byte EVM address");

    expect(
      productionInputs({
        ALLOW_PRODUCTION_DEPLOY: "merchant-context",
        X402_RECIPIENT: `0x${"a".repeat(40)}`,
      }),
    ).toEqual({ recipient: `0x${"a".repeat(40)}` });
  });

  it("refuses to run while a client private key is present", () => {
    expect(() =>
      productionInputs({
        ALLOW_PRODUCTION_DEPLOY: "merchant-context",
        X402_CLIENT_PRIVATE_KEY: `0x${"b".repeat(64)}`,
        X402_RECIPIENT: `0x${"a".repeat(40)}`,
      }),
    ).toThrow("Unset X402_CLIENT_PRIVATE_KEY before deploying");
  });

  it("adds reproducible mainnet and D1 settings without changing other bindings", () => {
    const config = {
      name: "merchant-context-mcp",
      vars: { EXISTING: "kept", X402_NETWORK: "base" },
      durable_objects: { bindings: [{ name: "MerchantContextMcp" }] },
    };

    expect(
      withProductionBindings(config, {
        databaseId: "database-id",
        recipient: `0x${"a".repeat(40)}`,
      }),
    ).toMatchObject({
      vars: {
        EXISTING: "kept",
        X402_NETWORK: "base",
        X402_RECIPIENT: `0x${"a".repeat(40)}`,
      },
      durable_objects: { bindings: [{ name: "MerchantContextMcp" }] },
      d1_databases: [
        {
          binding: "USAGE_DB",
          database_id: "database-id",
          database_name: "merchant-context-usage",
          migrations_dir: "migrations",
        },
      ],
    });
  });

  it("allows enough time for a new Worker route to become live", async () => {
    let attempts = 0;

    await verifyEndpointWithRetry(new URL("https://example.com"), {
      attempts: 10,
      delayMs: 0,
      verify: async () => {
        attempts += 1;

        if (attempts < 6) {
          throw new Error("not live yet");
        }
      },
    });

    expect(attempts).toBe(6);
  });
});
