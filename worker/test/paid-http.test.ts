import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";
import type { FacilitatorClient } from "@x402/core/server";
import { describe, expect, it, vi } from "vitest";

import { createPaidInspectHandler } from "../src/paid-http";

const facilitator: FacilitatorClient = {
  async getSupported() {
    return {
      kinds: [
        {
          x402Version: 2,
          scheme: "exact",
          network: "eip155:84532",
          extra: {},
        },
      ],
      extensions: [],
      signers: {},
    };
  },
  async verify() {
    throw new Error("verify should not run without a payment");
  },
  async settle() {
    throw new Error("settle should not run without a payment");
  },
};

describe("paid HTTP merchant inspection", () => {
  it("returns exact Base payment terms before inspecting a merchant", async () => {
    const inspect = vi.fn();
    const handle = await createPaidInspectHandler({
      facilitator,
      inspect,
      network: "base-sepolia",
      recipient: "0x0000000000000000000000000000000000000001",
    });

    const response = await handle(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchant_url: "https://merchant.example",
          agent_id: "agent/test/1",
        }),
      }),
    );

    expect(response.status).toBe(402);
    const encodedTerms = response.headers.get("payment-required");
    expect(encodedTerms).not.toBeNull();
    expect(decodePaymentRequiredHeader(encodedTerms!)).toMatchObject({
      x402Version: 2,
      resource: {
        description:
          "Refresh sourced merchant evidence after explicit human approval",
        serviceName: "Merchant Context",
        tags: ["merchant", "agentic-commerce", "evidence", "freshness"],
      },
      accepts: [
        {
          network: "eip155:84532",
          amount: "10000",
          payTo: "0x0000000000000000000000000000000000000001",
        },
      ],
      extensions: {
        bazaar: {
          info: {
            input: {
              type: "http",
              method: "POST",
              bodyType: "json",
              body: {
                merchant_url: "https://merchant.atomandbits.com",
                agent_id: "merchant-context-bazaar",
                approved: true,
              },
            },
          },
        },
      },
    });
    expect(inspect).not.toHaveBeenCalled();
  });

  it("cancels a verified payment before settlement when the input is unsafe", async () => {
    const payer = "0x1111111111111111111111111111111111111111";
    const settle = vi.fn<FacilitatorClient["settle"]>();
    const paidFacilitator: FacilitatorClient = {
      ...facilitator,
      verify: vi.fn().mockResolvedValue({ isValid: true, payer }),
      settle,
    };
    const inspect = vi.fn();
    const handle = await createPaidInspectHandler({
      facilitator: paidFacilitator,
      inspect,
      network: "base-sepolia",
      recipient: "0x0000000000000000000000000000000000000001",
    });
    const body = JSON.stringify({
      merchant_url: "https://localhost",
      agent_id: "agent/test/1",
      approved: true,
    });
    const challenge = await handle(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
    );
    const terms = decodePaymentRequiredHeader(
      challenge.headers.get("payment-required")!,
    );
    const payment = encodePaymentSignatureHeader({
      x402Version: 2,
      accepted: terms.accepts[0],
      payload: { authorization: { from: payer } },
    });

    const response = await handle(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "payment-signature": payment,
        },
        body,
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("payment-required")).toBeNull();
    expect(inspect).not.toHaveBeenCalled();
    expect(settle).not.toHaveBeenCalled();
  });

  it("cannot inspect or settle without explicit approval", async () => {
    const payer = "0x1111111111111111111111111111111111111111";
    const settle = vi.fn<FacilitatorClient["settle"]>();
    const handle = await createPaidInspectHandler({
      facilitator: {
        ...facilitator,
        verify: vi.fn().mockResolvedValue({ isValid: true, payer }),
        settle,
      },
      inspect: vi.fn(),
      network: "base-sepolia",
      recipient: "0x0000000000000000000000000000000000000001",
    });
    const body = JSON.stringify({
      merchant_url: "https://merchant.example",
      agent_id: "agent/test/1",
      approved: false,
    });
    const challenge = await handle(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
    );
    const terms = decodePaymentRequiredHeader(
      challenge.headers.get("payment-required")!,
    );
    const payment = encodePaymentSignatureHeader({
      x402Version: 2,
      accepted: terms.accepts[0],
      payload: { authorization: { from: payer } },
    });
    const response = await handle(
      new Request("https://service.example/v1/inspect", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "payment-signature": payment,
        },
        body,
      }),
    );

    expect(response.status).toBe(400);
    expect(settle).not.toHaveBeenCalled();
  });

  it("returns the inspection and settlement receipt after a valid payment", async () => {
    const payer = "0x1111111111111111111111111111111111111111";
    const transaction = `0x${"d".repeat(64)}`;
    const settle = vi.fn<FacilitatorClient["settle"]>().mockResolvedValue({
      success: true,
      network: "eip155:84532",
      payer,
      transaction,
    });
    const paidFacilitator: FacilitatorClient = {
      ...facilitator,
      verify: vi.fn().mockResolvedValue({ isValid: true, payer }),
      settle,
    };
    const inspection = {
      origin: "https://merchant.example",
      checks: [{ path: "/llms.txt", status: 200 }],
    };
    const inspect = vi.fn().mockResolvedValue(inspection);
    const observePayment = vi.fn().mockResolvedValue(undefined);
    const observeSettlement = vi.fn().mockResolvedValue(undefined);
    const handle = await createPaidInspectHandler({
      facilitator: paidFacilitator,
      inspect,
      network: "base-sepolia",
      observePayment,
      observeSettlement,
      recipient: "0x0000000000000000000000000000000000000001",
    });
    const requestUrl = new URL("https://service.example/v1/inspect");
    requestUrl.searchParams.set("merchant_url", "https://merchant.example");
    requestUrl.searchParams.set("agent_id", "agent/test/1");
    requestUrl.searchParams.set("approved", "true");
    const challenge = await handle(
      new Request(requestUrl, {
        method: "POST",
      }),
    );
    const terms = decodePaymentRequiredHeader(
      challenge.headers.get("payment-required")!,
    );
    const payment = encodePaymentSignatureHeader({
      x402Version: 2,
      accepted: terms.accepts[0],
      payload: { authorization: { from: payer } },
    });

    const response = await handle(
      new Request(requestUrl, {
        method: "POST",
        headers: {
          "payment-signature": payment,
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(inspection);
    expect(
      decodePaymentResponseHeader(response.headers.get("payment-response")!),
    ).toMatchObject({
      success: true,
      network: "eip155:84532",
      transaction,
    });
    expect(inspect).toHaveBeenCalledWith(
      "https://merchant.example",
      "agent/test/1",
    );
    expect(observePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        agentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        merchantOrigin: "https://merchant.example",
        payerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        paymentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(observeSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        network: "eip155:84532",
        payerHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        paymentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        transactionHash: transaction,
      }),
    );
    expect(observePayment.mock.invocationCallOrder[0]).toBeLessThan(
      settle.mock.invocationCallOrder[0],
    );
  });
});
