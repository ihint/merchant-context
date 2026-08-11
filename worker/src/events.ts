import { verifyMerchantContextSession } from "./attribution";

export const MERCHANT_EVENT_NAMES = [
  "resolved",
  "referred",
  "action_started",
  "action_completed",
  "action_failed",
  "merchant_claimed",
  "fact_corrected",
] as const;
export type MerchantEventName = (typeof MERCHANT_EVENT_NAMES)[number];
export type EventProvenance = "internal" | "unverified" | "outside_verified";

export interface EventDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ success: boolean; meta: { changes?: number } }>;
    };
  };
}

export interface ClientBeacon {
  event: MerchantEventName;
  sessionToken: string;
  internal: boolean;
  occurredAt?: string;
}

export interface MerchantReceipt {
  receipt_id: string;
  merchant_origin: string;
  session_id: string;
  action_id: string;
  completed_at: string;
}

export interface SignedMerchantReceipt extends MerchantReceipt {
  signature: string;
}

const encoder = new TextEncoder();

function receiptMessage(receipt: MerchantReceipt): string {
  return JSON.stringify({
    receipt_id: receipt.receipt_id,
    merchant_origin: receipt.merchant_origin,
    session_id: receipt.session_id,
    action_id: receipt.action_id,
    completed_at: receipt.completed_at,
  });
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

async function receiptHmac(
  receipt: MerchantReceipt,
  secret: string,
): Promise<string> {
  if (secret.length < 16)
    throw new Error("Merchant receipt secret is too short");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(receiptMessage(receipt)),
      ),
    ),
  );
}

export async function signMerchantReceipt(
  receipt: MerchantReceipt,
  secret: string,
): Promise<SignedMerchantReceipt> {
  return { ...receipt, signature: await receiptHmac(receipt, secret) };
}

export async function verifyMerchantReceipt(
  receipt: SignedMerchantReceipt,
  secret: string,
): Promise<void> {
  if (
    receipt.receipt_id.length === 0 ||
    receipt.session_id.length === 0 ||
    receipt.action_id.length === 0
  ) {
    throw new Error("Invalid merchant receipt");
  }
  const expected = await receiptHmac(receipt, secret);
  if (receipt.signature.length !== expected.length)
    throw new Error("Invalid merchant receipt signature");
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1)
    difference |=
      expected.charCodeAt(index) ^ receipt.signature.charCodeAt(index);
  if (difference !== 0) throw new Error("Invalid merchant receipt signature");
}

async function insertEvent(
  database: EventDatabase,
  values: {
    event: MerchantEventName;
    sessionId: string;
    clientId: string;
    merchantOrigin: string;
    recordVersion: string;
    actionId: string;
    occurredAt: string;
    provenance: EventProvenance;
    verified: boolean;
    receiptId: string | null;
  },
): Promise<void> {
  const result = await database
    .prepare(
      `INSERT INTO merchant_preflight_events (
    event_name, session_id, client_id, merchant_origin, record_version, action_id,
    occurred_at, provenance, verified, receipt_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      values.event,
      values.sessionId,
      values.clientId,
      values.merchantOrigin,
      values.recordVersion,
      values.actionId,
      values.occurredAt,
      values.provenance,
      values.verified ? 1 : 0,
      values.receiptId,
    )
    .run();
  if (!result.success) throw new Error("Event record failed");
  if (result.meta.changes !== 1)
    throw new Error(
      values.receiptId === null
        ? "Event record failed"
        : "Merchant receipt was already used",
    );
}

export async function recordClientBeacon(
  database: EventDatabase,
  beacon: ClientBeacon,
  attributionSecret: string,
  now = new Date(),
): Promise<void> {
  const session = await verifyMerchantContextSession(
    beacon.sessionToken,
    attributionSecret,
    now,
  );
  await insertEvent(database, {
    event: beacon.event,
    sessionId: session.session_id,
    clientId: session.client_id,
    merchantOrigin: session.merchant_origin,
    recordVersion: session.record_version,
    actionId: session.action_id,
    occurredAt: beacon.occurredAt ?? now.toISOString(),
    provenance: beacon.internal ? "internal" : "unverified",
    verified: false,
    receiptId: null,
  });
}

export async function recordVerifiedCompletion(
  database: EventDatabase,
  input: {
    sessionToken: string;
    receipt: SignedMerchantReceipt;
    attributionSecret: string;
    merchantSecret: string;
    now?: Date;
    internal?: boolean;
  },
): Promise<void> {
  const now = input.now ?? new Date();
  const session = await verifyMerchantContextSession(
    input.sessionToken,
    input.attributionSecret,
    now,
  );
  await verifyMerchantReceipt(input.receipt, input.merchantSecret);
  if (
    input.receipt.merchant_origin !== session.merchant_origin ||
    input.receipt.session_id !== session.session_id ||
    input.receipt.action_id !== session.action_id
  ) {
    throw new Error("Merchant receipt does not match attribution session");
  }
  const completedAt = new Date(input.receipt.completed_at);
  if (
    !Number.isFinite(completedAt.getTime()) ||
    completedAt.getTime() < session.issued_at * 1000 ||
    completedAt.getTime() > session.expires_at * 1000 ||
    completedAt.getTime() > now.getTime() + 60_000
  )
    throw new Error("Invalid merchant completion time");
  await insertEvent(database, {
    event: "action_completed",
    sessionId: session.session_id,
    clientId: session.client_id,
    merchantOrigin: session.merchant_origin,
    recordVersion: session.record_version,
    actionId: session.action_id,
    occurredAt: completedAt.toISOString(),
    provenance: input.internal ? "internal" : "outside_verified",
    verified: !input.internal,
    receiptId: input.receipt.receipt_id,
  });
}
