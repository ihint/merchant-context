import { describe, expect, it, vi } from "vitest";

import {
  capturePaymentToken,
  settlementFromExchange,
  trackSettlementInBackground,
} from "../src/settlement";

const paymentToken = btoa(JSON.stringify({ test: true }));
const payer = `0x${"a".repeat(40)}`;
const transaction = `0x${"b".repeat(64)}`;

function paymentResponse() {
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      content: [{ type: "text", text: "{}" }],
      _meta: {
        "x402/payment-response": {
          success: true,
          transaction,
          network: "eip155:8453",
          payer,
        },
      },
    },
  };
}

describe("settlementFromExchange", () => {
  it("extracts and hashes a settled JSON MCP response", async () => {
    const request = new Request("https://mcp.example/mcp", {
      headers: { "PAYMENT-SIGNATURE": paymentToken },
    });
    const response = Response.json(paymentResponse());

    await expect(
      settlementFromExchange(
        request,
        response,
        () => new Date("2026-08-03T21:00:00.000Z"),
      ),
    ).resolves.toEqual({
      network: "eip155:8453",
      payerHash:
        "30ffa9b5e1968e54bddadba7ff14c633c7c955a6f41808d9f5633a42c07537dd",
      paymentHash:
        "11cfa386694b599deed084ebd8d6abdcab3f5bda9ce3cd77511350915b30b539",
      settledAt: "2026-08-03T21:00:00.000Z",
      transactionHash: transaction,
    });
  });

  it("extracts the receipt from a Streamable HTTP SSE response", async () => {
    const request = new Request("https://mcp.example/mcp", {
      headers: { "X-PAYMENT": paymentToken },
    });
    const response = new Response(
      `event: message\ndata: ${JSON.stringify(paymentResponse())}\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    );

    const settlement = await settlementFromExchange(request, response);

    expect(settlement?.transactionHash).toBe(transaction);
  });

  it("captures the standard MCP payment metadata before the request is consumed", async () => {
    const request = new Request("https://mcp.example/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "inspect_merchant",
          arguments: {},
          _meta: { "x402/payment": paymentToken },
        },
      }),
    });

    const captured = capturePaymentToken(request);
    await request.text();

    await expect(captured).resolves.toBe(paymentToken);
  });

  it("ignores unpaid and failed MCP responses", async () => {
    const request = new Request("https://mcp.example/mcp");

    await expect(
      settlementFromExchange(request, Response.json(paymentResponse())),
    ).resolves.toBeNull();

    const paidRequest = new Request("https://mcp.example/mcp", {
      headers: { "PAYMENT-SIGNATURE": paymentToken },
    });

    await expect(
      settlementFromExchange(
        paidRequest,
        Response.json({ jsonrpc: "2.0", id: 1, result: {} }),
      ),
    ).resolves.toBeNull();
  });

  it("does not clone or track an unpaid streaming response", () => {
    const response = Response.json(paymentResponse());
    const clone = vi.spyOn(response, "clone");
    const waitUntil = vi.fn();
    const observe = vi.fn(async () => {});

    trackSettlementInBackground({ waitUntil }, null, response, observe);

    expect(clone).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
  });

  it("tracks a paid response in the background", async () => {
    let background: Promise<unknown> | undefined;
    const waitUntil = vi.fn((promise: Promise<unknown>) => {
      background = promise;
    });
    const observe = vi.fn(async () => {});

    trackSettlementInBackground(
      { waitUntil },
      paymentToken,
      Response.json(paymentResponse()),
      observe,
    );
    await background;

    expect(waitUntil).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(
      expect.objectContaining({ transactionHash: transaction }),
    );
  });

  it("rejects malformed settlement metadata without exposing its contents", async () => {
    const request = new Request("https://mcp.example/mcp", {
      headers: { "PAYMENT-SIGNATURE": paymentToken },
    });
    const body = paymentResponse();
    body.result._meta["x402/payment-response"].transaction = "not-a-hash";

    await expect(
      settlementFromExchange(request, Response.json(body)),
    ).rejects.toThrow("Settlement response is invalid");
  });
});
