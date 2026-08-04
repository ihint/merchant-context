import type { PaymentObservation } from "./mcp";

export interface UsageDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ success: boolean; meta: { changes?: number } }>;
    };
  };
}

export interface SettlementObservation {
  network: string;
  payerHash: string;
  paymentHash: string;
  settledAt: string;
  transactionHash: string;
}

export async function recordVerifiedPayment(
  database: UsageDatabase,
  observation: PaymentObservation,
): Promise<void> {
  const result = await database
    .prepare(
      `INSERT INTO verified_calls (
        payment_hash,
        payer_hash,
        agent_hash,
        merchant_origin,
        network,
        observed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(payment_hash) DO NOTHING`,
    )
    .bind(
      observation.paymentHash,
      observation.payerHash,
      observation.agentHash,
      observation.merchantOrigin,
      observation.network,
      observation.observedAt,
    )
    .run();

  if (!result.success) {
    throw new Error("Usage record failed");
  }

  if (result.meta.changes !== 1) {
    throw new Error("Payment replay detected");
  }
}

export async function recordSettlement(
  database: UsageDatabase,
  settlement: SettlementObservation,
): Promise<void> {
  const result = await database
    .prepare(
      `UPDATE verified_calls
      SET
        transaction_hash = COALESCE(transaction_hash, ?),
        settled_at = COALESCE(settled_at, ?)
      WHERE payment_hash = ?
        AND payer_hash = ?
        AND network = ?
        AND (transaction_hash IS NULL OR transaction_hash = ?)`,
    )
    .bind(
      settlement.transactionHash,
      settlement.settledAt,
      settlement.paymentHash,
      settlement.payerHash,
      settlement.network,
      settlement.transactionHash,
    )
    .run();

  if (!result.success) {
    throw new Error("Settlement record failed");
  }

  if (result.meta.changes !== 1) {
    throw new Error("Settlement did not match a verified payment");
  }
}
