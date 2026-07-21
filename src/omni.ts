import type { CreateGrantRequest, PayQuotedX402TestnetRequest } from "./index.js";

export const OMNI_X402_ORIGIN = "https://omniterminal.app";
export const OMNI_X402_RECEIVER = "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
export const OMNI_BASE_SEPOLIA_NETWORK = "eip155:84532";
export const OMNI_BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export type OmniMarket = "crypto" | "macro" | "equities" | "forex";
export type OmniNewsSentiment = "bullish" | "bearish" | "neutral";
export type OmniNewsImpact = "high" | "medium" | "low";
export type OmniAnalyticsScope = "current" | "aggregate";
export type OmniLiquidationView = "summary" | "buckets" | "clusters" | "flow";
export type OmniMarketInterval = "1m" | "5m" | "15m" | "1h" | "2h" | "4h" | "8h" | "1d" | "3d" | "1w" | "1M";
export type OmniTraderRank =
  | "best"
  | "worst"
  | "largest"
  | "largest_size"
  | "wallet_size"
  | "risk"
  | "closest";

export interface OmniFreshness {
  status: "fresh" | "stale" | "historical" | "unknown";
  data_as_of?: string | null;
  age_seconds?: number | null;
  max_age_seconds?: number | null;
}

export interface OmniNewsPulseResponse {
  service: "omni.ai_news_pulse";
  schema: "news_pulse.v1";
  symbol?: string;
  market: string;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness;
  market_context: null | {
    object: "market_context.v1";
    generated_at: string;
    cadence_minutes: number;
    source_window_hours: number | null;
    summary: string;
    direction: string;
    sentiment_rating: number;
    confidence: number;
    notable_tickers: string[];
    topics: string[];
    timeline: Record<string, unknown>[];
  };
  items: Record<string, unknown>[];
  usage: {
    item_count: number;
    lookback_hours: number;
    event_window_minutes: 15 | 60;
    mode: "latest" | "window" | "context";
    from_timestamp: number | null;
    to_timestamp: number | null;
    order: "recent" | "impact";
    offset: number;
    nearest_timestamp: number | null;
  };
}

export interface OmniTraderLeaderboardResponse {
  service: "omni.hyperliquid_trader_leaderboard";
  schema: "hyperliquid_trader_leaderboard.v1";
  symbol: string;
  scope: OmniAnalyticsScope;
  rank: OmniTraderRank;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness;
  rows: Record<string, unknown>[];
  usage: { item_count: number; item_limit: number };
}

export interface OmniLiquidationMapResponse {
  service: "omni.hyperliquid_liquidation_map";
  schema: "hyperliquid_liquidation_map.v1";
  symbol: string;
  scope: OmniAnalyticsScope;
  view: OmniLiquidationView;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness;
  summary: Record<string, number | null>;
  buckets?: Record<string, unknown>[];
  clusters?: { buy: Record<string, unknown>[]; sell: Record<string, unknown>[] };
  flow?: Record<string, unknown>[];
  nearest?: Record<string, unknown>[];
  largest?: Record<string, unknown>[];
}

export interface OmniTraderProfileResponse {
  service: "omni.trader_profile";
  schema: "trader_profile.v1";
  address: string;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness;
  [key: string]: unknown;
}

export interface OmniMarketSnapshotResponse {
  service: "omni.hyperliquid_market_snapshot";
  schema: "hyperliquid_market_snapshot.v1";
  symbol: string;
  interval: OmniMarketInterval;
  scope: OmniAnalyticsScope;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness;
  candles: Array<{
    open_time: number | null;
    close_time: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    trades: number | null;
  }>;
  liquidation_overlay?: OmniLiquidationMapResponse;
  usage: { candle_count: number; candle_limit: number; liquidation_overlay_included: boolean };
}

