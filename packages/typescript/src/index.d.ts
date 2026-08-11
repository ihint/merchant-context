export interface ClientOptions { baseUrl?: string; fetch?: typeof globalThis.fetch }
export declare class MerchantPreflightClient {
  constructor(options?: ClientOptions);
  resolveMerchant(merchantUrl: string, options?: Record<string, unknown>): Promise<unknown>;
  preflight(merchantUrl: string, input?: { intent?: unknown; constraints?: unknown }): Promise<unknown>;
  searchMerchants(query: Record<string, unknown>): Promise<unknown>;
  compareOffers(input: Record<string, unknown>): Promise<unknown>;
  getSafeActions(merchantUrl: string, input?: Record<string, unknown>): Promise<unknown>;
  refreshMerchant(merchantUrl: string, input?: Record<string, unknown> & { approved?: boolean }): Promise<unknown>;
}
export declare class MerchantPreflightError extends Error { status: number; body: unknown }
