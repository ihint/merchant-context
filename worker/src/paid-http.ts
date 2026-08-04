import {
  x402HTTPResourceServer,
  type FacilitatorClient,
  type HTTPAdapter,
  type HTTPResponseInstructions,
} from "@x402/core/http";
import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import {
  bazaarResourceServerExtension,
  declareDiscoveryExtension,
} from "@x402/extensions/bazaar";

import { normalizePublicOrigin } from "./inspect";
import type { SettlementObservation } from "./metrics";
import { buildPaymentObservation, type PaymentObservation } from "./mcp";
import { settlementObservationFromReceipt } from "./settlement";

type Inspect = (merchantUrl: string) => Promise<{ origin: string }>;
type PaymentObserver = (observation: PaymentObservation) => Promise<void>;
type SettlementObserver = (observation: SettlementObservation) => Promise<void>;

interface PaidInspectOptions {
  facilitator: FacilitatorClient;
  inspect: Inspect;
  network: "base" | "base-sepolia";
  observePayment?: PaymentObserver;
  observeSettlement?: SettlementObserver;
  recipient: `0x${string}`;
}

export async function createPaidInspectHandler(
  options: PaidInspectOptions,
): Promise<(request: Request) => Promise<Response>> {
  const network = options.network === "base" ? "eip155:8453" : "eip155:84532";
  const resourceServer = new x402ResourceServer(options.facilitator)
    .register("eip155:*", new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);
  const httpServer = new x402HTTPResourceServer(resourceServer, {
    "POST /v1/inspect": {
      accepts: {
        scheme: "exact",
        network,
        payTo: options.recipient,
        price: "$0.01",
      },
      description:
        "Inspect a merchant's public discovery and commerce files for buyer agents",
      mimeType: "application/json",
      serviceName: "Merchant Context",
      tags: ["merchant", "agentic-commerce", "discovery", "readiness"],
      iconUrl: "https://merchant.atomandbits.com/favicon.svg",
      extensions: declareDiscoveryExtension({
        bodyType: "json",
        input: {
          merchant_url: "https://merchant.atomandbits.com",
          agent_id: "merchant-context-bazaar",
        },
        inputSchema: {
          properties: {
            merchant_url: {
              type: "string",
              format: "uri",
              description: "Public HTTPS merchant origin to inspect",
            },
            agent_id: {
              type: "string",
              minLength: 3,
              maxLength: 128,
              description:
                "Stable, non-secret identifier for the calling agent",
            },
          },
          required: ["merchant_url", "agent_id"],
          additionalProperties: false,
        },
        output: {
          example: {
            origin: "https://merchant.atomandbits.com",
            summary: { passed: 6, total: 6, score: 100 },
            checks: [
              { id: "website", path: "/", status: "pass" },
              {
                id: "merchant_context",
                path: "/merchant-context.json",
                status: "pass",
              },
            ],
          },
        },
      }),
    },
  });

  await httpServer.initialize();

  return async (request) => {
    const url = new URL(request.url);
    const adapter = requestAdapter(request, url);
    const result = await httpServer.processHTTPRequest({
      adapter,
      method: request.method,
      path: url.pathname,
      paymentHeader:
        request.headers.get("payment-signature") ??
        request.headers.get("x-payment") ??
        undefined,
    });

    if (result.type === "payment-error") {
      return instructedResponse(result.response);
    }

    if (result.type === "payment-verified") {
      let input: Awaited<ReturnType<typeof paidInspectInput>>;

      try {
        input = await paidInspectInput(request);
      } catch (error) {
        await result.cancellationDispatcher.cancel({
          reason: "handler_failed",
          error,
          responseStatus: 400,
        });
        return invalidInputResponse();
      }

      try {
        const inspection = await options.inspect(input.merchant_url);
        const paymentToken =
          request.headers.get("payment-signature") ??
          request.headers.get("x-payment");

        if (paymentToken === null) {
          throw new Error("Verified payment metadata is missing");
        }

        if (options.observePayment !== undefined) {
          const observation = await buildPaymentObservation(paymentToken, {
            agentId: input.agent_id,
            merchantOrigin: inspection.origin,
          });
          await options.observePayment(observation);
        }

        const settlement = await httpServer.processSettlement(
          result.paymentPayload,
          result.paymentRequirements,
          result.declaredExtensions,
        );

        if (!settlement.success) {
          return instructedResponse(settlement.response);
        }

        if (options.observeSettlement !== undefined) {
          await options.observeSettlement(
            await settlementObservationFromReceipt(paymentToken, settlement),
          );
        }

        return jsonResponse(inspection, settlement.headers);
      } catch (error) {
        await result.cancellationDispatcher.cancel({
          reason: "handler_threw",
          error,
        });
        throw error;
      }
    }

    return new Response("Not found", { status: 404 });
  };
}

function invalidInputResponse(): Response {
  return new Response(JSON.stringify({ error: "Invalid inspection input" }), {
    status: 400,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

async function paidInspectInput(request: Request): Promise<{
  agent_id: string;
  merchant_url: string;
}> {
  const url = new URL(request.url);
  const queryAgentId = url.searchParams.get("agent_id");
  const queryMerchantUrl = url.searchParams.get("merchant_url");
  let value: unknown;

  if (queryAgentId !== null && queryMerchantUrl !== null) {
    value = { agent_id: queryAgentId, merchant_url: queryMerchantUrl };
  } else {
    value = (await request.clone().json()) as unknown;
  }

  if (
    !isRecord(value) ||
    typeof value.agent_id !== "string" ||
    value.agent_id.length < 3 ||
    value.agent_id.length > 128 ||
    typeof value.merchant_url !== "string"
  ) {
    throw new Error("Paid inspection input is invalid");
  }

  return {
    agent_id: value.agent_id,
    merchant_url: normalizePublicOrigin(value.merchant_url),
  };
}

function requestAdapter(request: Request, url: URL): HTTPAdapter {
  return {
    getAcceptHeader: () => request.headers.get("accept") ?? "application/json",
    getHeader: (name) => request.headers.get(name) ?? undefined,
    getMethod: () => request.method,
    getPath: () => url.pathname,
    getUrl: () => request.url,
    getUserAgent: () => request.headers.get("user-agent") ?? "",
  };
}

function instructedResponse(instructions: HTTPResponseInstructions): Response {
  const body =
    instructions.body === undefined
      ? null
      : typeof instructions.body === "string"
        ? instructions.body
        : JSON.stringify(instructions.body);

  return new Response(body, {
    status: instructions.status,
    headers: {
      ...instructions.headers,
      "x-content-type-options": "nosniff",
    },
  });
}

function jsonResponse(
  value: unknown,
  protocolHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      ...protocolHeaders,
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
