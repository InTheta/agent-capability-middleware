# SDK API

## CLI

| Command | Purpose |
|---|---|
| `acm doctor` | Verify Node.js compatibility and the no-private-key SDK boundary without a network request. |
| `acm inspect` | Inspect one live x402 resource through public CDP Bazaar without signing or paying. |
| `acm recipes` | Print bounded real Omni news, trader, liquidation and market-risk request plans without paying. |
| `acm demo buyer` | Validate a synthetic fresh paid result locally. |
| `acm demo developer-seller` | Create and request a local paid developer API offer. |
| `acm demo user-seller` | Create and request a confirmed minimum-disclosure user offer. |
| `acm demo exchange` | Put developer and user offers through one local decision model. |
| `acm partner-check` | Run the installed no-spend acceptance check; optionally run the explicitly armed Base Sepolia acceptance through a protected gateway. |

Until npm publication, run the CLI directly from GitHub:

```bash
npx github:InTheta/agent-capability-middleware#main inspect
```

All `demo` commands are local, keyless, and non-settling.

`acm partner-check` is no-spend by default. The funded path requires `ACM_GATEWAY_URL` and the exact
string `ACM_CONFIRM_TESTNET_SPEND=yes`; `ACM_API_KEY` is an optional server-only workload credential.
Its `design_partner_check.v3` JSON report excludes credentials and response bodies.

The same functionality is available as `runDesignPartnerCheck(options)` for controlled automation.
Supply a custom `fetch` implementation for conformance testing. Do not enable `confirmTestnetSpend`
unless the protected gateway and dedicated testnet payer are intentionally ready.

## Offer helpers (experimental)

| Export | Purpose |
|---|---|
| `createDeveloperServiceOffer` | Describe a developer x402 API and its fixed policy terms. |
| `createUserCapabilityOffer` | Describe a user-confirmed minimum-disclosure capability. |
| `evaluateCapabilityRequest` | Return `allow`, `payment_required`, `requires_user_approval`, or `deny`. |
| `LocalCapabilityDirectory` | Publish, list, filter, and request offers in memory. |

`OfferTerms.policy` is `free`, `paid`, `ask`, or `deny`. Paid offers require a positive USDC price, supported Base network, and EVM receiving address. User offers are restricted to low-risk preview namespaces and must set `confirmedByUser: true`.

These helpers do not sign challenges, settle payments, host data, or create a production marketplace. A developer seller still operates an x402 resource server. A future hosted user seller fulfils an approved projection only after the buyer-side grant and payment are validated.

## Client

```ts
new AgentCapabilityClient(baseUrl, { apiKey?, fetch? })
```

`apiKey` is sent as an HTTP bearer token. Supplying `fetch` supports controlled runtimes and testing.

## Agent and grant lifecycle

| Method | Purpose |
|---|---|
| `registerAgent` | Register a requesting agent identity. |
| `listAgents` | List visible agent identities. |
| `createGrant` | Create a scoped, expiring grant. |
| `listGrants` | Filter grants by user or agent. |
| `checkPermission` | Ask the policy engine for an explicit decision. |
| `revokeGrant` | Immediately revoke future use of a grant. |

## User context and memory

| Method | Purpose |
|---|---|
| `onboardProfile` | Submit explicitly entered profile fields. |
| `captureCoarseLocation` | Store coarse, time-bound location context. |
| `importShoppingEvidence` | Submit locally minimized shopping signals. |
| `getMemory` | Read candidate and confirmed-memory state. |
| `confirmCandidate` | Convert a candidate to user-confirmed memory. |
| `rejectCandidate` | Reject a derived candidate. |
| `getConfirmedAttribute` | Read one grant-scoped confirmed attribute. |
| `suggestPreference` | Let an authorized agent propose a candidate. |
| `indexVectorMemory` | Request indexing of eligible confirmed attributes. |
| `searchMemory` | Perform grant-scoped semantic retrieval. |

Vector search is an optional gateway feature. Sensitive namespaces should be excluded and vector records should use opaque identifiers rather than raw user values.

## Payments and x402

