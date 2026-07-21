import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("npm_execpath is required for the package smoke test");

const temporaryDirectory = await mkdtemp(join(tmpdir(), "acm-sdk-package-"));
try {
  const packed = runNpm(["pack", "--json", "--pack-destination", temporaryDirectory]);
  const parsedPackageInfo = JSON.parse(packed);
  const packageInfo = Array.isArray(parsedPackageInfo)
    ? parsedPackageInfo.find((entry) => entry.filename)
    : parsedPackageInfo;
  if (!packageInfo) throw new Error(`npm pack returned no package: ${packed}`);
  const tarball = isAbsolute(packageInfo.filename)
    ? packageInfo.filename
    : join(temporaryDirectory, packageInfo.filename);

  await writeFile(join(temporaryDirectory, "package.json"), JSON.stringify({
    name: "acm-external-consumer",
    private: true,
    type: "module",
  }));
  const installArguments = npmCli.includes("pnpm")
    ? ["install", "--ignore-scripts", tarball]
    : ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball];
  runNpm(installArguments, temporaryDirectory);

  const smoke = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {
      AgentCapabilityClient,
      createDeveloperServiceOffer,
      createOmniPaymentRequest,
      createOmniRecipeGrant,
      createOmniX402Recipe,
      createUserCapabilityOffer,
      listCdpX402MerchantResources,
      LocalCapabilityDirectory,
      requireFreshPaidResult,
      runDesignPartnerCheck,
    } from "@agent-capability-middleware/sdk";
    const client = new AgentCapabilityClient("https://gateway.example.com");
    if (
      typeof client.registerAgent !== "function"
      || typeof client.createGrant !== "function"
      || typeof client.consumeX402Testnet !== "function"
      || typeof client.consumeX402 !== "function"
      || typeof createDeveloperServiceOffer !== "function"
      || typeof createOmniX402Recipe !== "function"
      || typeof createOmniRecipeGrant !== "function"
      || typeof createOmniPaymentRequest !== "function"
      || typeof createUserCapabilityOffer !== "function"
      || typeof LocalCapabilityDirectory !== "function"
      || typeof runDesignPartnerCheck !== "function"
      || typeof listCdpX402MerchantResources !== "function"
      || typeof requireFreshPaidResult !== "function"
    ) {
      throw new Error("Expected x402 public methods are missing");
    }
    process.stdout.write("EXTERNAL_PACKAGE_SMOKE_OK\\n");
  `], { cwd: temporaryDirectory, encoding: "utf8" });
  if (smoke.status !== 0) throw new Error(smoke.stderr || smoke.stdout);
  process.stdout.write(smoke.stdout);

  const cli = spawnSync(join(temporaryDirectory, "node_modules", ".bin", "acm"), ["doctor"], {
    cwd: temporaryDirectory,
    encoding: "utf8",
  });
  if (cli.status !== 0) throw new Error(cli.stderr || cli.stdout);
  if (!cli.stdout.includes("No wallet key is required")) {
    throw new Error(`Installed ACM CLI did not preserve the key boundary: ${cli.stdout}`);
  }
  process.stdout.write("EXTERNAL_CLI_SMOKE_OK\n");

  const recipes = spawnSync(join(temporaryDirectory, "node_modules", ".bin", "acm"), ["recipes"], {
    cwd: temporaryDirectory,
    encoding: "utf8",
  });
  if (recipes.status !== 0) throw new Error(recipes.stderr || recipes.stdout);
  const recipeReport = JSON.parse(recipes.stdout);
  if (
    recipeReport.canonicalRouteTemplates !== 7 ||
    recipeReport.catalogedRouteTemplates !== 7 ||
    recipeReport.recipes?.length < 12 ||
    recipeReport.spent !== false
  ) {
    throw new Error(`Installed ACM CLI returned an invalid recipe plan: ${recipes.stdout}`);
  }
  process.stdout.write("EXTERNAL_RECIPES_CLI_SMOKE_OK\n");

  const exchange = spawnSync(join(temporaryDirectory, "node_modules", ".bin", "acm"), ["demo", "exchange"], {
    cwd: temporaryDirectory,
    encoding: "utf8",
  });
  if (exchange.status !== 0) throw new Error(exchange.stderr || exchange.stdout);
  if (!exchange.stdout.includes("ACM_EXCHANGE_DEMO_OK")) {
    throw new Error(`Installed ACM CLI could not run the exchange demo: ${exchange.stdout}`);
  }
  process.stdout.write("EXTERNAL_EXCHANGE_CLI_SMOKE_OK\n");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}

function runNpm(arguments_, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...arguments_], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
