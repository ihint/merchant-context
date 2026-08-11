import { D1Catalog } from "./catalog";
import { compareOffers } from "./compare";
import type {
  MerchantResolution,
  PreflightConstraints,
  PreflightIntent,
} from "./contracts";
import {
  mintMerchantContextSession,
  verifyMerchantContextSession,
} from "./attribution";
import {
  recordClientBeacon,
  recordVerifiedCompletion,
  type MerchantEventName,
  type SignedMerchantReceipt,
} from "./events";
import { inspectMerchant } from "./inspect";
import { preflight } from "./preflight";
import type {
  MerchantRecordStore,
  ResolveMerchantDependencies,
} from "./resolver";
import { resolveMerchant } from "./resolver";
import { getSafeActions, type SafeActionsRequest } from "./safe-actions";
import { searchMerchants, type MerchantSearch } from "./search";
import type { NormalizedMerchantRecord } from "./record";

interface D1RowStatement {
  bind(...values: unknown[]): D1RowStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
  run(): Promise<{ success: boolean; meta: { changes?: number } }>;
}

export interface MerchantServiceDatabase {
  prepare(query: string): D1RowStatement;
}

export interface MerchantServiceOptions {
  database: MerchantServiceDatabase;
  attributionSecret: string;
  merchantReceiptSecret: string;
  merchantReceiptOrigin?: string;
  fetcher?: typeof fetch;
  now?: () => Date;
}

export interface ClientContext {
  clientId: string;
  internal?: boolean;
}

export class MerchantService {
  private readonly records: MerchantRecordStore;
  private readonly catalog: D1Catalog;

  constructor(private readonly options: MerchantServiceOptions) {
    this.records = new D1MerchantRecordStore(options.database);
    this.catalog = new D1Catalog(options.database);
  }

  async resolve(
    merchantUrl: string,
    client: ClientContext,
  ): Promise<MerchantResolution> {
    const started = Date.now();
    let cache: MerchantResolution["record"]["cache"] | null = null;

    try {
      const resolution = await resolveMerchant(
        merchantUrl,
        this.resolverDependencies(client, false),
      );
      cache = resolution.record.cache;

      if (resolution.status === "resolved") {
        await this.catalog.put(resolution);
      }

      return resolution;
    } finally {
      await this.measure("resolve_merchant", cache, started, client);
    }
  }

  async refresh(
    merchantUrl: string,
    client: ClientContext,
  ): Promise<{
    inspection: Awaited<ReturnType<typeof inspectMerchant>>;
    resolution: MerchantResolution;
  }> {
    const inspection = await inspectMerchant(merchantUrl, {
      fetcher: this.options.fetcher,
    });
    const resolution = await resolveMerchant(
      inspection.origin,
      this.resolverDependencies(client, true),
    );

    if (resolution.status === "resolved") {
      await this.catalog.put(resolution);
    }

    return { inspection, resolution };
  }

  async preflight(
    merchantUrl: string,
    client: ClientContext,
    intent: PreflightIntent = {},
    constraints: PreflightConstraints = {},
  ) {
    const resolution = await this.resolve(merchantUrl, client);
    return preflight(
      resolution,
      intent,
      constraints,
      this.options.now?.() ?? new Date(),
    );
  }

  async search(query: MerchantSearch = {}) {
    return searchMerchants(await this.catalog.list(), query);
  }

  async compare(merchantUrls: string[], client: ClientContext) {
    const resolutions = await Promise.all(
      merchantUrls.map((merchantUrl) => this.resolve(merchantUrl, client)),
    );
    return compareOffers(resolutions);
  }

  async safeActions(
    merchantUrl: string,
    client: ClientContext,
    request: SafeActionsRequest = {},
  ) {
    return getSafeActions(await this.resolve(merchantUrl, client), request);
  }

  async recordEvent(input: {
    event: MerchantEventName;
    sessionToken: string;
    occurredAt?: string;
  }): Promise<void> {
    const internal = await this.sessionIsInternal(input.sessionToken);
    await recordClientBeacon(
      this.options.database,
      {
        event: input.event,
        sessionToken: input.sessionToken,
        internal,
        occurredAt: input.occurredAt,
      },
      this.options.attributionSecret,
      this.options.now?.() ?? new Date(),
    );
  }