export interface OmniMarketRiskResponse {
  service: "omni.market_risk_snapshot";
  schema: "market_risk_snapshot.v1";
  symbol: string;
  scope: OmniAnalyticsScope;
  generated_at: string;
  data_as_of: string | null;
  freshness: OmniFreshness & {
    component_statuses: OmniFreshness["status"][];
    components: { liquidations: OmniFreshness; news: OmniFreshness };
  };
  liquidations: OmniLiquidationMapResponse;
  news: OmniNewsPulseResponse;
}

export type OmniX402Response =
  | OmniNewsPulseResponse
  | OmniTraderLeaderboardResponse
  | OmniLiquidationMapResponse
  | OmniTraderProfileResponse
  | OmniMarketRiskResponse
  | OmniMarketSnapshotResponse;

type NewsFilters = {
  limit?: number;
  sentiment?: OmniNewsSentiment;
  impact?: OmniNewsImpact;
  minConfidence?: number;
  order?: "recent" | "impact";
  offset?: number;
  nearestTimestamp?: number;
};

export type OmniRecipeInput =
  | ({ kind: "targeted_news"; symbol: string; eventWindowMinutes?: 15 | 60 } & NewsFilters)
  | ({ kind: "market_news"; market?: OmniMarket; eventWindowMinutes?: 15 | 60 } & NewsFilters)
  | ({ kind: "hourly_market_briefing"; market?: OmniMarket } & NewsFilters)
  | ({ kind: "news_context"; symbol?: string; market?: OmniMarket })
  | ({ kind: "historical_news"; symbol?: string; market?: OmniMarket; fromTimestamp: number; toTimestamp: number } & NewsFilters)
  | { kind: "trader_profile"; address: string; range?: "1d" | "7d" | "30d" | "all"; view?: "summary" | "positions" | "balances" | "full"; symbol?: string; limit?: number }
  | { kind: "liquidations"; symbol: string; scope?: OmniAnalyticsScope; view?: OmniLiquidationView; limit?: number; order?: "strongest" | "nearest" | "price"; aroundPrice?: number; side?: "all" | "long" | "short" }
  | { kind: "traders"; symbol: string; scope?: OmniAnalyticsScope; rank?: OmniTraderRank; limit?: number }
  | { kind: "market_risk"; symbol: string; scope?: OmniAnalyticsScope }
  | { kind: "market_snapshot"; symbol: string; interval?: OmniMarketInterval; limit?: number; scope?: OmniAnalyticsScope; includeLiquidations?: boolean };

export interface OmniX402Recipe {
  kind: OmniRecipeInput["kind"];
  label: string;
  resourceUrl: string;
  schema: string;
  priceUsdc: 0.001 | 0.002 | 0.003;
  category: "market_intelligence";
  purpose: string;
  expectedPayment: {
    amount: 0.001 | 0.002 | 0.003;
    network: typeof OMNI_BASE_SEPOLIA_NETWORK;
    asset: typeof OMNI_BASE_SEPOLIA_USDC;
    payTo: typeof OMNI_X402_RECEIVER;
  };
  note?: string;
}

/**
 * Build one deterministic, bounded Omni x402 request. These are recipes over seven seller route
 * templates—not additional per-query routes or a generic query proxy. Bazaar catalog status is
 * verified separately because a new route requires a successful CDP settlement before indexing.
 */
