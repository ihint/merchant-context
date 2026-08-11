import { z } from "zod";

import { MERCHANT_EVENT_NAMES } from "./events";
import type { MerchantService } from "./service";

const clientId = z.string().min(3).max(128);
const merchantUrl = z.string().url().startsWith("https://");
const price = z
  .object({
    amount: z.number().nonnegative(),
    currency: z.string().regex(/^[A-Z]{3}$/),
  })
  .strict();
const intent = z
  .object({
    item_or_service: z.string().min(1).max(256).optional(),
    action_type: z
      .enum(["learn_more", "contact", "request_quote", "book", "checkout"])
      .optional(),
    geography: z.string().min(1).max(128).optional(),
    maximum_price: price.optional(),
    timing: z.string().min(1).max(128).optional(),
  })
  .strict();
const constraints = z
  .object({
    max_stale_seconds: z.number().int().nonnegative().optional(),
    allowed_authority: z
      .array(z.enum(["navigate", "prepare", "submit"]))
      .optional(),
    human_confirmation_available: z.boolean().optional(),
  })
  .strict();
const safeActionFilter = z
  .object({
    action_type: z
      .enum(["learn_more", "contact", "request_quote", "book", "checkout"])
      .optional(),
    allowed_authority: z
      .array(z.enum(["navigate", "prepare", "submit"]))
      .optional(),
    human_confirmation_available: z.boolean().optional(),
  })
  .strict();

const routes = new Set([
  "/v1/resolve",
  "/v1/preflight",
  "/v1/search",
  "/v1/compare",
  "/v1/actions",
  "/v1/events",
]);

export async function handleFreeApiRequest(
  request: Request,
  service: MerchantService,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  if (!routes.has(path)) return null;
  if (request.method === "OPTIONS") return corsResponse();
  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405, { allow: "POST, OPTIONS" });
  }

  try {
    const body = await readJson(request);

    if (path === "/v1/resolve") {
      const input = z
        .object({ merchant_url: merchantUrl, client_id: clientId })
        .strict()
        .parse(body);
      return jsonResponse(
        await service.resolve(
          input.merchant_url,
          clientContext(input.client_id),
        ),
      );
    }

    if (path === "/v1/preflight") {
      const input = z
        .object({
          merchant_url: merchantUrl,
          client_id: clientId,
          intent: intent.optional(),
          constraints: constraints.optional(),
        })
        .strict()
        .parse(body);
      return jsonResponse(
        await service.preflight(
          input.merchant_url,
          clientContext(input.client_id),
          input.intent,
          input.constraints,
        ),
      );
    }

    if (path === "/v1/search") {
      const input = z
        .object({
          client_id: clientId,
          item_or_service: z.string().min(1).max(256).optional(),
          geography: z.string().min(1).max(128).optional(),
          maximum_price: price.optional(),
          timing: z.string().min(1).max(128).optional(),
          policy: z.string().min(1).max(128).optional(),
          action_type: z
            .enum([
              "learn_more",
              "contact",
              "request_quote",
              "book",
              "checkout",
            ])
            .optional(),
          freshness: z.enum(["fresh", "stale", "unknown", "any"]).optional(),
          max_stale_seconds: z.number().int().nonnegative().optional(),
        })
        .strict()
        .parse(body);
      const { client_id, ...query } = input;
      return jsonResponse(
        await service.search(clientContext(client_id), query),
      );
    }

    if (path === "/v1/compare") {
      const input = z
        .object({
          merchant_urls: z.array(merchantUrl).min(2).max(20),
          client_id: clientId,
        })
        .strict()
        .parse(body);
      return jsonResponse(
        await service.compare(
          input.merchant_urls,
          clientContext(input.client_id),
        ),
      );
    }

    if (path === "/v1/actions") {
      const input = z
        .object({
          merchant_url: merchantUrl,
          client_id: clientId,
          filters: safeActionFilter.optional(),
        })
        .strict()
        .parse(body);
      return jsonResponse(
        await service.safeActions(
          input.merchant_url,
          clientContext(input.client_id),
          input.filters,
        ),
      );
    }

    const input = z
      .union([
        z
          .object({
            merchant_context_session: z.string().min(20).max(4096),
            event: z
              .enum(MERCHANT_EVENT_NAMES)
              .exclude(["resolved", "action_completed"]),
            occurred_at: z.string().datetime({ offset: true }).optional(),
          })
          .strict(),
        z
          .object({
            merchant_context_session: z.string().min(20).max(4096),
            event: z.literal("action_completed"),
            receipt: z
              .object({
                receipt_id: z.string().uuid(),
                merchant_origin: merchantUrl,
                session_id: z.string().uuid(),
                action_id: z.string().min(1).max(256),
                completed_at: z.string().datetime({ offset: true }),
                signature: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
              })
              .strict(),
          })
          .strict(),
      ])
      .parse(body);

    if (input.event === "action_completed") {
      await service.recordCompletion({
        sessionToken: input.merchant_context_session,
        receipt: input.receipt,
      });
    } else {
      await service.recordEvent({
        event: input.event,
        sessionToken: input.merchant_context_session,
        occurredAt: input.occurred_at,
      });
    }

    return jsonResponse({ recorded: true }, 202);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "Invalid request"
        : error instanceof Error
          ? error.message
          : "Request failed";
    const status = /expired|signature|receipt|session|token/i.test(message)
      ? 401
      : 400;
    return errorResponse(message, status);
  }
}

function clientContext(value: string) {
  return { clientId: value };
}

async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length"));

  if (Number.isFinite(length) && length > 64 * 1024) {
    throw new Error("Request body is too large");
  }

  const text = await request.text();

  if (new TextEncoder().encode(text).byteLength > 64 * 1024) {
    throw new Error("Request body is too large");
  }

  return JSON.parse(text) as unknown;
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-origin": "*",
      "access-control-max-age": "86400",
    },
  });
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "content-type": "application/json; charset=utf-8",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

function errorResponse(
  message: string,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      ...headers,
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
