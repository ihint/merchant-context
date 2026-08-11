# Gemini CLI

Install the extension from this folder with `gemini extensions install ./extensions/gemini-cli`, then restart Gemini CLI. For direct MCP setup, merge `settings.json` into `~/.gemini/settings.json`. Both paths are untested.

Test: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: `resolve_merchant` runs first. The config excludes paid refresh aliases. The server receives tool names and inputs. Free resolution needs no approval. Paid refresh and consequential actions need explicit human approval.

Remove it with `gemini extensions uninstall merchant-context`, or remove the direct `mcpServers` entry, then restart Gemini CLI.
