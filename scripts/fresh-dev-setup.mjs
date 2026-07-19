import { spawn, spawnSync } from "node:child_process";
import { copyFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run through npm: npm run example:fresh-dev");

const temporaryDirectory = await mkdtemp(join(tmpdir(), "acm-fresh-dev-"));
let gateway;
try {
  const packed = runNpm(["pack", "--json", "--pack-destination", temporaryDirectory]);
  const parsed = JSON.parse(packed);
  const packageInfo = (Array.isArray(parsed) ? parsed : [parsed]).find((entry) => entry.filename);
  if (!packageInfo) throw new Error("npm pack returned no package");
  const tarball = isAbsolute(packageInfo.filename)
    ? packageInfo.filename
    : join(temporaryDirectory, packageInfo.filename);

  await writeFile(join(temporaryDirectory, "package.json"), `${JSON.stringify({
    name: "acm-fresh-dev-consumer",
    private: true,
    type: "module",
  }, null, 2)}\n`);
  const installArguments = npmCli.includes("pnpm")
    ? ["install", "--ignore-scripts", tarball]
    : ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball];
  runNpm(installArguments, temporaryDirectory);

  const exampleDirectory = join(temporaryDirectory, "example");
  await mkdir(exampleDirectory);
  await Promise.all([
    copyFile(resolve("examples/fresh-dev/mock-gateway.mjs"), join(exampleDirectory, "mock-gateway.mjs")),
    copyFile(resolve("examples/fresh-dev/consumer.mjs"), join(exampleDirectory, "consumer.mjs")),
  ]);

  gateway = spawn(process.execPath, [join(exampleDirectory, "mock-gateway.mjs")], {
    cwd: temporaryDirectory,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const gatewayUrl = await waitForGateway(gateway);
  const consumer = spawnSync(process.execPath, [join(exampleDirectory, "consumer.mjs")], {
    cwd: temporaryDirectory,
    encoding: "utf8",
    env: { ...process.env, ACM_GATEWAY_URL: gatewayUrl },
  });
  process.stdout.write(consumer.stdout ?? "");
  process.stderr.write(consumer.stderr ?? "");
  if (consumer.status !== 0) throw new Error(`Fresh consumer exited ${consumer.status ?? "unknown"}`);
  if (!consumer.stdout?.includes("FRESH_DEV_MOCK_OK")) throw new Error("Fresh consumer omitted success marker");
} finally {
  gateway?.kill("SIGTERM");
  await rm(temporaryDirectory, { recursive: true, force: true });
}

function runNpm(arguments_, cwd = process.cwd()) {
  const result = spawnSync(process.execPath, [npmCli, ...arguments_], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}

function waitForGateway(child) {
  return new Promise((resolveUrl, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Mock gateway start timed out: ${output}`)), 10_000);
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/MOCK_ACM_GATEWAY_READY (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolveUrl(match[1]);
      }
    });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Mock gateway exited ${code ?? "unknown"}: ${output}`));
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
