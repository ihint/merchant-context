# Claude API and Claude Code

For Claude Code, copy `.mcp.json` to the project root or run:

```sh
claude mcp add --transport http --scope user merchant-context https://api.merchant.atomandbits.com/mcp
```

Run `claude mcp get merchant-context` to check it. Remove it with `claude mcp remove --scope user merchant-context`, or delete the JSON entry.

For the Claude API, install the current `@anthropic-ai/sdk`, set `ANTHROPIC_API_KEY` and `CLAUDE_MODEL`, and run `node messages.mjs`.

The MCP toolset disables every tool by default, then enables the five free tools.

The API example is untested live because a model call can cost money.

Test: `Call resolve_merchant first for https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: free resolution first, no paid call, and no action. Claude receives the prompt. Merchant Context receives MCP tool names and inputs. Paid refresh and consequential actions need explicit human approval.
