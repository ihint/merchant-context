import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

// An exception covers one advisory in one package at the exact install paths
// it lists, until its expiry date. Anything else at high or critical blocks.
export function checkAudit(report, exceptions, today) {
  if (!report || typeof report.vulnerabilities !== "object") {
    throw new Error("npm audit did not return a vulnerability report");
  }

  const blocking = [];
  const excepted = [];
  const used = new Set();

  for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
    for (const via of vulnerability.via) {
      if (typeof via !== "object" || !BLOCKING_SEVERITIES.has(via.severity)) {
        continue;
      }
      const advisory = via.url.split("/").pop();
      const finding = { package: name, advisory, severity: via.severity };
      const exception = exceptions.find(
        (item) => item.advisory === advisory && item.package === name,
      );

      if (exception === undefined) {
        blocking.push(finding);
      } else if (exception.expires < today) {
        blocking.push({
          ...finding,
          note: `exception expired ${exception.expires}`,
        });
      } else if (
        !vulnerability.nodes.every((node) => exception.paths.includes(node))
      ) {
        blocking.push({ ...finding, note: "found outside the excepted paths" });
      } else {
        excepted.push({ ...finding, expires: exception.expires });
        used.add(exception);
      }
    }
  }

  return {
    blocking,
    excepted,
    unused: exceptions.filter((item) => !used.has(item)),
  };
}

function main() {
  const audit = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
  const report = JSON.parse(audit.stdout);
  const { exceptions } = JSON.parse(
    readFileSync(new URL("../audit-exceptions.json", import.meta.url), "utf8"),
  );
  const today = new Date().toISOString().slice(0, 10);
  const result = checkAudit(report, exceptions, today);

  for (const item of result.excepted) {
    console.log(
      `excepted until ${item.expires}: ${item.package} ${item.advisory}`,
    );
  }
  for (const item of result.unused) {
    console.log(
      `unused exception, remove it: ${item.package} ${item.advisory}`,
    );
  }
  for (const item of result.blocking) {
    console.error(
      `blocking ${item.severity}: ${item.package} ${item.advisory}${item.note ? ` (${item.note})` : ""}`,
    );
  }
  if (result.blocking.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
