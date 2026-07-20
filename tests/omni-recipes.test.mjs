import assert from "node:assert/strict";
import test from "node:test";

import {
  createOmniPaymentRequest,
  createOmniRecipeGrant,
  createOmniX402Recipe,
  listOmniAgentRecipes,
} from "../dist/index.js";

test("builds the 60-minute briefing on the canonical market-news route", () => {
  const recipe = createOmniX402Recipe({
    kind: "hourly_market_briefing",
    market: "crypto",
    limit: 8,
    impact: "high",
  });
  assert.equal(
    recipe.resourceUrl,
    "https://omniterminal.app/api/x402/v1/news?market=crypto&mode=latest&event_window_minutes=60&limit=8&impact=high",
  );
  assert.equal(recipe.priceUsdc, 0.001);
  assert.equal(recipe.schema, "news_pulse.v1");
  assert.match(recipe.note, /24-hour source window/);
});

test("maps screenshot-bot trader concepts to one bounded Bazaar route", () => {
  for (const rank of ["best", "worst", "largest", "largest_size", "wallet_size", "risk", "closest"]) {
    const recipe = createOmniX402Recipe({ kind: "traders", symbol: "btc", rank, limit: 5 });
    assert.equal(new URL(recipe.resourceUrl).pathname, "/api/x402/v1/traders/BTC");
    assert.equal(new URL(recipe.resourceUrl).searchParams.get("rank"), rank);
    assert.equal(recipe.priceUsdc, 0.002);
  }
});

test("builds exact payment intent and a least-privilege aggregate grant", () => {
  const recipes = [
    createOmniX402Recipe({ kind: "targeted_news", symbol: "ETH", limit: 3 }),
    createOmniX402Recipe({ kind: "market_risk", symbol: "BTC" }),
  ];
  const grant = createOmniRecipeGrant("agent_test", recipes, { userId: "user_test" });
  assert.equal(grant.spendPolicy.perRequestMax, 0.003);
  assert.equal(grant.spendPolicy.dailyMax, 0.004);
  assert.deepEqual(grant.resourcePolicy.allowedDomains, ["omniterminal.app"]);
  assert.deepEqual(grant.settlementPolicy.allowedNetworks, ["eip155:84532"]);

  const request = createOmniPaymentRequest("grant_test", recipes[1], "request_123");
  assert.equal(request.resourceUrl, recipes[1].resourceUrl);
  assert.deepEqual(request.expectedPayment, recipes[1].expectedPayment);
});

test("rejects unbounded or malformed inputs before a payment request exists", () => {
  assert.throws(
    () => createOmniX402Recipe({ kind: "traders", symbol: "BTC", limit: 21 }),
    /limit must be an integer from 1 to 20/,
  );
  assert.throws(
    () => createOmniX402Recipe({ kind: "trader_profile", address: "0x1234" }),
    /20-byte EVM address/,
  );
  assert.throws(
    () => createOmniX402Recipe({
      kind: "historical_news",
      market: "crypto",
      fromTimestamp: 1_700_000_000_000,
      toTimestamp: 1_700_700_000_001,
    }),
    /seven days/,
  );
});

test("lists coherent recipes without creating new route templates", () => {
  const recipes = listOmniAgentRecipes(1_800_000_000_000);
  assert.equal(recipes.length, 11);
  assert.equal(new Set(recipes.map((recipe) => new URL(recipe.resourceUrl).pathname.split("/").slice(0, 6).join("/"))).size > 0, true);
  assert.equal(recipes.every((recipe) => recipe.resourceUrl.startsWith("https://omniterminal.app/api/x402/v1/")), true);
});
