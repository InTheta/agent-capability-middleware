export const CDP_X402_BAZAAR_ORIGIN = "https://api.cdp.coinbase.com/platform/v2/x402/discovery";
function requireBazaarLimit(value, maximum) {
    if (!Number.isInteger(value) || value < 1 || value > maximum) {
        throw new RangeError(`Bazaar limit must be an integer from 1 to ${maximum}`);
    }
    return value;
}
async function publicJson(url, fetchImplementation) {
    const response = await fetchImplementation(url, { headers: { accept: "application/json" } });
    const body = (await response.json());
    if (!response.ok)
        throw new AgentCapabilityApiError(response.status, body);
    return body;
}
export function searchCdpX402Bazaar(request = {}, fetchImplementation = globalThis.fetch) {
    const url = new URL(`${CDP_X402_BAZAAR_ORIGIN}/search`);
    const scalar = [
        ["query", "query"],
        ["network", "network"],
        ["asset", "asset"],
        ["scheme", "scheme"],
        ["payTo", "payTo"],
        ["maxUsdPrice", "maxUsdPrice"],
    ];
    for (const [key, parameter] of scalar) {
        const value = request[key];
        if (typeof value === "string" && value)
            url.searchParams.set(parameter, value);
    }
    for (const extension of request.extensions ?? [])
        url.searchParams.append("extensions", extension);
    if (request.limit !== undefined)
        url.searchParams.set("limit", String(requireBazaarLimit(request.limit, 20)));
    return publicJson(url, fetchImplementation);
}
export function listCdpX402MerchantResources(payTo, options = {}, fetchImplementation = globalThis.fetch) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(payTo))
        throw new TypeError("payTo must be an EVM address");
    const url = new URL(`${CDP_X402_BAZAAR_ORIGIN}/merchant`);
    url.searchParams.set("payTo", payTo);
    if (options.limit !== undefined)
        url.searchParams.set("limit", String(requireBazaarLimit(options.limit, 100)));
    if (options.offset !== undefined) {
        if (!Number.isInteger(options.offset) || options.offset < 0) {
            throw new RangeError("Bazaar offset must be a non-negative integer");
        }
        url.searchParams.set("offset", String(options.offset));
    }
    return publicJson(url, fetchImplementation);
}
export class AgentCapabilityValidationError extends Error {
    code;
    result;
    constructor(code, message, result) {
        super(message);
        this.code = code;
        this.result = result;
        this.name = "AgentCapabilityValidationError";
    }
}
/**
 * Require the canonical ACM paid-resource contract before agent code acts on a result.
 * This validates gateway output; it does not verify a chain transaction independently.
 */
