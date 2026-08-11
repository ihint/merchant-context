# Agent integration

Merchant Context exposes one remote MCP server:

```text
https://api.merchant.atomandbits.com/mcp
```

No API key is needed for the free tools.

## Tool limits

| Tool               |               Cost | Use                                          |
| ------------------ | -----------------: | -------------------------------------------- |
| `get_service_info` |               Free | Read the service rules and price.            |
| `check_merchant`   |               Free | Check six public files and return a score.   |
| `inspect_merchant` | $0.01 USDC on Base | Return detailed evidence after x402 payment. |

Do not auto-approve `inspect_merchant`.
Require clear user approval before a wallet pays for it.

## Codex

```sh
codex mcp add merchant-context --url https://api.merchant.atomandbits.com/mcp
```

Restart Codex after adding the server.

## Claude Code

```sh
claude mcp add --transport http --scope user merchant-context https://api.merchant.atomandbits.com/mcp
```

Run `claude mcp get merchant-context` to check the connection.

## Gemini CLI

```sh
gemini mcp add merchant-context https://api.merchant.atomandbits.com/mcp --transport http --scope user
```

Run `gemini mcp list` to check the connection.

## Cursor

Add this to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "merchant-context": {
      "url": "https://api.merchant.atomandbits.com/mcp"
    }
  }
}
```

Approve the server in Cursor Settings, then ask the agent to use `check_merchant`.

## VS Code and GitHub Copilot

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "merchant-context": {
      "type": "http",
      "url": "https://api.merchant.atomandbits.com/mcp"
    }
  }
}
```

Start the server from the MCP configuration view.

## OpenAI Responses API

Allow only the free check unless the application has its own payment approval flow:

```js
const response = await client.responses.create({
  model: "gpt-5",
  input: "Use check_merchant to check https://merchant.atomandbits.com",
  tools: [
    {
      type: "mcp",
      server_label: "merchant_context",
      server_url: "https://api.merchant.atomandbits.com/mcp",
      allowed_tools: ["check_merchant"],
      require_approval: "never",
    },
  ],
});
```

## First check

Use this prompt after the server connects:

```text
Use Merchant Context check_merchant to check https://merchant.atomandbits.com.
List each check and its pass or fail status.
Do not call a paid tool.
```

The result is a public-web observation.
It is not certification, endorsement, or a security review.

## Registry record

The official MCP Registry name is `io.github.ihint/merchant-context`.
The source record is [`server.json`](../server.json).

Run the public smoke test from `worker`:

```sh
npm run smoke:public:mcp
```
