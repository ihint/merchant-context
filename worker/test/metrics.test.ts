import { describe, expect, it, vi } from "vitest";

import { recordVerifiedPayment } from "../src/metrics";
import type { PaymentObservation } from "../src/mcp";

const observation: PaymentObservation = {
  agentHash: "c".repeat(64),
  merchantOrigin: "https://merchant.example",
  network: "eip155:8453",
  payerHash: "a".repeat(64),
  paymentHash: "b".repeat(64),
  observedAt: "2026-08-03T20:00:00.000Z",
};

describe("recordVerifiedPayment", () => {
  it("stores a verified call once and rejects a duplicate payment token", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ success: true, meta: { changes: 1 } })
      .mockResolvedValueOnce({ success: true, meta: { changes: 0 } });
    const bind = vi.fn(() => ({ run }));
    const database = { prepare: vi.fn(() => ({ bind })) };

    await recordVerifiedPayment(database, observation);
    await expect(recordVerifiedPayment(database, observation)).rejects.toThrow(
      "Payment replay detected",
    );

    expect(bind).toHaveBeenCalledWith(
      observation.paymentHash,
      observation.payerHash,
      observation.agentHash,
      observation.merchantOrigin,
      observation.network,
      observation.observedAt,
    );
  });
});
