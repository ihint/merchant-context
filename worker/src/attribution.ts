import type { AttributionSession } from "./contracts";

const encoder = new TextEncoder();

export interface MerchantContextSessionPayload {
  session_id: string;
  client_id: string;
  merchant_origin: string;
  record_version: string;
  action_id: string;
  issued_at: number;
  expires_at: number;
}

export interface MintAttributionInput {
  clientIdentifier: string;
  merchantOrigin: string;
  recordVersion: string;
  actionId: string;
  secret: string;
  ttlSeconds?: number;
  now?: Date;
  sessionId?: string;
}

const payloadKeys = [
  "action_id",
  "client_id",
  "expires_at",
  "issued_at",
  "merchant_origin",
  "record_version",
  "session_id",
] as const;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value))
    throw new Error("Invalid attribution token");
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );
    if (toBase64Url(bytes) !== value) throw new Error("non-canonical");
    return bytes;
  } catch {
    throw new Error("Invalid attribution token");
  }
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  if (secret.length < 16) throw new Error("Attribution secret is too short");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

export async function privacyPreservingClientId(
  clientIdentifier: string,
  secret: string,
): Promise<string> {
  if (clientIdentifier.length === 0)
    throw new Error("Client identifier is required");
  return toBase64Url(
    await hmac(secret, `merchant-context-client\0${clientIdentifier}`),
  );
}

export async function mintMerchantContextSession(
  input: MintAttributionInput,
): Promise<AttributionSession> {
  const now = input.now ?? new Date();
  const issuedAt = Math.floor(now.getTime() / 1000);
  const ttl = input.ttlSeconds ?? 600;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > 3600) {
    throw new Error("Attribution lifetime must be between 1 and 3600 seconds");
  }
  const origin = new URL(input.merchantOrigin);
  if (origin.protocol !== "https:" || origin.origin !== input.merchantOrigin) {
    throw new Error("Merchant origin must be a canonical HTTPS origin");
  }

  const payload: MerchantContextSessionPayload = {
    session_id: input.sessionId ?? crypto.randomUUID(),
    client_id: await privacyPreservingClientId(
      input.clientIdentifier,
      input.secret,
    ),
    merchant_origin: input.merchantOrigin,
    record_version: input.recordVersion,
    action_id: input.actionId,
    issued_at: issuedAt,
    expires_at: issuedAt + ttl,
  };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(input.secret, encodedPayload));
  return {
    token: `${encodedPayload}.${signature}`,
    expires_at: new Date(payload.expires_at * 1000).toISOString(),
    query_parameter: "merchant_context_session",
  };
}

export async function verifyMerchantContextSession(
  token: string,
  secret: string,
  now = new Date(),
): Promise<MerchantContextSessionPayload> {
  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    throw new Error("Invalid attribution token");
  }
  const expected = await hmac(secret, parts[0]);
  let supplied: Uint8Array;
  try {
    supplied = fromBase64Url(parts[1]);
  } catch {
    throw new Error("Invalid attribution signature");
  }
  if (expected.length !== supplied.length)
    throw new Error("Invalid attribution signature");
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1)
    difference |= expected[index] ^ supplied[index];
  if (difference !== 0) throw new Error("Invalid attribution signature");

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
  } catch {
    throw new Error("Invalid attribution token");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid attribution payload");
  const payload = value as Record<string, unknown>;
  const keys = Object.keys(payload).sort();
  if (
    keys.length !== payloadKeys.length ||
    keys.some((key, index) => key !== payloadKeys[index])
  ) {
    throw new Error("Invalid attribution payload");
  }
  if (
    typeof payload.session_id !== "string" ||
    payload.session_id.length === 0 ||
    typeof payload.client_id !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/u.test(payload.client_id) ||
    typeof payload.merchant_origin !== "string" ||
    typeof payload.record_version !== "string" ||
    payload.record_version.length === 0 ||
    typeof payload.action_id !== "string" ||
    payload.action_id.length === 0 ||
    typeof payload.issued_at !== "number" ||
    !Number.isInteger(payload.issued_at) ||
    typeof payload.expires_at !== "number" ||
    !Number.isInteger(payload.expires_at) ||
    payload.expires_at <= payload.issued_at ||
    payload.expires_at - payload.issued_at > 3600
  )
    throw new Error("Invalid attribution payload");
  let origin: URL;
  try {
    origin = new URL(payload.merchant_origin);
  } catch {
    throw new Error("Invalid attribution payload");
  }
  if (origin.protocol !== "https:" || origin.origin !== payload.merchant_origin)
    throw new Error("Invalid attribution payload");
  const current = Math.floor(now.getTime() / 1000);
  if (payload.issued_at > current + 60)
    throw new Error("Attribution token is not yet valid");
  if (payload.expires_at <= current)
    throw new Error("Attribution token has expired");
  return payload as unknown as MerchantContextSessionPayload;
}
