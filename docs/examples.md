# Runnable Examples

Choose the smallest example that answers your question. Only the last two rows can spend test
USDC, and both require an explicit environment-variable confirmation.

| Goal | Command | Network | Spend |
|---|---|---:|---:|
| Prove a packed SDK works in a brand-new project | `npm run example:fresh-dev` | local mock | none |
| Learn the secondary user-confirmed attribute lifecycle | `npm run quickstart` | local reference | none |
| Discover Omni in the public CDP x402 Bazaar | `npm run example:bazaar` | public read-only API | none |
| Run the partner package + discovery preflight | `npm run partner:check` | public read-only API | none |
| Buy one fresh market-risk result, then revoke | `ACM_CONFIRM_TESTNET_SPEND=yes npm run partner:check` | Base Sepolia | `0.003` test USDC |
| Exercise all six Omni product shapes | `ACM_CONFIRM_CATALOG_TESTNET_SPEND=yes npm run example:omni-catalog` | Base Sepolia | up to `0.025` test USDC |

## 1. Fresh project, full mock lifecycle

```bash
git clone https://github.com/InTheta/agent-capability-middleware.git
cd agent-capability-middleware
npm ci
npm run example:fresh-dev
```

This is more than an in-repository unit test. The runner:

1. builds and packs the SDK;
2. creates an empty temporary Node.js project;
3. installs the generated tarball as an external dependency;
4. starts a deterministic mock ACM gateway;
5. registers an agent and creates an exact `x402.pay` grant;
6. receives and validates a simulated paid, fresh response;
7. revokes the grant; and
8. proves the next request is denied with no second receipt.

Expected final marker:

```text
FRESH_DEV_MOCK_OK
```

The mock receipt is visibly prefixed `0xmock_`. No seller is contacted and no asset moves.

## 2. Read-only Bazaar discovery

```bash
npm run example:bazaar
```

This calls Coinbase's public discovery endpoints without a CDP credential, ACM token, or wallet.
It prints the live route, price, network, and recent call count for each Omni service and ends with:

```text
BAZAAR_DISCOVERY_NO_SPEND_OK
```

![Six Omni x402 routes shown in the ACM Bazaar interface](assets/omni-bazaar-six-routes.png)

## 3. One real Base Sepolia result

After an operator issues controlled preview-gateway access and confirms the dedicated payer has
test USDC:

```bash
ACM_GATEWAY_URL=https://your-protected-gateway.example \
ACM_API_KEY=server_only_workload_credential \
ACM_CONFIRM_TESTNET_SPEND=yes \
npm run partner:check
```

The example pins the exact HTTPS resource, `0.003` amount, Base Sepolia network, canonical USDC
contract, Omni recipient, category, purpose, grant and idempotency key. It accepts the body only
through `requireFreshPaidResult()`, revokes the grant, then proves a new request is rejected before
quote or settlement.

Expected final markers:

```text
OMNI_X402_PAID_FRESH_OK
OMNI_X402_REVOKED_DENY_OK
```

![ACM dashboard showing a bounded x402 grant and paid audit entries](assets/acm-bounded-grant-audit.png)

The following public explorer capture is an earlier successful `0.003` USDC Base Sepolia transfer
to Omni's receiving address. It is testnet evidence, not a mainnet or production claim.

![Successful 0.003 USDC Base Sepolia settlement in BaseScan](assets/base-sepolia-settlement.png)

## 4. Consume the result in agent code

```ts
import {
  AgentCapabilityClient,
  requireFreshPaidResult,
} from "@agent-capability-middleware/sdk";

const acm = new AgentCapabilityClient(process.env.ACM_GATEWAY_URL!, {
  apiKey: process.env.ACM_API_KEY,
});

const result = await acm.consumeX402Testnet<{
  schema: "market_risk_snapshot.v1";
  symbol: string;
  freshness: { status: "fresh" | "stale" | "unknown" };
}>({
  grantId: "grant_from_user_approval",
  resourceUrl: "https://omniterminal.app/api/x402/v1/market-risk/BTC?scope=current",
  category: "market_intelligence",
  purpose: "build_current_btc_risk_brief",
  idempotencyKey: crypto.randomUUID(),
  expectedPayment: {
    amount: 0.003,
    network: "eip155:84532",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
  },
});

const marketRisk = requireFreshPaidResult(result, {
  expectedSchema: "market_risk_snapshot.v1",
});
console.log(marketRisk.symbol);
```

The helper validates the ACM response contract. It does not independently query a block explorer;
the protected gateway remains responsible for quote verification, signing, settlement, and
reconciliation.
