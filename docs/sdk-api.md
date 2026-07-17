# SDK API

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

Standalone, keyless discovery helpers do not use the configured ACM gateway:

| Function | Purpose |
|---|---|
| `searchCdpX402Bazaar` | Semantically search the public CDP x402 Bazaar with network, asset, recipient, price, and extension filters. |
| `listCdpX402MerchantResources` | List cataloged services for a receiving wallet. |

These calls are read-only and send no API key or wallet material.

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

if (paid.decision !== "paid" || paid.resourceBody?.freshness.status !== "fresh") {
  throw new Error("No fresh paid market data was returned");
}
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
