#!/usr/bin/env node

import {
  createDeveloperServiceOffer,
  createUserCapabilityOffer,
  LocalCapabilityDirectory,
  listOmniAgentRecipes,
  requireFreshPaidResult,
  runDesignPartnerCheck,
  searchCdpX402Bazaar,
} from "./index.js";

declare const process: {
  argv: string[];
  version: string;
  env: Record<string, string | undefined>;
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
      next: "Request controlled ACM gateway access, then run acm partner-check with the explicit testnet spend flag.",
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Bazaar inspection failed");
    process.exitCode = 1;
  }
} else if (command === "recipes") {
  console.log(JSON.stringify({
    ok: true,
    action: "bounded_omni_agent_recipes",
    canonicalRouteTemplates: 6,
    recipes: listOmniAgentRecipes().map(({ label, kind, resourceUrl, schema, priceUsdc, purpose, note }) => ({
      label, kind, resourceUrl, schema, priceUsdc, purpose, ...(note ? { note } : {}),
    })),
    spent: false,
    privateKeyUsed: false,
    note: "Recipes reuse six cataloged route templates; they do not claim additional Bazaar listings.",
  }, null, 2));
} else if (command === "demo") {
  const flow = process.argv[3] ?? "exchange";
  try {
    runDemo(flow);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "ACM demo failed");
    process.exitCode = 1;
  }
} else if (command === "partner-check") {
  try {
    const major = Number(process.version.match(/^v(\d+)/)?.[1] ?? 0);
    if (major < 20) throw new Error(`ACM requires Node.js 20 or newer; found ${process.version}`);
    const report = await runDesignPartnerCheck({
      ...(process.env.ACM_GATEWAY_URL ? { gatewayUrl: process.env.ACM_GATEWAY_URL } : {}),
      ...(process.env.ACM_API_KEY ? { apiKey: process.env.ACM_API_KEY } : {}),
      ...(process.env.ACM_USER_ID ? { userId: process.env.ACM_USER_ID } : {}),
      confirmTestnetSpend: process.env.ACM_CONFIRM_TESTNET_SPEND === "yes",
    });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const step = error && typeof error === "object" && "step" in error ? String(error.step) : "unknown";
    console.error(JSON.stringify({
      ok: false,
      step,
      message: error instanceof Error ? error.message : "Design-partner check failed",
      secretsIncluded: false,
    }, null, 2));
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
  acm recipes  Print bounded real Omni news, trader and liquidation request recipes. No payment.
  acm demo buyer|developer-seller|user-seller|exchange
                Run a local, keyless product flow. No payment.
  acm partner-check
                Validate the installed package and live canonical Bazaar contract. No spend by default.

Funded testnet acceptance requires ACM_GATEWAY_URL and ACM_CONFIRM_TESTNET_SPEND=yes.
The public SDK never accepts a wallet private key.`);
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
