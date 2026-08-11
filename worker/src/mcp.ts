import { createFacilitatorConfig } from "@coinbase/x402";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withX402, type FacilitatorConfig } from "agents/x402";
import { z } from "zod";

import { inspectMerchant } from "./inspect";
import type { MerchantService } from "./service";

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

export function createMerchantContextServer(
  config: PaymentConfig,
  service?: MerchantService,
): McpServer {
  const server = newMerchantContextServer();

  registerMerchantContextTools(server, config, service);
  return server;
}

export function newMerchantContextServer(): McpServer {
  return new McpServer({ name: "merchant-context", version: "0.3.0" });
}

export function registerMerchantContextTools(
  server: McpServer,
  config: PaymentConfig,
  service?: MerchantService,
  observePayment?: PaymentObserver,
): void {
  const defaultClientId = `mcp/${crypto.randomUUID()}`;
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
        version: "0.3.0",
        operator: "Atom & Bits",
        documentation: "https://merchant.atomandbits.com",
        mcp_url: "https://api.merchant.atomandbits.com/mcp",
        resolve_http_url: "https://api.merchant.atomandbits.com/v1/resolve",
        refresh_http_url: "https://api.merchant.atomandbits.com/v1/refresh",
        refresh_price_usd: 0.01,
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
        "Run a free merchant-site diagnostic. Agents should use resolve_merchant before relying on merchant facts or actions.",
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
          tool: "refresh_merchant",
          price_usd: 0.01,
          payment: "x402",
          network: config.network,
        },
      });
    },
  );

  server.registerTool(
    "resolve_merchant",
    {
      description:
        "Resolve cached merchant identity, sourced facts, offers, terms, freshness, and safe actions for free. Call this before relying on merchant facts or starting an action.",
      inputSchema: {
        merchant_url: z.string().url().describe("Public HTTPS merchant URL"),
        client_id: z
          .string()
          .min(3)
          .max(128)
          .optional()
          .describe("Stable, non-secret identifier for the calling client"),
      },
      annotations: freeReadAnnotations(),
    },
    async ({ merchant_url, client_id }) =>
      jsonToolResult(
        await requireService(service).resolve(
          merchant_url,
          clientContext(client_id ?? defaultClientId),
        ),
      ),
  );

  server.registerTool(
    "search_merchants",
    {
      description:
        "Search cached merchant records by sourced offer, place, price, timing, policy, action support, and freshness. Payment and adoption never change order.",
      inputSchema: {
        item_or_service: z.string().min(1).max(256).optional(),
        geography: z.string().min(1).max(128).optional(),
        maximum_price_amount: z.number().nonnegative().optional(),
        maximum_price_currency: z
          .string()
          .regex(/^[A-Z]{3}$/)
          .optional(),
        timing: z.string().min(1).max(128).optional(),
        policy: z.string().min(1).max(128).optional(),
        action_type: actionType().optional(),
        freshness: z.enum(["fresh", "stale", "unknown", "any"]).optional(),
        max_stale_seconds: z.number().int().nonnegative().optional(),
      },
      annotations: freeReadAnnotations(),
    },
    async (input) =>
      jsonToolResult(
        await requireService(service).search({
          item_or_service: input.item_or_service,
          geography: input.geography,
          maximum_price:
            input.maximum_price_amount !== undefined &&
            input.maximum_price_currency !== undefined
              ? {
                  amount: input.maximum_price_amount,
                  currency: input.maximum_price_currency,
                }
              : undefined,
          timing: input.timing,
          policy: input.policy,
          action_type: input.action_type,
          freshness: input.freshness,
          max_stale_seconds: input.max_stale_seconds,
        }),
      ),
  );

  server.registerTool(
    "compare_offers",
    {
      description:
        "Compare only sourced offer fields from two or more merchants. Unknown values stay unknown and payment never changes order.",
      inputSchema: {
        merchant_urls: z.array(z.string().url()).min(2).max(20),
        client_id: z.string().min(3).max(128).optional(),
      },
      annotations: freeReadAnnotations(),
    },
    async ({ merchant_urls, client_id }) =>
      jsonToolResult(
        await requireService(service).compare(
          merchant_urls,
          clientContext(client_id ?? defaultClientId),
        ),
      ),
  );

  server.registerTool(
    "get_safe_actions",
    {
      description:
        "Return current merchant-owned action URLs, exact inputs, authority, confirmation, expiry, retry rules, recovery, and attribution.",
      inputSchema: {
        merchant_url: z.string().url(),
        client_id: z.string().min(3).max(128).optional(),
        action_type: actionType().optional(),
        allowed_authority: z
          .array(z.enum(["navigate", "prepare", "submit"]))
          .optional(),
        human_confirmation_available: z.boolean().optional(),
      },
      annotations: freeReadAnnotations(),
    },
    async ({ merchant_url, client_id, ...request }) =>
      jsonToolResult(
        await requireService(service).safeActions(
          merchant_url,
          clientContext(client_id ?? defaultClientId),
          request,
        ),
      ),
  );

  server.registerTool(
    "preflight",
    {
      description:
        "Resolve one merchant, evaluate sourced intent constraints, select a safe action, state approval, and return attribution.",
      inputSchema: {
        merchant_url: z.string().url(),
        client_id: z.string().min(3).max(128).optional(),
        item_or_service: z.string().min(1).max(256).optional(),
        action_type: actionType().optional(),
        geography: z.string().min(1).max(128).optional(),
        maximum_price_amount: z.number().nonnegative().optional(),
        maximum_price_currency: z
          .string()
          .regex(/^[A-Z]{3}$/)
          .optional(),
        timing: z.string().min(1).max(128).optional(),
        max_stale_seconds: z.number().int().nonnegative().optional(),
        allowed_authority: z
          .array(z.enum(["navigate", "prepare", "submit"]))
          .optional(),
        human_confirmation_available: z.boolean().optional(),
      },
      annotations: freeReadAnnotations(),
    },
    async ({ merchant_url, client_id, ...input }) =>
      jsonToolResult(
        await requireService(service).preflight(
          merchant_url,
          clientContext(client_id ?? defaultClientId),
          {
            item_or_service: input.item_or_service,
            action_type: input.action_type,
            geography: input.geography,
            maximum_price:
              input.maximum_price_amount !== undefined &&
              input.maximum_price_currency !== undefined
                ? {
                    amount: input.maximum_price_amount,
                    currency: input.maximum_price_currency,
                  }
                : undefined,
            timing: input.timing,
          },
          {
            max_stale_seconds: input.max_stale_seconds,
            allowed_authority: input.allowed_authority,
            human_confirmation_available: input.human_confirmation_available,
          },
        ),
      ),
  );

  const paidServer = withX402(server, config);
  registerPaidRefreshTool(
    paidServer,
    "refresh_merchant",
    "Pay for a fresh merchant inspection and cache refresh. Show the price and get explicit human approval first.",
    service,
    observePayment,
  );
  registerPaidRefreshTool(
    paidServer,
    "inspect_merchant",
    "Compatibility alias for refresh_merchant. Show the price and get explicit human approval first.",
    service,
    observePayment,
  );
}

