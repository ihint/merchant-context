import type {
  EvidenceSource,
  MerchantResolution,
  PreflightResult,
  ResolvedOffer,
} from "./contracts";
import type { OfferComparison } from "./compare";
import type { MerchantSearchResult } from "./search";

export type Detail = "compact" | "full";

export const EVIDENCE_RULE =
  "Fields without their own evidence use record.evidence.";

// A normalized record gives every sourced field the same record-level evidence
// list. Compact output keeps that list once and removes identical copies from
// fields. A field whose evidence differs keeps its own list, so nothing is lost.
export function compactResolution(resolution: MerchantResolution) {
  const shared = sharedEvidence(resolution.merchant?.name?.evidence);
  if (shared === null) return resolution;

  return {
    ...(stripEvidence(resolution, shared) as MerchantResolution),
    record: {
      ...resolution.record,
      evidence: shared.list,
      evidence_rule: EVIDENCE_RULE,
    },
  };
}

export function compactSearch(results: MerchantSearchResult[]) {
  return results.map(({ origin, resolution, matching_offers }) => ({
    origin,
    resolution: compactResolution(resolution),
    matching_offer_ids: matching_offers.map((offer) => offer.id),
  }));
}

export function compactPreflight(result: PreflightResult) {
  return { ...result, resolution: compactResolution(result.resolution) };
}

export function compactComparison(comparison: OfferComparison) {
  const sharedByOrigin = new Map<string, SharedEvidence>();

  for (const { origin, offer } of comparison.offers) {
    if (sharedByOrigin.has(origin)) continue;
    const shared = sharedEvidence(offer.name?.evidence);
    if (shared !== null) sharedByOrigin.set(origin, shared);
  }

  return {
    merchants: comparison.merchants.map((merchant) => {
      const shared = sharedByOrigin.get(merchant.origin);
      return shared === undefined
        ? merchant
        : {
            ...merchant,
            record: {
              ...merchant.record,
              evidence: shared.list,
              evidence_rule: EVIDENCE_RULE,
            },
          };
    }),
    offers: comparison.offers.map((item) => {
      const shared = sharedByOrigin.get(item.origin);
      return shared === undefined
        ? item
        : {
            ...item,
            offer: stripEvidence(item.offer, shared) as ResolvedOffer,
          };
    }),
  };
}

interface SharedEvidence {
  list: EvidenceSource[];
  key: string;
}

function sharedEvidence(evidence: unknown): SharedEvidence | null {
  return Array.isArray(evidence)
    ? { list: evidence as EvidenceSource[], key: JSON.stringify(evidence) }
    : null;
}

function stripEvidence(value: unknown, shared: SharedEvidence): unknown {
  if (Array.isArray(value))
    return value.map((item) => stripEvidence(item, shared));
  if (value === null || typeof value !== "object") return value;
  const object = value as Record<string, unknown>;
  const isSourcedValue = "state" in object && "evidence" in object;

  return Object.fromEntries(
    Object.entries(object)
      .filter(
        ([key, item]) =>
          !(
            isSourcedValue &&
            key === "evidence" &&
            JSON.stringify(item) === shared.key
          ),
      )
      .map(([key, item]) => [key, stripEvidence(item, shared)]),
  );
}
