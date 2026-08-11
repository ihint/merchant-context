import {
  MERCHANT_PREFLIGHT_CONTRACT_VERSION,
  type AttributionSession,
  type MerchantResolution,
  type SafeAction,
} from "./contracts";
import { normalizePublicOrigin } from "./inspect";
import {
  normalizeMerchantRecord,
  type NormalizedMerchantRecord,
} from "./record";

export interface MerchantRecordStore {
  get(origin: string): Promise<NormalizedMerchantRecord | null>;
  put(origin: string, record: NormalizedMerchantRecord): Promise<void>;
}

export interface AttributionSessionMinter {
  mint(input: {
    merchant_origin: string;
    record_version: string;
    action_id: string;
  }): Promise<AttributionSession>;
}

export interface ResolveMerchantDependencies {
  store: MerchantRecordStore;
  sessionMinter: AttributionSessionMinter;
  fetcher?: typeof fetch;
  now?: () => Date;
  cacheTtlSeconds?: number;
}

export async function resolveMerchant(
  merchant: string,
  dependencies: ResolveMerchantDependencies,
): Promise<MerchantResolution> {
  const origin = normalizePublicOrigin(merchant);
  const now = dependencies.now?.() ?? new Date();
  let record = await dependencies.store.get(origin);
  let cache: MerchantResolution["record"]["cache"];

  if (record !== null) {
    cache =
      Date.parse(record.expires_at) <= now.getTime() ? "stale_hit" : "hit";
  } else {
    cache = "miss";
    try {
      record = await fetchFreeRecord(origin, now, dependencies);
    } catch {
      record = null;
    }
    if (record === null) return unknownResolution(origin, now, cache);
    await dependencies.store.put(origin, record);
  }

  const stale = Date.parse(record.expires_at) <= now.getTime();
  if (stale) record = markEvidenceStale(record);
  const actions = await Promise.all(
    record.actions.map(async (action): Promise<SafeAction> => ({
      ...action,
      attribution: await dependencies.sessionMinter.mint({
        merchant_origin: origin,
        record_version: record!.version,
        action_id: action.id,
      }),
    })),
  );

  return {
    contract_version: MERCHANT_PREFLIGHT_CONTRACT_VERSION,
    status: "resolved",
    merchant: record.merchant,
    facts: record.facts,
    offers: record.offers,
    policies: record.policies,
    supported_geography: record.supported_geography,
    actions,
    selected_action: null,
    approval_required: false,
    next_steps: actions.length ? ["Select a merchant-owned action."] : [],
    record: {
      version: record.version,
      evidence_hash: record.evidence_hash,
      source_url: record.source_url,
      observed_at: record.observed_at,
      expires_at: record.expires_at,
      stale,
      cache,
    },
  };
}

async function fetchFreeRecord(
  origin: string,
  now: Date,
  dependencies: ResolveMerchantDependencies,
): Promise<NormalizedMerchantRecord | null> {
  const sourceUrl = `${origin}/merchant-context.json`;
  const response = await (dependencies.fetcher ?? fetch)(sourceUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
    headers: { accept: "application/json" },
  });
  if (!response.ok) return null;
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 512 * 1024) return null;
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > 512 * 1024) return null;
  const observedAt = now.toISOString();
  const ttl = dependencies.cacheTtlSeconds ?? 3600;
  return normalizeMerchantRecord(JSON.parse(body) as unknown, {
    fetchedOrigin: origin,
    sourceUrl,
    observedAt,
    expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
  });
}

function markEvidenceStale(
  record: NormalizedMerchantRecord,
): NormalizedMerchantRecord {
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit);
    if (value === null || typeof value !== "object") return value;
    const object = value as Record<string, unknown>;
    if ("url" in object && "observed_at" in object && "freshness" in object) {
      return { ...object, freshness: "stale" };
    }
    return Object.fromEntries(
      Object.entries(object).map(([key, item]) => [key, visit(item)]),
    );
  };
  return visit(record) as NormalizedMerchantRecord;
}

function unknownResolution(
  origin: string,
  now: Date,
  cache: "miss",
): MerchantResolution {
  const unknown = <T>(reason: string) => ({
    state: "unknown" as const,
    reason,
    evidence: [],
  });
  return {
    contract_version: MERCHANT_PREFLIGHT_CONTRACT_VERSION,
    status: "unknown",
    merchant: {
      name: unknown<string>("No cached or public merchant record was found."),
      legal_name: unknown<string>(
        "No cached or public merchant record was found.",
      ),
      origin,
      aliases: [],
    },
    facts: [],
    offers: [],
    policies: [],
    supported_geography: unknown<string[]>(
      "No cached or public merchant record was found.",
    ),
    actions: [],
    selected_action: null,
    approval_required: false,
    next_steps: ["Use the paid refresh path only with explicit approval."],
    record: {
      version: "unknown",
      evidence_hash: "",
      source_url: `${origin}/merchant-context.json`,
      observed_at: now.toISOString(),
      expires_at: now.toISOString(),
      stale: false,
      cache,
    },
  };
}
