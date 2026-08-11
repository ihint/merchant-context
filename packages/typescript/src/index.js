const DEFAULT_BASE_URL = "https://api.merchant.atomandbits.com/v1";

export class MerchantPreflightClient {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    clientId,
    fetch: fetchImpl = globalThis.fetch,
  } = {}) {
    if (typeof fetchImpl !== "function")
      throw new TypeError("fetch is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetch = fetchImpl;
    this.clientId = clientId ?? `typescript/${globalThis.crypto.randomUUID()}`;
  }

  resolveMerchant(merchantUrl, options = {}) {
    return this.post("resolve", {
      merchant_url: merchantUrl,
      client_id: this.clientId,
      ...options,
    });
  }

  preflight(merchantUrl, { intent, constraints } = {}) {
    return this.post("preflight", {
      merchant_url: merchantUrl,
      client_id: this.clientId,
      intent,
      constraints,
    });
  }

  searchMerchants(query) {
    return this.post("search", { client_id: this.clientId, ...query });
  }
  compareOffers(input) {
    return this.post("compare", { client_id: this.clientId, ...input });
  }
  getSafeActions(merchantUrl, input = {}) {
    return this.post("actions", {
      merchant_url: merchantUrl,
      client_id: this.clientId,
      ...input,
    });
  }

  async refreshMerchant(merchantUrl, { approved = false, ...input } = {}) {
    if (approved !== true)
      throw new Error("Paid refresh requires approved: true");
    return this.post("refresh", {
      merchant_url: merchantUrl,
      agent_id: this.clientId,
      approved: true,
      ...input,
    });
  }

  async post(path, body) {
    const response = await this.fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(dropUndefined(body)),
    });
    const value = await response.json().catch(() => null);
    if (!response.ok) throw new MerchantPreflightError(response.status, value);
    return value;
  }
}

export class MerchantPreflightError extends Error {
  constructor(status, body) {
    super(`Merchant Context request failed with HTTP ${status}`);
    this.name = "MerchantPreflightError";
    this.status = status;
    this.body = body;
  }
}

function dropUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}