export function requireFreshPaidResult(result, options = {}) {
    if (result.decision !== "paid") {
        throw new AgentCapabilityValidationError("payment_not_completed", `Expected a paid x402 result, received ${result.decision}${result.reason ? `:${result.reason}` : ""}`, result);
    }
    if (!result.receiptId) {
        throw new AgentCapabilityValidationError("receipt_missing", "Paid x402 result did not include a settlement receipt", result);
    }
    if (!result.resourceBody) {
        throw new AgentCapabilityValidationError("resource_body_missing", "Paid x402 result did not include a resource body", result);
    }
    if (result.resourceBody.freshness?.status !== "fresh") {
        throw new AgentCapabilityValidationError("resource_not_fresh", `Expected fresh x402 data, received ${result.resourceBody.freshness?.status ?? "missing"}`, result);
    }
    if (options.expectedSchema && result.resourceBody.schema !== options.expectedSchema) {
        throw new AgentCapabilityValidationError("schema_mismatch", `Expected schema ${options.expectedSchema}, received ${result.resourceBody.schema ?? "missing"}`, result);
    }
    return result.resourceBody;
}
export class AgentCapabilityClient {
    baseUrl;
    apiKey;
    fetchImplementation;
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = options.apiKey;
        this.fetchImplementation = options.fetch ?? globalThis.fetch;
    }
    registerAgent(request) {
        return this.post("/v1/agents/register", request);
    }
    listAgents() {
        return this.get("/v1/agents");
    }
    createGrant(request = {}) {
        return this.post("/v1/grants", request);
    }
    listGrants(filter = {}) {
        const params = new URLSearchParams();
        if (filter.userId)
            params.set("user_id", filter.userId);
        if (filter.agentId)
            params.set("agent_id", filter.agentId);
        if (filter.includeRevoked)
            params.set("include_revoked", "true");
        return this.get(`/v1/grants${params.size ? `?${params}` : ""}`);
    }
    checkPermission(request) {
        return this.post("/v1/policy/check", request);
    }
    getPreferences(grantId, category, purpose) {
        return this.get(`/v1/context/preferences/${encodeURIComponent(category)}`, { "x-grant-id": grantId, "x-purpose": purpose });
    }
    getCoarseLocation(grantId, purpose) {
        return this.get("/v1/location/coarse", { "x-grant-id": grantId, "x-purpose": purpose });
    }
    requestSpend(request) {
        return this.post("/v1/spend/request", request);
    }
    payQuotedX402Testnet(request) {
        return this.post("/v1/pay/x402/testnet/quoted", request);
    }
    consumeX402Testnet(request) {
        return this.post("/v1/pay/x402/testnet/quoted", request);
    }
    payQuotedX402(request) {
        return this.post("/v1/pay/x402/quoted", request);
    }
    consumeX402(request) {
        return this.post("/v1/pay/x402/quoted", request);
    }
    approveApproval(approvalId) {
        return this.post(`/v1/approvals/${encodeURIComponent(approvalId)}/approve`, {});
    }
    revokeGrant(grantId) {
        return this.post(`/v1/grants/${encodeURIComponent(grantId)}/revoke`, {});
    }
    getMemory(userId = "user_demo") {
        return this.get(`/v1/memory?user_id=${encodeURIComponent(userId)}`);
    }
    importDemoDining(userId = "user_demo") {
        return this.post("/v1/imports/demo-dining", { userId });
    }
    importShoppingEvidence(request) {
        return this.post("/v1/imports/shopping-evidence", request);
    }
    onboardProfile(request) {
        return this.post("/v1/onboarding/profile", request);
    }
    captureCoarseLocation(request) {
        return this.post("/v1/onboarding/location/coarse", request);
    }
    suggestPreference(request) {
        return this.post("/v1/memory/suggestions", request);
    }
    getConfirmedAttribute(grantId, attribute, purpose) {
        return this.get(`/v1/context/attributes/${encodeURIComponent(attribute)}`, {
            "x-grant-id": grantId,
            "x-purpose": purpose,
        });
    }
    getWalletStatus() {
        return this.get("/v1/wallet/status");
    }
    getWalletBalances() {
        return this.get("/v1/wallet/balances");
    }
    getMainnetWalletStatus() {
        return this.get("/v1/wallet/mainnet-status");
    }
    getMainnetWalletBalances() {
        return this.get("/v1/wallet/mainnet-balances");
    }
    getTestnetFundingInstructions() {
        return this.get("/v1/wallet/funding-instructions");
    }
    listPublicX402Resources(query, limit = 8) {
        const parameters = new URLSearchParams();
        if (query)
            parameters.set("q", query);
        parameters.set("limit", String(limit));
        return this.get(`/v1/x402/public/resources?${parameters}`);
    }
    inspectPublicX402Challenge(id) {
        return this.get(`/v1/x402/public/challenge?id=${encodeURIComponent(id)}`);
    }
    getVectorMemoryStatus() {
        return this.get("/v1/memory/vector/status");
    }
    indexVectorMemory(userId = "user_demo") {
        return this.post("/v1/memory/vector/index", { userId });
    }
    searchMemory(grantId, query, purpose, limit = 5) {
        return this.post("/v1/memory/vector/search", { grantId, query, purpose, limit });
    }
    confirmCandidate(candidateId, userId = "user_demo") {
        return this.post(`/v1/candidates/${encodeURIComponent(candidateId)}/confirm`, { userId });
    }
    rejectCandidate(candidateId, userId = "user_demo") {
        return this.post(`/v1/candidates/${encodeURIComponent(candidateId)}/reject`, { userId });
    }
    async get(path, headers = {}) {
        return this.responseJson(await this.fetchImplementation(`${this.baseUrl}${path}`, {
            headers: this.headers(headers),
        }));
    }
    async post(path, body) {
        return this.responseJson(await this.fetchImplementation(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: this.headers({ "content-type": "application/json" }),
            body: JSON.stringify(body),
        }));
    }
    headers(headers) {
        return this.apiKey
            ? { authorization: `Bearer ${this.apiKey}`, ...headers }
            : headers;
    }
    async responseJson(response) {
        const body = (await response.json());
        if (!response.ok)
            throw new AgentCapabilityApiError(response.status, body);
        return body;
    }
}
export class AgentCapabilityApiError extends Error {
    status;
    body;
    constructor(status, body) {
        super(`Agent Capability Middleware API request failed with ${status}`);
        this.status = status;
        this.body = body;
        this.name = "AgentCapabilityApiError";
    }
}
/** @deprecated Use AgentCapabilityClient. */
export { AgentCapabilityClient as AgentPermissionWalletClient };
/** @deprecated Use AgentCapabilityApiError. */
export { AgentCapabilityApiError as AgentPermissionWalletApiError };
export * from "./shopping-evidence.js";
