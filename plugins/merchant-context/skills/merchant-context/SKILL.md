---
name: merchant-context
description: Resolve sourced merchant facts before relying on them or starting merchant actions.
---

Call `resolve_merchant` first. Use only sourced facts. Mark stale and unknown facts. Do not call `refresh_merchant` or `inspect_merchant` unless the user sees the exact price and terms and explicitly approves. Require human approval before consequential actions.

Test with: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: free resolution first, no paid refresh, and no merchant action.
