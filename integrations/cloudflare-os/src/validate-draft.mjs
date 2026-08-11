export function validateDraftBlueprint(value) {
  const errors = [];
  if (value?.draft !== true) errors.push("draft must be true");
  if (!String(value?.notice ?? "").toLowerCase().includes("no stable public")) errors.push("notice must deny a stable public contract claim");
  if (value?.gatekeeper?.tool !== "resolve_merchant" || value?.gatekeeper?.require_success !== true) errors.push("gatekeeper must require resolve_merchant");
  for (const scope of ["merchant_fact", "merchant_action"]) {
    if (!value?.gatekeeper?.before?.includes(scope)) errors.push(`gatekeeper must run before ${scope}`);
  }
  const defaults = value?.tools?.default ?? [];
  for (const tool of ["resolve_merchant", "search_merchants", "compare_offers", "get_safe_actions", "preflight"]) {
    if (!defaults.includes(tool)) errors.push(`${tool} must be a default tool`);
  }
  for (const paid of ["refresh_merchant", "inspect_merchant"]) {
    if (defaults.includes(paid)) errors.push(`${paid} must not be a default tool`);
    if (!value?.tools?.not_default?.includes(paid)) errors.push(`${paid} must be marked not_default`);
  }
  if (!value?.webmcp?.input_fields?.includes("merchant_context_session")) errors.push("WebMCP input must include merchant_context_session");
  if (value?.actions?.consequential?.human_confirmation !== "required") errors.push("consequential actions must require human confirmation");
  return errors;
}
