import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  AgentCapabilityClient,
  listCdpX402MerchantResources,
  requireFreshPaidResult,
} from "@agent-capability-middleware/sdk";

const startedAt = new Date(process.env.ACM_PARTNER_STARTED_AT ?? Date.now());

const omniReceiver = process.env.OMNI_X402_PAY_TO
  ?? "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
const discovery = await listCdpX402MerchantResources(omniReceiver, { limit: 100 });
const marketRiskListing = discovery.resources.find((resource) =>
  resource.resource === "https://omniterminal.app/api/x402/v1/market-risk/:symbol"
);
if (!marketRiskListing) throw new Error("Canonical Omni market-risk route is not present in CDP Bazaar");
const marketRiskQuote = marketRiskListing.accepts.find((accept) => accept.network === "eip155:84532");
if (!marketRiskQuote) throw new Error("Canonical Omni market-risk route has no Base Sepolia quote");
if (marketRiskQuote.amount !== "3000") throw new Error(`Expected 3000 atomic USDC, received ${marketRiskQuote.amount}`);
if (marketRiskQuote.asset.toLowerCase() !== "0x036cbd53842c5426634e7929541ec2318f3dcf7e") {
  throw new Error("Canonical Omni market-risk quote uses an unexpected asset");
}
if (marketRiskQuote.payTo.toLowerCase() !== omniReceiver.toLowerCase()) {
  throw new Error("Canonical Omni market-risk quote uses an unexpected receiver");
}

console.log(JSON.stringify({
  ready: true,
  mode: process.env.ACM_CONFIRM_TESTNET_SPEND === "yes" ? "paid_testnet_pending" : "no_spend",
  discovery: "cdp_bazaar",
  omniReceiver,
  listedRoutes: discovery.resources.length,
  canonicalMarketRisk: {
    route: marketRiskListing.resource,
    amountUsdc: 0.003,
    network: marketRiskQuote.network,
    asset: marketRiskQuote.asset,
    payTo: marketRiskQuote.payTo,
  },
}, null, 2));

if (process.env.ACM_CONFIRM_TESTNET_SPEND !== "yes") {
  await writeReport({
    reportVersion: "design_partner_check.v2",
    ok: true,
    mode: "no_spend",
    externalPackageInstall: process.env.ACM_EXTERNAL_PACKAGE_SMOKE === "passed" ? "passed" : "not_run",
    catalog: {
      source: "cdp_bazaar",
      listedRoutes: discovery.resources.length,
      canonicalMarketRisk: {
        amountUsdc: 0.003,
        network: marketRiskQuote.network,
        asset: marketRiskQuote.asset,
        payTo: marketRiskQuote.payTo,
      },
    },
  });
  console.log("OMNI_X402_NO_SPEND_READY");
  console.log("Set ACM_CONFIRM_TESTNET_SPEND=yes only when a protected funded gateway and explicit grant are intended.");
  process.exit(0);
}

const gatewayUrl = process.env.ACM_GATEWAY_URL;
if (!gatewayUrl) {
  throw new Error("Set ACM_GATEWAY_URL to a protected Agent Capability Middleware gateway");
}

const resourceUrl = "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current";
const apiKey = process.env.ACM_API_KEY;
const client = new AgentCapabilityClient(gatewayUrl, apiKey ? { apiKey } : {});
const agent = await client.registerAgent({
  name: "Omni Research Agent",
  developerId: "public_sdk_omni_example",
});
const grant = await client.createGrant({
  userId: process.env.ACM_USER_ID ?? "user_demo",
  agentId: agent.id,
  scopes: ["x402.pay"],
  spendPolicy: {
    currency: "USDC",
    perRequestMax: 0.003,
    dailyMax: 0.05,
    approvalRequiredAbove: 0.003,
  },
  resourcePolicy: {
    allowedDomains: [new URL(resourceUrl).hostname],
    allowedCategories: ["market_intelligence"],
  },
  settlementPolicy: {
    allowedNetworks: ["eip155:84532"],
    allowedAssets: [{
      network: "eip155:84532",
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      symbol: "USDC",
      decimals: 6,
    }],
    allowedPayees: [omniReceiver],
    requireApprovalForMainnet: true,
  },
  expiresInSeconds: 900,
});

