# Getting Started

## Choose a development mode

### Local reference mode

Use this to understand the lifecycle with synthetic data:

```bash
npm ci
npm run quickstart
```

The reference server keeps state in memory, has no authentication and is destroyed when the example exits. It is not the hosted product.

### Gateway mode

Use the SDK against an Agent Capability Middleware-compatible gateway:

```ts
import { AgentCapabilityClient } from "@agent-capability-middleware/sdk";

const acm = new AgentCapabilityClient(process.env.ACM_GATEWAY_URL!, {
  apiKey: process.env.ACM_API_KEY,
});
```

Keep gateway credentials on a server or in a protected workload environment. Do not embed a privileged API key in a public browser bundle.

## Minimum integration

1. Register the agent identity.
2. Ask the user to create or approve a narrow grant.
3. Request only the attribute or action required for the stated purpose.
4. Handle `allow`, `deny`, `requires_approval` and `payment_required` decisions explicitly.
5. Make revocation and activity history visible to the user.

```ts
const agent = await acm.registerAgent({ name: "Restaurant Finder" });
const grant = await acm.createGrant({
  userId: "user_123",
  agentId: agent.id,
  scopes: ["attributes.preferences.dietary_requirements.read"],
  expiresInSeconds: 900,
});

const result = await acm.getConfirmedAttribute(
  grant.id,
  "preferences.dietary_requirements",
  "restaurant_recommendation",
);
```

## Pay a protected x402 resource

The public SDK delegates signing and settlement to the protected gateway. For a Base Sepolia integration test, create a narrow grant and pass the exact resource URL:

```ts
const marketGrant = await acm.createGrant({
  userId: "user_123",
  agentId: agent.id,
  scopes: ["x402.pay"],
  spendPolicy: {
    currency: "USDC",
    perRequestMax: 0.003,
    dailyMax: 0.05,
    approvalRequiredAbove: 0.003,
  },
  resourcePolicy: {
    allowedDomains: ["omniterminal.app"],
    allowedCategories: ["market_intelligence"],
  },
  expiresInSeconds: 900,
});

const paid = await acm.payQuotedX402Testnet({
  grantId: marketGrant.id,
  resourceUrl: "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current",
  category: "market_intelligence",
  purpose: "evaluate_btc_market_risk",
  idempotencyKey: crypto.randomUUID(),
});
```

The live Omni catalog also exposes enriched news, exact news windows, liquidation maps, trader rankings and individual trader profiles. Run the deliberately spend-gated 14-call example only against a funded Base Sepolia payer:

```bash
ACM_GATEWAY_URL=https://your-protected-gateway.example \
ACM_API_KEY=server_only_key \
ACM_CONFIRM_CATALOG_TESTNET_SPEND=yes \
npm run example:omni-catalog
```

The example authorizes at most `0.025` test USDC and is not part of CI.

## Mainnet boundary

`payQuotedX402()` can address a compatible mainnet seller, but the gateway must still have mainnet explicitly enabled, a dedicated funded payer, an exact network/asset/payee grant and—by default—a human approval. Inspect `getMainnetWalletStatus()` and `getMainnetWalletBalances()` before attempting any mainnet flow. Never put wallet keys in SDK configuration or a browser bundle.

## Production checklist

- Authenticate both developer workload and end user.
- Bind the grant to the correct tenant, user and agent.
- Prefer short-lived grants and least-privilege scopes.
- Require explicit user approval for sensitive identity or payment actions.
- Never give an agent raw cookies, session tokens, identity documents or wallet keys.
- Record redacted allow and deny decisions.
- Test revocation and replay behavior before launch.
