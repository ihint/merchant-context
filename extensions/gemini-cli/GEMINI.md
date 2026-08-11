# Merchant Context policy

Before relying on merchant facts or starting a merchant action, call `resolve_merchant`. Use only sourced facts. Mark stale and unknown facts. Do not call `refresh_merchant` or `inspect_merchant` unless the user sees the exact price and terms and explicitly approves. Require human approval before consequential actions.
