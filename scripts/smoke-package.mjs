import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("npm_execpath is required for the package smoke test");

const temporaryDirectory = await mkdtemp(join(tmpdir(), "acm-sdk-package-"));
try {
  const packed = runNpm(["pack", "--json", "--pack-destination", temporaryDirectory]);
  const packageInfo = JSON.parse(packed).find((entry) => entry.filename);
  if (!packageInfo) throw new Error(`npm pack returned no package: ${packed}`);
  const tarball = join(temporaryDirectory, packageInfo.filename);

  await writeFile(join(temporaryDirectory, "package.json"), JSON.stringify({
    name: "acm-external-consumer",
    private: true,
    type: "module",
  }));
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], temporaryDirectory);

  const smoke = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {
      AgentCapabilityClient,
      listCdpX402MerchantResources,
    } from "@agent-capability-middleware/sdk";
    const client = new AgentCapabilityClient("https://gateway.example.com");
    if (
      typeof client.registerAgent !== "function"
      || typeof client.createGrant !== "function"
      || typeof client.consumeX402Testnet !== "function"
      || typeof client.consumeX402 !== "function"
      || typeof listCdpX402MerchantResources !== "function"
    ) {
      throw new Error("Expected x402 public methods are missing");
    }
    process.stdout.write("EXTERNAL_PACKAGE_SMOKE_OK\\n");
  `], { cwd: temporaryDirectory, encoding: "utf8" });
  if (smoke.status !== 0) throw new Error(smoke.stderr || smoke.stdout);
  process.stdout.write(smoke.stdout);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

function runNpm(arguments_, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...arguments_], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
