# Compatibility

Checked on 2026-08-11 against the contract and current official client formats.

| Surface              | Install format                                   | Status                                                                |
| -------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Streamable HTTP MCP  | Public `/mcp` URL                                | Preview tool list and free resolver passed                            |
| Direct HTTP          | JSON `POST` under `/v1`                          | Preview resolve, preflight, cache, and x402 terms passed              |
| OpenAI Responses API | Remote MCP tool with an allowlist                | Format checked; live call untested                                    |
| Codex                | Plugin manifest, MCP config, and skill           | Plugin install and removal passed with Codex CLI 0.146.0              |
| Claude API           | Messages API MCP connector                       | Format checked; live call untested                                    |
| Claude Code          | `.mcp.json` HTTP server                          | Preview connection and removal passed with Claude Code 2.1.227        |
| Cursor               | `.cursor/mcp.json` and install-link data         | Format checked; install untested                                      |
| Gemini CLI           | Extension manifest and direct MCP setup          | Extension and direct preview connection passed with Gemini CLI 0.54.4 |
| TypeScript           | Fetch-based client                               | Unit, tarball install, and preview preflight passed                   |
| Cloudflare bridge    | Service binding, Browser Run adapter, and WebMCP | Preview bridge and receipt flow passed; Browser Run tests passed      |
| Cloudflare OS        | Draft blueprint                                  | Draft only; no stable public install contract found                   |

“Format checked” means the files match the cited official format.

It does not mean the package has passed a live client test.

Treat each row marked untested as untested.

The OpenAI and Claude API model calls were not run because they can cost money.

The Cursor Add to Cursor flow still needs a graphical install test.

Cloudflare Browser Run was not started because it can cost money.

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

- [OpenAI remote MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [Codex plugins](https://developers.openai.com/plugins/build/plugins)
- [Anthropic MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector)
- [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
- [Gemini CLI extension reference](https://geminicli.com/docs/extensions/reference/)
