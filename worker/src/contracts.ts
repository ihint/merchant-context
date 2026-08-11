export const MERCHANT_PREFLIGHT_CONTRACT_VERSION = "2026-08-11" as const;

export type Freshness = "fresh" | "stale" | "unknown";
export type KnownState = "known" | "unknown";

export interface EvidenceSource {
  url: string;
  observed_at: string;
  expires_at: string | null;
  freshness: Freshness;
}

export type SourcedValue<T> =
  | {
      state: "known";
      value: T;
      evidence: EvidenceSource[];
    }
  | {
      state: "unknown";
      reason: string;
      evidence: EvidenceSource[];
    };

export interface MerchantPrice {
  amount: number;
  currency: string;
  billing_period?: "one_time" | "day" | "week" | "month" | "year";
  tax_included?: boolean;
}

export interface ResolvedOffer {
  id: string;
  name: SourcedValue<string>;
  description: SourcedValue<string>;
  canonical_url: SourcedValue<string>;
  price: SourcedValue<MerchantPrice>;
  availability: SourcedValue<string>;
  timing: SourcedValue<string>;
  geography: SourcedValue<string[]>;
  terms: SourcedValue<string[]>;
}

export interface ActionInput {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  sensitive: boolean;
}

export interface AttributionSession {
  token: string;
  expires_at: string;
  query_parameter: "merchant_context_session";
}

export interface SafeAction {
  id: string;
  type: "learn_more" | "contact" | "request_quote" | "book" | "checkout";
  method: "GET" | "POST";
  url: string;
  required_inputs: ActionInput[];
  allowed_authority: "navigate" | "prepare" | "submit";
  human_confirmation_required: boolean;
  expires_at: string;
  idempotency: {
    supported: boolean | null;
    key_header: string | null;
    instructions: string;
  };
  recovery: {
    url: string;
    instructions: string;
  };
  attribution: AttributionSession;
}

export interface MerchantResolution {
  contract_version: typeof MERCHANT_PREFLIGHT_CONTRACT_VERSION;
  status: "resolved" | "unknown";
  merchant: {
    name: SourcedValue<string>;
    legal_name: SourcedValue<string>;
    origin: string;
    aliases: string[];
  };
  facts: Array<{
    id: string;
    label: string;
    value: SourcedValue<unknown>;
  }>;
  offers: ResolvedOffer[];
  policies: Array<{
    id: string;
    name: SourcedValue<string>;
    url: SourcedValue<string>;
  }>;
  supported_geography: SourcedValue<string[]>;
  actions: SafeAction[];
  selected_action: SafeAction | null;
  approval_required: boolean;
  next_steps: string[];
  record: {
    version: string;
    evidence_hash: string;
    source_url: string;
    observed_at: string;
    expires_at: string;
    stale: boolean;
    cache: "hit" | "miss" | "stale_hit";
  };
}

export interface PreflightIntent {
  item_or_service?: string;
  action_type?: SafeAction["type"];
  geography?: string;
  maximum_price?: MerchantPrice;
  timing?: string;
}

export interface PreflightConstraints {
  max_stale_seconds?: number;
  allowed_authority?: SafeAction["allowed_authority"][];
  human_confirmation_available?: boolean;
}

export interface PreflightResult {
  contract_version: typeof MERCHANT_PREFLIGHT_CONTRACT_VERSION;
  resolution: MerchantResolution;
  evidence: EvidenceSource[];
  selected_safe_action: SafeAction | null;
  approval_required: boolean;
  decision: "ready" | "blocked" | "unknown" | "needs_confirmation";
  reasons: string[];
  attribution_session: AttributionSession | null;
}
