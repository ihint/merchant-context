# Merchant Context policy

Before relying on merchant facts or starting a merchant action, call `resolve_merchant`.

Use only sourced facts.

Keep stale and unknown facts visible.

Use `refresh_merchant` only when the requested freshness justifies its stated price.

Require human approval before consequential actions.

Do not put buyer data, payment data, prompts, credentials, or secrets in Merchant Context inputs.
