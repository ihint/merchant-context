import {
  MERCHANT_PREFLIGHT_CONTRACT_VERSION,
  type EvidenceSource,
  type MerchantResolution,
  type PreflightConstraints,
  type PreflightIntent,
  type PreflightResult,
  type SafeAction,
} from "./contracts";

export function preflight(
  resolution: MerchantResolution,
  intent: PreflightIntent = {},
  constraints: PreflightConstraints = {},
  now: Date = new Date(),
): PreflightResult {
  const reasons: string[] = [];
  let hasBlockingReason = false;
  let hasUnknownReason = false;
  const evidence = collectEvidence(resolution);
  if (resolution.status === "unknown") {
    reasons.push("Merchant facts are unknown.");
    hasUnknownReason = true;
  }

  if (resolution.record.stale) {
    const ageSeconds = Math.max(
      0,
      (now.getTime() - Date.parse(resolution.record.expires_at)) / 1000,
    );
    if (
      constraints.max_stale_seconds !== undefined &&
      ageSeconds > constraints.max_stale_seconds
    ) {
      reasons.push("Merchant evidence is too stale for these constraints.");
      hasBlockingReason = true;
    } else {
      reasons.push("Merchant evidence is stale.");
    }
  }

  let candidates = resolution.actions.filter(
    (action) => Date.parse(action.expires_at) > now.getTime(),
  );
  if (intent.action_type)
    candidates = candidates.filter(
      (action) => action.type === intent.action_type,
    );
  if (constraints.allowed_authority) {
    candidates = candidates.filter((action) =>
      constraints.allowed_authority!.includes(action.allowed_authority),
    );
  }
  const selected = candidates[0] ?? null;
  if (selected === null) {
    reasons.push(
      resolution.actions.length > 0
        ? "No action meets the requested type, authority, and expiry."
        : "The record has no safe merchant-owned action.",
    );
    hasBlockingReason = true;
  }

  if (intent.item_or_service) {
    const match = matchesItem(resolution, intent.item_or_service);
    if (match === false) {
      reasons.push("No sourced offer matches the requested item or service.");
      hasBlockingReason = true;
    }
    if (match === null) {
      reasons.push(
        "The record does not state enough offer detail to match the request.",
      );
      hasUnknownReason = true;
    }
  }
  if (intent.maximum_price) {
    const match = hasPriceWithinLimit(resolution, intent.maximum_price);
    if (match === false) {
      reasons.push("No sourced offer meets the maximum price.");
      hasBlockingReason = true;
    }
    if (match === null) {
      reasons.push("Offer prices are unknown.");
      hasUnknownReason = true;
    }
  }
  if (intent.geography) {
    const match = supportsGeography(resolution, intent.geography);
    if (match === false) {
      reasons.push(
        "The requested geography is not supported by sourced evidence.",
      );
      hasBlockingReason = true;
    }
    if (match === null) {
      reasons.push("Supported geography is unknown.");
      hasUnknownReason = true;
    }
  }
  if (intent.timing) {
    const match = matchesTiming(resolution, intent.timing);
    if (match === false) {
      reasons.push("No sourced offer matches the requested timing.");
      hasBlockingReason = true;
    }
    if (match === null) {
      reasons.push("Offer timing is unknown.");
      hasUnknownReason = true;
    }
  }

  const confirmationRequired = selected?.human_confirmation_required === true;
  const confirmationUnavailable =
    confirmationRequired && constraints.human_confirmation_available === false;
  if (confirmationUnavailable) {
    reasons.push("Human confirmation is not available for this action.");
    hasBlockingReason = true;
  } else if (confirmationRequired) {
    reasons.push("The action needs human confirmation.");
  }
  if (evidence.length === 0) hasUnknownReason = true;
  const decision = hasBlockingReason
    ? "blocked"
    : confirmationRequired
      ? "needs_confirmation"
      : hasUnknownReason
        ? "unknown"
        : "ready";

  return {
    contract_version: MERCHANT_PREFLIGHT_CONTRACT_VERSION,
    resolution: {
      ...resolution,
      selected_action: selected,
      approval_required: confirmationRequired,
    },
    evidence,
    selected_safe_action: selected,
    approval_required: confirmationRequired,
    decision,
    reasons,
    attribution_session: selected?.attribution ?? null,
  };
}

export const preflightMerchant = preflight;

function collectEvidence(resolution: MerchantResolution): EvidenceSource[] {
  const evidence: EvidenceSource[] = [];
  const add = (items: EvidenceSource[]) => evidence.push(...items);
  add(resolution.merchant.name.evidence);
  add(resolution.merchant.legal_name.evidence);
  resolution.facts.forEach((fact) => add(fact.value.evidence));
  resolution.offers.forEach((offer) =>
    Object.values(offer).forEach((value) => {
      if (typeof value === "object" && value && "evidence" in value)
        add((value as { evidence: EvidenceSource[] }).evidence);
    }),
  );
  resolution.policies.forEach((policy) => {
    add(policy.name.evidence);
    add(policy.url.evidence);
  });
  add(resolution.supported_geography.evidence);
  return [
    ...new Map(
      evidence.map((item) => [`${item.url}\0${item.observed_at}`, item]),
    ).values(),
  ].sort((left, right) => left.url.localeCompare(right.url));
}

function hasPriceWithinLimit(
  resolution: MerchantResolution,
  maximum: { amount: number; currency: string },
): boolean | null {
  const known = resolution.offers.filter(
    (offer) => offer.price.state === "known",
  );
  if (known.length === 0) return null;
  return known.some(
    (offer) =>
      offer.price.state === "known" &&
      offer.price.value.currency.toUpperCase() ===
        maximum.currency.toUpperCase() &&
      offer.price.value.amount <= maximum.amount,
  );
}

function supportsGeography(
  resolution: MerchantResolution,
  geography: string,
): boolean | null {
  if (resolution.supported_geography.state === "unknown") return null;
  return resolution.supported_geography.value.some(
    (value) => value.toLowerCase() === geography.toLowerCase(),
  );
}

function matchesItem(
  resolution: MerchantResolution,
  query: string,
): boolean | null {
  if (resolution.offers.length === 0) return null;
  const needle = query.toLowerCase();
  return resolution.offers.some(
    (offer) =>
      (offer.name.state === "known" &&
        offer.name.value.toLowerCase().includes(needle)) ||
      (offer.description.state === "known" &&
        offer.description.value.toLowerCase().includes(needle)),
  );
}

function matchesTiming(
  resolution: MerchantResolution,
  timing: string,
): boolean | null {
  const known = resolution.offers.filter(
    (offer) => offer.timing.state === "known",
  );
  if (known.length === 0) return null;
  return known.some(
    (offer) =>
      offer.timing.state === "known" &&
      offer.timing.value.toLowerCase().includes(timing.toLowerCase()),
  );
}
