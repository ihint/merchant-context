const HTTPS_ORIGIN = /^https:\/\/[^/]+$/;

export class PreflightError extends Error {}

/**
 * Run one merchant page tool after a free Merchant Context resolution.
 * All I/O is injected so importing this module cannot start paid browser work.
 */
export async function runPreflightedWebMcpAction(options) {
  const {
    merchantOrigin,
    actionId,
    webMcpTool,
    input = {},
    merchantContext,
    browserPage,
    confirm,
  } = options;

  const origin = normalizePublicHttpsOrigin(merchantOrigin);
  requireFunction(
    merchantContext?.resolveMerchant,
    "merchantContext.resolveMerchant",
  );
  requireFunction(browserPage?.callWebMcpTool, "browserPage.callWebMcpTool");

  // This must finish before any page tool is called.
  const resolution = await merchantContext.resolveMerchant(origin);
  const actionResult = merchantContext.getActions
    ? await merchantContext.getActions({ merchant: origin, resolution })
    : resolution?.actions;
  const actions = Array.isArray(actionResult)
    ? actionResult
    : actionResult?.actions;
  const action = actions?.find((candidate) => candidate.id === actionId);

  if (!action) throw new PreflightError(`Safe action not found: ${actionId}`);
  assertMerchantOwnedUrl(
    action.url,
    origin,
    resolution?.merchant?.aliases ?? [],
  );
  if (new Date(action.expires_at).getTime() <= Date.now()) {
    throw new PreflightError("Safe action has expired");
  }
  if (typeof webMcpTool !== "string" || webMcpTool.length === 0) {
    throw new PreflightError("WebMCP tool mapping is required");
  }
  if (!action.attribution?.token) {
    throw new PreflightError("Safe action has no merchant_context_session");
  }

  if (isConsequential(action)) {
    requireFunction(confirm, "confirm");
    const approved = await confirm({
      merchantOrigin: origin,
      action,
      input: { ...input },
    });
    if (approved !== true)
      throw new PreflightError("Human confirmation was not granted");
  }

  return browserPage.callWebMcpTool(webMcpTool, {
    ...input,
    merchant_context_session: action.attribution.token,
  });
}

function isConsequential(action) {
  return (
    action.human_confirmation_required === true ||
    action.allowed_authority === "submit"
  );
}

function normalizePublicHttpsOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new PreflightError("Merchant must be a valid URL");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new PreflightError("Merchant must be a public HTTPS origin");
  }
  if (!HTTPS_ORIGIN.test(url.origin) || isPrivateHost(url.hostname)) {
    throw new PreflightError("Merchant must be a public HTTPS origin");
  }
  return url.origin;
}

function isPrivateHost(host) {
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function assertMerchantOwnedUrl(value, origin, aliases) {
  let actionOrigin;
  try {
    actionOrigin = new URL(value).origin;
  } catch {
    throw new PreflightError("Safe action URL is invalid");
  }
  const allowed = new Set([
    origin,
    ...aliases.map((alias) => new URL(alias).origin),
  ]);
  if (!allowed.has(actionOrigin))
    throw new PreflightError("Safe action URL is not merchant-owned");
}

function requireFunction(value, name) {
  if (typeof value !== "function")
    throw new TypeError(`${name} must be a function`);
}
