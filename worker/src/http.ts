const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export function handlePublicRequest(
  request: Request,
  options: { paymentNetwork?: "base" | "base-sepolia" } = {},
): Response | null {
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return null;
  }

  if (url.pathname === "/health") {
    return jsonResponse({ status: "ok" }, request.method === "HEAD");
  }

  if (url.pathname === "/.well-known/merchant-context") {
    return jsonResponse(
      {
        name: "Merchant Context",
        version: "0.3.0",
        operator: "Atom & Bits",
        documentation: "https://merchant.atomandbits.com",
        source: "https://github.com/ihint/merchant-context",
        mcp: {
          transport: "streamable-http",
          url: `${url.origin}/mcp`,
        },
        http: {
          free: {
            resolve: { method: "POST", url: `${url.origin}/v1/resolve` },
            preflight: { method: "POST", url: `${url.origin}/v1/preflight` },
            search: { method: "POST", url: `${url.origin}/v1/search` },
            compare: { method: "POST", url: `${url.origin}/v1/compare` },
            actions: { method: "POST", url: `${url.origin}/v1/actions` },
          },
          paid_refresh: {
            method: "POST",
            url: `${url.origin}/v1/refresh`,
            price_usd: 0.01,
            payment: "x402",
            network: options.paymentNetwork ?? "base",
            approval_required: true,
          },
        },
        ucp: {
          profile_url: "https://merchant.atomandbits.com/.well-known/ucp",
          version: "2026-04-08",
          capabilities: [],
        },
        tools: [
          {
            name: "resolve_merchant",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "search_merchants",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "compare_offers",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "get_safe_actions",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "preflight",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "check_merchant",
            price_usd: 0,
            payment: "none",
            role: "diagnostic",
          },
          {
            name: "refresh_merchant",
            price_usd: 0.01,
            payment: "x402",
            approval_required: true,
          },
          {
            name: "inspect_merchant",
            price_usd: 0.01,
            payment: "x402",
            role: "compatibility_alias",
            approval_required: true,
          },
        ],
        install: "https://merchant.atomandbits.com/install",
        attribution: {
          event_url: `${url.origin}/v1/events`,
          query_parameter: "merchant_context_session",
          verified_receipt_origins: ["https://merchant.atomandbits.com"],
        },
      },
      request.method === "HEAD",
    );
  }

  return null;
}

function jsonResponse(value: unknown, omitBody = false): Response {
  return new Response(omitBody ? null : JSON.stringify(value), {
    headers: {
      ...SECURITY_HEADERS,
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300",
      "content-type": "application/json; charset=utf-8",
    },
  });
}
