import type { MerchantResolution, ResolvedOffer } from "./contracts";

type ComparedRecord = Pick<
  MerchantResolution["record"],
  "version" | "source_url" | "observed_at" | "expires_at" | "stale"
>;

export interface ComparedMerchant {
  origin: string;
  status: MerchantResolution["status"];
  offer_count: number;
  record: ComparedRecord;
}

export interface ComparedOffer {
  origin: string;
  offer: ResolvedOffer;
  record: ComparedRecord;
}

export interface OfferComparison {
  merchants: ComparedMerchant[];
  offers: ComparedOffer[];
}

// Every requested merchant gets a row, so a merchant with no record shows as
// unknown instead of disappearing from the comparison.
export function compare_offers(
  records: readonly MerchantResolution[],
): OfferComparison {
  const byOrigin = new Map<string, MerchantResolution>();
  for (const resolution of records) {
    if (!byOrigin.has(resolution.merchant.origin)) {
      byOrigin.set(resolution.merchant.origin, resolution);
    }
  }
  const resolutions = [...byOrigin.values()].sort((a, b) =>
    a.merchant.origin.localeCompare(b.merchant.origin),
  );

  return {
    merchants: resolutions.map((resolution) => ({
      origin: resolution.merchant.origin,
      status: resolution.status,
      offer_count: resolution.offers.length,
      record: comparedRecord(resolution),
    })),
    offers: resolutions
      .flatMap((resolution) =>
        resolution.offers.map((offer) => ({
          origin: resolution.merchant.origin,
          offer,
          record: comparedRecord(resolution),
        })),
      )
      .sort(
        (a, b) =>
          a.origin.localeCompare(b.origin) ||
          a.offer.id.localeCompare(b.offer.id),
      ),
  };
}

export const compareOffers = compare_offers;

function comparedRecord(resolution: MerchantResolution): ComparedRecord {
  return {
    version: resolution.record.version,
    source_url: resolution.record.source_url,
    observed_at: resolution.record.observed_at,
    expires_at: resolution.record.expires_at,
    stale: resolution.record.stale,
  };
}
