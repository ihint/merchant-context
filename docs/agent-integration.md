# Agent integration

Merchant Context exposes a Streamable HTTP MCP server and a direct HTTP API:

```text
https://api.merchant.atomandbits.com/mcp
https://api.merchant.atomandbits.com/v1
```

No API key is needed for the free tools.

## Default policy

Before relying on merchant facts or starting a merchant action, call `resolve_merchant`. Use `refresh_merchant` only when the requested freshness justifies its stated price. Require human approval before consequential actions.

Where a client supports an allowlist, enable only `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight`. Do not enable `refresh_merchant` or its first-release alias, `inspect_merchant`, by default.

## Test prompt

```text
Use Merchant Context to resolve https://merchant.atomandbits.com before relying on any merchant fact. Show each fact's source, observation time, and freshness. Keep unknown facts unknown. Do not call refresh_merchant or inspect_merchant. Do not start an action.
```

Expected result: the agent calls `resolve_merchant` first, returns sourced facts, marks stale and unknown facts, and makes no paid call or merchant action.

## Install packages

| Client                 | Package                                                                                                                 | Status                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| OpenAI Responses API   | [`integrations/openai`](../integrations/openai/)                                                                        | Format checked; live flow untested                  |
| Codex plugin and skill | [`plugins/merchant-context`](../plugins/merchant-context/) and [`skills/merchant-context`](../skills/merchant-context/) | Plugin install and removal passed                   |
| Claude Code            | [`integrations/claude`](../integrations/claude/)                                                                        | Preview connection and removal passed               |
| Claude API             | [`integrations/claude`](../integrations/claude/)                                                                        | Format checked; model call untested                 |
| Cursor                 | [`integrations/cursor`](../integrations/cursor/)                                                                        | Format checked; live flow untested                  |
| Gemini CLI             | [`extensions/gemini-cli`](../extensions/gemini-cli/)                                                                    | Extension and direct connection passed              |
| Generic MCP and HTTP   | [`integrations/generic-http`](../integrations/generic-http/)                                                            | Preview resolver and HTTP bridge passed             |
| TypeScript             | [`packages/typescript`](../packages/typescript/)                                                                        | Unit, tarball install, and preview preflight passed |

Each package states what it sends, which calls are free or paid, where approval applies, how to test it, and how to remove it.

## Compatibility check

From `worker`, run:

```sh
node scripts/compatibility.mjs
```

The check lists the live MCP tools and calls only the free `resolve_merchant` tool when it exists. It does not call a paid tool, settle a payment, start an action, or need a model API key.

See [`compatibility.md`](compatibility.md) for current status and [`server.json`](../server.json) for the MCP Registry record.
