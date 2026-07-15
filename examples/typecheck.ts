import {
  AgentCapabilityClient,
  createShoppingEvidenceImportRequest,
  parseShoppingOrderCsv,
  type RegisterAgentRequest,
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
  resourceUrl: "https://dev.omniterminal.app/api/x402/v1/news/BTC?limit=5",
  category: "market_intelligence",
  purpose: "typed_example",
  idempotencyKey: "typed_example_001",
});
