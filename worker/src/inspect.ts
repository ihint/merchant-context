import { merchantContextSchema } from "./schema";

export interface InspectOptions {
  fetcher?: typeof fetch;
}

export interface MerchantInspection {
  origin: string;
  resources: InspectedResource[];
  summary: {
    passed: number;
    total: number;
    score: number;
  };
  checks: ReadinessCheck[];
}

export interface ReadinessCheck {
  id:
    | "website"
    | "robots_txt"
    | "sitemap"
    | "llms_txt"
    | "ucp_profile"
    | "merchant_context";
  path: string;
  status: "pass" | "fail";
}

export interface InspectedResource {
  path: string;
  status: number;
  contentType: string | null;
  bytes: number;
  error?:
    | "unsafe_redirect"
    | "too_many_redirects"
    | "body_too_large"
    | "fetch_failed"
    | "invalid_json"
    | "invalid_schema";
}

const MAX_RESPONSE_BYTES = 512 * 1024;

const DISCOVERY_PATHS = [
  "/",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/.well-known/ucp",
  "/merchant-context.json",
] as const;

const CHECK_IDS: ReadinessCheck["id"][] = [
  "website",
  "robots_txt",
  "sitemap",
  "llms_txt",
  "ucp_profile",
  "merchant_context",
];

const PRIVATE_HOST_SUFFIXES = [".local", ".internal", ".test", ".invalid"];

export async function inspectMerchant(
  target: string,
  options: InspectOptions = {},
): Promise<MerchantInspection> {
  const origin = normalizePublicOrigin(target);
  const fetcher = options.fetcher ?? fetch;
  const resources = await Promise.all(
    DISCOVERY_PATHS.map(async (path) => {
      try {
        return await fetchResource(path, origin, fetcher);
      } catch {
        return failedResource(path);
      }
    }),
  );
  const checks = resources.map((resource, index): ReadinessCheck => ({
    id: CHECK_IDS[index],
    path: resource.path,
    status:
      resource.error === undefined &&
      resource.status >= 200 &&
      resource.status < 300
        ? "pass"
        : "fail",
  }));
  const passed = checks.filter((check) => check.status === "pass").length;

  return {
    origin,
    resources,
    checks,
    summary: {
      passed,
      total: checks.length,
      score: Math.round((passed / checks.length) * 100),
    },
  };
}

async function fetchResource(
  path: string,
  origin: string,
  fetcher: typeof fetch,
): Promise<InspectedResource> {
  let currentUrl = new URL(path, origin);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetcher(currentUrl.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
      headers: {
        accept:
          "text/html, application/json, text/plain, application/xml, text/xml",
        "user-agent":
          "MerchantContextBot/0.1 (+https://merchant.atomandbits.com)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (location === null) {
        return resourceResult(path, response, 0);
      }

      if (redirectCount === 3) {
        return {
          ...resourceResult(path, response, 0),
          error: "too_many_redirects",
        };
      }

      const nextUrl = new URL(location, currentUrl);

      try {
        normalizePublicOrigin(nextUrl.toString());
      } catch {
        return {
          ...resourceResult(path, response, 0),
          error: "unsafe_redirect",
        };
      }

      currentUrl = nextUrl;
      continue;
    }

    const contentLength = Number(response.headers.get("content-length"));

    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
      await response.body?.cancel();
      return { ...resourceResult(path, response, 0), error: "body_too_large" };
    }

    const body = await readBody(response);

    if (body === null) {
      return { ...resourceResult(path, response, 0), error: "body_too_large" };
    }

    const result = resourceResult(path, response, body.bytes);

    if (
      (path === "/.well-known/ucp" || path === "/merchant-context.json") &&
      response.status >= 200 &&
      response.status < 300
    ) {
      try {
        const parsed = JSON.parse(body.text) as unknown;

        if (
          path === "/merchant-context.json" &&
          !merchantContextSchema.safeParse(parsed).success
        ) {
          return { ...result, error: "invalid_schema" };
        }
      } catch {
        return { ...result, error: "invalid_json" };
      }
    }

    return result;
  }

  throw new Error("Unreachable redirect state");
}

function failedResource(path: string): InspectedResource {
  return {
    path,
    status: 0,
    contentType: null,
    bytes: 0,
    error: "fetch_failed",
  };
}

async function readBody(
  response: Response,
): Promise<{ bytes: number; text: string } | null> {
  if (response.body === null) {
    return { bytes: 0, text: "" };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const chunk = await reader.read();

    if (chunk.done) {
      text += decoder.decode();
      return { bytes, text };
    }

    bytes += chunk.value.byteLength;

    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      return null;
    }

    text += decoder.decode(chunk.value, { stream: true });
  }
}

function resourceResult(
  path: string,
  response: Response,
  bytes: number,
): InspectedResource {
  return {
    path,
    status: response.status,
    contentType: response.headers.get("content-type"),
    bytes,
  };
}

export function normalizePublicOrigin(target: string): string {
  let url: URL;

  try {
    url = new URL(target);
  } catch {
    throw unsafeUrlError();
  }

  const hostname = url.hostname.toLowerCase();
  const hasBlockedSuffix = PRIVATE_HOST_SUFFIXES.some((suffix) =>
    hostname.endsWith(suffix),
  );
  const isIpLiteral =
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    (url.port !== "" && url.port !== "443") ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hasBlockedSuffix ||
    isIpLiteral
  ) {
    throw unsafeUrlError();
  }

  return url.origin;
}

function unsafeUrlError(): Error {
  return new Error("Merchant URL must be a public HTTPS origin");
}
