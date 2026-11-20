import { describe, expect, it, vi } from "vitest";

import type { SettlementObservation } from "../src/metrics";
import {
  STRIPE_API_VERSION,
  stripeRecorderFromEnv,
  withStripeRecording,
} from "../src/stripe";

// Fake keys: shaped like Stripe restricted keys, valid nowhere.
const testKey = "rk_test_example";
const liveKey = "rk_live_example";
const transactionHash = `0x${"a".repeat(64)}`;

const sepoliaSettlement: SettlementObservation = {
  network: "eip155:84532",
  payerHash: "b".repeat(64),
  paymentHash: "c".repeat(64),
  settledAt: "2026-11-13T15:00:00.000Z",
  transactionHash,
};

function stripeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Stripe recorder config", () => {
  it("stays off when no Stripe key is set", () => {
    expect(stripeRecorderFromEnv({ X402_NETWORK: "base-sepolia" })).toBeNull();
    expect(
      stripeRecorderFromEnv({ X402_NETWORK: "base", STRIPE_SECRET_KEY: "" }),
    ).toBeNull();
  });

  it("requires a test key on Base Sepolia and a live key on Base", () => {
    expect(() =>
      stripeRecorderFromEnv({
        X402_NETWORK: "base-sepolia",
        STRIPE_SECRET_KEY: liveKey,
      }),
    ).toThrow("Base Sepolia needs a Stripe test-mode key");
    expect(() =>
      stripeRecorderFromEnv({
        X402_NETWORK: "base",
        STRIPE_SECRET_KEY: testKey,
      }),
    ).toThrow("Base mainnet needs a Stripe live-mode key");
  });

  it("rejects publishable or malformed keys without echoing them", () => {
    for (const key of ["pk_test_abc123", "not-a-key", "sk_test_"]) {
      let message = "";
      try {
        stripeRecorderFromEnv({
          X402_NETWORK: "base-sepolia",
          STRIPE_SECRET_KEY: key,
        });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toBe(
        "STRIPE_SECRET_KEY must be a Stripe secret or restricted key",
      );
    }
  });
});

describe("Stripe payment recording", () => {
  it("records a settled x402 payment as a confirmed crypto PaymentIntent", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        stripeResponse({ id: "pi_test_123", status: "succeeded" }),
      );
    const recorder = stripeRecorderFromEnv(
      { X402_NETWORK: "base-sepolia", STRIPE_SECRET_KEY: testKey },
      fetcher,
    );

    await expect(recorder!.record(sepoliaSettlement)).resolves.toEqual({
      id: "pi_test_123",
      status: "succeeded",
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.stripe.com/v1/payment_intents");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${testKey}`);
    expect(headers.get("stripe-version")).toBe(STRIPE_API_VERSION);
    expect(headers.get("idempotency-key")).toBe(`x402-base-${transactionHash}`);
    expect(headers.get("content-type")).toBe(
      "application/x-www-form-urlencoded",
    );

    const body = new URLSearchParams(String(init?.body));
    expect(Object.fromEntries(body)).toEqual({
      amount: "1",
      currency: "usd",
      confirm: "true",
      description: "Merchant Context refresh",
      "payment_method_data[type]": "crypto",
      "allowed_payment_method_types[0]": "crypto",
      "payment_method_options[crypto][mode]": "transaction_verification",
      "payment_method_options[crypto][transaction_verification_options][network]":
        "base",
      "payment_method_options[crypto][transaction_verification_options][transaction_hash]":
        transactionHash,
    });
  });

  it("refuses to record a testnet payment with a live key", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const recorder = stripeRecorderFromEnv(
      { X402_NETWORK: "base", STRIPE_SECRET_KEY: liveKey },
      fetcher,
    );

    await expect(recorder!.record(sepoliaSettlement)).rejects.toThrow(
      "Settlement network does not match the Stripe key mode",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports a Stripe error by status and code, never by key", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      stripeResponse(
        {
          error: {
            type: "invalid_request_error",
            code: "parameter_unknown",
            message: `Invalid API Key provided: ${testKey}`,
          },
        },
        400,
      ),
    );
    const recorder = stripeRecorderFromEnv(
      { X402_NETWORK: "base-sepolia", STRIPE_SECRET_KEY: testKey },
      fetcher,
    );

    const failure = await recorder!
      .record(sepoliaSettlement)
      .catch((error: Error) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe(
      "Stripe PaymentIntent failed: 400 invalid_request_error parameter_unknown",
    );
    expect((failure as Error).message).not.toContain(testKey);
  });
});

describe("settlement observer with Stripe", () => {
  it("passes through unchanged when Stripe is off", async () => {
    const observe = vi.fn().mockResolvedValue(undefined);
    const waitUntil = vi.fn();

    await withStripeRecording(observe, null, waitUntil)(sepoliaSettlement);

    expect(observe).toHaveBeenCalledWith(sepoliaSettlement);
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it("records in Stripe in the background even when the usage record fails", async () => {
    const observe = vi.fn().mockRejectedValue(new Error("Usage record failed"));
    const record = vi
      .fn()
      .mockResolvedValue({ id: "pi_test_123", status: "succeeded" });
    const background: Promise<unknown>[] = [];
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      withStripeRecording(observe, { record }, (promise) => {
        background.push(promise);
      })(sepoliaSettlement),
    ).rejects.toThrow("Usage record failed");

    expect(record).toHaveBeenCalledWith(sepoliaSettlement);
    await Promise.all(background);
    expect(log).toHaveBeenCalledWith(
      "Stripe recorded PaymentIntent pi_test_123 (succeeded)",
    );
    log.mockRestore();
  });

  it("logs a Stripe failure instead of failing the paid response", async () => {
    const observe = vi.fn().mockResolvedValue(undefined);
    const record = vi
      .fn()
      .mockRejectedValue(new Error("Stripe PaymentIntent failed: 500"));
    const background: Promise<unknown>[] = [];
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await withStripeRecording(observe, { record }, (promise) => {
      background.push(promise);
    })(sepoliaSettlement);

    await expect(Promise.all(background)).resolves.toBeDefined();
    expect(error).toHaveBeenCalledWith(
      "Stripe payment record failed: Stripe PaymentIntent failed: 500",
    );
    error.mockRestore();
  });
});
