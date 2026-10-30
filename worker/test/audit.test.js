import assert from "node:assert/strict";
import { test } from "vitest";
import { checkAudit } from "../scripts/audit.mjs";

const zodPaths = [
  "node_modules/@coinbase/cdp-sdk/node_modules/zod",
  "node_modules/@coinbase/x402/node_modules/zod",
];
const exception = {
  advisory: "GHSA-mrhx-c7xc-m3w5",
  package: "zod",
  paths: zodPaths,
  expires: "2026-12-31",
};

function report(nodes, extra = {}) {
  return {
    vulnerabilities: {
      "@coinbase/x402": {
        severity: "high",
        nodes: ["node_modules/@coinbase/x402"],
        via: ["@coinbase/cdp-sdk", "zod"],
      },
      zod: {
        severity: "high",
        nodes,
        via: [
          {
            name: "zod",
            severity: "high",
            url: "https://github.com/advisories/GHSA-mrhx-c7xc-m3w5",
          },
        ],
      },
      ...extra,
    },
  };
}

test("an excepted advisory at its listed paths does not block", () => {
  const result = checkAudit(report(zodPaths), [exception], "2026-10-30");

  assert.deepEqual(result.blocking, []);
  assert.equal(result.excepted.length, 1);
  assert.deepEqual(result.unused, []);
});

test("the same advisory at another path blocks", () => {
  const result = checkAudit(
    report([...zodPaths, "node_modules/zod"]),
    [exception],
    "2026-10-30",
  );

  assert.equal(result.blocking.length, 1);
  assert.match(result.blocking[0].note, /outside the excepted paths/);
});

test("an expired exception blocks", () => {
  const result = checkAudit(report(zodPaths), [exception], "2027-01-01");

  assert.equal(result.blocking.length, 1);
  assert.match(result.blocking[0].note, /expired 2026-12-31/);
});

test("other high and critical advisories block; moderate ones do not", () => {
  const result = checkAudit(
    report(zodPaths, {
      undici: {
        severity: "critical",
        nodes: ["node_modules/undici"],
        via: [
          {
            name: "undici",
            severity: "critical",
            url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
          },
        ],
      },
      hono: {
        severity: "moderate",
        nodes: ["node_modules/hono"],
        via: [
          {
            name: "hono",
            severity: "moderate",
            url: "https://github.com/advisories/GHSA-dddd-eeee-ffff",
          },
        ],
      },
    }),
    [exception],
    "2026-10-30",
  );

  assert.deepEqual(
    result.blocking.map((item) => item.package),
    ["undici"],
  );
});

test("an exception with nothing to cover is reported unused", () => {
  const result = checkAudit({ vulnerabilities: {} }, [exception], "2026-10-30");

  assert.deepEqual(result.unused, [exception]);
});

test("a failed audit run is an error, not a pass", () => {
  assert.throws(
    () => checkAudit({ error: { code: "ENOAUDIT" } }, [], "2026-10-30"),
    /did not return a vulnerability report/,
  );
});
