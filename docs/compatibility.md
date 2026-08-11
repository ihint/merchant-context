# Compatibility

Checked on 2026-08-11 against the contract and current official client formats.

| Surface | Install format | Status |
| --- | --- | --- |
| Streamable HTTP MCP | Public `/mcp` URL | Harness added; live resolver untested |
| Direct HTTP | JSON `POST` under `/v1` | Client added; live resolver untested |
| OpenAI Responses API | Remote MCP tool with an allowlist | Format checked; live call untested |
| Codex | Plugin manifest, MCP config, and skill | Format checked; install untested |
| Claude API | Messages API MCP connector | Format checked; live call untested |
| Claude Code | `.mcp.json` HTTP server | Format checked; install untested |
| Cursor | `.cursor/mcp.json` and install-link data | Format checked; install untested |
| Gemini CLI | Extension manifest or `settings.json` | Format checked; install untested |
| TypeScript | Fetch-based client | Local tests added; package install untested |

“Format checked” means the files match the cited official format. It does not mean the package has passed a live client test. Treat all rows marked untested as untested.

## Safe live check

Run this from `worker`:

```sh
node scripts/compatibility.mjs
```

The script:

1. connects to the live Streamable HTTP endpoint;
2. lists tools;
3. checks for the five free default tools;
4. confirms paid refresh is outside the free default set; and
5. calls `resolve_merchant` only if the server offers it.

It never calls `refresh_merchant` or `inspect_merchant`. It exits with a non-zero status when the live server does not match the contract.

Override the targets without changing the script:

```sh
MERCHANT_CONTEXT_MCP_URL=https://example.test/mcp \
MERCHANT_CONTEXT_TEST_MERCHANT=https://merchant.atomandbits.com \
node scripts/compatibility.mjs
```

## Data and cost

The MCP server receives the tool name and tool input. The resolver input includes the public merchant HTTPS URL. Search, comparison, safe-action, and preflight calls also send the intent and constraints supplied by the caller. Do not put buyer data, payment data, credentials, or secrets in these fields.

`resolve_merchant` and `preflight` are free. `refresh_merchant` is paid. Its first-release alias, `inspect_merchant`, is also a paid path. A client must show the exact terms and get explicit human approval before it pays or calls a consequential merchant action.

## Sources

- [OpenAI remote MCP](https://platform.openai.com/docs/guides/tools-remote-mcp)
- [Codex plugins](https://developers.openai.com/plugins/build/plugins)
- [Anthropic MCP connector](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector)
- [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
- [Gemini CLI extension reference](https://geminicli.com/docs/extensions/reference/)