const paymentRequest = {
  grantId: grant.id,
  resourceUrl,
  category: "market_intelligence",
  purpose: "summarize_current_market_intelligence",
  idempotencyKey: randomUUID(),
  expectedPayment: {
    amount: 0.003,
    network: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    payTo: omniReceiver,
  },
};
const result = await client.consumeX402Testnet(paymentRequest);
const resourceBody = requireFreshPaidResult(result, {
  expectedSchema: "market_risk_snapshot.v1",
});

const paidSummary = {
  decision: result.decision,
  status: result.status,
  receiptId: result.receiptId,
  auditEventId: result.auditEventId ?? result.policyResult?.auditEventId,
  schema: resourceBody.schema,
  freshness: resourceBody.freshness.status,
  symbol: resourceBody.symbol,
  newsItems: Array.isArray(resourceBody.news?.items) ? resourceBody.news.items.length : undefined,
  totalPositions: resourceBody.liquidations?.summary?.total_positions,
};
if (!paidSummary.receiptId) throw new Error("Paid result omitted the public settlement receipt");
if (!paidSummary.auditEventId) throw new Error("Paid result omitted the ACM audit event id");

const revokedGrant = await client.revokeGrant(grant.id);
if (!revokedGrant.revokedAt) throw new Error("Gateway did not confirm grant revocation");
const deniedAfterRevocation = await client.consumeX402Testnet({
  ...paymentRequest,
  purpose: "prove_revoked_grant_cannot_spend",
  idempotencyKey: randomUUID(),
});
if (deniedAfterRevocation.decision !== "deny" || deniedAfterRevocation.reason !== "grant_revoked") {
  throw new Error(
    `Expected grant_revoked denial after revocation, received ${deniedAfterRevocation.decision}:${deniedAfterRevocation.reason ?? "missing"}`,
  );
}
if (deniedAfterRevocation.receiptId) {
  throw new Error("Revoked-grant denial unexpectedly included a settlement receipt");
}
await writeReport({
  reportVersion: "design_partner_check.v2",
  ok: true,
  mode: "paid_testnet",
  externalPackageInstall: process.env.ACM_EXTERNAL_PACKAGE_SMOKE === "passed" ? "passed" : "not_run",
  grantProvisioning: "synthetic_demo_operator",
  catalog: {
    source: "cdp_bazaar",
    listedRoutes: discovery.resources.length,
  },
  payment: {
    resource: resourceUrl,
    amountUsdc: 0.003,
    network: marketRiskQuote.network,
    asset: marketRiskQuote.asset,
    payTo: marketRiskQuote.payTo,
  },
  result: paidSummary,
  revocation: {
    grantId: grant.id,
    revokedAt: revokedGrant.revokedAt,
    deniedDecision: deniedAfterRevocation.decision,
    denialReason: deniedAfterRevocation.reason,
    denialAuditEventId: deniedAfterRevocation.auditEventId,
    settlementCreated: false,
  },
});
console.log(JSON.stringify(paidSummary, null, 2));
console.log("OMNI_X402_PAID_FRESH_OK");
console.log("OMNI_X402_REVOKED_DENY_OK");

async function writeReport(report) {
  const reportPath = process.env.ACM_PARTNER_REPORT_PATH;
  if (!reportPath) return;
  const completedAt = new Date();
  await writeFile(resolve(reportPath), `${JSON.stringify({
    ...report,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    elapsedMs: completedAt.getTime() - startedAt.getTime(),
    secretsIncluded: false,
  }, null, 2)}\n`, { mode: 0o600 });
}
