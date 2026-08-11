import type { MerchantResolution } from "./contracts";

export interface CatalogRecord {
  origin: string;
  resolution: MerchantResolution;
}

export interface Catalog {
  get(origin: string): Promise<MerchantResolution | null>;
  list(): Promise<MerchantResolution[]>;
  put(resolution: MerchantResolution): Promise<void>;
  delete(origin: string): Promise<void>;
}

interface D1Result<T> {
  results?: T[];
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

export interface D1CatalogDatabase {
  prepare(query: string): D1Statement;
}

interface StoredRow {
  origin: string;
  resolution_json: string;
}

export class D1Catalog implements Catalog {
  constructor(
    private readonly db: D1CatalogDatabase,
    private readonly table = "merchant_catalog",
  ) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
      throw new Error("Invalid catalog table name");
    }
  }

  async get(origin: string): Promise<MerchantResolution | null> {
    const normalized = normalizeOrigin(origin);
    const row = await this.db
      .prepare(
        `SELECT origin, resolution_json FROM ${this.table} WHERE origin = ?1`,
      )
      .bind(normalized)
      .first<StoredRow>();
    return row ? parseResolution(row.resolution_json) : null;
  }

  async list(): Promise<MerchantResolution[]> {
    const result = await this.db
      .prepare(
        `SELECT origin, resolution_json FROM ${this.table} ORDER BY origin ASC`,
      )
      .all<StoredRow>();
    return (result.results ?? []).map((row) =>
      parseResolution(row.resolution_json),
    );
  }

  async put(resolution: MerchantResolution): Promise<void> {
    const origin = normalizeOrigin(resolution.merchant.origin);
    await this.db
      .prepare(
        `INSERT INTO ${this.table} (origin, resolution_json) VALUES (?1, ?2) ` +
          "ON CONFLICT(origin) DO UPDATE SET resolution_json = excluded.resolution_json",
      )
      .bind(
        origin,
        JSON.stringify({
          ...resolution,
          merchant: { ...resolution.merchant, origin },
        }),
      )
      .run();
  }

  async delete(origin: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM ${this.table} WHERE origin = ?1`)
      .bind(normalizeOrigin(origin))
      .run();
  }
}

export class MemoryCatalog implements Catalog {
  private readonly records = new Map<string, MerchantResolution>();

  constructor(initial: MerchantResolution[] = []) {
    for (const resolution of initial) this.store(resolution);
  }

  async get(origin: string): Promise<MerchantResolution | null> {
    return this.records.get(normalizeOrigin(origin)) ?? null;
  }

  async list(): Promise<MerchantResolution[]> {
    return [...this.records.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);
  }

  async put(resolution: MerchantResolution): Promise<void> {
    this.store(resolution);
  }

  async delete(origin: string): Promise<void> {
    this.records.delete(normalizeOrigin(origin));
  }

  private store(resolution: MerchantResolution): void {
    const origin = normalizeOrigin(resolution.merchant.origin);
    this.records.set(origin, {
      ...resolution,
      merchant: { ...resolution.merchant, origin },
    });
  }
}

export function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Catalog origins must be public HTTPS origins");
  return url.origin.toLowerCase();
}

function parseResolution(json: string): MerchantResolution {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== "object" || !("merchant" in value))
    throw new Error("Invalid catalog record");
  return value as MerchantResolution;
}
