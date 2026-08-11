# OpenAI Responses API

`responses.mjs` uses the remote MCP server and allows only the five free tools. It sets MCP approval to `never` because the allowlist excludes paid refresh and merchant actions. The example is untested against the live resolver.

Set `OPENAI_API_KEY` and `OPENAI_MODEL`, install the current `openai` package, and run `node responses.mjs`.

The request sends the prompt to OpenAI. OpenAI sends selected MCP tool names and inputs, including the public merchant URL, to Merchant Context. Do not add buyer data, payment data, credentials, or secrets.

Expected: `resolve_merchant` runs first and the answer cites sources and freshness. No paid call can run through this tool entry.

Remove the integration by deleting the MCP tool object from the Responses request. No server-side account or token needs removal.
