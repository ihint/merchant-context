# Merchant Context Codex plugin

Install this folder through a local Codex marketplace, then restart Codex. The plugin adds the remote MCP server and the merchant preflight skill. The install path is untested.

Open `/plugins` in Codex CLI to install it from the configured marketplace. Then set this plugin-scoped policy in Codex config when your host supports it:

```toml
[plugins."merchant-context".mcp_servers.merchant-context]
enabled = true
default_tools_approval_mode = "prompt"
enabled_tools = ["resolve_merchant", "search_merchants", "compare_offers", "get_safe_actions", "preflight"]
```

Test: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: `resolve_merchant` runs first. No paid refresh or action runs.

The server receives the merchant URL and tool inputs. Free: `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight`. Paid and excluded by policy: `refresh_merchant` and `inspect_merchant`. Paid refresh and consequential actions need explicit human approval.

Remove the plugin through `/plugins` or delete its local marketplace entry, then restart Codex.
