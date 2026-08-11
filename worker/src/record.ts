import type {
  ActionInput,
  EvidenceSource,
  MerchantPrice,
  SafeAction,
  SourcedValue,
} from "./contracts";
import { normalizePublicOrigin } from "./inspect";
import { merchantContextSchema } from "./schema";

export type NormalizedAction = Omit<SafeAction, "attribution">;

export interface NormalizedMerchantRecord {
  version: string;
  merchant: {
    name: SourcedValue<string>;
    legal_name: SourcedValue<string>;
    origin: string;
    aliases: string[];
  };
  facts: Array<{ id: string; label: string; value: SourcedValue<unknown> }>;
  offers: Array<{
    id: string;
    name: SourcedValue<string>;
    description: SourcedValue<string>;
    canonical_url: SourcedValue<string>;
    price: SourcedValue<MerchantPrice>;
    availability: SourcedValue<string>;
    timing: SourcedValue<string>;
    geography: SourcedValue<string[]>;
    terms: SourcedValue<string[]>;
  }>;
  policies: Array<{
    id: string;
    name: SourcedValue<string>;
    url: SourcedValue<string>;
  }>;
  supported_geography: SourcedValue<string[]>;
  actions: NormalizedAction[];
  evidence: EvidenceSource[];
  evidence_hash: string;
  source_url: string;
  observed_at: string;
  expires_at: string;
}

export interface NormalizeRecordOptions {
  fetchedOrigin: string;
  sourceUrl?: string;
  observedAt?: string;
  expiresAt?: string;
  aliases?: string[];
}

export async function normalizeMerchantRecord(
  input: unknown,
  options: NormalizeRecordOptions,
): Promise<NormalizedMerchantRecord> {
  const parsed = merchantContextSchema.parse(input);
  const fetchedOrigin = normalizePublicOrigin(options.fetchedOrigin);
  const canonicalOrigin = normalizePublicOrigin(parsed.merchant.canonical_url);

  if (canonicalOrigin !== fetchedOrigin) {
    throw new Error("Merchant record origin does not match fetched origin");
  }

  const observedAt = options.observedAt ?? parsed.provenance.generated_at;
  const expiresAt = options.expiresAt ?? observedAt;
  const sourceUrl =
    options.sourceUrl ?? `${fetchedOrigin}/merchant-context.json`;
  const stale = Date.parse(expiresAt) <= Date.now();
  const source: EvidenceSource = {
    url: sourceUrl,
    observed_at: observedAt,
    expires_at: expiresAt,
    freshness: stale ? "stale" : "fresh",
  };
  const evidence = uniqueEvidence([
    source,
    ...parsed.provenance.source_urls.map((url) => ({ ...source, url })),
  ]);
  const known = <T>(value: T): SourcedValue<T> => ({
    state: "known",
    value,
    evidence,
  });
  const unknown = <T>(reason: string): SourcedValue<T> => ({
    state: "unknown",
    reason,
    evidence,
  });
  const aliases = normalizeAliases(options.aliases ?? [], fetchedOrigin);
  const allowedOrigins = new Set([fetchedOrigin, ...aliases]);
  const actions = parsed.actions.flatMap((action, index) => {
    if (!isMerchantOwnedAction(action.url, allowedOrigins)) return [];
    if (action.method !== "GET") return [];
    const expires = expiresAt;
    return [
      {
        id: `${action.name}-${index + 1}`,
        type: action.name,
        method: action.method,
        url: action.url,
        required_inputs: [] as ActionInput[],
        allowed_authority: "navigate" as const,
        human_confirmation_required: action.human_confirmation_required,
        expires_at: expires,
        idempotency: {
          supported: null,
          key_header: null,
          instructions:
            "The merchant record does not state an idempotency rule.",
        },
        recovery: {
          url:
            parsed.merchant.support_url &&
            isMerchantOwnedAction(parsed.merchant.support_url, allowedOrigins)
              ? parsed.merchant.support_url
              : parsed.merchant.canonical_url,
          instructions:
            "Contact the merchant before retrying an action with an unknown result.",
        },
      },
    ];
  });

  const normalizedWithoutHash = {
    version: parsed.version,
    merchant: {
      name: known(parsed.merchant.name),
      legal_name: parsed.merchant.legal_name
        ? known(parsed.merchant.legal_name)
        : unknown<string>("The merchant record does not state a legal name."),
      origin: fetchedOrigin,
      aliases,
    },
    facts: [],
    offers: parsed.offers.map((offer) => ({
      id: offer.id,
      name: known(offer.name),
      description: known(offer.description),
      canonical_url: known(offer.canonical_url),
      price: offer.price
        ? known(offer.price)
        : unknown<MerchantPrice>("The merchant record does not state a price."),
      availability: known(offer.availability),
      timing: unknown<string>("The merchant record does not state timing."),
      geography: unknown<string[]>(
        "The merchant record does not state geography.",
      ),
      terms: offer.limits
        ? known(offer.limits)
        : unknown<string[]>("The merchant record does not state terms."),
    })),
    policies: parsed.policies.map((policy, index) => ({
      id: `policy-${index + 1}`,
      name: known(policy.name),
      url: known(policy.url),
    })),
    supported_geography: unknown<string[]>(
      "The merchant record does not state supported geography.",
    ),
    actions,
    evidence,
    source_url: sourceUrl,
    observed_at: observedAt,
    expires_at: expiresAt,
  };

  return {
    ...normalizedWithoutHash,
    evidence_hash: await stableEvidenceHash(parsed),
  };
}

export function isMerchantOwnedAction(
  actionUrl: string,
  merchantOrigins: ReadonlySet<string> | readonly string[],
): boolean {
  try {
    const origin = normalizePublicOrigin(actionUrl);
    return new Set(merchantOrigins).has(origin);
  } catch {
    return false;
  }
}

export async function stableEvidenceHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function normalizeAliases(
  aliases: string[],
  canonicalOrigin: string,
): string[] {
  return [...new Set(aliases.map(normalizePublicOrigin))]
    .filter((origin) => origin !== canonicalOrigin)
    .sort();
}

function uniqueEvidence(evidence: EvidenceSource[]): EvidenceSource[] {
  const byUrl = new Map(evidence.map((item) => [item.url, item]));
  return [...byUrl.values()].sort((left, right) =>
    left.url.localeCompare(right.url),
  );
}
