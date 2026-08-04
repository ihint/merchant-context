import { McpAgent } from "agents/mcp";
import { HTTPFacilitatorClient } from "@x402/core/http";

import { handlePublicRequest } from "./http";
import { inspectMerchant } from "./inspect";
import {
  newMerchantContextServer,
  paymentConfigFromEnv,
  registerMerchantContextTools,
  type PaymentEnv,
} from "./mcp";
import { recordSettlement, recordVerifiedPayment } from "./metrics";
import { createPaidInspectHandler } from "./paid-http";
import { mcpHandlerOptions } from "./runtime-config";
import { capturePaymentToken, trackSettlementInBackground } from "./settlement";

export interface Env extends PaymentEnv {
  MerchantContextMcp: DurableObjectNamespace<MerchantContextMcp>;
  RATE_LIMITER: RateLimit;
  USAGE_DB?: D1Database;
}

export class MerchantContextMcp extends McpAgent<Env> {
  server = newMerchantContextServer();

  async init(): Promise<void> {
    registerMerchantContextTools(
      this.server,
      paymentConfigFromEnv(this.env),
      async (observation) => {
        if (this.env.USAGE_DB === undefined) {
          throw new Error("Usage database is not configured");
        }

        await recordVerifiedPayment(this.env.USAGE_DB, observation);
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
    const publicResponse = handlePublicRequest(request);

    if (publicResponse !== null) {
      return publicResponse;
    }

    if (new URL(request.url).pathname === "/v1/inspect") {
      let paymentConfig;

      try {
        paymentConfig = paymentConfigFromEnv(env);
      } catch {
        return new Response("Payment service is not configured", {
          status: 503,
        });
      }

      if (env.USAGE_DB === undefined) {
        return new Response("Payment service is not configured", {
          status: 503,
        });
      }

      const source = request.headers.get("cf-connecting-ip") ?? "unknown";
      const rateLimit = await env.RATE_LIMITER.limit({ key: source });

      if (!rateLimit.success) {
        return new Response("Rate limit exceeded", {
          status: 429,
          headers: { "retry-after": "60" },
        });
      }

      const handlePaidInspect = await createPaidInspectHandler({
        facilitator: new HTTPFacilitatorClient(paymentConfig.facilitator),
        inspect: inspectMerchant,
        network: paymentConfig.network,
        observePayment: (observation) =>
          recordVerifiedPayment(env.USAGE_DB!, observation),
        observeSettlement: (settlement) =>
          recordSettlement(env.USAGE_DB!, settlement),
        recipient: paymentConfig.recipient,
      });

      return handlePaidInspect(request);
    }

    if (new URL(request.url).pathname.startsWith("/mcp")) {
      try {
        paymentConfigFromEnv(env);
      } catch {
        return new Response("Payment service is not configured", {
          status: 503,
        });
      }

      if (env.USAGE_DB === undefined) {
        return new Response("Payment service is not configured", {
          status: 503,
        });
      }

      const source = request.headers.get("cf-connecting-ip") ?? "unknown";
      const rateLimit = await env.RATE_LIMITER.limit({ key: source });

      if (!rateLimit.success) {
        return new Response("Rate limit exceeded", {
          status: 429,
          headers: { "retry-after": "60" },
        });
      }

      const paymentToken = await capturePaymentToken(request);
      const response = await mcpHandler.fetch(request, env, context);
      trackSettlementInBackground(
        context,
        paymentToken,
        response,
        (settlement) => recordSettlement(env.USAGE_DB!, settlement),
      );

      return response;
    }

    return new Response("Not found", {
      status: 404,
      headers: { "x-content-type-options": "nosniff" },
    });
  },
} satisfies ExportedHandler<Env>;
