import { describe, expect, it, vi } from "vitest";

import { recordSettlement, recordVerifiedPayment } from "../src/metrics";
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

describe("recordSettlement", () => {
  it("marks the matching verified payment as settled", async () => {
    const run = vi.fn().mockResolvedValue({
      success: true,
      meta: { changes: 1 },
    });
    const bind = vi.fn(() => ({ run }));
    const database = { prepare: vi.fn(() => ({ bind })) };
    const settlement = {
      network: "eip155:8453",
      payerHash: "a".repeat(64),
      paymentHash: "b".repeat(64),
      settledAt: "2026-08-03T21:00:00.000Z",
      transactionHash: `0x${"d".repeat(64)}`,
    };

    await recordSettlement(database, settlement);

    expect(bind).toHaveBeenCalledWith(
      settlement.transactionHash,
      settlement.settledAt,
      settlement.paymentHash,
      settlement.payerHash,
      settlement.network,
      settlement.transactionHash,
    );
  });

  it("rejects a receipt that does not match a verified payment", async () => {
    const run = vi.fn().mockResolvedValue({
      success: true,
      meta: { changes: 0 },
    });
    const database = {
      prepare: vi.fn(() => ({ bind: vi.fn(() => ({ run })) })),
    };

    await expect(
      recordSettlement(database, {
        network: "eip155:8453",
        payerHash: "a".repeat(64),
        paymentHash: "b".repeat(64),
        settledAt: "2026-08-03T21:00:00.000Z",
        transactionHash: `0x${"d".repeat(64)}`,
      }),
    ).rejects.toThrow("Settlement did not match a verified payment");
  });
});