export function createOmniX402Recipe(input: OmniRecipeInput): OmniX402Recipe {
  const url = new URL(`${OMNI_X402_ORIGIN}/api/x402/v1/`);
  let label: string;
  let schema: string;
  let priceUsdc: OmniX402Recipe["priceUsdc"];
  let purpose: string;
  let note: string | undefined;

  switch (input.kind) {
    case "targeted_news": {
      const symbol = normalizedSymbol(input.symbol);
      url.pathname += `news/${symbol}`;
      addNewsQuery(url, input, "latest", input.eventWindowMinutes ?? 60);
      label = `${symbol} targeted news`;
      schema = "news_pulse.v1";
      priceUsdc = 0.001;
      purpose = `research_current_${symbol.toLowerCase()}_news`;
      break;
    }
    case "market_news": {
      const market = input.market ?? "crypto";
      url.pathname += "news";
      url.searchParams.set("market", market);
      addNewsQuery(url, input, "latest", input.eventWindowMinutes ?? 60);
      label = `${market} market news`;
      schema = "news_pulse.v1";
      priceUsdc = 0.001;
      purpose = `research_current_${market}_news`;
      break;
    }
    case "hourly_market_briefing": {
      const market = input.market ?? "crypto";
      url.pathname += "news";
      url.searchParams.set("market", market);
      addNewsQuery(url, input, "latest", 60);
      label = `${market} 60-minute agent briefing`;
      schema = "news_pulse.v1";
      priceUsdc = 0.001;
      purpose = `build_${market}_hourly_briefing`;
      note = "Combines a 60-minute event slice with market context refreshed every 15 minutes over a 24-hour source window.";
      break;
    }
    case "news_context": {
      url.pathname += input.symbol ? `news/${normalizedSymbol(input.symbol)}` : "news";
      if (!input.symbol) url.searchParams.set("market", input.market ?? "crypto");
      url.searchParams.set("mode", "context");
      label = input.symbol ? `${normalizedSymbol(input.symbol)} market context` : `${input.market ?? "crypto"} market context`;
      schema = "news_pulse.v1";
      priceUsdc = 0.001;
      purpose = "load_current_market_context";
      break;
    }
    case "historical_news": {
      requireTimestampWindow(input.fromTimestamp, input.toTimestamp);
      url.pathname += input.symbol ? `news/${normalizedSymbol(input.symbol)}` : "news";
      if (!input.symbol) url.searchParams.set("market", input.market ?? "crypto");
      url.searchParams.set("mode", "window");
      url.searchParams.set("from_timestamp", String(input.fromTimestamp));
      url.searchParams.set("to_timestamp", String(input.toTimestamp));
      addNewsFilters(url, input);
      label = `${input.symbol ? normalizedSymbol(input.symbol) : input.market ?? "crypto"} historical news window`;
      schema = "news_pulse.v1";
      priceUsdc = 0.001;
      purpose = "research_exact_historical_news_window";
      note = "Historical windows may correctly return freshness.status=historical rather than fresh.";
      break;
    }
    case "trader_profile": {
      const address = normalizedAddress(input.address);
      url.pathname += `trader-profile/${address}`;
      url.searchParams.set("range", input.range ?? "30d");
      url.searchParams.set("view", input.view ?? "full");
      if (input.symbol) url.searchParams.set("symbol", normalizedSymbol(input.symbol));
      url.searchParams.set("limit", String(boundedInteger(input.limit ?? 20, 1, 20, "limit")));
      label = "Public trader profile";
      schema = "trader_profile.v1";
      priceUsdc = 0.002;
      purpose = "evaluate_public_trader_profile";
      break;
    }
    case "liquidations": {
      const symbol = normalizedSymbol(input.symbol);
      url.pathname += `liquidations/${symbol}`;
      url.searchParams.set("scope", input.scope ?? "current");
      url.searchParams.set("view", input.view ?? "summary");
      url.searchParams.set("limit", String(boundedInteger(input.limit ?? 20, 1, 50, "limit")));
      if (input.order) url.searchParams.set("order", input.order);
      if (input.aroundPrice !== undefined) url.searchParams.set("around_price", String(positiveNumber(input.aroundPrice, "aroundPrice")));
      if (input.side) url.searchParams.set("side", input.side);
      label = `${symbol} liquidation ${input.view ?? "summary"}`;
      schema = "hyperliquid_liquidation_map.v1";
      priceUsdc = 0.002;
      purpose = `evaluate_${symbol.toLowerCase()}_liquidation_risk`;
      break;
    }
    case "traders": {
      const symbol = normalizedSymbol(input.symbol);
      const rank = input.rank ?? "best";
      url.pathname += `traders/${symbol}`;
      url.searchParams.set("scope", input.scope ?? "current");
      url.searchParams.set("rank", rank);
      url.searchParams.set("limit", String(boundedInteger(input.limit ?? 10, 1, 20, "limit")));
      label = `${symbol} trader ranking: ${rank}`;
      schema = "hyperliquid_trader_leaderboard.v1";
      priceUsdc = 0.002;
      purpose = `rank_public_${symbol.toLowerCase()}_traders_by_${rank}`;
      break;
    }
    case "market_risk": {
      const symbol = normalizedSymbol(input.symbol);
      url.pathname += `market-risk/${symbol}`;
      url.searchParams.set("scope", input.scope ?? "current");
      label = `${symbol} composite market risk`;
      schema = "market_risk_snapshot.v1";
      priceUsdc = 0.003;
      purpose = `build_current_${symbol.toLowerCase()}_risk_brief`;
      break;
    }
    case "market_snapshot": {
      const symbol = normalizedSymbol(input.symbol);
      url.pathname += `market-snapshot/${symbol}`;
      url.searchParams.set("interval", input.interval ?? "1h");
      url.searchParams.set("limit", String(boundedInteger(input.limit ?? 120, 20, 200, "limit")));
      url.searchParams.set("scope", input.scope ?? "aggregate");
      url.searchParams.set("include_liquidations", String(input.includeLiquidations ?? true));
      label = `${symbol} market snapshot`;
      schema = "hyperliquid_market_snapshot.v1";
      priceUsdc = 0.003;
      purpose = `evaluate_${symbol.toLowerCase()}_price_and_liquidation_structure`;
      break;
    }
  }

  return {
    kind: input.kind,
    label,
    resourceUrl: url.toString(),
    schema,
    priceUsdc,
    category: "market_intelligence",
    purpose,
    expectedPayment: {
      amount: priceUsdc,
      network: OMNI_BASE_SEPOLIA_NETWORK,
      asset: OMNI_BASE_SEPOLIA_USDC,
      payTo: OMNI_X402_RECEIVER,
    },
    ...(note ? { note } : {}),
  };
}

