# Cursor

Copy `mcp.json` to `.cursor/mcp.json`, approve the server in Cursor settings, and open a new chat. `add-to-cursor.json` holds the data needed to build an Add to Cursor link. The link and install are untested, so this package does not publish a one-click link.

Test: `Call resolve_merchant first for https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: free resolution first, no paid call, and no action. Merchant Context receives MCP tool names and inputs. Cursor may expose every server tool; keep the prompt policy and disable paid tools in Cursor when tool controls are available. Paid refresh and consequential actions need human approval.

Remove the `merchant-context` entry from `.cursor/mcp.json` and restart Cursor.