  async recordCompletion(input: {
    sessionToken: string;
    receipt: SignedMerchantReceipt;
  }): Promise<void> {
    const allowedReceiptOrigin =
      this.options.merchantReceiptOrigin ?? "https://merchant.atomandbits.com";

    if (input.receipt.merchant_origin !== allowedReceiptOrigin) {
      throw new Error("Merchant receipt issuer is not configured");
    }

    const internal = await this.sessionIsInternal(input.sessionToken);
    await recordVerifiedCompletion(this.options.database, {
      sessionToken: input.sessionToken,
      receipt: input.receipt,
      attributionSecret: this.options.attributionSecret,
      merchantSecret: this.options.merchantReceiptSecret,
      now: this.options.now?.() ?? new Date(),
      internal,
    });
  }

  private resolverDependencies(
    client: ClientContext,
    forceFetch: boolean,
  ): ResolveMerchantDependencies {
    const store = forceFetch
      ? {
          get: async () => null,
          put: (origin: string, record: NormalizedMerchantRecord) =>
            this.records.put(origin, record),
        }
      : this.records;

    return {
      store,
      fetcher: this.options.fetcher,
      now: this.options.now,
      sessionMinter: {
        mint: async ({ merchant_origin, record_version, action_id }) => {
          const sessionId = crypto.randomUUID();
          const session = await mintMerchantContextSession({
            clientIdentifier: client.clientId,
            merchantOrigin: merchant_origin,
            recordVersion: record_version,
            actionId: action_id,
            secret: this.options.attributionSecret,
            now: this.options.now?.(),
            sessionId,
          });
          const payload = await verifyMerchantContextSession(
            session.token,
            this.options.attributionSecret,
            this.options.now?.() ?? new Date(),
          );
          await this.registerSession(payload, client.internal === true);
          await recordClientBeacon(
            this.options.database,
            {
              event: "resolved",
              sessionToken: session.token,
              internal: client.internal === true,
            },
            this.options.attributionSecret,
            this.options.now?.() ?? new Date(),
          );
          return session;
        },
      },
    };
  }

  private async registerSession(
    payload: Awaited<ReturnType<typeof verifyMerchantContextSession>>,
    internal: boolean,
  ): Promise<void> {
    const result = await this.options.database
      .prepare(
        `INSERT INTO merchant_context_sessions (
          session_id, client_id, merchant_origin, record_version, action_id,
          issued_at, expires_at, internal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        payload.session_id,
        payload.client_id,
        payload.merchant_origin,
        payload.record_version,
        payload.action_id,
        new Date(payload.issued_at * 1000).toISOString(),
        new Date(payload.expires_at * 1000).toISOString(),
        internal ? 1 : 0,
      )
      .run();

    if (!result.success || result.meta.changes !== 1) {
      throw new Error("Attribution session record failed");
    }
  }

  private async sessionIsInternal(token: string): Promise<boolean> {
    const payload = await verifyMerchantContextSession(
      token,
      this.options.attributionSecret,
      this.options.now?.() ?? new Date(),
    );
    const row = await this.options.database
      .prepare(
        "SELECT internal FROM merchant_context_sessions WHERE session_id = ?",
      )
      .bind(payload.session_id)
      .first<{ internal: number }>();

    if (row === null) {
      throw new Error("Attribution session is not registered");
    }

    return row.internal === 1;
  }

  private async measure(
    operation: string,
    cache: MerchantResolution["record"]["cache"] | null,
    started: number,
    client: ClientContext,
  ): Promise<void> {
    try {
      await this.options.database
        .prepare(
          `INSERT INTO merchant_preflight_measurements (
            operation, cache_status, duration_ms, internal, observed_at
          ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          operation,
          cache,
          Math.max(0, Date.now() - started),
          client.internal ? 1 : 0,
          (this.options.now?.() ?? new Date()).toISOString(),
        )
        .run();
    } catch {
      // A metric write must not change a resolver result.
    }
  }
}

class D1MerchantRecordStore implements MerchantRecordStore {
  constructor(private readonly database: MerchantServiceDatabase) {}

  async get(origin: string): Promise<NormalizedMerchantRecord | null> {
    const row = await this.database
      .prepare("SELECT record_json FROM merchant_records WHERE origin = ?")
      .bind(origin)
      .first<{ record_json: string }>();

    return row === null
      ? null
      : (JSON.parse(row.record_json) as NormalizedMerchantRecord);
  }

  async put(origin: string, record: NormalizedMerchantRecord): Promise<void> {
    const result = await this.database
      .prepare(
        `INSERT INTO merchant_records (origin, record_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(origin) DO UPDATE SET
          record_json = excluded.record_json,
          updated_at = excluded.updated_at`,
      )
      .bind(origin, JSON.stringify(record), new Date().toISOString())
      .run();

    if (!result.success) {
      throw new Error("Merchant record write failed");
    }
  }
}
