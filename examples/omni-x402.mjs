import { randomUUID } from "node:crypto";
import { AgentCapabilityClient } from "@agent-capability-middleware/sdk";

const gatewayUrl = process.env.ACM_GATEWAY_URL;
if (!gatewayUrl) {
  throw new Error("Set ACM_GATEWAY_URL to a protected Agent Capability Middleware gateway");
}

const resourceUrl = process.env.OMNI_X402_RESOURCE_URL
  ?? "https://dev.omniterminal.app/api/x402/v1/news/BTC?limit=5";
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
    perRequestMax: 0.002,
    dailyMax: 0.02,
    approvalRequiredAbove: 0.002,
  },
  resourcePolicy: {
    allowedDomains: [new URL(resourceUrl).hostname],
    allowedCategories: ["market_intelligence"],
  },
  expiresInSeconds: 900,
});

const result = await client.payQuotedX402Testnet({
  grantId: grant.id,
  resourceUrl,
  category: "market_intelligence",
  purpose: "summarize_current_market_intelligence",
  idempotencyKey: randomUUID(),
});

console.log(JSON.stringify({ resourceUrl, agentId: agent.id, grantId: grant.id, result }, null, 2));
