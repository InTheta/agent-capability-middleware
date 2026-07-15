export interface CreateGrantRequest {
  userId?: string;
  agentId?: string;
  scopes?: string[];
  deniedScopes?: string[];
  spendPolicy?: { currency: string; perRequestMax: number; dailyMax: number; approvalRequiredAbove: number };
  resourcePolicy?: { allowedCategories?: string[]; allowedDomains?: string[]; deniedCategories?: string[]; deniedDomains?: string[] };
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
  address?: { line1?: string; locality: string; region?: string; postalCode?: string; countryCode: string };
  identity?: { displayName?: string; email?: string; ageOver18SelfDeclared?: boolean };
  paymentPreferences?: { preferredNetwork?: "base-sepolia" | "arbitrum-sepolia"; automaticPaymentLimitUsdc?: number };
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
  accepts: Array<{ scheme: string; network: string; amount: string; asset: string; payTo: string; maxTimeoutSeconds?: number }>;
  lastUpdated?: string;
  method?: string;
  quality?: { l30DaysTotalCalls?: number; l30DaysUniquePayers?: number; lastCalledAt?: string };
}

export interface PublicX402Challenge {
  id: string;
  name: string;
  resource: string;
  status: number;
  x402Version: number;
  description?: string;
  accepts: Array<{ scheme: string; network: string; amount: string; asset: string; payTo: string; displayAmount: string }>;
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
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
}

export interface AgentCapabilityClientOptions {
  apiKey?: string;
  fetch?: typeof fetch;
}

