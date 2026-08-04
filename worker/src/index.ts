import { McpAgent } from "agents/mcp";

import { handlePublicRequest } from "./http";
import {
  newMerchantContextServer,
  paymentConfigFromEnv,
  registerMerchantContextTools,
  type PaymentEnv,
} from "./mcp";
import { recordSettlement, recordVerifiedPayment } from "./metrics";
import { mcpHandlerOptions } from "./runtime-config";
import { capturePaymentToken, settlementFromResponse } from "./settlement";

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

      const paymentToken = capturePaymentToken(request);
      const response = await mcpHandler.fetch(request, env, context);
      const settlementResponse = response.clone();

      context.waitUntil(
        paymentToken
          .then((token) => settlementFromResponse(token, settlementResponse))
          .then((settlement) => {
            if (settlement !== null) {
              return recordSettlement(env.USAGE_DB!, settlement);
            }
          })
          .catch(() => {
            console.error("Settlement receipt could not be recorded");
          }),
      );

      return response;
    }

    return new Response("Not found", {
      status: 404,
      headers: { "x-content-type-options": "nosniff" },
    });
  },
} satisfies ExportedHandler<Env>;
