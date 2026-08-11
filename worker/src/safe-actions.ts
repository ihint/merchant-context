import type { MerchantResolution, SafeAction } from "./contracts";

export interface SafeActionsRequest {
  action_type?: SafeAction["type"];
  allowed_authority?: SafeAction["allowed_authority"][];
  human_confirmation_available?: boolean;
  now?: string | Date;
}

export interface SafeActionsResult {
  origin: string;
  actions: SafeAction[];
  rejected: Array<{ action: SafeAction; reason: string }>;
}

export function get_safe_actions(resolution: MerchantResolution, request: SafeActionsRequest = {}): SafeActionsResult {
  const actions: SafeAction[] = [];
  const rejected: SafeActionsResult["rejected"] = [];
  const now = request.now instanceof Date ? request.now : new Date(request.now ?? Date.now());
  const owners = new Set([resolution.merchant.origin, ...resolution.merchant.aliases].map(validOrigin).filter((v): v is string => v !== null));

  for (const action of resolution.actions) {
    let reason: string | null = null;
    const actionOrigin = validOrigin(action.url);
    const recoveryOrigin = validOrigin(action.recovery.url);
    if (!actionOrigin || !owners.has(actionOrigin)) reason = "Action URL is not owned by the merchant";
    else if (!recoveryOrigin || !owners.has(recoveryOrigin)) reason = "Recovery URL is not owned by the merchant";
    else if (request.action_type && action.type !== request.action_type) reason = "Action type does not match";
    else if (request.allowed_authority && !request.allowed_authority.includes(action.allowed_authority)) reason = "Action authority is not allowed";
    else if (action.human_confirmation_required && request.human_confirmation_available === false) reason = "Human confirmation is not available";
    else if (!Number.isFinite(new Date(action.expires_at).getTime()) || new Date(action.expires_at) <= now) reason = "Action has expired";
    else if (!Number.isFinite(new Date(action.attribution.expires_at).getTime()) || new Date(action.attribution.expires_at) <= now) reason = "Attribution session has expired";
    if (reason) rejected.push({ action, reason });
    else actions.push(action);
  }
  return { origin: resolution.merchant.origin, actions: actions.sort((a, b) => a.id.localeCompare(b.id)), rejected };
}

export const getSafeActions = get_safe_actions;

function validOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.origin.toLowerCase() : null;
  } catch {
    return null;
  }
}
