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
    input = {},
    merchantContext,
    browserPage,
    confirm,
  } = options;

  const origin = normalizePublicHttpsOrigin(merchantOrigin);
  requireFunction(merchantContext?.resolveMerchant, "merchantContext.resolveMerchant");
  requireFunction(browserPage?.callWebMcpTool, "browserPage.callWebMcpTool");

  // This must finish before any page tool is called.
  const resolution = await merchantContext.resolveMerchant(origin);
  const actions = merchantContext.getActions
    ? await merchantContext.getActions({ merchant: origin, resolution })
    : resolution?.actions;
  const action = actions?.find((candidate) => candidate.id === actionId);

  if (!action) throw new PreflightError(`Safe action not found: ${actionId}`);
  assertMerchantOwnedUrl(action.url, origin, resolution?.aliases ?? []);
  if (action.ready !== true) throw new PreflightError("Safe action is not ready for handoff");
  if (!action.webmcp_tool) throw new PreflightError("Safe action has no WebMCP tool name");
  if (!action.merchant_context_session) {
    throw new PreflightError("Safe action has no merchant_context_session");
  }

  if (isConsequential(action)) {
    requireFunction(confirm, "confirm");
    const approved = await confirm({ merchantOrigin: origin, action, input: { ...input } });
    if (approved !== true) throw new PreflightError("Human confirmation was not granted");
  }

  return browserPage.callWebMcpTool(action.webmcp_tool, {
    ...input,
    merchant_context_session: action.merchant_context_session,
  });
}

function isConsequential(action) {
  return action.human_confirmation === true || action.consequential === true;
}

function normalizePublicHttpsOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw new PreflightError("Merchant must be a valid URL"); }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new PreflightError("Merchant must be a public HTTPS origin");
  }
  if (!HTTPS_ORIGIN.test(url.origin) || isPrivateHost(url.hostname)) {
    throw new PreflightError("Merchant must be a public HTTPS origin");
  }
  return url.origin;
}

function isPrivateHost(host) {
  return host === "localhost" || host.endsWith(".local") || host === "127.0.0.1" || host === "::1" ||
    /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

function assertMerchantOwnedUrl(value, origin, aliases) {
  let actionOrigin;
  try { actionOrigin = new URL(value).origin; } catch { throw new PreflightError("Safe action URL is invalid"); }
  const allowed = new Set([origin, ...aliases.map((alias) => new URL(alias).origin)]);
  if (!allowed.has(actionOrigin)) throw new PreflightError("Safe action URL is not merchant-owned");
}

function requireFunction(value, name) {
  if (typeof value !== "function") throw new TypeError(`${name} must be a function`);
}
