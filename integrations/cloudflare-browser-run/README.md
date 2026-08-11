# Cloudflare Browser Run + WebMCP reference

This reference shows how a Browser Run agent can check Merchant Context before it calls a page's WebMCP tool. It does not start a browser, spend Browser Run time, or deploy anything.

The adapter enforces this order:

1. Call `resolve_merchant` for the page origin.
2. Select a merchant-owned safe action from the resolution.
3. Ask a human to confirm a consequential action.
4. Put the action's signed `merchant_context_session` in the WebMCP input.
5. Call the named page tool.

`ready` permits a handoff. It does not mean approved, paid, in stock, or complete.

## Use

Pass small wrappers for the Merchant Context client, Browser Run page, and confirmation UI:

```js
import { runPreflightedWebMcpAction } from "./src/preflight-webmcp.mjs";

const result = await runPreflightedWebMcpAction({
  merchantOrigin: "https://shop.example",
  actionId: "add-to-cart",
  webMcpTool: "add_to_cart",
  input: { sku: "ABC", quantity: 1 },
  merchantContext: {
    resolveMerchant: (origin) =>
      mcp.callTool("resolve_merchant", { merchant: origin }),
  },
  browserPage: {
    callWebMcpTool: (name, input) => page.callWebMcpTool(name, input),
  },
  confirm: ({ action, input }) => showHumanConfirmation({ action, input }),
});
```

The host maps the selected safe action to a page tool with `webMcpTool`.

Merchant Context does not claim which WebMCP tool implements a merchant action.

Adapt `getActions` if your resolver returns actions through `get_safe_actions`.

Do not add `refresh_merchant` to the default tool set.

See `browser-run.policy.json` for the intended tool policy. Map that policy to the current Browser Run configuration surface when you install it; Cloudflare product APIs can change.
