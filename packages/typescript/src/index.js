const DEFAULT_BASE_URL = "https://api.merchant.atomandbits.com/v1";

export class MerchantPreflightClient {
  constructor({ baseUrl = DEFAULT_BASE_URL, fetch: fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetch = fetchImpl;
  }

  resolveMerchant(merchantUrl, options = {}) {
    return this.post("resolve", { merchant_url: merchantUrl, ...options });
  }

  preflight(merchantUrl, { intent, constraints } = {}) {
    return this.post("preflight", { merchant_url: merchantUrl, intent, constraints });
  }

  searchMerchants(query) { return this.post("search", query); }
  compareOffers(input) { return this.post("compare", input); }
  getSafeActions(merchantUrl, input = {}) { return this.post("safe-actions", { merchant_url: merchantUrl, ...input }); }

  async refreshMerchant(merchantUrl, { approved = false, ...input } = {}) {
    if (approved !== true) throw new Error("Paid refresh requires approved: true");
    return this.post("refresh", { merchant_url: merchantUrl, approved: true, ...input });
  }

  async post(path, body) {
    const response = await this.fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(dropUndefined(body))
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
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
