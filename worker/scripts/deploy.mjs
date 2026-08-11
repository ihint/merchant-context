#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const workerRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const configPath = fileURLToPath(new URL("../wrangler.jsonc", import.meta.url));
const databaseName = "merchant-context-usage";
const canonicalEndpoint = new URL("https://api.merchant.atomandbits.com");

export function productionInputs(environment) {
  if (environment.ALLOW_PRODUCTION_DEPLOY !== "merchant-context") {
    throw new Error(
      "Set ALLOW_PRODUCTION_DEPLOY=merchant-context to approve this deployment",
    );
  }

  if (environment.X402_CLIENT_PRIVATE_KEY) {
    throw new Error("Unset X402_CLIENT_PRIVATE_KEY before deploying");
  }

  const recipient = environment.X402_RECIPIENT;

  if (
    typeof recipient !== "string" ||
    !/^0x[0-9a-fA-F]{40}$/.test(recipient) ||
    /^0x0{40}$/.test(recipient)
  ) {
    throw new Error("X402_RECIPIENT must be a public 20-byte EVM address");
  }

  return { recipient };
}

export function withProductionBindings(config, { databaseId, recipient }) {
  const existingDatabases = Array.isArray(config.d1_databases)
    ? config.d1_databases.filter((item) => item?.binding !== "USAGE_DB")
    : [];

  return {
    ...config,
    vars: {
      ...(config.vars ?? {}),
      X402_NETWORK: "base",
      X402_RECIPIENT: recipient,
    },
    d1_databases: [
      ...existingDatabases,
      {
        binding: "USAGE_DB",
        database_name: databaseName,
        database_id: databaseId,
        migrations_dir: "migrations",
      },
    ],
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? workerRoot,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr ?? "");
    }
    throw new Error(`${command} exited with status ${result.status}`);
  }

  if (!options.capture) {
    return "";
  }

  return options.combine
    ? `${result.stdout ?? ""}${result.stderr ?? ""}`
    : (result.stdout ?? "");
}

function readConfig() {
  return parseWranglerConfig(readFileSync(configPath, "utf8"));
}

export function parseWranglerConfig(value) {
  return JSON.parse(value.replace(/,\s*([}\]])/gu, "$1"));
}

