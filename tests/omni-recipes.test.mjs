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

test("maps screenshot-bot chart and filtered news concepts to bounded routes", () => {
  const snapshot = createOmniX402Recipe({
    kind: "market_snapshot",
    symbol: "btc",
    interval: "15m",
    limit: 150,
    scope: "aggregate",
    includeLiquidations: true,
  });
  assert.equal(
    snapshot.resourceUrl,
    "https://omniterminal.app/api/x402/v1/market-snapshot/BTC?interval=15m&limit=150&scope=aggregate&include_liquidations=true",
  );
  assert.equal(snapshot.schema, "hyperliquid_market_snapshot.v1");
  assert.equal(snapshot.priceUsdc, 0.003);

  const news = createOmniX402Recipe({
    kind: "targeted_news",
    symbol: "ETH",
    order: "impact",
    offset: 1,
    nearestTimestamp: 1_800_000_000_000,
    limit: 1,
  });
  const params = new URL(news.resourceUrl).searchParams;
  assert.equal(params.get("order"), "impact");
  assert.equal(params.get("offset"), "1");
  assert.equal(params.get("nearest_timestamp"), "1800000000000");
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

test("builds bounded 15-minute and 60-minute composite risk calls", () => {
  const fast = createOmniX402Recipe({
    kind: "market_risk",
    symbol: "BTC",
    scope: "current",
    eventWindowMinutes: 15,
    limit: 8,
  });
  assert.equal(
    fast.resourceUrl,
    "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current&event_window_minutes=15&limit=8",
  );
  const hourly = createOmniX402Recipe({
    kind: "market_risk",
    symbol: "ETH",
    eventWindowMinutes: 60,
  });
  assert.equal(new URL(hourly.resourceUrl).searchParams.get("event_window_minutes"), "60");
  assert.equal(new URL(hourly.resourceUrl).searchParams.get("limit"), "5");
  assert.throws(
    () => createOmniX402Recipe({ kind: "market_risk", symbol: "BTC", limit: 11 }),
    /limit must be an integer from 1 to 10/,
  );
});

test("builds bounded entity-resolution and market-carry requests", () => {
  const resolution = createOmniX402Recipe({
    kind: "entity_resolution",
    mentions: [" bitcoin ", "BTC-PERP"],
  });
  assert.equal(
    resolution.resourceUrl,
    "https://omniterminal.app/api/x402/v1/symbols/resolve",
  );
  assert.equal(resolution.method, "POST");
  assert.deepEqual(resolution.headers, {
    "content-type": "application/json",
  });
  assert.deepEqual(JSON.parse(resolution.body), {
    mentions: ["bitcoin", "BTC-PERP"],
    venue: "hyperliquid",
  });
  assert.equal(resolution.schema, "market_entity_resolution.v1");
  assert.equal(resolution.priceUsdc, 0.001);

  const payment = createOmniPaymentRequest(
    "grant_resolver",
    resolution,
    "resolve_request_001",
  );
  assert.equal(payment.method, "POST");
  assert.deepEqual(payment.headers, {
    "content-type": "application/json",
  });
  assert.equal(payment.body, resolution.body);

  const carry = createOmniX402Recipe({
    kind: "market_carry",
    symbol: "btc",
  });
  assert.equal(
    carry.resourceUrl,
    "https://omniterminal.app/api/x402/v1/market-carry/BTC",
  );
  assert.equal(carry.schema, "hyperliquid_market_carry.v1");
  assert.equal(carry.priceUsdc, 0.001);
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
  assert.throws(
    () => createOmniX402Recipe({ kind: "market_snapshot", symbol: "BTC", limit: 201 }),
    /limit must be an integer from 20 to 200/,
  );
  assert.throws(
    () =>
      createOmniX402Recipe({
        kind: "entity_resolution",
        mentions: Array.from({ length: 21 }, (_, index) => `symbol-${index}`),
      }),
    /mentions must contain from 1 to 20 items/,
  );
});

test("lists coherent recipes without creating new route templates", () => {
  const recipes = listOmniAgentRecipes(1_800_000_000_000);
  assert.equal(recipes.length, 25);
  assert.deepEqual(
    new Set(
      recipes
        .filter((recipe) => recipe.kind === "traders")
        .map((recipe) => new URL(recipe.resourceUrl).searchParams.get("rank")),
    ),
    new Set(["best", "worst", "largest", "largest_size", "wallet_size", "risk", "closest"]),
  );
  assert.deepEqual(
    new Set(
      recipes
        .filter((recipe) => recipe.kind === "liquidations")
        .map((recipe) => new URL(recipe.resourceUrl).searchParams.get("view")),
    ),
    new Set(["summary", "buckets", "clusters", "flow"]),
  );
  assert.equal(
    recipes.filter((recipe) => recipe.kind === "entity_resolution").length,
    1,
  );
  assert.equal(
    recipes.filter((recipe) => recipe.kind === "market_carry").length,
    1,
  );
  assert.equal(new Set(recipes.map((recipe) => new URL(recipe.resourceUrl).pathname.split("/").slice(0, 6).join("/"))).size > 0, true);
  assert.equal(recipes.every((recipe) => recipe.resourceUrl.startsWith("https://omniterminal.app/api/x402/v1/")), true);
});
