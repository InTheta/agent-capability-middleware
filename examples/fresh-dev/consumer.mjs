import { randomUUID } from "node:crypto";
import {
  AgentCapabilityClient,
  requireFreshPaidResult,
} from "@agent-capability-middleware/sdk";

const gatewayUrl = process.env.ACM_GATEWAY_URL;
if (!gatewayUrl) throw new Error("ACM_GATEWAY_URL is required");

const acm = new AgentCapabilityClient(gatewayUrl);
const agent = await acm.registerAgent({
  name: "Fresh Install Agent",
  developerId: "clean_room_example",
});
const grant = await acm.createGrant({
  userId: "user_clean_room",
  agentId: agent.id,
  scopes: ["x402.pay"],
  deniedScopes: ["wallet.transfer", "trading.execute", "cookies.*"],
  spendPolicy: {
    currency: "USDC",
    perRequestMax: 0.003,
    dailyMax: 0.003,
    approvalRequiredAbove: 0.003,
  },
  resourcePolicy: {
    allowedDomains: ["omniterminal.app"],
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
    allowedPayees: ["0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457"],
    requireApprovalForMainnet: true,
  },
  expiresInSeconds: 900,
});

const request = {
  grantId: grant.id,
  resourceUrl: "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current",
  category: "market_intelligence",
  purpose: "clean_room_market_risk_brief",
  idempotencyKey: randomUUID(),
  expectedPayment: {
    amount: 0.003,
    network: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
  },
};

const paid = await acm.consumeX402Testnet(request);
const resource = requireFreshPaidResult(paid, {
  expectedSchema: "market_risk_snapshot.v1",
});

const revoked = await acm.revokeGrant(grant.id);
if (!revoked.revokedAt) throw new Error("Grant revocation was not confirmed");
const denied = await acm.consumeX402Testnet({
  ...request,
  purpose: "prove_revocation_before_payment",
  idempotencyKey: randomUUID(),
});
if (denied.decision !== "deny" || denied.reason !== "grant_revoked" || denied.receiptId) {
  throw new Error("Expected a receipt-free grant_revoked denial");
}

console.log(JSON.stringify({
  mode: "mock_no_spend",
  agentId: agent.id,
  grantId: grant.id,
  paidDecision: paid.decision,
  receiptId: paid.receiptId,
  schema: resource.schema,
  freshness: resource.freshness.status,
  revokedAt: revoked.revokedAt,
  postRevokeDecision: denied.decision,
  postRevokeReason: denied.reason,
  secondSettlementCreated: false,
}, null, 2));
console.log("FRESH_DEV_MOCK_OK");
