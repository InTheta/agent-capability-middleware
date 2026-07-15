import { randomUUID } from "node:crypto";
import { AgentCapabilityClient } from "@agent-capability-middleware/sdk";

if (process.env.ACM_CONFIRM_CATALOG_TESTNET_SPEND !== "yes") {
  throw new Error("Set ACM_CONFIRM_CATALOG_TESTNET_SPEND=yes to authorize 0.025 test USDC");
}
const gatewayUrl = process.env.ACM_GATEWAY_URL;
if (!gatewayUrl) throw new Error("Set ACM_GATEWAY_URL to a protected ACM gateway");
const origin = (process.env.OMNI_X402_ORIGIN ?? "https://omniterminal.app").replace(/\/$/, "");
const now = Date.now();
const resources = [
  `${origin}/api/x402/v1/news/BTC?mode=latest&event_window_minutes=15&limit=3`,
  `${origin}/api/x402/v1/news?mode=latest&market=crypto&event_window_minutes=60&limit=3`,
  `${origin}/api/x402/v1/news/BTC?mode=context`,
  `${origin}/api/x402/v1/news?mode=window&from_timestamp=${now - 3_600_000}&to_timestamp=${now}&limit=5`,
  `${origin}/api/x402/v1/liquidations/BTC?view=summary`,
  `${origin}/api/x402/v1/liquidations/BTC?view=buckets&order=strongest&limit=10`,
  `${origin}/api/x402/v1/liquidations/BTC?view=clusters&order=strongest&limit=10`,
  `${origin}/api/x402/v1/liquidations/BTC?view=flow&limit=10`,
  `${origin}/api/x402/v1/traders/BTC?rank=best&limit=5`,
  `${origin}/api/x402/v1/traders/BTC?rank=worst&limit=5`,
  `${origin}/api/x402/v1/traders/BTC?rank=largest&limit=5`,
  `${origin}/api/x402/v1/traders/BTC?rank=risk&limit=5`,
  `${origin}/api/x402/v1/trader-profile/0x0ddf9bae2af4b874b96d287a5ad42eb47138a902?range=30d`,
  `${origin}/api/x402/v1/market-risk/BTC?scope=current`,
];
const client = new AgentCapabilityClient(gatewayUrl, process.env.ACM_API_KEY ? { apiKey: process.env.ACM_API_KEY } : {});
const agent = await client.registerAgent({ name: "Omni Catalog Agent", developerId: "public_sdk_catalog" });
const grant = await client.createGrant({
  userId: process.env.ACM_USER_ID ?? "user_demo",
  agentId: agent.id,
  scopes: ["x402.pay"],
  spendPolicy: { currency: "USDC", perRequestMax: 0.003, dailyMax: 0.05, approvalRequiredAbove: 0.003 },
  resourcePolicy: { allowedDomains: [new URL(origin).hostname], allowedCategories: ["market_intelligence"] },
  expiresInSeconds: 900,
});
const results = [];
for (const resourceUrl of resources) {
  const result = await client.payQuotedX402Testnet({
    grantId: grant.id,
    resourceUrl,
    category: "market_intelligence",
    purpose: "verify_omni_catalog",
    idempotencyKey: randomUUID(),
  });
  results.push({ resourceUrl, decision: result.decision, receiptId: result.receiptId });
}
console.log(JSON.stringify({ calls: results.length, allPaid: results.every((item) => item.decision === "paid"), results }, null, 2));
