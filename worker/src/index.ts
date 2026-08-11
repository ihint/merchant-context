import { HTTPFacilitatorClient } from "@x402/core/http";
import { McpAgent } from "agents/mcp";

import { handleFreeApiRequest } from "./api";
import { handlePublicRequest } from "./http";
import {
  newMerchantContextServer,
  paymentConfigFromEnv,
  registerMerchantContextTools,
  type PaymentEnv,
} from "./mcp";
import { recordSettlement, recordVerifiedPayment } from "./metrics";
import { createPaidInspectHandler } from "./paid-http";
import { mcpHandlerOptions } from "./runtime-config";
import { MerchantService } from "./service";
import { capturePaymentToken, trackSettlementInBackground } from "./settlement";

export interface Env extends PaymentEnv {
  MerchantContextMcp: DurableObjectNamespace<MerchantContextMcp>;
  RATE_LIMITER: RateLimit;
  USAGE_DB?: D1Database;
  ATTRIBUTION_SIGNING_KEY?: string;
  MERCHANT_RECEIPT_SECRET?: string;
  TRAFFIC_PROVENANCE?: "internal" | "outside";
}

export class MerchantContextMcp extends McpAgent<Env> {
  server = newMerchantContextServer();

  async init(): Promise<void> {
    const service = serviceFromEnv(this.env);
    registerMerchantContextTools(
      this.server,
      paymentConfigFromEnv(this.env),
      service,
      async (observation) => {
        await recordVerifiedPayment(requireDatabase(this.env), observation);
      },
    );
  }
}

const mcpHandler = MerchantContextMcp.serve("/mcp", mcpHandlerOptions);

export default {
  async fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Promise<Response> {
    const publicResponse = handlePublicRequest(request, {
      paymentNetwork:
        env.X402_NETWORK === "base-sepolia" ? "base-sepolia" : "base",
    });

    if (publicResponse !== null) return publicResponse;

    const url = new URL(request.url);
    const controlledPath =
      url.pathname.startsWith("/v1/") || url.pathname.startsWith("/mcp");

    if (controlledPath) {
      const limited = await applyRateLimit(request, env);
      if (limited !== null) return limited;
    }

    if (
      url.pathname.startsWith("/v1/") &&
      url.pathname !== "/v1/refresh" &&
      url.pathname !== "/v1/inspect"
    ) {
      let service: MerchantService;

      try {
        service = serviceFromEnv(env);
      } catch {
        return serviceUnavailable();
      }

      const response = await handleFreeApiRequest(request, service);
      if (response !== null) return response;
    }

    if (url.pathname === "/v1/refresh" || url.pathname === "/v1/inspect") {
      let service: MerchantService;
      let paymentConfig;

      try {
        service = serviceFromEnv(env);
        paymentConfig = paymentConfigFromEnv(env);
      } catch {
        return serviceUnavailable();
      }

      const database = requireDatabase(env);
      const handlePaidRefresh = await createPaidInspectHandler({
        facilitator: new HTTPFacilitatorClient(paymentConfig.facilitator),
        inspect: async (merchantUrl, agentId) => {
          const result = await service.refresh(merchantUrl, {
            clientId: agentId,
          });
          return { origin: result.inspection.origin, ...result };
        },
        network: paymentConfig.network,
        observePayment: (observation) =>
          recordVerifiedPayment(database, observation),
        observeSettlement: (settlement) =>
          recordSettlement(database, settlement),
        path: url.pathname,
        recipient: paymentConfig.recipient,
      });

      return handlePaidRefresh(request);
    }

    if (url.pathname.startsWith("/mcp")) {
      try {
        serviceFromEnv(env);
        paymentConfigFromEnv(env);
      } catch {
        return serviceUnavailable();
      }

      const database = requireDatabase(env);
      const paymentToken = await capturePaymentToken(request);
      const response = await mcpHandler.fetch(request, env, context);
      trackSettlementInBackground(
        context,
        paymentToken,
        response,
        (settlement) => recordSettlement(database, settlement),
      );
      return response;
    }

    return new Response("Not found", {
      status: 404,
      headers: { "x-content-type-options": "nosniff" },
    });
  },
} satisfies ExportedHandler<Env>;

function serviceFromEnv(env: Env): MerchantService {
  const attributionSecret = env.ATTRIBUTION_SIGNING_KEY;
  const merchantReceiptSecret = env.MERCHANT_RECEIPT_SECRET;

  if (!attributionSecret || attributionSecret.length < 16) {
    throw new Error("Attribution signing is not configured");
  }

  if (!merchantReceiptSecret || merchantReceiptSecret.length < 16) {
    throw new Error("Merchant receipt verification is not configured");
  }

  return new MerchantService({
    database: requireDatabase(env),
    attributionSecret,
    merchantReceiptSecret,
    trafficProvenance:
      env.TRAFFIC_PROVENANCE === "internal" ? "internal" : "outside",
  });
}

function requireDatabase(env: Env): D1Database {
  if (env.USAGE_DB === undefined) {
    throw new Error("Usage database is not configured");
  }

  return env.USAGE_DB;
}

async function applyRateLimit(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const source = request.headers.get("cf-connecting-ip") ?? "unknown";
  const rateLimit = await env.RATE_LIMITER.limit({ key: source });

  if (rateLimit.success) return null;

  return new Response("Rate limit exceeded", {
    status: 429,
    headers: { "retry-after": "60", "x-content-type-options": "nosniff" },
  });
}

function serviceUnavailable(): Response {
  return new Response("Merchant Context service is not configured", {
    status: 503,
    headers: { "x-content-type-options": "nosniff" },
  });
}