function registerPaidRefreshTool(
  paidServer: ReturnType<typeof withX402>,
  name: "refresh_merchant" | "inspect_merchant",
  description: string,
  service: MerchantService | undefined,
  observePayment: PaymentObserver | undefined,
): void {
  paidServer.paidTool(
    name,
    description,
    0.01,
    {
      merchant_url: z.string().url().describe("Public HTTPS merchant URL"),
      agent_id: z
        .string()
        .min(3)
        .max(128)
        .describe("Stable, non-secret identifier for the calling agent"),
      approved: z
        .literal(true)
        .describe("Explicit human approval for this priced refresh"),
    },
    {
      title: "Refresh merchant evidence",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async ({ merchant_url, agent_id, approved }, extra) => {
      if (approved !== true) {
        throw new Error("Explicit approval is required");
      }

      const result = await requireService(service).refresh(
        merchant_url,
        clientContext(agent_id),
      );

      if (observePayment !== undefined) {
        const token = paymentTokenFromExtra(extra);
        const observation = await buildPaymentObservation(token, {
          agentId: agent_id,
          merchantOrigin: result.inspection.origin,
        });
        await observePayment(observation);
      }

      return jsonToolResult(result);
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

function requireService(service: MerchantService | undefined): MerchantService {
  if (service === undefined) {
    throw new Error("Merchant resolver is not configured");
  }

  return service;
}

function clientContext(clientId: string) {
  return { clientId, internal: clientId.startsWith("internal/") };
}

function actionType() {
  return z.enum(["learn_more", "contact", "request_quote", "book", "checkout"]);
}

function freeReadAnnotations() {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  } as const;
}

function attributionMeta(value: unknown): Record<string, unknown> | undefined {
  const sessions: Array<{
    action_id: string;
    merchant_context_session: string;
    expires_at: string;
  }> = [];
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (!isRecord(item)) return;

    if (
      typeof item.id === "string" &&
      isRecord(item.attribution) &&
      typeof item.attribution.token === "string" &&
      typeof item.attribution.expires_at === "string"
    ) {
      sessions.push({
        action_id: item.id,
        merchant_context_session: item.attribution.token,
        expires_at: item.attribution.expires_at,
      });
    }

    Object.values(item).forEach(visit);
  };
  visit(value);

  if (sessions.length === 0) return undefined;

  const unique = [
    ...new Map(
      sessions.map((session) => [session.merchant_context_session, session]),
    ).values(),
  ];
  return {
    "merchant-context/sessions": unique,
    ...(unique.length === 1
      ? { "merchant-context/session": unique[0].merchant_context_session }
      : {}),
  };
}

function jsonToolResult(value: unknown) {
  const _meta = attributionMeta(value);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
    ...(_meta === undefined ? {} : { _meta }),
  };
}
