import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("Wrangler routes", () => {
  it("publishes the Worker on the branded API domain", () => {
    const configPath = fileURLToPath(
      new URL("../wrangler.jsonc", import.meta.url),
    );
    const configText = readFileSync(configPath, "utf8");
    const config = JSON.parse(configText.replace(/,\s*([}\]])/g, "$1"));

    expect(config.workers_dev).toBe(true);
    expect(config.routes).toContainEqual({
      pattern: "api.merchant.atomandbits.com",
      custom_domain: true,
    });
  });
});
