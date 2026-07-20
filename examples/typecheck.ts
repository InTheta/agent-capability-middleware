import {
  AgentCapabilityClient,
  createDeveloperServiceOffer,
  createOmniPaymentRequest,
  createOmniRecipeGrant,
  createOmniX402Recipe,
  createShoppingEvidenceImportRequest,
  createUserCapabilityOffer,
  listCdpX402MerchantResources,
  parseShoppingOrderCsv,
  LocalCapabilityDirectory,
  requireFreshPaidResult,
  searchCdpX402Bazaar,
  type RegisterAgentRequest,
  type OmniNewsPulseResponse,
} from "@agent-capability-middleware/sdk";

const client = new AgentCapabilityClient("http://127.0.0.1:8787/", { apiKey: "test_key" });
const registration: RegisterAgentRequest = {
  name: "Typed SDK Consumer",
  developerId: "typescript_example",
};
const preview = parseShoppingOrderCsv(
  "Order Date,Product Name,Item Total\n2026-07-01,Nike trainer size 10,89.99",
  { source: "amazon_order_history_export" },
);

void client.registerAgent(registration);
void client.listAgents();
void client.importShoppingEvidence(createShoppingEvidenceImportRequest("user_typescript_example", preview));
void client.getConfirmedAttribute("grant_example", "preferences.shopping.brands", "typed_example");
void client.payQuotedX402Testnet({
  grantId: "grant_example",
  resourceUrl: "https://omniterminal.app/api/x402/v1/news/BTC?limit=5",
  category: "market_intelligence",
  purpose: "typed_example",
  idempotencyKey: "typed_example_001",
});
void client.payQuotedX402({
  grantId: "grant_example",
  resourceUrl: "https://seller.example.com/paid",
  category: "market_intelligence",
  purpose: "typed_mainnet_example",
  idempotencyKey: "typed_mainnet_example_001",
});
const paidResult = client.consumeX402<{ schema: string; freshness: { status: string } }>({
  grantId: "grant_example",
  resourceUrl: "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current",
  category: "market_intelligence",
  purpose: "typed_mainnet_consumption",
  idempotencyKey: "typed_mainnet_consumption_001",
  expectedPayment: {
    amount: 0.003,
    network: "eip155:8453",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
  },
});
void paidResult.then((result) => requireFreshPaidResult(result, { expectedSchema: "market_risk_snapshot.v1" }));
void client.getMainnetWalletStatus();
void client.getMainnetWalletBalances();

void searchCdpX402Bazaar({ query: "market news", network: "eip155:84532", limit: 5 });
void listCdpX402MerchantResources("0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457");

const hourlyBriefing = createOmniX402Recipe({
  kind: "hourly_market_briefing",
  market: "crypto",
  limit: 8,
  minConfidence: 0.7,
});
const recipeGrant = createOmniRecipeGrant("agent_example", [hourlyBriefing]);
void client.createGrant(recipeGrant);
void client.consumeX402Testnet<OmniNewsPulseResponse>(createOmniPaymentRequest(
  "grant_example",
  hourlyBriefing,
  "typed_hourly_briefing_001",
));

const directory = new LocalCapabilityDirectory();
directory.publish(createDeveloperServiceOffer({
  developerId: "developer_example",
  name: "Typed API",
  description: "Compile-time seller example",
  capability: "api.example.current",
  purpose: "typed_example",
  endpoint: "https://example.com/x402/data",
  terms: {
    policy: "paid",
    priceUsdc: 0.001,
    payTo: "0x1111111111111111111111111111111111111111",
    network: "eip155:84532",
  },
}));
directory.publish(createUserCapabilityOffer({
  userId: "user_example",
  name: "Typed user intent",
  description: "Compile-time minimum disclosure example",
  capability: "commerce.intent.running_shoes",
  purpose: "typed_example",
  confirmedByUser: true,
  projection: { category: "running_shoes" },
  terms: { policy: "ask" },
}));
