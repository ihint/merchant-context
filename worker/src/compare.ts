import type { MerchantResolution, ResolvedOffer } from "./contracts";

export interface ComparedOffer {
  origin: string;
  offer: ResolvedOffer;
  record: Pick<MerchantResolution["record"], "version" | "source_url" | "observed_at" | "expires_at" | "stale">;
}

export function compare_offers(records: readonly MerchantResolution[]): ComparedOffer[] {
  return records
    .flatMap((resolution) =>
      resolution.offers.map((offer) => ({
        origin: resolution.merchant.origin,
        offer,
        record: {
          version: resolution.record.version,
          source_url: resolution.record.source_url,
          observed_at: resolution.record.observed_at,
          expires_at: resolution.record.expires_at,
          stale: resolution.record.stale,
        },
      })),
    )
    .sort((a, b) => a.origin.localeCompare(b.origin) || a.offer.id.localeCompare(b.offer.id));
}

export const compareOffers = compare_offers;
