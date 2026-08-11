# Gemini CLI

Install the extension from this folder:

```sh
gemini extensions install ./extensions/gemini-cli
```

The extension passed `gemini extensions validate`, install, connection, and removal checks with Gemini CLI 0.54.4 on 2026-08-11.

For direct MCP setup, run:

```sh
gemini mcp add merchant-context https://api.merchant.atomandbits.com/mcp --scope user --transport http --include-tools resolve_merchant,search_merchants,compare_offers,get_safe_actions,preflight
```

Run `gemini mcp list` to check the server.

`settings.json` contains the same direct setup.

Test: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: `resolve_merchant` runs first.

The config loads only the five free preflight tools.

The server receives tool names and public merchant inputs.

Free resolution needs no approval.

Paid refresh and consequential actions need explicit human approval.

Remove the extension with `gemini extensions uninstall merchant-context`.

Remove the direct setup with `gemini mcp remove merchant-context --scope user`.
