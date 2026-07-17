import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this command through npm: npm run partner:check");

const startedAt = new Date();
const reportPath = resolve(process.env.ACM_PARTNER_REPORT_PATH ?? ".acm-design-partner-report.json");

try {
  runNpm(["run", "package:smoke"], "external_package_install");
  const result = spawnSync(process.execPath, [resolve("examples/omni-x402.mjs")], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ACM_PARTNER_REPORT_PATH: reportPath,
      ACM_PARTNER_STARTED_AT: startedAt.toISOString(),
      ACM_EXTERNAL_PACKAGE_SMOKE: "passed",
    },
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0) {
    if (!(await exists(reportPath))) {
      await writeFailure("omni_flow", `child_exit_${result.status ?? "unknown"}`);
    }
    process.exitCode = result.status ?? 1;
  } else {
    process.stdout.write(`DESIGN_PARTNER_REPORT ${reportPath}\n`);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const [failedStep = "runner", reason = "failed"] = message.split(":", 2);
  await writeFailure(failedStep, reason);
  process.stderr.write(`DESIGN_PARTNER_CHECK_FAILED ${failedStep}\n`);
  process.exitCode = 1;
}

function runNpm(arguments_, step) {
  const result = spawnSync(process.execPath, [npmCli, ...arguments_], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  if (result.status !== 0) throw new Error(`${step}:exit_${result.status ?? "unknown"}`);
}

async function writeFailure(failedStep, reason) {
  const completedAt = new Date();
  await writeFile(reportPath, `${JSON.stringify({
    reportVersion: "design_partner_check.v1",
    ok: false,
    mode: process.env.ACM_CONFIRM_TESTNET_SPEND === "yes" ? "paid_testnet" : "no_spend",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    failedStep,
    reason,
    secretsIncluded: false,
  }, null, 2)}\n`, { mode: 0o600 });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
