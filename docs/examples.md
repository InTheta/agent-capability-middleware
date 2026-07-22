# Runnable examples

Start with the buyer path. Seller and exchange examples are clearly separated because they are experimental local previews.

## 1. Live Bazaar discovery — no spend

From any empty directory with Node.js 20+:

```bash
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-no-spend-report.json
```

This installs the pinned preview, reads Coinbase's public x402 Bazaar catalog, verifies all seven canonical Omni route templates and the `0.003` Base Sepolia USDC market-risk quote, then exits without signing or paying.

Expected fields:

```json
{
  "ok": true,
  "mode": "no_spend",
  "packageInstall": "installed_cli",
  "secretsIncluded": false
}
```

## 2. Deterministic buyer demo — no spend

```bash
npx github:InTheta/agent-capability-middleware#main demo buyer
```

This demonstrates the policy lifecycle without a chain transaction:

```text
bounded grant → fresh synthetic result → revoke → denied retry
```

Any `0xmock_...` receipt is intentionally synthetic.

## 3. Controlled Base Sepolia purchase

Run only after an ACM operator provides a protected gateway URL and confirms its dedicated testnet payer is ready:

```bash
export ACM_GATEWAY_URL='https://provided-gateway.example'
export ACM_CONFIRM_TESTNET_SPEND=yes
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-paid-report.json
unset ACM_API_KEY ACM_CONFIRM_TESTNET_SPEND
```

If that deployment requires a workload key, enter it separately through the hidden prompt documented in the [external developer checklist](design-partner-checklist.md).

The flow binds one request to its resource, purpose, `0.003` USDC maximum, Base Sepolia network, USDC contract, Omni receiver, grant, and idempotency key. It accepts the result only when paid, receipted, fresh, and schema-matched. It then revokes the grant and proves another settlement cannot occur.

Required paid-report evidence:

```text
mode: paid_testnet
freshness: fresh
denialReason: grant_revoked
secondSettlementCreated: false
secretsIncluded: false
```

The payer key stays inside the protected gateway.

## Contributor examples

```bash
git clone https://github.com/InTheta/agent-capability-middleware.git
cd agent-capability-middleware
npm ci
```

| Command | Purpose | Payment |
|---|---|---|
| `npm run example:fresh-dev` | Pack, install in an empty project, grant, validate, revoke, deny | None; deterministic mock |
| `npm run example:bazaar` | List the live receiver-scoped Bazaar catalog | None |
| `npm run example:omni-recipes` | Build exact news, liquidation, trader, risk, and snapshot requests | None |
| `npm run example:omni-x402` | Run the partner flow | No spend unless explicitly enabled |
| `npm run verify` | Type-check, test, package-smoke, and exercise public examples | None |

Expected markers include `FRESH_DEV_MOCK_OK`, `BAZAAR_DISCOVERY_NO_SPEND_OK`, and `OMNI_AGENT_RECIPES_NO_SPEND_OK`.

## Experimental seller previews

These examples create and evaluate local fixed-price offer objects. They do **not** custody keys, issue a real x402 challenge, settle payment, fulfil a live order, prove demand, or constitute a production marketplace.

| Command | Preview |
|---|---|
| `npx github:InTheta/agent-capability-middleware#main demo developer-seller` | Developer describes a paid API offer |
| `npx github:InTheta/agent-capability-middleware#main demo user-seller` | User offers a confirmed minimum-disclosure capability |
| `npx github:InTheta/agent-capability-middleware#main demo exchange` | Both offer types share Free, Paid, Ask, or Deny decisions |

The user-seller example locally minimizes an Amazon-shaped CSV into aggregate evidence. It explicitly reports that raw rows and product titles are not uploaded, cookies are not read, and settlement did not occur. See the [user seller preview](user-seller-agent.md).

## Testnet proof images

![ACM dashboard showing a bounded x402 grant and paid audit entries](assets/acm-bounded-grant-audit.png)

![Successful 0.003 USDC Base Sepolia settlement in BaseScan](assets/base-sepolia-settlement.png)

These captures are operator testnet evidence, not external validation, mainnet, or production claims.
