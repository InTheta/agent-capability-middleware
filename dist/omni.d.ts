import type { CreateGrantRequest, PayQuotedX402TestnetRequest } from "./index.js";
export declare const OMNI_X402_ORIGIN = "https://omniterminal.app";
export declare const OMNI_X402_RECEIVER = "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
export declare const OMNI_BASE_SEPOLIA_NETWORK = "eip155:84532";
export declare const OMNI_BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export type OmniMarket = "crypto" | "macro" | "equities" | "forex";
export type OmniNewsSentiment = "bullish" | "bearish" | "neutral";
export type OmniNewsImpact = "high" | "medium" | "low";
export type OmniAnalyticsScope = "current" | "aggregate";
export type OmniLiquidationView = "summary" | "buckets" | "clusters" | "flow";
export type OmniMarketInterval = "1m" | "5m" | "15m" | "1h" | "2h" | "4h" | "8h" | "1d" | "3d" | "1w" | "1M";
export type OmniTraderRank = "best" | "worst" | "largest" | "largest_size" | "wallet_size" | "risk" | "closest";
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
    usage: {
        item_count: number;
        item_limit: number;
    };
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
    clusters?: {
        buy: Record<string, unknown>[];
        sell: Record<string, unknown>[];
    };
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
    usage: {
        candle_count: number;
        candle_limit: number;
        liquidation_overlay_included: boolean;
    };
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
        components: {
            liquidations: OmniFreshness;
            news: OmniFreshness;
        };
    };
    liquidations: OmniLiquidationMapResponse;
    news: OmniNewsPulseResponse;
}
export interface OmniEntityResolutionResponse {
    service: "omni.market_entity_resolution";
    product_version: "v1";
    schema: "market_entity_resolution.v1";
    generated_at: string;
    data_as_of: string | null;
    freshness: OmniFreshness;
    venue: "hyperliquid";
    results: Array<{
        input: string;
        resolution_status: "resolved" | "unsupported";
        canonical_symbol: string | null;
        confidence: number;
        product_supported: boolean;
        [key: string]: unknown;
    }>;
    usage: {
        mention_count: number;
        resolved_count: number;
        mention_limit: 20;
    };
}
export interface OmniMarketCarryResponse {
    service: "omni.hyperliquid_market_carry";
    product_version: "v1";
    schema: "hyperliquid_market_carry.v1";
    symbol: string;
    canonical_symbol: string;
    venue: "hyperliquid";
    market_type: "perp";
    generated_at: string;
    data_as_of: string | null;
    freshness: OmniFreshness;
    carry: {
        funding_rate_per_hour: number;
        funding_annualized_pct: number;
        annualization_method: "simple_current_hourly_rate_x_8760";
        funding_direction: "longs_pay_shorts" | "shorts_pay_longs" | "balanced";
        premium: number | null;
    };
    positioning: Record<string, number | null>;
    prices: Record<string, number | null>;
    usage: {
        current_snapshot_only: true;
        historical_series_included: false;
    };
}
export type OmniX402Response = OmniNewsPulseResponse | OmniTraderLeaderboardResponse | OmniLiquidationMapResponse | OmniTraderProfileResponse | OmniMarketRiskResponse | OmniMarketSnapshotResponse | OmniEntityResolutionResponse | OmniMarketCarryResponse;
type NewsFilters = {
    limit?: number;
    sentiment?: OmniNewsSentiment;
    impact?: OmniNewsImpact;
    minConfidence?: number;
    order?: "recent" | "impact";
    offset?: number;
    nearestTimestamp?: number;
};
export type OmniRecipeInput = ({
    kind: "targeted_news";
    symbol: string;
    eventWindowMinutes?: 15 | 60;
} & NewsFilters) | ({
    kind: "market_news";
    market?: OmniMarket;
    eventWindowMinutes?: 15 | 60;
} & NewsFilters) | ({
    kind: "hourly_market_briefing";
    market?: OmniMarket;
} & NewsFilters) | ({
    kind: "news_context";
    symbol?: string;
    market?: OmniMarket;
}) | ({
    kind: "historical_news";
    symbol?: string;
    market?: OmniMarket;
    fromTimestamp: number;
    toTimestamp: number;
} & NewsFilters) | {
    kind: "trader_profile";
    address: string;
    range?: "1d" | "7d" | "30d" | "all";
    view?: "summary" | "positions" | "balances" | "full";
    symbol?: string;
    limit?: number;
} | {
    kind: "liquidations";
    symbol: string;
    scope?: OmniAnalyticsScope;
    view?: OmniLiquidationView;
    limit?: number;
    order?: "strongest" | "nearest" | "price";
    aroundPrice?: number;
    side?: "all" | "long" | "short";
} | {
    kind: "traders";
    symbol: string;
    scope?: OmniAnalyticsScope;
    rank?: OmniTraderRank;
    limit?: number;
} | {
    kind: "market_risk";
    symbol: string;
    scope?: OmniAnalyticsScope;
    eventWindowMinutes?: 15 | 60;
    limit?: number;
} | {
    kind: "market_snapshot";
    symbol: string;
    interval?: OmniMarketInterval;
    limit?: number;
    scope?: OmniAnalyticsScope;
    includeLiquidations?: boolean;
} | {
    kind: "entity_resolution";
    mentions: string[];
    venue?: "hyperliquid";
} | {
    kind: "market_carry";
    symbol: string;
};
export interface OmniX402Recipe {
    kind: OmniRecipeInput["kind"];
    label: string;
    resourceUrl: string;
    schema: string;
    priceUsdc: 0.001 | 0.002 | 0.003;
    category: "market_intelligence";
    purpose: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    expectedPayment: {
        amount: 0.001 | 0.002 | 0.003;
        network: typeof OMNI_BASE_SEPOLIA_NETWORK;
        asset: typeof OMNI_BASE_SEPOLIA_USDC;
        payTo: typeof OMNI_X402_RECEIVER;
    };
    note?: string;
}
/**
 * Build one deterministic, bounded Omni x402 request. These are recipes over nine seller route
 * templates—not additional per-query routes or a generic query proxy. Bazaar catalog status is
 * verified separately because a new route requires a successful CDP settlement before indexing.
 */
export declare function createOmniX402Recipe(input: OmniRecipeInput): OmniX402Recipe;
export declare function createOmniRecipeGrant(agentId: string, recipes: readonly OmniX402Recipe[], options?: {
    userId?: string;
    expiresInSeconds?: number;
    approvalRequiredAbove?: number;
}): CreateGrantRequest;
export declare function createOmniPaymentRequest(grantId: string, recipe: OmniX402Recipe, idempotencyKey: string): PayQuotedX402TestnetRequest;
export declare function listOmniAgentRecipes(now?: number): OmniX402Recipe[];
export {};
//# sourceMappingURL=omni.d.ts.map