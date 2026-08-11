import test from "node:test";
import assert from "node:assert/strict";
import {
  PreflightError,
  runPreflightedWebMcpAction,
} from "../src/preflight-webmcp.mjs";

function fixture(overrides = {}) {
  const calls = [];
  const action = {
    id: "buy",
    url: "https://shop.example/buy",
    allowed_authority: "submit",
    human_confirmation_required: true,
    expires_at: "2099-01-01T00:00:00Z",
    attribution: { token: "signed-session" },
    ...overrides,
  };
  return {
    calls,
    options: {
      merchantOrigin: "https://shop.example",
      actionId: "buy",
      webMcpTool: "buy_product",
      input: { sku: "A1" },
      merchantContext: {
        resolveMerchant: async () => (
          calls.push("resolve"),
          { merchant: { aliases: [] }, actions: [action] }
        ),
      },
      confirm: async () => (calls.push("confirm"), true),
      browserPage: {
        callWebMcpTool: async (name, input) => (
          calls.push("page"),
          { name, input }
        ),
      },
    },
  };
}

test("resolves, confirms, then forwards the session to WebMCP", async () => {
  const { calls, options } = fixture();
  const result = await runPreflightedWebMcpAction(options);
  assert.deepEqual(calls, ["resolve", "confirm", "page"]);
  assert.deepEqual(result, {
    name: "buy_product",
    input: { sku: "A1", merchant_context_session: "signed-session" },
  });
});

test("does not call the page when a human declines", async () => {
  const { calls, options } = fixture();
  options.confirm = async () => (calls.push("confirm"), false);
  await assert.rejects(runPreflightedWebMcpAction(options), PreflightError);
  assert.deepEqual(calls, ["resolve", "confirm"]);
});

test("rejects an action on an undeclared origin", async () => {
  const { calls, options } = fixture({ url: "https://other.example/buy" });
  await assert.rejects(
    runPreflightedWebMcpAction(options),
    /not merchant-owned/,
  );
  assert.deepEqual(calls, ["resolve"]);
});

test("rejects a missing attribution session before page work", async () => {
  const { calls, options } = fixture({ attribution: { token: "" } });
  await assert.rejects(
    runPreflightedWebMcpAction(options),
    /no merchant_context_session/,
  );
  assert.deepEqual(calls, ["resolve"]);
});
