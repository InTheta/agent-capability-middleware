export declare const CANONICAL_OMNI_RECEIVER = "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
export declare const CANONICAL_OMNI_MARKET_RISK_ROUTE = "https://omniterminal.app/api/x402/v1/market-risk/:symbol";
export declare const CANONICAL_OMNI_MARKET_RISK_RESOURCE = "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current";
export declare const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export interface DesignPartnerCheckOptions {
    gatewayUrl?: string;
    apiKey?: string;
    userId?: string;
    confirmTestnetSpend?: boolean;
    fetch?: typeof fetch;
    receiver?: string;
}
export interface DesignPartnerCheckReport {
    reportVersion: "design_partner_check.v3";
    ok: true;
    mode: "no_spend" | "paid_testnet";
    startedAt: string;
    completedAt: string;
    elapsedMs: number;
    packageInstall: "installed_cli";
    catalog: {
        source: "cdp_bazaar";
        listedRoutes: number;
        canonicalMarketRisk: {
            amountUsdc: 0.003;
            network: "eip155:84532";
            asset: string;
            payTo: string;
        };
    };
    payment?: {
        resource: string;
        decision: "paid";
        receiptId: string;
        auditEventId: string;
        schema: "market_risk_snapshot.v1";
        freshness: "fresh";
    };
    revocation?: {
        grantId: string;
        revokedAt: string;
        deniedDecision: "deny";
        denialReason: "grant_revoked";
        denialAuditEventId?: string;
        secondSettlementCreated: false;
    };
    secretsIncluded: false;
    next: string;
}
export declare class DesignPartnerCheckError extends Error {
    readonly step: "catalog" | "gateway" | "payment" | "revocation";
    constructor(step: "catalog" | "gateway" | "payment" | "revocation", message: string);
}
export declare function runDesignPartnerCheck(options?: DesignPartnerCheckOptions): Promise<DesignPartnerCheckReport>;
//# sourceMappingURL=partner-check.d.ts.map