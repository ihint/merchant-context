const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

export function handlePublicRequest(request: Request): Response | null {
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
        version: "0.2.0",
        operator: "Atom & Bits",
        documentation: "https://merchant.atomandbits.com",
        source: "https://github.com/ihint/merchant-context",
        mcp: {
          transport: "streamable-http",
          url: `${url.origin}/mcp`,
        },
        http: {
          method: "POST",
          url: `${url.origin}/v1/inspect`,
          price_usd: 0.01,
          payment: "x402",
          network: "base",
        },
        ucp: {
          profile_url: "https://merchant.atomandbits.com/.well-known/ucp",
          version: "2026-04-08",
          capabilities: [],
        },
        tools: [
          {
            name: "get_service_info",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "check_merchant",
            price_usd: 0,
            payment: "none",
          },
          {
            name: "inspect_merchant",
            price_usd: 0.01,
            payment: "x402",
          },
        ],
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
