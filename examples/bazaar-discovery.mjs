import {
  listCdpX402MerchantResources,
  searchCdpX402Bazaar,
} from "@agent-capability-middleware/sdk";

const payTo = process.env.OMNI_X402_PAY_TO
  ?? "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";

const [merchant, search] = await Promise.all([
  listCdpX402MerchantResources(payTo, { limit: 100 }),
  searchCdpX402Bazaar({
    query: "Hyperliquid news market risk",
    network: "eip155:84532",
    payTo,
    limit: 20,
  }),
]);

const routes = merchant.resources.map((resource) => {
  const quote = resource.accepts.find((accept) => accept.network === "eip155:84532")
    ?? resource.accepts[0];
  return {
    service: resource.serviceName ?? resource.id ?? productName(resource.resource),
    method: resource.method ?? "GET",
    resource: resource.resource,
    network: quote?.network,
    amountUsdc: quote ? Number(quote.amount) / 1_000_000 : undefined,
    calls30d: resource.quality?.l30DaysTotalCalls,
  };
});

console.log(JSON.stringify({
  mode: "public_discovery_no_spend",
  source: "cdp_x402_bazaar",
  payTo,
  merchantRouteCount: routes.length,
  semanticSearchMatches: search.resources.length,
  routes,
}, null, 2));
console.log("BAZAAR_DISCOVERY_NO_SPEND_OK");

function productName(resource) {
  if (resource.includes("market-risk")) return "Omni Market Risk Snapshot";
  if (resource.includes("trader-profile")) return "Omni Hyperliquid Trader Profile";
  if (resource.includes("/traders/")) return "Omni Hyperliquid Trader Leaderboard";
  if (resource.includes("/liquidations/")) return "Omni Hyperliquid Liquidation Map";
  if (resource.endsWith("/news/:symbol")) return "Omni AI News Pulse — Symbol";
  if (resource.endsWith("/news")) return "Omni AI News Pulse — Market";
  return "Omni x402 Resource";
}
