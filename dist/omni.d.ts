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
export type OmniX402Response = OmniNewsPulseResponse | OmniTraderLeaderboardResponse | OmniLiquidationMapResponse | OmniTraderProfileResponse | OmniMarketRiskResponse;
type NewsFilters = {
    limit?: number;
    sentiment?: OmniNewsSentiment;
    impact?: OmniNewsImpact;
    minConfidence?: number;
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
};
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
 * Build one deterministic, bounded Omni x402 request. These are recipes over the six canonical
 * Bazaar route templates—not additional seller routes or a generic query proxy.
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