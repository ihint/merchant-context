import { describe, expect, it, vi } from "vitest";

import { inspectMerchant } from "../src/inspect";

const validMerchantContext = {
  version: "0.1",
  merchant: {
    name: "Merchant Example",
    canonical_url: "https://merchant.example",
  },
  offers: [
    {
      id: "offer-1",
      name: "Example offer",
      description: "A test offer",
      canonical_url: "https://merchant.example/offer",
      availability: "available",
      updated_at: "2026-08-03T20:00:00Z",
    },
  ],
  policies: [],
  actions: [],
  provenance: {
    generated_at: "2026-08-03T20:00:00Z",
    source_urls: ["https://merchant.example"],
  },
};

describe("inspectMerchant", () => {
  it.each([
    "http://merchant.example",
    "https://localhost",
    "https://127.0.0.1",
    "https://[::1]",
    "https://merchant.local",
    "https://user:password@merchant.example",
    "https://merchant.example:8443",
  ])("rejects unsafe target %s before fetching", async (target) => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(inspectMerchant(target, { fetcher })).rejects.toThrow(
      "Merchant URL must be a public HTTPS origin",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("checks only the fixed public discovery files", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async () =>
        new Response("ok", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
    );

    const result = await inspectMerchant("https://merchant.example/store", {
      fetcher,
    });

    expect(
      fetcher.mock.calls.map(([request]) => new URL(String(request)).pathname),
    ).toEqual([
      "/",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/.well-known/ucp",
      "/merchant-context.json",
    ]);
    expect(result.resources).toHaveLength(6);
  });

  it("does not follow redirects to an unsafe origin", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const url = new URL(String(request));

        if (url.pathname === "/") {
          return new Response(null, {
            status: 302,
            headers: { location: "http://localhost/admin" },
          });
        }

        return new Response("not found", { status: 404 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(
      fetcher.mock.calls.some(([request]) =>
        String(request).includes("localhost"),
      ),
    ).toBe(false);
    expect(result.resources[0]).toMatchObject({
      path: "/",
      error: "unsafe_redirect",
    });
  });

  it("refuses oversized responses without reading their body", async () => {
    const cancel = vi.fn();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const url = new URL(String(request));

        if (url.pathname === "/merchant-context.json") {
          return {
            status: 200,
            headers: new Headers({
              "content-length": "524289",
              "content-type": "application/json",
            }),
            body: { cancel },
          } as unknown as Response;
        }

        return new Response("not found", { status: 404 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.resources[5]).toMatchObject({
      path: "/merchant-context.json",
      bytes: 0,
      error: "body_too_large",
    });
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("returns a deterministic readiness summary", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const path = new URL(String(request)).pathname;
        const found = path === "/" || path === "/robots.txt";

        return new Response(found ? "found" : "missing", {
          status: found ? 200 : 404,
          headers: { "content-type": "text/plain" },
        });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.summary).toEqual({ passed: 2, total: 6, score: 33 });
    expect(result.checks).toEqual([
      { id: "website", path: "/", status: "pass" },
      { id: "robots_txt", path: "/robots.txt", status: "pass" },
      { id: "sitemap", path: "/sitemap.xml", status: "fail" },
      { id: "llms_txt", path: "/llms.txt", status: "fail" },
      { id: "ucp_profile", path: "/.well-known/ucp", status: "fail" },
      {
        id: "merchant_context",
        path: "/merchant-context.json",
        status: "fail",
      },
    ]);
  });

  it("returns a redacted failure when one resource cannot be fetched", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const path = new URL(String(request)).pathname;

        if (path === "/llms.txt") {
          throw new Error("socket details must not leak");
        }

        const body =
          path === "/.well-known/ucp"
            ? JSON.stringify({
                ucp: {
                  version: "2026-04-08",
                  services: {},
                  payment_handlers: {},
                },
              })
            : path === "/merchant-context.json"
              ? JSON.stringify(validMerchantContext)
              : "found";
        return new Response(body, { status: 200 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.resources[3]).toEqual({
      path: "/llms.txt",
      status: 0,
      contentType: null,
      bytes: 0,
      error: "fetch_failed",
    });
    expect(JSON.stringify(result)).not.toContain("socket details");
    expect(result.summary).toEqual({ passed: 5, total: 6, score: 83 });
  });

  it("fails a malformed merchant context record even when HTTP returns 200", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const path = new URL(String(request)).pathname;

        if (path === "/merchant-context.json") {
          return new Response("{not-json", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response("missing", { status: 404 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.resources[5]).toMatchObject({
      path: "/merchant-context.json",
      status: 200,
      error: "invalid_json",
    });
    expect(result.checks[5].status).toBe("fail");
  });

  it("fails a JSON merchant context record that does not match the public schema", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const path = new URL(String(request)).pathname;

        if (path === "/merchant-context.json") {
          return new Response("{}", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response("missing", { status: 404 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.resources[5]).toMatchObject({ error: "invalid_schema" });
    expect(result.checks[5].status).toBe("fail");
  });

  it("fails a UCP profile that omits required discovery fields", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const path = new URL(String(request)).pathname;

        if (path === "/.well-known/ucp") {
          return new Response("{}", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response("missing", { status: 404 });
      });

    const result = await inspectMerchant("https://merchant.example", {
      fetcher,
    });

    expect(result.resources[4]).toMatchObject({ error: "invalid_schema" });
    expect(result.checks[4].status).toBe("fail");
  });
});
