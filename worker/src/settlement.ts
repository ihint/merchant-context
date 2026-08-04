import type { SettlementObservation } from "./metrics";

const maxResponseBytes = 256 * 1024;
const supportedNetworks = new Set(["eip155:8453", "eip155:84532"]);

type Clock = () => Date;

export async function settlementFromExchange(
  request: Request,
  response: Response,
  clock: Clock = () => new Date(),
): Promise<SettlementObservation | null> {
  const paymentToken = await capturePaymentToken(request);

  return settlementFromResponse(paymentToken, response, clock);
}

export function capturePaymentToken(request: Request): Promise<string | null> {
  const headerToken =
    request.headers.get("PAYMENT-SIGNATURE") ??
    request.headers.get("X-PAYMENT");

  if (headerToken !== null) {
    return Promise.resolve(validPaymentToken(headerToken));
  }

  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (
    !contentType.toLowerCase().includes("application/json") ||
    (Number.isFinite(contentLength) && contentLength > maxResponseBytes)
  ) {
    return Promise.resolve(null);
  }

  return request
    .clone()
    .text()
    .then((body) => {
      if (new TextEncoder().encode(body).byteLength > maxResponseBytes) {
        return null;
      }

      const [payload] = parseJson(body);

      if (!isRecord(payload) || !isRecord(payload.params)) {
        return null;
      }

      const meta = payload.params._meta;

      if (!isRecord(meta)) {
        return null;
      }

      return validPaymentToken(meta["x402/payment"]);
    })
    .catch(() => null);
}

export async function settlementFromResponse(
  paymentToken: string | null,
  response: Response,
  clock: Clock = () => new Date(),
): Promise<SettlementObservation | null> {
  if (paymentToken === null || response.status >= 400) {
    return null;
  }

  const body = await response.clone().text();

  if (new TextEncoder().encode(body).byteLength > maxResponseBytes) {
    throw new Error("Settlement response is invalid");
  }

  const responsePayloads = parseResponsePayloads(
    body,
    response.headers.get("content-type") ?? "",
  );

  for (const payload of responsePayloads) {
    const receipt = settlementReceipt(payload);

    if (receipt === null) {
      continue;
    }

    const [payerHash, paymentHash] = await Promise.all([
      sha256(receipt.payer.toLowerCase()),
      sha256(paymentToken),
    ]);

    return {
      network: receipt.network,
      payerHash,
      paymentHash,
      settledAt: clock().toISOString(),
      transactionHash: receipt.transaction,
    };
  }

  return null;
}

function validPaymentToken(value: unknown): string | null {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 * 1024
    ? value
    : null;
}

function parseResponsePayloads(body: string, contentType: string): unknown[] {
  if (contentType.toLowerCase().includes("text/event-stream")) {
    return body
      .replaceAll("\r\n", "\n")
      .split(/\n\n+/)
      .map((event) =>
        event
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n"),
      )
      .filter((data) => data !== "" && data !== "[DONE]")
      .flatMap(parseJson);
  }

  return parseJson(body);
}

function parseJson(value: string): unknown[] {
  try {
    return [JSON.parse(value) as unknown];
  } catch {
    return [];
  }
}

function settlementReceipt(value: unknown): {
  network: string;
  payer: string;
  transaction: string;
} | null {
  if (!isRecord(value) || !isRecord(value.result)) {
    return null;
  }

  const meta = value.result._meta;

  if (!isRecord(meta)) {
    return null;
  }

  const receipt = meta["x402/payment-response"];

  if (receipt === undefined) {
    return null;
  }

  if (
    !isRecord(receipt) ||
    receipt.success !== true ||
    typeof receipt.network !== "string" ||
    !supportedNetworks.has(receipt.network) ||
    typeof receipt.payer !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(receipt.payer) ||
    typeof receipt.transaction !== "string" ||
    !/^0x[0-9a-fA-F]{64}$/.test(receipt.transaction)
  ) {
    throw new Error("Settlement response is invalid");
  }

  return {
    network: receipt.network,
    payer: receipt.payer,
    transaction: receipt.transaction.toLowerCase(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
