import assert from "node:assert/strict";
import { test } from "vitest";
import {
  checkCompatibility,
  resolverArguments,
} from "../scripts/compatibility.mjs";

test("compatibility check calls only the free resolver", async () => {
  const calls = [];
  const tools = [
    "resolve_merchant",
    "search_merchants",
    "compare_offers",
    "get_safe_actions",
    "preflight",
    "refresh_merchant",
  ];
  const report = await checkCompatibility({
    endpoint: "https://example.test/mcp",
    merchantUrl: "https://shop.test",
    clientFactory: async () => ({
      client: {
        listTools: async () => ({
          tools: tools.map((name) => ({
            name,
            inputSchema:
              name === "resolve_merchant"
                ? { properties: { merchant_url: {}, client_id: {} } }
                : {},
          })),
        }),
        callTool: async (call) => {
          calls.push(call);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  origin: "https://shop.test",
                  evidence: [],
                }),
              },
            ],
          };
        },
      },
      close: async () => {},
    }),
  });
  assert.deepEqual(calls, [
    {
      name: "resolve_merchant",
      arguments: {
        merchant_url: "https://shop.test",
        client_id: "internal/compatibility",
      },
    },
  ]);
  assert.deepEqual(report.missing, []);
  assert.deepEqual(report.paidToolsPresent, ["refresh_merchant"]);
});

test("resolver argument follows the advertised schema", () => {
  assert.deepEqual(
    resolverArguments({ properties: { origin: {} } }, "https://shop.test"),
    { origin: "https://shop.test" },
  );
});
