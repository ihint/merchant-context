import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateDraftBlueprint } from "../src/validate-draft.mjs";

test("draft blueprint keeps all preflight safety controls", async () => {
  const url = new URL("../blueprint.draft.json", import.meta.url);
  const blueprint = JSON.parse(await readFile(url, "utf8"));
  assert.deepEqual(validateDraftBlueprint(blueprint), []);
});

test("validator rejects a paid default and missing confirmation", () => {
  const errors = validateDraftBlueprint({
    draft: true,
    notice: "No stable public contract",
    gatekeeper: { tool: "resolve_merchant", require_success: true, before: ["merchant_fact", "merchant_action"] },
    tools: { default: ["resolve_merchant", "search_merchants", "compare_offers", "get_safe_actions", "preflight", "refresh_merchant"], not_default: ["inspect_merchant"] },
    webmcp: { input_fields: ["merchant_context_session"] },
    actions: { consequential: { human_confirmation: "optional" } }
  });
  assert(errors.some((error) => error.includes("refresh_merchant must not")));
  assert(errors.some((error) => error.includes("human confirmation")));
});