| Method | Purpose |
|---|---|
| `requestSpend` | Request a policy-bounded spend decision. |
| `approveApproval` | Record required human approval. |
| `getWalletStatus` | Read configured testnet wallet status without secrets. |
| `getWalletBalances` | Read supported testnet balances. |
| `getTestnetFundingInstructions` | Read the public payer address and funding metadata. |
| `getMainnetWalletStatus` | Read the separate payer address, disabled/enabled state, asset and human gates. |
| `getMainnetWalletBalances` | Read Base mainnet USDC/ETH balances without exposing the key. |
| `listPublicX402Resources` | Discover public x402 resources through a gateway. |
| `inspectPublicX402Challenge` | Inspect a payment challenge without paying. |
| `payQuotedX402Testnet` | Ask a protected ACM gateway to quote, authorize, sign, settle, and retry an exact testnet resource. |
| `consumeX402Testnet<T>` | Typed alias for the same keyless flow; returns the paid response as `resourceBody: T` with its receipt and policy result. |
| `payQuotedX402` | Ask a protected gateway to quote any allowed x402 resource; mainnet requires a separate payer, explicit settlement policy and approval. |
| `consumeX402<T>` | Typed generic x402 consumption; pins `expectedPayment` and returns the protected response, receipt and approval state. |

Standalone, keyless discovery helpers do not use the configured ACM gateway:

| Function | Purpose |
|---|---|
| `searchCdpX402Bazaar` | Semantically search the public CDP x402 Bazaar with network, asset, recipient, price, and extension filters. |
| `listCdpX402MerchantResources` | List cataloged services for a receiving wallet. |

These calls are read-only and send no API key or wallet material.

### Omni recipe helpers

| Function | Purpose |
|---|---|
| `createOmniX402Recipe` | Convert a bounded news, trader, liquidation, profile, or risk question into an exact canonical resource and expected payment. |
| `listOmniAgentRecipes` | List representative real request plans for the six Bazaar route templates. |
| `createOmniRecipeGrant` | Build the least-privilege grant policy and aggregate cap for selected recipes. |
| `createOmniPaymentRequest` | Bind a grant and idempotency key to one recipe for protected gateway consumption. |

Recipes never sign or settle and cannot grant themselves permission. See
[Real Omni agent recipes](omni-agent-recipes.md).

The exported `OmniNewsPulseResponse`, `OmniTraderLeaderboardResponse`,
`OmniLiquidationMapResponse`, `OmniTraderProfileResponse`, and `OmniMarketRiskResponse` interfaces
provide typed paid bodies without exposing raw upstream fields.

### Validate a paid resource before acting

`requireFreshPaidResult<T>(result, options)` returns `resourceBody` only when:

- `decision` is `paid`;
- a settlement `receiptId` exists;
- a resource body exists;
- `freshness.status` is exactly `fresh`; and
- `schema` matches `options.expectedSchema` when one is supplied.

It throws `AgentCapabilityValidationError` with a stable `code` otherwise. The codes are
`payment_not_completed`, `receipt_missing`, `resource_body_missing`, `resource_not_fresh`, and
`schema_mismatch`. The helper validates the ACM response contract; it is not an independent chain
receipt verifier.

`payQuotedX402Testnet` accepts grant and policy metadata, never a private key:

```ts
await client.payQuotedX402Testnet({
  grantId,
  resourceUrl: "https://omniterminal.app/api/x402/v1/news/BTC?limit=5",
  category: "market_intelligence",
  purpose: "summarize_current_btc_news",
  idempotencyKey: crypto.randomUUID(),
});
```

For agent code that consumes the returned data directly, use the typed form:

```ts
const paid = await client.consumeX402Testnet<{
  schema: "market_risk_snapshot.v1";
  service: "omni.market_risk_snapshot";
  freshness: { status: "fresh" | "stale" | "unknown" };
}>({
  grantId: grant.id,
  resourceUrl: "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current",
  category: "market_intelligence",
  purpose: "build_current_risk_brief",
  idempotencyKey: crypto.randomUUID(),
  expectedPayment: {
    amount: 0.003,
    network: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
  },
});

const marketRisk = requireFreshPaidResult(paid, {
  expectedSchema: "market_risk_snapshot.v1",
});
```

The configured gateway owns payer custody, challenge validation, budget reservation, and reconciliation. Keep live payment examples opt-in and outside CI.

For mainnet-capable gateways, grants must explicitly allow the network, canonical asset contract
and payee. The first call may return `needs_user_approval`; approve that request, then repeat with
its `approvalId`. The gateway re-quotes and denies any changed resource, network, asset, payee,
currency or increased amount.

## Errors

Non-success HTTP responses throw `AgentCapabilityApiError` with:

- `status` — HTTP status code;
- `body` — parsed response body.

The compatibility exports `AgentPermissionWalletClient` and `AgentPermissionWalletApiError` remain available during the preview line but new integrations should use the Agent Capability names.
