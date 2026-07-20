#!/usr/bin/env node

import {
  createDeveloperServiceOffer,
  createUserCapabilityOffer,
  LocalCapabilityDirectory,
  requireFreshPaidResult,
  searchCdpX402Bazaar,
} from "./index.js";

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
} else if (command === "demo") {
  const flow = process.argv[3] ?? "exchange";
  try {
    runDemo(flow);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "ACM demo failed");
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
  acm demo buyer|developer-seller|user-seller|exchange
                Run a local, keyless product flow. No payment.

The public SDK never accepts a wallet private key. Funded calls require a separately protected ACM gateway.`);
}

function runDemo(flow: string): void {
  const directory = new LocalCapabilityDirectory();
  const payTo = "0x1111111111111111111111111111111111111111";

  if (flow === "buyer") {
    const resource = requireFreshPaidResult({
      decision: "paid",
      receiptId: "0xmock_demo_receipt",
      resourceBody: {
        schema: "market_risk_snapshot.v1",
        freshness: { status: "fresh" },
        summary: "Synthetic result: no seller was contacted and no money moved.",
      },
    }, { expectedSchema: "market_risk_snapshot.v1" });
    printDemo(flow, { grant: "bounded", privateKeyUsed: false, spent: false, acceptedSchema: resource.schema });
    return;
  }

  const developerOffer = directory.publish(createDeveloperServiceOffer({
    id: "offer_market_risk",
    developerId: "developer_demo",
    name: "Fresh market-risk snapshot",
    description: "Structured market context for an agent decision.",
    capability: "api.market_risk.current",
    purpose: "build_current_risk_brief",
    endpoint: "https://seller.example/x402/market-risk/BTC",
    terms: { policy: "paid", priceUsdc: 0.003, payTo, network: "eip155:84532" },
  }));

  if (flow === "developer-seller") {
    printDemo(flow, {
      offer: developerOffer,
      request: directory.request({
        offerId: developerOffer.id,
        requesterId: "agent_demo",
        purpose: developerOffer.purpose,
        maximumPriceUsdc: 0.005,
      }),
      settled: false,
    });
    return;
  }

  const userOffer = directory.publish(createUserCapabilityOffer({
    id: "offer_running_shoes",
    userId: "user_demo",
    name: "Running-shoe purchase intent",
    description: "A user-confirmed minimum-disclosure shopping intent.",
    capability: "commerce.intent.running_shoes",
    purpose: "match_running_shoe_offer",
    confirmedByUser: true,
    projection: { category: "running_shoes", sizeBand: "UK_9_10", budgetBand: "GBP_70_110" },
    retention: "session",
    terms: { policy: "paid", priceUsdc: 0.01, payTo, network: "eip155:84532" },
  }));

  if (flow === "user-seller") {
    printDemo(flow, {
      offer: userOffer,
      request: directory.request({
        offerId: userOffer.id,
        requesterId: "merchant_agent_demo",
        purpose: userOffer.purpose,
        maximumPriceUsdc: 0.02,
      }),
      rawOrderRowsPublished: false,
      cookiesRead: false,
      settled: false,
    });
    return;
  }

  if (flow !== "exchange") throw new TypeError(`Unknown demo flow: ${flow}`);
  printDemo(flow, {
    directory: directory.list().map(({ id, publisherKind, name, capability, terms }) => ({
      id, publisherKind, name, capability, policy: terms.policy,
    })),
    matches: [developerOffer, userOffer].map((offer) => directory.request({
      offerId: offer.id,
      requesterId: "agent_demo",
      purpose: offer.purpose,
      maximumPriceUsdc: 0.02,
    })),
    mode: "local_fixed_price_preview",
    settled: false,
  });
}

function printDemo(flow: string, result: unknown): void {
  console.log(JSON.stringify({ ok: true, flow, result }, null, 2));
  console.log(`ACM_${flow.toUpperCase().replaceAll("-", "_")}_DEMO_OK`);
}
