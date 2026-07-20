#!/usr/bin/env node

import { searchCdpX402Bazaar } from "./index.js";

declare const process: {
  argv: string[];
  version: string;
  exitCode?: number;
};

const command = process.argv[2] ?? "help";

if (command === "help" || command === "--help" || command === "-h") {
  printHelp();
} else if (command === "doctor") {
  const major = Number(process.version.match(/^v(\d+)/)?.[1] ?? 0);
  if (major < 20) {
    console.error(`ACM requires Node.js 20 or newer; found ${process.version}.`);
    process.exitCode = 1;
  } else {
    console.log(`ACM SDK ready · Node ${process.version}`);
    console.log("No wallet key is required by this SDK.");
    console.log("Next: acm inspect");
  }
} else if (command === "inspect") {
  try {
    const result = await searchCdpX402Bazaar({
      query: "Omni Terminal market risk",
      network: "eip155:84532",
      limit: 10,
    });
    const resource = result.resources.find((candidate) => candidate.resource.includes("/market-risk/"))
      ?? result.resources[0];
    if (!resource) throw new Error("No matching x402 resource was returned by CDP Bazaar");
    const accepted = resource.accepts[0];
    console.log(JSON.stringify({
      ok: true,
      action: "read_only_bazaar_inspection",
      resource: resource.resource,
      method: resource.method ?? "GET",
      x402Version: resource.x402Version,
      payment: accepted ? {
        network: accepted.network,
        atomicAmount: accepted.amount,
        asset: accepted.asset,
        payTo: accepted.payTo,
      } : null,
      spent: false,
      privateKeyUsed: false,
      next: "Request controlled ACM gateway access, then run npm run partner:check.",
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Bazaar inspection failed");
    process.exitCode = 1;
  }
} else {
  console.error(`Unknown ACM command: ${command}`);
  printHelp();
  process.exitCode = 1;
}

function printHelp(): void {
  console.log(`Agent Capability Middleware

Usage:
  acm doctor   Check the local SDK runtime. No network request or payment.
  acm inspect  Inspect one live x402 resource through public CDP Bazaar. No payment.

The public SDK never accepts a wallet private key. Funded calls require a separately protected ACM gateway.`);
}
