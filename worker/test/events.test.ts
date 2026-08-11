import { describe, expect, it, vi } from "vitest";

import { mintMerchantContextSession } from "../src/attribution";
import {
  MERCHANT_EVENT_NAMES,
  recordClientBeacon,
  recordVerifiedCompletion,
  signMerchantReceipt,
} from "../src/events";

const attributionSecret = "test-attribution-secret-that-is-long-enough";
const merchantSecret = "test-merchant-secret-that-is-long-enough";
const now = new Date("2026-08-11T12:00:00.000Z");

async function token(): Promise<string> {
  return (
    await mintMerchantContextSession({
      clientIdentifier: "outside-agent",
      merchantOrigin: "https://merchant.example",
      recordVersion: "v1",
      actionId: "checkout",
      sessionId: "session-1",
      secret: attributionSecret,
      now,
    })
  ).token;
}

function database(changes = 1) {
  const run = vi.fn().mockResolvedValue({ success: true, meta: { changes } });
  const bind = vi.fn(() => ({ run }));
  return { value: { prepare: vi.fn(() => ({ bind })) }, bind };
}

describe("merchant preflight events", () => {
  it("defines the seven contract event names", () => {
    expect(MERCHANT_EVENT_NAMES).toEqual([
      "resolved",
      "referred",
      "action_started",
      "action_completed",
      "action_failed",
      "merchant_claimed",
      "fact_corrected",
    ]);
  });

  it("never verifies completion from a client beacon", async () => {
    const db = database();
    await recordClientBeacon(
      db.value,
      {
        event: "action_completed",
        sessionToken: await token(),
        internal: false,
      },
      attributionSecret,
      now,
    );
    expect(db.bind).toHaveBeenCalledWith(
      "action_completed",
      "session-1",
      expect.any(String),
      "https://merchant.example",
      "v1",
      "checkout",
      now.toISOString(),
      "unverified",
      0,
      null,
    );
  });

  it("records a matching merchant receipt as an outside verified completion", async () => {
    const db = database();
    const receipt = await signMerchantReceipt(
      {
        receipt_id: "receipt-1",
        merchant_origin: "https://merchant.example",
        session_id: "session-1",
        action_id: "checkout",
        completed_at: now.toISOString(),
      },
      merchantSecret,
    );
    await recordVerifiedCompletion(db.value, {
      sessionToken: await token(),
      receipt,
      attributionSecret,
      merchantSecret,
      now,
    });
    expect(db.bind).toHaveBeenCalledWith(
      "action_completed",
      "session-1",
      expect.any(String),
      "https://merchant.example",
      "v1",
      "checkout",
      now.toISOString(),
      "outside_verified",
      1,
      "receipt-1",
    );
  });

  it("rejects tampered and reused merchant receipts", async () => {
    const signed = await signMerchantReceipt(
      {
        receipt_id: "receipt-1",
        merchant_origin: "https://merchant.example",
        session_id: "session-1",
        action_id: "checkout",
        completed_at: now.toISOString(),
      },
      merchantSecret,
    );
    await expect(
      recordVerifiedCompletion(database().value, {
        sessionToken: await token(),
        receipt: { ...signed, action_id: "other" },
        attributionSecret,
        merchantSecret,
        now,
      }),
    ).rejects.toThrow("signature");
    await expect(
      recordVerifiedCompletion(database(0).value, {
        sessionToken: await token(),
        receipt: signed,
        attributionSecret,
        merchantSecret,
        now,
      }),
    ).rejects.toThrow("already used");
  });
});
