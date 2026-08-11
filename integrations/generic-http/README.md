# Generic HTTP

Use `mcp.json` with any Streamable HTTP MCP client. Allow only `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight` when the client supports tool filters.

For direct HTTP, `resolve.sh` posts a public merchant URL to the free resolver. The direct route is untested live.

Test with `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.` Expected: sourced free resolution, no paid call, and no action.

The service receives the route or tool name and JSON input. Do not send private buyer data, payment data, credentials, or secrets. Paid refresh and consequential actions need explicit human approval.

Remove the MCP server entry from the host config. Direct HTTP has no installed state to remove.
