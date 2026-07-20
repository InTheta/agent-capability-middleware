export interface CreateGrantRequest {
    userId?: string;
    agentId?: string;
    scopes?: string[];
    deniedScopes?: string[];
    spendPolicy?: {
        currency: string;
        perRequestMax: number;
        dailyMax: number;
        approvalRequiredAbove: number;
    };
    resourcePolicy?: {
        allowedCategories?: string[];
        allowedDomains?: string[];
        deniedCategories?: string[];
        deniedDomains?: string[];
    };
    settlementPolicy?: {
        allowedNetworks?: string[];
        allowedAssets?: Array<{
            network: string;
            asset: string;
            symbol: string;
            decimals: number;
        }>;
        allowedPayees?: string[];
        requireApprovalForMainnet?: boolean;
    };
    expiresInSeconds?: number;
}
export interface RegisterAgentRequest {
    id?: string;
    developerId?: string;
    name: string;
    publicKey?: string;
    redirectUris?: string[];
    allowedOrigins?: string[];
    reputationScore?: number;
    metadata?: Record<string, unknown>;
}
export interface AgentIdentity {
    id: string;
    developerId?: string;
    name: string;
    publicKey?: string;
    redirectUris: string[];
    allowedOrigins: string[];
    reputationScore?: number;
    metadata: Record<string, unknown>;
    createdAt: string;
}
export interface Grant {
    id: string;
    userId: string;
    agentId: string;
    scopes: string[];
    deniedScopes: string[];
    expiresAt: string;
    revokedAt?: string;
}
export interface MemoryCandidate {
    id: string;
    attribute: string;
    proposedValue: unknown;
    confidence: number;
    explanation: string;
    status: "pending_review" | "confirmed" | "rejected";
}
export interface MemoryAttribute {
    id: string;
    attribute: string;
    value: unknown;
    provenance: "user_confirmed" | "self_declared" | "provider_verified_mock";
    version: number;
}
export interface MemorySnapshot {
    userId: string;
    encryptedAtRest: boolean;
    storageMode: "memory" | "encrypted_file";
    candidates: MemoryCandidate[];
    attributes: MemoryAttribute[];
}
export interface OnboardingProfileRequest {
    userId: string;
    preferences?: {
        dietaryRequirements?: string[];
        likedCuisines?: string[];
        budgetBand?: string;
        accessibilityRequirements?: string[];
    };
    address?: {
        line1?: string;
        locality: string;
        region?: string;
        postalCode?: string;
        countryCode: string;
    };
    identity?: {
        displayName?: string;
        email?: string;
        ageOver18SelfDeclared?: boolean;
    };
    paymentPreferences?: {
        preferredNetwork?: "base-sepolia" | "arbitrum-sepolia";
        automaticPaymentLimitUsdc?: number;
    };
}
export interface CoarseLocationRequest {
    userId: string;
    precision: "coarse";
    latitude: number;
    longitude: number;
    city?: string;
    countryCode?: string;
    observedAt: string;
}
export interface AgentMemorySuggestionRequest {
    grantId: string;
    attribute: string;
    proposedValue: string | number | boolean | string[];
    purpose: string;
    explanation: string;
}
export interface DemoWalletStatus {
    configured: boolean;
    address?: string;
    custody: "server_testnet_key" | "not_configured";
    networks: Array<{
        id: "eip155:84532" | "eip155:421614";
        name: string;
        asset: "USDC";
        faucetUrl: string;
        explorerUrl: string;
        settlement: "public_facilitator" | "facilitator_required";
    }>;
}
export interface DemoWalletBalanceReport {
    configured: boolean;
    payerAddress?: string;
    checkedAt: string;
    networks: Array<{
        network: "eip155:84532" | "eip155:421614";
        chain: string;
        nativeBalance: string;
        usdcBalance: string;
        usdcContract: string;
        readyForExactX402: boolean;
        hasNativeGas: boolean;
    }>;
}
export interface MainnetWalletStatus {
    configured: boolean;
    enabled: boolean;
    address?: string;
    custody: "server_mainnet_key_file" | "server_mainnet_key_env" | "not_configured";
    network: "eip155:8453";
    chain: "Base";
    asset: "USDC";
    assetContract: string;
    fundingRequired: boolean;
    humanGates: string[];
}
export interface MainnetWalletBalanceReport {
    configured: boolean;
    payerAddress?: string;
    checkedAt: string;
    network: "eip155:8453";
    chain: "Base";
    nativeBalance: string;
    usdcBalance: string;
    usdcContract: string;
    funded: boolean;
}
export interface TestnetFundingInstructions {
    configured: boolean;
    payerAddress?: string;
    fundRole: "x402_buyer_payer";
    primaryNetwork: {
        network: "eip155:84532";
        chainId: 84532;
        name: "Base Sepolia";
        asset: "USDC";
        assetContract: string;
        recommendedMinimumUsdc: "0.01";
        recommendedDemoUsdc: "1";
        recommendedGasEth: "0.001";
        usdcFaucetUrl: string;
        gasFaucetUrl: string;
        facilitatorUrl: string;
    };
    sellerAddress?: string;
    sellerConfigured: boolean;
    sellerIsPayer: boolean;
    warnings: string[];
}
export interface VectorMemoryStatus {
    configured: boolean;
    collection: string;
    privacyMode: "opaque_attribute_references";
    indexedClassifications: readonly ["low", "moderate"];
    excludedNamespaces: string[];
}
export interface VectorMemoryIndexResult {
    indexed: number;
    skipped: number;
    model: string | null;
    dimensions: number | null;
    status: VectorMemoryStatus;
}
export interface SemanticMemorySearchResult {
    decision: "allow";
    results: Array<{
        attribute: string;
        value: unknown;
        classification: "low" | "moderate" | "sensitive";
        provenance: "user_confirmed" | "self_declared" | "provider_verified_mock";
        score: number;
        updatedAt: string;
    }>;
    auditEventId?: string;
}
export interface BazaarResource {
    id?: string;
    serviceName?: string;
    resource: string;
    description?: string;
    type: string;
    x402Version: number;
    accepts: Array<{
        scheme: string;
        network: string;
        amount: string;
        asset: string;
        payTo: string;
        maxTimeoutSeconds?: number;
    }>;
    lastUpdated?: string;
    method?: string;
    quality?: {
        l30DaysTotalCalls?: number;
        l30DaysUniquePayers?: number;
        lastCalledAt?: string;
    };
}
export interface CdpBazaarMerchantResponse {
    x402Version: number;
    payTo: string;
    resources: BazaarResource[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}
export interface CdpBazaarSearchResponse {
    x402Version: number;
    resources: BazaarResource[];
    partialResults: boolean;
    searchMethod?: string;
}
export interface CdpBazaarSearchRequest {
    query?: string;
    network?: string;
    asset?: string;
    scheme?: string;
    payTo?: string;
    maxUsdPrice?: string;
    extensions?: string[];
    limit?: number;
}
export declare const CDP_X402_BAZAAR_ORIGIN = "https://api.cdp.coinbase.com/platform/v2/x402/discovery";
export declare function searchCdpX402Bazaar(request?: CdpBazaarSearchRequest, fetchImplementation?: typeof fetch): Promise<CdpBazaarSearchResponse>;
export declare function listCdpX402MerchantResources(payTo: string, options?: {
    limit?: number;
    offset?: number;
}, fetchImplementation?: typeof fetch): Promise<CdpBazaarMerchantResponse>;
export interface PublicX402Challenge {
    id: string;
    name: string;
    resource: string;
    status: number;
    x402Version: number;
    description?: string;
    accepts: Array<{
        scheme: string;
        network: string;
        amount: string;
        asset: string;
        payTo: string;
        displayAmount: string;
    }>;
    paymentRequired: true;
    liveCheckedAt: string;
}
export interface PolicyCheckRequest {
    grantId: string;
    scope: string;
    purpose: string;
    resource?: string;
    category?: string;
    amount?: number;
    currency?: string;
    idempotencyKey?: string;
}
export interface SpendRequest {
    grantId: string;
    amount: number;
    currency: string;
    merchant?: string;
    category: string;
    purpose: string;
    idempotencyKey: string;
}
export interface PayQuotedX402TestnetRequest {
    grantId: string;
    resourceUrl: string;
    category: string;
    purpose: string;
    idempotencyKey: string;
    currency?: string;
    expectedPayment?: {
        amount: number;
        network: string;
        asset: string;
        payTo: string;
    };
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
}
export interface PayQuotedX402Request extends PayQuotedX402TestnetRequest {
    approvalId?: string;
}
export interface X402ConsumptionResult<T = unknown> {
    decision: "paid" | "allow" | "deny" | "requires_approval" | "needs_user_approval";
    reason?: string;
    auditEventId?: string;
    receiptId?: string;
    approvalId?: string;
    approvalUrl?: string;
    expiresAt?: string;
    status?: number;
    resourceBody?: T;
    quote?: {
        paymentRequest?: Record<string, unknown>;
        scheme?: string;
        rawAmount?: string;
        asset?: string;
        description?: string;
    };
    policyResult?: Record<string, unknown>;
}
export interface FreshX402Resource {
    schema?: string;
    freshness: {
        status: "fresh" | "stale" | "unknown" | string;
    };
}
export type X402ResultValidationCode = "payment_not_completed" | "receipt_missing" | "resource_body_missing" | "resource_not_fresh" | "schema_mismatch";
export declare class AgentCapabilityValidationError extends Error {
    readonly code: X402ResultValidationCode;
    readonly result: X402ConsumptionResult<unknown>;
    constructor(code: X402ResultValidationCode, message: string, result: X402ConsumptionResult<unknown>);
}
/**
 * Require the canonical ACM paid-resource contract before agent code acts on a result.
 * This validates gateway output; it does not verify a chain transaction independently.
 */
export declare function requireFreshPaidResult<T extends FreshX402Resource>(result: X402ConsumptionResult<T>, options?: {
    expectedSchema?: string;
}): T;
export interface AgentCapabilityClientOptions {
    apiKey?: string;
    fetch?: typeof fetch;
}
export declare class AgentCapabilityClient {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly fetchImplementation;
    constructor(baseUrl: string, options?: AgentCapabilityClientOptions);
    registerAgent(request: RegisterAgentRequest): Promise<AgentIdentity>;
    listAgents(): Promise<AgentIdentity[]>;
    createGrant(request?: CreateGrantRequest): Promise<Grant>;
    listGrants(filter?: {
        userId?: string;
        agentId?: string;
        includeRevoked?: boolean;
    }): Promise<Grant[]>;
    checkPermission(request: PolicyCheckRequest): Promise<Record<string, unknown>>;
    getPreferences(grantId: string, category: string, purpose: string): Promise<Record<string, unknown>>;
    getCoarseLocation(grantId: string, purpose: string): Promise<Record<string, unknown>>;
    requestSpend(request: SpendRequest): Promise<Record<string, unknown>>;
    payQuotedX402Testnet(request: PayQuotedX402TestnetRequest): Promise<X402ConsumptionResult>;
    consumeX402Testnet<T = unknown>(request: PayQuotedX402TestnetRequest): Promise<X402ConsumptionResult<T>>;
    payQuotedX402<T = unknown>(request: PayQuotedX402Request): Promise<X402ConsumptionResult<T>>;
    consumeX402<T = unknown>(request: PayQuotedX402Request): Promise<X402ConsumptionResult<T>>;
    approveApproval(approvalId: string): Promise<Record<string, unknown>>;
    revokeGrant(grantId: string): Promise<Grant>;
    getMemory(userId?: string): Promise<MemorySnapshot>;
    importDemoDining(userId?: string): Promise<MemorySnapshot>;
    importShoppingEvidence(request: ShoppingEvidenceImportRequest): Promise<{
        memory: MemorySnapshot;
        summary: {
            source: string;
            rowsProcessed: number;
            acceptedSignals: number;
            candidatesCreated: number;
            rawEvidenceStored: false;
        };
    }>;
    onboardProfile(request: OnboardingProfileRequest): Promise<MemorySnapshot>;
    captureCoarseLocation(request: CoarseLocationRequest): Promise<MemorySnapshot>;
    suggestPreference(request: AgentMemorySuggestionRequest): Promise<MemorySnapshot | Record<string, unknown>>;
    getConfirmedAttribute(grantId: string, attribute: string, purpose: string): Promise<Record<string, unknown>>;
    getWalletStatus(): Promise<DemoWalletStatus>;
    getWalletBalances(): Promise<DemoWalletBalanceReport>;
    getMainnetWalletStatus(): Promise<MainnetWalletStatus>;
    getMainnetWalletBalances(): Promise<MainnetWalletBalanceReport>;
    getTestnetFundingInstructions(): Promise<TestnetFundingInstructions>;
    listPublicX402Resources(query?: string, limit?: number): Promise<{
        source: string;
        query: string;
        resources: BazaarResource[];
    }>;
    inspectPublicX402Challenge(id: string): Promise<PublicX402Challenge>;
    getVectorMemoryStatus(): Promise<VectorMemoryStatus>;
    indexVectorMemory(userId?: string): Promise<VectorMemoryIndexResult>;
    searchMemory(grantId: string, query: string, purpose: string, limit?: number): Promise<SemanticMemorySearchResult | Record<string, unknown>>;
    confirmCandidate(candidateId: string, userId?: string): Promise<MemorySnapshot>;
    rejectCandidate(candidateId: string, userId?: string): Promise<MemorySnapshot>;
    private get;
    private post;
    private headers;
    private responseJson;
}
export declare class AgentCapabilityApiError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(status: number, body: unknown);
}
/** @deprecated Use AgentCapabilityClient. */
export { AgentCapabilityClient as AgentPermissionWalletClient };
/** @deprecated Use AgentCapabilityApiError. */
export { AgentCapabilityApiError as AgentPermissionWalletApiError };
import type { ShoppingEvidenceImportRequest } from "./shopping-evidence.js";
export * from "./shopping-evidence.js";
//# sourceMappingURL=index.d.ts.map