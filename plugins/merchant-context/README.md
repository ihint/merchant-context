# Merchant Context Codex plugin

Add the repository marketplace, then install the plugin:

```sh
codex plugin marketplace add ihint/merchant-context --ref main
codex plugin add merchant-context@merchant-context
```

Test: `Resolve https://merchant.atomandbits.com. Cite sources and freshness. Do not refresh or act.`

Expected: `resolve_merchant` runs first. No paid refresh or action runs.

The server receives the merchant URL and tool inputs. Free: `resolve_merchant`, `search_merchants`, `compare_offers`, `get_safe_actions`, and `preflight`. Paid and excluded by policy: `refresh_merchant` and `inspect_merchant`. Paid refresh and consequential actions need explicit human approval.

Remove it with `codex plugin remove merchant-context@merchant-context`.

Remove the marketplace with `codex plugin marketplace remove merchant-context`.