function writeConfig(config) {
  const current = readFileSync(configPath, "utf8");

  if (JSON.stringify(parseWranglerConfig(current)) === JSON.stringify(config)) {
    return;
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function configuredDatabaseId(config) {
  const binding = config.d1_databases?.find(
    (database) => database.binding === "USAGE_DB",
  );

  return binding?.database_id ?? null;
}

function findOrCreateDatabase() {
  const configured = configuredDatabaseId(readConfig());

  if (configured !== null) {
    return configured;
  }

  const databases = JSON.parse(
    run("npx", ["wrangler", "d1", "list", "--json"], { capture: true }),
  );
  const existing = databases.find((database) => database.name === databaseName);
  const existingId = existing?.uuid ?? existing?.id;

  if (typeof existingId === "string" && existingId !== "") {
    return existingId;
  }

  run("npx", [
    "wrangler",
    "d1",
    "create",
    databaseName,
    "--binding",
    "USAGE_DB",
    "--update-config",
    "--use-remote",
    "--location",
    "enam",
  ]);

  const createdId = configuredDatabaseId(readConfig());

  if (createdId === null) {
    throw new Error("Wrangler created D1 but did not update its binding");
  }

  return createdId;
}

async function verifyEndpoint(endpoint) {
  const healthResponse = await fetch(new URL("/health", endpoint), {
    signal: AbortSignal.timeout(10_000),
  });

  if (!healthResponse.ok) {
    throw new Error(`Health check returned ${healthResponse.status}`);
  }

  const health = await healthResponse.json();

  if (health?.status !== "ok") {
    throw new Error("Health check body is invalid");
  }

  const serviceUrl = new URL("/.well-known/merchant-context", endpoint);
  serviceUrl.searchParams.set("release_check", crypto.randomUUID());
  const serviceResponse = await fetch(serviceUrl, {
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(10_000),
  });
  const service = await serviceResponse.json();

  if (
    !serviceResponse.ok ||
    service?.mcp?.url !== new URL("/mcp", endpoint).toString() ||
    service?.http?.free?.resolve?.url !==
      new URL("/v1/resolve", endpoint).toString() ||
    service?.http?.paid_refresh?.url !==
      new URL("/v1/refresh", endpoint).toString()
  ) {
    throw new Error("Public service record is invalid");
  }

  const httpChallenge = await fetch(new URL("/v1/refresh", endpoint), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      merchant_url: "https://merchant.atomandbits.com",
      agent_id: "merchant-context-deploy-check",
      approved: true,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const paymentRequiredHeader = httpChallenge.headers.get("payment-required");

  if (httpChallenge.status !== 402 || paymentRequiredHeader === null) {
    throw new Error("Paid HTTP route did not return an x402 challenge");
  }

  const { decodePaymentRequiredHeader } = await import("@x402/core/http");
  const httpPayment = decodePaymentRequiredHeader(paymentRequiredHeader);

  if (
    httpPayment.accepts?.[0]?.network !== "eip155:8453" ||
    httpPayment.accepts?.[0]?.amount !== "10000"
  ) {
    throw new Error("Paid HTTP route returned the wrong x402 terms");
  }

  const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all([
    import("@modelcontextprotocol/sdk/client/index.js"),
    import("@modelcontextprotocol/sdk/client/streamableHttp.js"),
  ]);
  const client = new Client({
    name: "merchant-context-deploy-check",
    version: "0.1.0",
  });

  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL("/mcp", endpoint)),
    );
    const tools = await client.listTools();
    const names = tools.tools.map((tool) => tool.name);

    if (
      !names.includes("get_service_info") ||
      !names.includes("resolve_merchant") ||
      !names.includes("search_merchants") ||
      !names.includes("compare_offers") ||
      !names.includes("get_safe_actions") ||
      !names.includes("preflight") ||
      !names.includes("check_merchant") ||
      !names.includes("refresh_merchant") ||
      !names.includes("inspect_merchant")
    ) {
      throw new Error("MCP tool list is incomplete");
    }

    const challenge = await client.callTool({
      name: "refresh_merchant",
      arguments: {
        merchant_url: "https://merchant.atomandbits.com",
        agent_id: "merchant-context-deploy-check",
        approved: true,
      },
    });
    const paymentError = challenge._meta?.["x402/error"];

    if (
      challenge.isError !== true ||
      paymentError?.error !== "PAYMENT_REQUIRED" ||
      paymentError?.accepts?.[0]?.network !== "eip155:8453" ||
      paymentError?.accepts?.[0]?.amount !== "10000"
    ) {
      throw new Error("Paid tool did not return the expected x402 challenge");
    }
  } finally {
    await client.close();
  }
}

export async function verifyEndpointWithRetry(
  endpoint,
  {
    attempts = 10,
    delayMs = 2_000,
    verify = verifyEndpoint,
    sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = {},
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await verify(endpoint);
      return;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

async function main() {
  const { recipient } = productionInputs(process.env);
  const changes = run("git", ["status", "--porcelain"], {
    cwd: repositoryRoot,
    capture: true,
  });

  if (changes.trim() !== "") {
    throw new Error("Commit or stash repository changes before deploying");
  }

  run("npm", ["test"]);
  run("npm", ["run", "typecheck"]);
  run("npm", ["run", "format:check"]);
  run("npm", ["audit", "--audit-level=high"]);
  run("npx", ["wrangler", "deploy", "--dry-run"]);
  run("npx", ["wrangler", "whoami"]);

  const databaseId = findOrCreateDatabase();
  writeConfig(withProductionBindings(readConfig(), { databaseId, recipient }));

  run("npx", ["wrangler", "deploy", "--dry-run"]);
  run("npx", ["wrangler", "d1", "migrations", "list", "USAGE_DB", "--remote"]);
  run(
    "npx",
    ["wrangler", "d1", "migrations", "apply", "USAGE_DB", "--remote"],
    { env: { ...process.env, CI: "true" } },
  );

  const deployOutput = run("npx", ["wrangler", "deploy", "--keep-vars"], {
    capture: true,
    combine: true,
  });
  process.stdout.write(deployOutput);

  const endpointMatch = deployOutput.match(
    /https:\/\/[a-zA-Z0-9.-]+\.workers\.dev/,
  );

  if (!endpointMatch) {
    throw new Error(
      "Deployment completed but its workers.dev URL was not found",
    );
  }

  const endpoint = new URL(endpointMatch[0]);
  await verifyEndpointWithRetry(endpoint);
  process.stdout.write(`Verified production endpoint: ${endpoint.origin}\n`);
  await verifyEndpointWithRetry(canonicalEndpoint);
  process.stdout.write(
    `Verified canonical endpoint: ${canonicalEndpoint.origin}\n`,
  );
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Production deployment failed"}\n`,
    );
    process.exitCode = 1;
  });
}
