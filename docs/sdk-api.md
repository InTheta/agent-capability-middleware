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
| `listPublicX402Resources` | Discover public x402 resources through a gateway. |
| `inspectPublicX402Challenge` | Inspect a payment challenge without paying. |
| `payQuotedX402Testnet` | Ask a protected ACM gateway to quote, authorize, sign, settle, and retry an exact testnet resource. |

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

The configured gateway owns payer custody, challenge validation, budget reservation, and reconciliation. Keep live payment examples opt-in and outside CI.

## Errors

Non-success HTTP responses throw `AgentCapabilityApiError` with:

- `status` — HTTP status code;
- `body` — parsed response body.

The compatibility exports `AgentPermissionWalletClient` and `AgentPermissionWalletApiError` remain available during the preview line but new integrations should use the Agent Capability names.
