import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.ACM_QUICKSTART_PORT ?? 18789);
const gatewayUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [resolve(root, "examples/reference-server.mjs")], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "inherit"],
});

try {
  await waitUntilReady(server, gatewayUrl);
  const quickstart = spawn(process.execPath, [
    resolve(root, "examples/quickstart.mjs"),
    resolve(root, "fixtures/amazon-orders-demo.csv"),
  ], {
    cwd: root,
    env: { ...process.env, ACM_GATEWAY_URL: gatewayUrl },
    stdio: "inherit",
  });
  const exitCode = await new Promise((resolveExit) => quickstart.once("exit", resolveExit));
  if (exitCode !== 0) process.exitCode = exitCode ?? 1;
} finally {
  server.kill("SIGTERM");
  await new Promise((resolveExit) => server.once("exit", resolveExit));
}

async function waitUntilReady(child, url) {
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Reference server stopped before startup: ${output}`);
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // Startup polling intentionally ignores connection errors.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Reference server did not start: ${output}`);
}
