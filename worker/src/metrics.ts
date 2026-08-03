import type { PaymentObservation } from "./mcp";

export interface UsageDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ success: boolean; meta: { changes?: number } }>;
    };
  };
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
