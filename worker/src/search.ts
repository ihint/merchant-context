import type {
  Freshness,
  MerchantPrice,
  MerchantResolution,
  ResolvedOffer,
  SafeAction,
  SourcedValue,
} from "./contracts";

export interface MerchantSearch {
  item_or_service?: string;
  geography?: string;
  maximum_price?: MerchantPrice;
  timing?: string;
  policy?: string;
  action_type?: SafeAction["type"];
  freshness?: Freshness | "any";
  max_stale_seconds?: number;
  now?: string | Date;
}

export interface MerchantSearchResult {
  origin: string;
  resolution: MerchantResolution;
  matching_offers: ResolvedOffer[];
}

export interface SearchableMerchantResolution {
  status: MerchantResolution["status"];
  merchant: MerchantResolution["merchant"];
  offers: ResolvedOffer[];
  policies: MerchantResolution["policies"];
  supported_geography: MerchantResolution["supported_geography"];
  actions: Array<Pick<SafeAction, "type">>;
  record: Pick<
    MerchantResolution["record"],
    "observed_at" | "expires_at" | "stale"
  >;
}

export interface SearchResult<T extends SearchableMerchantResolution> {
  origin: string;
  resolution: T;
  matching_offers: ResolvedOffer[];
}

export function search_merchants<T extends SearchableMerchantResolution>(
  records: readonly T[],
  query: MerchantSearch = {},
): SearchResult<T>[] {
  const results: SearchResult<T>[] = [];
  for (const resolution of records) {
    if (!matchesFreshness(resolution, query)) continue;
    if (
      query.action_type &&
      !resolution.actions.some((action) => action.type === query.action_type)
    )
      continue;
    if (
      query.policy &&
      !resolution.policies.some((policy) =>
        sourcedText(policy.name, policy.url).some((v) =>
          includes(v, query.policy!),
        ),
      )
    )
      continue;

    const matchingOffers = resolution.offers.filter((offer) =>
      matchesOffer(offer, resolution, query),
    );
    const hasOfferFilter = Boolean(
      query.item_or_service ||
      query.geography ||
      query.maximum_price ||
      query.timing,
    );
    if (hasOfferFilter && matchingOffers.length === 0) continue;
    if (
      query.geography &&
      !hasOfferFilterMatch(resolution.supported_geography, query.geography) &&
      !resolution.offers.some((offer) =>
        hasOfferFilterMatch(offer.geography, query.geography!),
      )
    )
      continue;
    results.push({
      origin: resolution.merchant.origin,
      resolution,
      matching_offers: matchingOffers,
    });
  }
  return results.sort((a, b) => a.origin.localeCompare(b.origin));
}

export const searchMerchants = search_merchants;

function matchesOffer(
  offer: ResolvedOffer,
  resolution: SearchableMerchantResolution,
  query: MerchantSearch,
): boolean {
  if (
    query.item_or_service &&
    !sourcedText(offer.name, offer.description).some((v) =>
      includes(v, query.item_or_service!),
    )
  )
    return false;
  if (
    query.geography &&
    !hasOfferFilterMatch(offer.geography, query.geography) &&
    !hasOfferFilterMatch(resolution.supported_geography, query.geography)
  )
    return false;
  if (query.timing && !knownIncludes(offer.timing, query.timing)) return false;
  if (query.maximum_price && !withinPrice(offer.price, query.maximum_price))
    return false;
  return true;
}

function withinPrice(
  value: SourcedValue<MerchantPrice>,
  maximum: MerchantPrice,
): boolean {
  return (
    value.state === "known" &&
    value.value.currency.toUpperCase() === maximum.currency.toUpperCase() &&
    value.value.amount <= maximum.amount
  );
}

function hasOfferFilterMatch(
  value: SourcedValue<string[]>,
  expected: string,
): boolean {
  return (
    value.state === "known" &&
    value.value.some((entry) => includes(entry, expected))
  );
}

function knownIncludes(value: SourcedValue<string>, expected: string): boolean {
  return value.state === "known" && includes(value.value, expected);
}

function sourcedText(...values: SourcedValue<string>[]): string[] {
  return values.flatMap((value) =>
    value.state === "known" ? [value.value] : [],
  );
}

function includes(value: string, expected: string): boolean {
  return value
    .toLocaleLowerCase()
    .includes(expected.trim().toLocaleLowerCase());
}

function matchesFreshness(
  resolution: SearchableMerchantResolution,
  query: MerchantSearch,
): boolean {
  const freshness = query.freshness;
  if (freshness === "stale" && !resolution.record.stale) return false;
  if (freshness === "fresh" && resolution.record.stale) return false;
  if (freshness === "unknown" && resolution.status !== "unknown") return false;
  if (query.max_stale_seconds !== undefined) {
    const observed = new Date(resolution.record.observed_at).getTime();
    const now =
      query.now instanceof Date
        ? query.now.getTime()
        : new Date(query.now ?? Date.now()).getTime();
    return (
      Number.isFinite(observed) &&
      now - observed <= query.max_stale_seconds * 1_000
    );
  }
  return true;
}