export class AgentCapabilityClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImplementation: typeof fetch;

  constructor(baseUrl: string, options: AgentCapabilityClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
  }

  registerAgent(request: RegisterAgentRequest): Promise<AgentIdentity> {
    return this.post("/v1/agents/register", request);
  }

  listAgents(): Promise<AgentIdentity[]> {
    return this.get("/v1/agents");
  }

  createGrant(request: CreateGrantRequest = {}): Promise<Grant> {
    return this.post("/v1/grants", request);
  }

  listGrants(filter: { userId?: string; agentId?: string; includeRevoked?: boolean } = {}): Promise<Grant[]> {
    const params = new URLSearchParams();
    if (filter.userId) params.set("user_id", filter.userId);
    if (filter.agentId) params.set("agent_id", filter.agentId);
    if (filter.includeRevoked) params.set("include_revoked", "true");
    return this.get(`/v1/grants${params.size ? `?${params}` : ""}`);
  }

  checkPermission(request: PolicyCheckRequest): Promise<Record<string, unknown>> {
    return this.post("/v1/policy/check", request);
  }

  getPreferences(grantId: string, category: string, purpose: string): Promise<Record<string, unknown>> {
    return this.get(`/v1/context/preferences/${encodeURIComponent(category)}`, { "x-grant-id": grantId, "x-purpose": purpose });
  }

  getCoarseLocation(grantId: string, purpose: string): Promise<Record<string, unknown>> {
    return this.get("/v1/location/coarse", { "x-grant-id": grantId, "x-purpose": purpose });
  }

  requestSpend(request: SpendRequest): Promise<Record<string, unknown>> {
    return this.post("/v1/spend/request", request);
  }

  payQuotedX402Testnet(request: PayQuotedX402TestnetRequest): Promise<Record<string, unknown>> {
    return this.post("/v1/pay/x402/testnet/quoted", request);
  }

  approveApproval(approvalId: string): Promise<Record<string, unknown>> {
    return this.post(`/v1/approvals/${encodeURIComponent(approvalId)}/approve`, {});
  }

  revokeGrant(grantId: string): Promise<Grant> {
    return this.post(`/v1/grants/${encodeURIComponent(grantId)}/revoke`, {});
  }

  getMemory(userId = "user_demo"): Promise<MemorySnapshot> {
    return this.get(`/v1/memory?user_id=${encodeURIComponent(userId)}`);
  }

  importDemoDining(userId = "user_demo"): Promise<MemorySnapshot> {
    return this.post("/v1/imports/demo-dining", { userId });
  }

  importShoppingEvidence(request: ShoppingEvidenceImportRequest): Promise<{ memory: MemorySnapshot; summary: { source: string; rowsProcessed: number; acceptedSignals: number; candidatesCreated: number; rawEvidenceStored: false } }> {
    return this.post("/v1/imports/shopping-evidence", request);
  }

  onboardProfile(request: OnboardingProfileRequest): Promise<MemorySnapshot> {
    return this.post("/v1/onboarding/profile", request);
  }

  captureCoarseLocation(request: CoarseLocationRequest): Promise<MemorySnapshot> {
    return this.post("/v1/onboarding/location/coarse", request);
  }

  suggestPreference(request: AgentMemorySuggestionRequest): Promise<MemorySnapshot | Record<string, unknown>> {
    return this.post("/v1/memory/suggestions", request);
  }

  getConfirmedAttribute(grantId: string, attribute: string, purpose: string): Promise<Record<string, unknown>> {
    return this.get(`/v1/context/attributes/${encodeURIComponent(attribute)}`, {
      "x-grant-id": grantId,
      "x-purpose": purpose,
    });
  }

  getWalletStatus(): Promise<DemoWalletStatus> {
    return this.get("/v1/wallet/status");
  }

  getWalletBalances(): Promise<DemoWalletBalanceReport> {
    return this.get("/v1/wallet/balances");
  }

  getTestnetFundingInstructions(): Promise<TestnetFundingInstructions> {
    return this.get("/v1/wallet/funding-instructions");
  }

  listPublicX402Resources(query?: string, limit = 8): Promise<{ source: string; query: string; resources: BazaarResource[] }> {
    const parameters = new URLSearchParams();
    if (query) parameters.set("q", query);
    parameters.set("limit", String(limit));
    return this.get(`/v1/x402/public/resources?${parameters}`);
  }

  inspectPublicX402Challenge(id: string): Promise<PublicX402Challenge> {
    return this.get(`/v1/x402/public/challenge?id=${encodeURIComponent(id)}`);
  }

  getVectorMemoryStatus(): Promise<VectorMemoryStatus> {
    return this.get("/v1/memory/vector/status");
  }

  indexVectorMemory(userId = "user_demo"): Promise<VectorMemoryIndexResult> {
    return this.post("/v1/memory/vector/index", { userId });
  }

  searchMemory(grantId: string, query: string, purpose: string, limit = 5): Promise<SemanticMemorySearchResult | Record<string, unknown>> {
    return this.post("/v1/memory/vector/search", { grantId, query, purpose, limit });
  }

  confirmCandidate(candidateId: string, userId = "user_demo"): Promise<MemorySnapshot> {
    return this.post(`/v1/candidates/${encodeURIComponent(candidateId)}/confirm`, { userId });
  }

  rejectCandidate(candidateId: string, userId = "user_demo"): Promise<MemorySnapshot> {
    return this.post(`/v1/candidates/${encodeURIComponent(candidateId)}/reject`, { userId });
  }

  private async get<T>(path: string, headers: Record<string, string> = {}): Promise<T> {
    return this.responseJson<T>(await this.fetchImplementation(`${this.baseUrl}${path}`, {
      headers: this.headers(headers),
    }));
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.responseJson<T>(await this.fetchImplementation(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    }));
  }

  private headers(headers: Record<string, string>): Record<string, string> {
    return this.apiKey
      ? { authorization: `Bearer ${this.apiKey}`, ...headers }
      : headers;
  }

  private async responseJson<T>(response: Response): Promise<T> {
    const body = (await response.json()) as T;
    if (!response.ok) throw new AgentCapabilityApiError(response.status, body);
    return body;
  }
}

export class AgentCapabilityApiError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super(`Agent Capability Middleware API request failed with ${status}`);
    this.name = "AgentCapabilityApiError";
  }
}

/** @deprecated Use AgentCapabilityClient. */
export { AgentCapabilityClient as AgentPermissionWalletClient };
/** @deprecated Use AgentCapabilityApiError. */
export { AgentCapabilityApiError as AgentPermissionWalletApiError };
import type { ShoppingEvidenceImportRequest } from "./shopping-evidence.js";
export * from "./shopping-evidence.js";
