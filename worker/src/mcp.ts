import { createFacilitatorConfig } from "@coinbase/x402";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withX402, type FacilitatorConfig } from "agents/x402";
import { z } from "zod";

import { inspectMerchant } from "./inspect";

export interface PaymentConfig {
  facilitator?: FacilitatorConfig;
  network: "base" | "base-sepolia";
  recipient: `0x${string}`;
}

export interface PaymentEnv {
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;
  X402_NETWORK?: string;
  X402_RECIPIENT?: string;
}

export interface PaymentObservation {
  agentHash: string;
  merchantOrigin: string;
  network: string;
  payerHash: string;
  paymentHash: string;
  observedAt: string;
}

export type PaymentObserver = (
  observation: PaymentObservation,
) => Promise<void>;

export function paymentConfigFromEnv(env: PaymentEnv): PaymentConfig {
  const recipient = env.X402_RECIPIENT;

  if (
    recipient === undefined ||
    !/^0x[0-9a-fA-F]{40}$/.test(recipient) ||
    /^0x0{40}$/.test(recipient)
  ) {
    throw new Error("X402_RECIPIENT must be a 20-byte EVM address");
  }

  const network = env.X402_NETWORK;

  if (network !== "base" && network !== "base-sepolia") {
    throw new Error("X402_NETWORK must be base or base-sepolia");
  }

  if (network === "base") {
    const apiKeyId = env.CDP_API_KEY_ID;
    const apiKeySecret = env.CDP_API_KEY_SECRET;

    if (!apiKeyId || !apiKeySecret) {
      throw new Error("CDP facilitator credentials are required for Base");
    }

    return {
      facilitator: createFacilitatorConfig(apiKeyId, apiKeySecret),
      network,
      recipient: recipient as `0x${string}`,
    };
  }

  return { network, recipient: recipient as `0x${string}` };
}

export async function buildPaymentObservation(
  token: string,
  context: { agentId: string; merchantOrigin: string },
): Promise<PaymentObservation> {
  try {
    const payment = JSON.parse(atob(token)) as unknown;

    if (
      !isRecord(payment) ||
      !isRecord(payment.accepted) ||
      !isRecord(payment.payload)
    ) {
      throw new Error("bad payment shape");
    }

    const network = payment.accepted.network;
    const authorization = isRecord(payment.payload.authorization)
      ? payment.payload.authorization
      : payment.payload.permit2Authorization;

    if (!isRecord(authorization)) {
      throw new Error("missing authorization");
    }

    const payer = authorization.from;

    if (
      typeof network !== "string" ||
      typeof payer !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(payer)
    ) {
      throw new Error("bad payment identity");
    }

    const [agentHash, payerHash, paymentHash] = await Promise.all([
      sha256(context.agentId),
      sha256(payer.toLowerCase()),
      sha256(token),
    ]);

    return {
      agentHash,
      merchantOrigin: context.merchantOrigin,
      network,
      payerHash,
      paymentHash,
      observedAt: new Date().toISOString(),
    };
  } catch {
    throw new Error("Verified payment metadata is invalid");
  }
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

export function createMerchantContextServer(config: PaymentConfig): McpServer {
  const server = newMerchantContextServer();

  registerMerchantContextTools(server, config);
  return server;
}

export function newMerchantContextServer(): McpServer {
  return new McpServer({ name: "merchant-context", version: "0.2.0" });
}

export function registerMerchantContextTools(
  server: McpServer,
  config: PaymentConfig,
  observePayment?: PaymentObserver,
): void {
  server.registerTool(
    "get_service_info",
    {
      description:
        "Describe the Merchant Context service, price, and inspection checks.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      jsonToolResult({
        name: "Merchant Context",
        version: "0.2.0",
        operator: "Atom & Bits",
        documentation: "https://merchant.atomandbits.com",
        mcp_url: "https://api.merchant.atomandbits.com/mcp",
        http_url: "https://api.merchant.atomandbits.com/v1/inspect",
        inspection_price_usd: 0.01,
        payment_protocol: "x402",
        payment_network: config.network,
        checks: [
          "/",
          "/robots.txt",
          "/sitemap.xml",
          "/llms.txt",
          "/.well-known/ucp",
          "/merchant-context.json",
        ],
      }),
  );

  server.registerTool(
    "check_merchant",
    {
      description:
        "Return a free readiness score and pass/fail checks for one public HTTPS merchant origin. Use inspect_merchant for detailed resource evidence.",
      inputSchema: {
        merchant_url: z
          .string()
          .url()
          .describe("Public HTTPS merchant URL to check"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ merchant_url }) => {
      const inspection = await inspectMerchant(merchant_url);

      return jsonToolResult({
        origin: inspection.origin,
        summary: inspection.summary,
        checks: inspection.checks,
        full_report: {
          tool: "inspect_merchant",
          price_usd: 0.01,
          payment: "x402",
          network: config.network,
        },
      });
    },
  );

  const paidServer = withX402(server, config);
  paidServer.paidTool(
    "inspect_merchant",
    "Inspect one public HTTPS merchant origin for agent discovery and commerce files.",
    0.01,
    {
      merchant_url: z
        .string()
        .url()
        .describe("Public HTTPS merchant URL to inspect"),
      agent_id: z
        .string()
        .min(3)
        .max(128)
        .describe("Stable, non-secret identifier for the calling agent"),
    },
    {
      title: "Inspect merchant",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ merchant_url, agent_id }, extra) => {
      const inspection = await inspectMerchant(merchant_url);

      if (observePayment !== undefined) {
        const token = paymentTokenFromExtra(extra);
        const observation = await buildPaymentObservation(token, {
          agentId: agent_id,
          merchantOrigin: inspection.origin,
        });
        await observePayment(observation);
      }

      return jsonToolResult(inspection);
    },
  );
}

function paymentTokenFromExtra(extra: unknown): string {
  if (!isRecord(extra)) {
    throw new Error("Verified payment metadata is missing");
  }

  const meta = extra._meta;

  if (isRecord(meta) && typeof meta["x402/payment"] === "string") {
    return meta["x402/payment"];
  }

  const requestInfo = extra.requestInfo;

  if (isRecord(requestInfo) && isRecord(requestInfo.headers)) {
    const token =
      requestInfo.headers["PAYMENT-SIGNATURE"] ??
      requestInfo.headers["X-PAYMENT"];

    if (typeof token === "string") {
      return token;
    }
  }

  throw new Error("Verified payment metadata is missing");
}

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
  };
}
