import {
  createDeveloperServiceOffer,
  LocalCapabilityDirectory,
} from "@agent-capability-middleware/sdk";

const directory = new LocalCapabilityDirectory();
const offer = directory.publish(createDeveloperServiceOffer({
  developerId: "developer_acme",
  name: "Current weather risk",
  description: "A fresh structured weather-risk result for delivery agents.",
  capability: "api.weather.delivery_risk",
  purpose: "check_delivery_conditions",
  endpoint: "https://api.example.com/x402/weather-risk",
  terms: {
    policy: "paid",
    priceUsdc: 0.002,
    payTo: "0x1111111111111111111111111111111111111111",
    network: "eip155:84532",
  },
}));

const decision = directory.request({
  offerId: offer.id,
  requesterId: "delivery_agent",
  purpose: "check_delivery_conditions",
  maximumPriceUsdc: 0.005,
});
if (decision.decision !== "payment_required") throw new Error("Expected an x402 payment requirement");

console.log(JSON.stringify({ offer, decision, privateKeyUsed: false, settled: false }, null, 2));
console.log("DEVELOPER_SELLER_PREVIEW_OK");
