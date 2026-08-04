import { describe, expect, it } from "vitest";

import { mcpHandlerOptions } from "../src/runtime-config";

describe("MCP runtime config", () => {
  it("routes the handler to the named Durable Object binding", () => {
    expect(mcpHandlerOptions).toEqual({
      binding: "MerchantContextMcp",
      transport: "streamable-http",
    });
  });
});
