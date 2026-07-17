import { randomUUID } from "node:crypto";
import {
  AgentCapabilityClient,
  listCdpX402MerchantResources,
} from "@agent-capability-middleware/sdk";

const omniReceiver = process.env.OMNI_X402_PAY_TO
  ?? "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
const discovery = await listCdpX402MerchantResources(omniReceiver, { limit: 100 });
console.log(JSON.stringify({ discovery: "cdp_bazaar", omniReceiver, resources: discovery.resources }, null, 2));

if (process.env.ACM_CONFIRM_TESTNET_SPEND !== "yes") {
  console.log("Discovery is read-only. Set ACM_CONFIRM_TESTNET_SPEND=yes to run the funded testnet call.");
  process.exit(0);
}

const gatewayUrl = process.env.ACM_GATEWAY_URL;
if (!gatewayUrl) {
  throw new Error("Set ACM_GATEWAY_URL to a protected Agent Capability Middleware gateway");
}

const resourceUrl = process.env.OMNI_X402_RESOURCE_URL
  ?? "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current";
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

const result = await client.consumeX402Testnet({
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
});

if (result.decision !== "paid") throw new Error(`Payment failed: ${result.reason ?? result.decision}`);
if (result.resourceBody?.freshness?.status !== "fresh") {
  throw new Error(`Paid resource is not fresh: ${result.resourceBody?.freshness?.status ?? "missing"}`);
}

console.log(JSON.stringify({ resourceUrl, agentId: agent.id, grantId: grant.id, result }, null, 2));
