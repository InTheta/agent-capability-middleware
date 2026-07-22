import { AgentCapabilityClient, listCdpX402MerchantResources, requireFreshPaidResult, } from "./index.js";
export const CANONICAL_OMNI_RECEIVER = "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
export const CANONICAL_OMNI_MARKET_RISK_ROUTE = "https://omniterminal.app/api/x402/v1/market-risk/:symbol";
export const CANONICAL_OMNI_MARKET_RISK_RESOURCE = "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current";
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const CANONICAL_OMNI_ROUTES = [
    "https://omniterminal.app/api/x402/v1/news/:symbol",
    "https://omniterminal.app/api/x402/v1/news",
    "https://omniterminal.app/api/x402/v1/trader-profile/:address",
    "https://omniterminal.app/api/x402/v1/liquidations/:symbol",
    "https://omniterminal.app/api/x402/v1/traders/:symbol",
    CANONICAL_OMNI_MARKET_RISK_ROUTE,
    "https://omniterminal.app/api/x402/v1/market-snapshot/:symbol",
];
export class DesignPartnerCheckError extends Error {
    step;
    constructor(step, message) {
        super(message);
        this.step = step;
        this.name = "DesignPartnerCheckError";
    }
}
export async function runDesignPartnerCheck(options = {}) {
    const started = new Date();
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    const receiver = options.receiver ?? CANONICAL_OMNI_RECEIVER;
    let resources;
    try {
        resources = (await listCdpX402MerchantResources(receiver, { limit: 100 }, fetchImplementation)).resources;
    }
    catch (error) {
        throw new DesignPartnerCheckError("catalog", errorMessage(error));
    }
    const listing = resources.find((resource) => resource.resource === CANONICAL_OMNI_MARKET_RISK_ROUTE);
    const listedRouteSet = new Set(resources.map((resource) => resource.resource));
    for (const route of CANONICAL_OMNI_ROUTES) {
        if (!listedRouteSet.has(route))
            throw new DesignPartnerCheckError("catalog", `Canonical Omni route is not listed in CDP Bazaar: ${route}`);
    }
    if (!listing)
        throw new DesignPartnerCheckError("catalog", "Canonical Omni market-risk route is not listed in CDP Bazaar");
    const quote = listing.accepts.find((accept) => accept.network === "eip155:84532");
    if (!quote)
        throw new DesignPartnerCheckError("catalog", "Canonical route has no Base Sepolia quote");
    if (quote.amount !== "3000")
        throw new DesignPartnerCheckError("catalog", `Expected 3000 atomic USDC; received ${quote.amount}`);
    if (quote.asset.toLowerCase() !== BASE_SEPOLIA_USDC.toLowerCase()) {
        throw new DesignPartnerCheckError("catalog", "Canonical route uses an unexpected Base Sepolia asset");
    }
    if (quote.payTo.toLowerCase() !== receiver.toLowerCase()) {
        throw new DesignPartnerCheckError("catalog", "Canonical route uses an unexpected receiver");
    }
    const catalog = {
        source: "cdp_bazaar",
        listedRoutes: resources.length,
        canonicalRoutes: [...CANONICAL_OMNI_ROUTES],
        canonicalMarketRisk: {
            amountUsdc: 0.003,
            network: "eip155:84532",
            asset: quote.asset,
            payTo: quote.payTo,
        },
    };
    if (!options.confirmTestnetSpend) {
        return finish(started, {
            reportVersion: "design_partner_check.v3",
            ok: true,
            mode: "no_spend",
            packageInstall: "installed_cli",
            catalog,
            secretsIncluded: false,
            next: "Request controlled ACM gateway credentials, then rerun with ACM_CONFIRM_TESTNET_SPEND=yes.",
        });
    }
    if (!options.gatewayUrl) {
        throw new DesignPartnerCheckError("gateway", "ACM_GATEWAY_URL is required for the explicitly funded testnet check");
    }
    const client = new AgentCapabilityClient(options.gatewayUrl, {
        ...(options.apiKey ? { apiKey: options.apiKey } : {}),
        fetch: fetchImplementation,
    });
    let agent;
    let grant;
    try {
        agent = await client.registerAgent({
            name: "External Design Partner Agent",
            developerId: "public_sdk_partner_check_v3",
        });
        grant = await client.createGrant({
            userId: options.userId ?? "user_demo",
            agentId: agent.id,
            scopes: ["x402.pay"],
            deniedScopes: ["wallet.transfer", "trading.execute", "cookies.*"],
            spendPolicy: {
                currency: "USDC",
                perRequestMax: 0.003,
                dailyMax: 0.003,
                approvalRequiredAbove: 0.003,
            },
            resourcePolicy: {
                allowedDomains: ["omniterminal.app"],
                allowedCategories: ["market_intelligence"],
            },
            settlementPolicy: {
                allowedNetworks: ["eip155:84532"],
                allowedAssets: [{
                        network: "eip155:84532",
                        asset: BASE_SEPOLIA_USDC,
                        symbol: "USDC",
                        decimals: 6,
                    }],
                allowedPayees: [receiver],
                requireApprovalForMainnet: true,
            },
            expiresInSeconds: 900,
        });
    }
    catch (error) {
        throw new DesignPartnerCheckError("gateway", errorMessage(error));
    }
    const paymentRequest = {
        grantId: grant.id,
        resourceUrl: CANONICAL_OMNI_MARKET_RISK_RESOURCE,
        category: "market_intelligence",
        purpose: "external_partner_market_risk_brief",
        idempotencyKey: globalThis.crypto.randomUUID(),
        expectedPayment: {
            amount: 0.003,
            network: "eip155:84532",
            asset: BASE_SEPOLIA_USDC,
            payTo: receiver,
        },
    };
    let paid;
    let body;
    try {
        paid = await client.consumeX402Testnet(paymentRequest);
        body = requireFreshPaidResult(paid, { expectedSchema: "market_risk_snapshot.v1" });
    }
    catch (error) {
        throw new DesignPartnerCheckError("payment", errorMessage(error));
    }
    const auditEventId = paid.auditEventId ?? String(paid.policyResult?.auditEventId ?? "");
    if (!paid.receiptId || !auditEventId) {
        throw new DesignPartnerCheckError("payment", "Paid result omitted its public receipt or ACM audit identifier");
    }
    let revoked;
    let denied;
    try {
        revoked = await client.revokeGrant(grant.id);
        if (!revoked.revokedAt)
            throw new Error("Gateway did not confirm grant revocation");
        denied = await client.consumeX402Testnet({
            ...paymentRequest,
            purpose: "prove_revocation_before_payment",
            idempotencyKey: globalThis.crypto.randomUUID(),
        });
        if (denied.decision !== "deny" || denied.reason !== "grant_revoked" || denied.receiptId) {
            throw new Error(`Expected receipt-free grant_revoked denial; received ${denied.decision}:${denied.reason ?? "missing"}`);
        }
    }
    catch (error) {
        throw new DesignPartnerCheckError("revocation", errorMessage(error));
    }
    return finish(started, {
        reportVersion: "design_partner_check.v3",
        ok: true,
        mode: "paid_testnet",
        packageInstall: "installed_cli",
        catalog,
        payment: {
            resource: CANONICAL_OMNI_MARKET_RISK_RESOURCE,
            decision: "paid",
            receiptId: paid.receiptId,
            auditEventId,
            schema: body.schema,
            freshness: "fresh",
        },
        revocation: {
            grantId: grant.id,
            revokedAt: revoked.revokedAt,
            deniedDecision: "deny",
            denialReason: "grant_revoked",
            ...(denied.auditEventId ? { denialAuditEventId: denied.auditEventId } : {}),
            secondSettlementCreated: false,
        },
        secretsIncluded: false,
        next: "Return this redacted JSON report and the five feedback answers; do not return shell history or credentials.",
    });
}
function finish(started, report) {
    const completed = new Date();
    return {
        ...report,
        startedAt: started.toISOString(),
        completedAt: completed.toISOString(),
        elapsedMs: completed.getTime() - started.getTime(),
    };
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