export function createOmniRecipeGrant(
  agentId: string,
  recipes: readonly OmniX402Recipe[],
  options: { userId?: string; expiresInSeconds?: number; approvalRequiredAbove?: number } = {},
): CreateGrantRequest {
  if (!agentId.trim()) throw new TypeError("agentId is required");
  if (recipes.length === 0) throw new TypeError("At least one Omni recipe is required");
  const maximum = Math.max(...recipes.map((recipe) => recipe.priceUsdc));
  const total = Math.round(recipes.reduce((sum, recipe) => sum + recipe.priceUsdc, 0) * 1_000_000) / 1_000_000;
  return {
    ...(options.userId ? { userId: options.userId } : {}),
    agentId,
    scopes: ["x402.pay"],
    spendPolicy: {
      currency: "USDC",
      perRequestMax: maximum,
      dailyMax: total,
      approvalRequiredAbove: options.approvalRequiredAbove ?? maximum,
    },
    resourcePolicy: {
      allowedDomains: [new URL(OMNI_X402_ORIGIN).hostname],
      allowedCategories: ["market_intelligence"],
    },
    settlementPolicy: {
      allowedNetworks: [OMNI_BASE_SEPOLIA_NETWORK],
      allowedAssets: [{
        network: OMNI_BASE_SEPOLIA_NETWORK,
        asset: OMNI_BASE_SEPOLIA_USDC,
        symbol: "USDC",
        decimals: 6,
      }],
      allowedPayees: [OMNI_X402_RECEIVER],
      requireApprovalForMainnet: true,
    },
    expiresInSeconds: options.expiresInSeconds ?? 900,
  };
}

export function createOmniPaymentRequest(
  grantId: string,
  recipe: OmniX402Recipe,
  idempotencyKey: string,
): PayQuotedX402TestnetRequest {
  if (!grantId.trim()) throw new TypeError("grantId is required");
  if (!idempotencyKey.trim()) throw new TypeError("idempotencyKey is required");
  return {
    grantId,
    resourceUrl: recipe.resourceUrl,
    category: recipe.category,
    purpose: recipe.purpose,
    idempotencyKey,
    expectedPayment: recipe.expectedPayment,
  };
}

