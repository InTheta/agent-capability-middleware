import {
  createDeveloperServiceOffer,
  createUserCapabilityOffer,
  LocalCapabilityDirectory,
} from "@agent-capability-middleware/sdk";

const directory = new LocalCapabilityDirectory();
const payTo = "0x1111111111111111111111111111111111111111";

const offers = [
  createDeveloperServiceOffer({
    developerId: "market_data_builder",
    name: "Market-risk snapshot",
    description: "Fresh structured context for a trading agent.",
    capability: "api.market_risk.current",
    purpose: "build_current_risk_brief",
    endpoint: "https://seller.example/x402/market-risk/BTC",
    terms: { policy: "paid", priceUsdc: 0.003, payTo, network: "eip155:84532" },
  }),
  createUserCapabilityOffer({
    userId: "user_demo",
    name: "Running-shoe intent",
    description: "A user-confirmed, minimum-disclosure shopping signal.",
    capability: "commerce.intent.running_shoes",
    purpose: "match_running_shoe_offer",
    confirmedByUser: true,
    projection: { category: "running_shoes", budgetBand: "GBP_70_110" },
    terms: { policy: "ask" },
  }),
];
for (const offer of offers) directory.publish(offer);

const catalog = directory.list();
const decisions = catalog.map((offer) => directory.request({
  offerId: offer.id,
  requesterId: "buyer_agent",
  purpose: offer.purpose,
  maximumPriceUsdc: 0.01,
}));

if (decisions[0]?.decision !== "payment_required" || decisions[1]?.decision !== "requires_user_approval") {
  throw new Error("The exchange did not preserve Paid and Ask policies");
}
console.log(JSON.stringify({ mode: "local_fixed_price_preview", catalog, decisions, settled: false }, null, 2));
console.log("DATA_EXCHANGE_PREVIEW_OK");
