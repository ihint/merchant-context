import type { SettlementObservation } from "./metrics";

// Stripe records an already-settled x402 payment as a PaymentIntent in
// `transaction_verification` mode. The payment itself still moves on-chain to
// X402_RECIPIENT, which must be a Stripe crypto deposit address for Stripe to
// accept the record. See https://docs.stripe.com/payments/machine/x402
export const STRIPE_API_VERSION = "2026-05-27.preview";

// Both paid paths charge $0.01.
const refreshPriceCents = 1;
const keyPattern = /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/;
const networkKeyMode: Record<string, "test" | "live"> = {
  "eip155:84532": "test",
  "eip155:8453": "live",
};

export interface StripeEnv {
  STRIPE_SECRET_KEY?: string;
  X402_NETWORK?: string;
}

export interface StripeRecorder {
  record(
    settlement: SettlementObservation,
  ): Promise<{ id: string; status: string }>;
}

type SettlementObserver = (settlement: SettlementObservation) => Promise<void>;

export function stripeRecorderFromEnv(
  env: StripeEnv,
  fetcher: typeof fetch = (input, init) => fetch(input, init),
): StripeRecorder | null {
  const secretKey = env.STRIPE_SECRET_KEY;

  if (secretKey === undefined || secretKey === "") {
    return null;
  }

  const match = keyPattern.exec(secretKey);

  if (match === null) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a Stripe secret or restricted key",
    );
  }

  const keyMode = match[2] as "test" | "live";

  if (env.X402_NETWORK === "base-sepolia" && keyMode !== "test") {
    throw new Error("Base Sepolia needs a Stripe test-mode key");
  }

  if (env.X402_NETWORK === "base" && keyMode !== "live") {
    throw new Error("Base mainnet needs a Stripe live-mode key");
  }

  return {
    async record(settlement) {
      if (networkKeyMode[settlement.network] !== keyMode) {
        throw new Error(
          "Settlement network does not match the Stripe key mode",
        );
      }

      // Stripe's sandbox guide keeps network "base" for Base Sepolia payments.
      // The first sandbox payment confirms this.
      const body = new URLSearchParams({
        amount: String(refreshPriceCents),
        currency: "usd",
        confirm: "true",
        description: "Merchant Context refresh",
        "payment_method_data[type]": "crypto",
        "allowed_payment_method_types[0]": "crypto",
        "payment_method_options[crypto][mode]": "transaction_verification",
        "payment_method_options[crypto][transaction_verification_options][network]":
          "base",
        "payment_method_options[crypto][transaction_verification_options][transaction_hash]":
          settlement.transactionHash,
      });

      const response = await fetcher(
        "https://api.stripe.com/v1/payment_intents",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${secretKey}`,
            "content-type": "application/x-www-form-urlencoded",
            "idempotency-key": `x402-base-${settlement.transactionHash}`,
            "stripe-version": STRIPE_API_VERSION,
          },
          body: body.toString(),
        },
      );
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        const error =
          isRecord(payload) && isRecord(payload.error) ? payload.error : {};
        const detail = [error.type, error.code]
          .filter((part): part is string => typeof part === "string")
          .join(" ");

        throw new Error(
          `Stripe PaymentIntent failed: ${response.status}${detail ? ` ${detail}` : ""}`,
        );
      }

      if (
        !isRecord(payload) ||
        typeof payload.id !== "string" ||
        typeof payload.status !== "string"
      ) {
        throw new Error("Stripe PaymentIntent response is invalid");
      }

      return { id: payload.id, status: payload.status };
    },
  };
}

// Stripe runs after the money has moved, so its failure must not fail the
// paid response. It runs in the background and logs the outcome.
export function withStripeRecording(
  observe: SettlementObserver,
  recorder: Pick<StripeRecorder, "record"> | null,
  waitUntil: (promise: Promise<unknown>) => void,
): SettlementObserver {
  if (recorder === null) {
    return observe;
  }

  return async (settlement) => {
    waitUntil(
      recorder.record(settlement).then(
        (paymentIntent) => {
          console.log(
            `Stripe recorded PaymentIntent ${paymentIntent.id} (${paymentIntent.status})`,
          );
        },
        (error: unknown) => {
          console.error(
            `Stripe payment record failed: ${error instanceof Error ? error.message : "unknown error"}`,
          );
        },
      ),
    );
    await observe(settlement);
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