export function listOmniAgentRecipes(now = Date.now()): OmniX402Recipe[] {
  return [
    createOmniX402Recipe({ kind: "targeted_news", symbol: "BTC", eventWindowMinutes: 15, limit: 5 }),
    createOmniX402Recipe({ kind: "hourly_market_briefing", market: "crypto", limit: 10 }),
    createOmniX402Recipe({ kind: "news_context", market: "crypto" }),
    createOmniX402Recipe({ kind: "historical_news", market: "crypto", fromTimestamp: now - 3_600_000, toTimestamp: now, limit: 10 }),
    createOmniX402Recipe({ kind: "liquidations", symbol: "BTC", view: "clusters", limit: 10 }),
    createOmniX402Recipe({ kind: "traders", symbol: "BTC", rank: "best", limit: 10 }),
    createOmniX402Recipe({ kind: "traders", symbol: "BTC", rank: "worst", limit: 10 }),
    createOmniX402Recipe({ kind: "traders", symbol: "BTC", rank: "largest", limit: 10 }),
    createOmniX402Recipe({ kind: "traders", symbol: "BTC", rank: "risk", limit: 10 }),
    createOmniX402Recipe({ kind: "trader_profile", address: "0x0ddf9bae2af4b874b96d287a5ad42eb47138a902", range: "30d" }),
    createOmniX402Recipe({ kind: "market_risk", symbol: "BTC" }),
    createOmniX402Recipe({ kind: "market_snapshot", symbol: "BTC", interval: "1h", limit: 120 }),
  ];
}

function addNewsQuery(
  url: URL,
  input: NewsFilters,
  mode: "latest",
  eventWindowMinutes: 15 | 60,
): void {
  url.searchParams.set("mode", mode);
  url.searchParams.set("event_window_minutes", String(eventWindowMinutes));
  addNewsFilters(url, input);
}

function addNewsFilters(url: URL, input: NewsFilters): void {
  url.searchParams.set("limit", String(boundedInteger(input.limit ?? 10, 1, 20, "limit")));
  if (input.sentiment) url.searchParams.set("sentiment", input.sentiment);
  if (input.impact) url.searchParams.set("impact", input.impact);
  if (input.minConfidence !== undefined) {
    if (!Number.isFinite(input.minConfidence) || input.minConfidence < 0 || input.minConfidence > 1) {
      throw new RangeError("minConfidence must be from 0 to 1");
    }
    url.searchParams.set("min_confidence", String(input.minConfidence));
  }
  if (input.order) url.searchParams.set("order", input.order);
  if (input.offset !== undefined) {
    url.searchParams.set("offset", String(boundedInteger(input.offset, 0, 19, "offset")));
  }
  if (input.nearestTimestamp !== undefined) {
    if (!Number.isSafeInteger(input.nearestTimestamp) || String(input.nearestTimestamp).length !== 13) {
      throw new RangeError("nearestTimestamp must be a 13-digit Unix millisecond timestamp");
    }
    url.searchParams.set("nearest_timestamp", String(input.nearestTimestamp));
  }
}

function normalizedSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,15}$/.test(symbol)) throw new TypeError("symbol must contain 2-15 letters or digits");
  return symbol;
}

function normalizedAddress(value: string): string {
  const address = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(address)) throw new TypeError("address must be a 20-byte EVM address");
  return address;
}

function boundedInteger(value: number, minimum: number, maximum: number, name: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function positiveNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive`);
  return value;
}

function requireTimestampWindow(fromTimestamp: number, toTimestamp: number): void {
  if (!Number.isSafeInteger(fromTimestamp) || !Number.isSafeInteger(toTimestamp)) {
    throw new TypeError("News window timestamps must be integer Unix milliseconds");
  }
  if (String(fromTimestamp).length !== 13 || String(toTimestamp).length !== 13 || fromTimestamp >= toTimestamp) {
    throw new RangeError("News window requires increasing 13-digit Unix millisecond timestamps");
  }
  if (toTimestamp - fromTimestamp > 7 * 24 * 60 * 60 * 1000) {
    throw new RangeError("News window cannot exceed seven days");
  }
}
