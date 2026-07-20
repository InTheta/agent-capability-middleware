# Real Omni agent recipes

Omni Terminal exposes six bounded x402 route templates. ACM recipes turn common agent questions
into exact URLs, expected schemas, prices, and Base Sepolia payment constraints without putting a
wallet key in agent code.

```bash
npx github:InTheta/agent-capability-middleware#main recipes
```

This command plans requests only. It does not create a grant, sign, or pay.

## Questions agents can answer

| Agent question | Recipe | Canonical route template | Price |
|---|---|---|---:|
| What changed for BTC in the last 15 or 60 minutes? | `targeted_news` | `/news/:symbol` | `0.001` USDC |
| Give me the current broad crypto briefing | `hourly_market_briefing` | `/news` | `0.001` USDC |
| What is the current market-wide context only? | `news_context` | `/news` | `0.001` USDC |
| What happened during this exact historical window? | `historical_news` | `/news` or `/news/:symbol` | `0.001` USDC |
| Where are the strongest or nearest liquidation areas? | `liquidations` | `/liquidations/:symbol` | `0.002` USDC |
| Which public wallets are best, worst, largest, or most at risk? | `traders` | `/traders/:symbol` | `0.002` USDC |
| What is known about this public wallet? | `trader_profile` | `/trader-profile/:address` | `0.002` USDC |
| Give me one joined news and liquidation risk input | `market_risk` | `/market-risk/:symbol` | `0.003` USDC |

The 60-minute briefing is not a new LLM call. It combines events from the latest 60-minute slice
with the existing market context refreshed every 15 minutes over a 24-hour source window. This
keeps latency, cost, lineage, and freshness explicit.

## Build one request

```ts
import {
  AgentCapabilityClient,
  createOmniPaymentRequest,
  createOmniRecipeGrant,
  createOmniX402Recipe,
  requireFreshPaidResult,
  type OmniNewsPulseResponse,
} from "@agent-capability-middleware/sdk";

const recipe = createOmniX402Recipe({
  kind: "hourly_market_briefing",
  market: "crypto",
  impact: "high",
  minConfidence: 0.75,
  limit: 8,
});

const acm = new AgentCapabilityClient(process.env.ACM_GATEWAY_URL!, {
  apiKey: process.env.ACM_API_KEY,
});
const agent = await acm.registerAgent({ name: "Risk briefing agent" });
const grant = await acm.createGrant(createOmniRecipeGrant(agent.id, [recipe], {
  userId: "user_approved_identity",
  expiresInSeconds: 900,
}));
const paid = await acm.consumeX402Testnet<OmniNewsPulseResponse>(createOmniPaymentRequest(
  grant.id,
  recipe,
  crypto.randomUUID(),
));
const briefing = requireFreshPaidResult(paid, { expectedSchema: recipe.schema });
```

`createOmniRecipeGrant` computes the smallest aggregate testnet budget for the supplied recipes and
pins Omni's domain, market-intelligence category, Base Sepolia network, USDC asset, and public
receiver. It does not approve the grant on behalf of the user and never handles the payer key.

## Trader and liquidation examples

```ts
const best = createOmniX402Recipe({
  kind: "traders", symbol: "BTC", rank: "best", limit: 10,
});
const worst = createOmniX402Recipe({
  kind: "traders", symbol: "BTC", rank: "worst", limit: 10,
});
const largest = createOmniX402Recipe({
  kind: "traders", symbol: "BTC", rank: "largest", limit: 10,
});
const clusters = createOmniX402Recipe({
  kind: "liquidations", symbol: "BTC", view: "clusters", limit: 10,
});
```

These mirror the useful public-wallet and liquidation views proven by Omni's Telegram screenshot
bot, while returning bounded JSON rather than a screenshot or an arbitrary database query.

## Safety and freshness

- Current recipes must pass `requireFreshPaidResult` with the recipe schema.
- Historical news deliberately reports `historical`; validate its exact timestamp window instead of
  using the current-data helper.
- Never automatically retry an uncertain settlement with a new idempotency key.
- A recipe is request intent, not permission. The protected ACM gateway still enforces the grant,
  exact challenge, budget, approval, revocation, and reconciliation.
- Query variants remain part of six coherent Bazaar products. A variant is not another catalog
  listing or evidence of customer usage.
