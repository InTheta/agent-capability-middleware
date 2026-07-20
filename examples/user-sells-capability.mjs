import {
  createShoppingEvidenceImportRequest,
  createUserCapabilityOffer,
  LocalCapabilityDirectory,
  parseShoppingOrderCsv,
} from "@agent-capability-middleware/sdk";

const csv = [
  "Order Date,Product Name,Item Total",
  '2026-06-12,"Nike running shoe black size 10",89.99',
  '2026-05-01,"Nike trail shoe blue size 10",74.00',
].join("\n");
const preview = parseShoppingOrderCsv(csv, { source: "local_demo_export" });
const minimized = createShoppingEvidenceImportRequest("user_demo", preview);
const directory = new LocalCapabilityDirectory();
const offer = directory.publish(createUserCapabilityOffer({
  userId: "user_demo",
  name: "Running-shoe purchase intent",
  description: "A confirmed shopping intent without order rows or exact product history.",
  capability: "commerce.intent.running_shoes",
  purpose: "match_running_shoe_offer",
  confirmedByUser: true,
  projection: {
    category: "running_shoes",
    sizeBand: "UK_9_10",
    budgetBand: "GBP_70_110",
    preferredBrands: minimized.signals.filter((signal) => signal.kind === "brand").map((signal) => signal.value),
  },
  retention: "session",
  terms: {
    policy: "paid",
    priceUsdc: 0.01,
    payTo: "0x1111111111111111111111111111111111111111",
    network: "eip155:84532",
  },
}));
const decision = directory.request({
  offerId: offer.id,
  requesterId: "merchant_agent",
  purpose: "match_running_shoe_offer",
  maximumPriceUsdc: 0.02,
});
if (decision.decision !== "payment_required") throw new Error("Expected a payment requirement");

console.log(JSON.stringify({
  offer,
  decision,
  privacy: preview.privacy,
  rawRowsPublished: false,
  settled: false,
}, null, 2));
console.log("USER_SELLER_PREVIEW_OK");
