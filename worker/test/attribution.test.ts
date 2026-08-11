import { describe, expect, it } from "vitest";

import {
  mintMerchantContextSession,
  privacyPreservingClientId,
  verifyMerchantContextSession,
} from "../src/attribution";

const secret = "test-attribution-secret-that-is-long-enough";
const now = new Date("2026-08-11T12:00:00.000Z");

describe("merchant_context_session", () => {
  it("signs only the contract fields and hides the source client identifier", async () => {
    const session = await mintMerchantContextSession({
      clientIdentifier: "outside-agent@example.test",
      merchantOrigin: "https://merchant.example",
      recordVersion: "record-v3",
      actionId: "checkout",
      secret,
      now,
      ttlSeconds: 300,
      sessionId: "opaque-session",
    });
    const payload = await verifyMerchantContextSession(
      session.token,
      secret,
      now,
    );

    expect(Object.keys(payload).sort()).toEqual([
      "action_id",
      "client_id",
      "expires_at",
      "issued_at",
      "merchant_origin",
      "record_version",
      "session_id",
    ]);
    expect(payload.client_id).not.toContain("outside-agent");
    expect(payload.client_id).toBe(
      await privacyPreservingClientId("outside-agent@example.test", secret),
    );
    expect(session.query_parameter).toBe("merchant_context_session");
  });

  it("rejects expiry and changed signatures", async () => {
    const session = await mintMerchantContextSession({
      clientIdentifier: "agent",
      merchantOrigin: "https://merchant.example",
      recordVersion: "v1",
      actionId: "contact",
      secret,
      now,
      ttlSeconds: 60,
    });
    await expect(
      verifyMerchantContextSession(
        session.token,
        secret,
        new Date("2026-08-11T12:01:00.000Z"),
      ),
    ).rejects.toThrow("expired");
    const changed = `${session.token.slice(0, -1)}${session.token.endsWith("a") ? "b" : "a"}`;
    await expect(
      verifyMerchantContextSession(changed, secret, now),
    ).rejects.toThrow("signature");
  });
});
