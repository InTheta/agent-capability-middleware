# Five-minute getting started

This guide follows one path: **discover → grant → pay → validate → revoke**.

Requirements: Node.js 20+ and npm. The first two steps require no account, wallet, private key, or payment.

## 1. Check the live catalog without spending

Run the pinned preview from any empty directory:

```bash
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-no-spend-report.json
```

Success requires:

```json
{
  "ok": true,
  "mode": "no_spend",
  "packageInstall": "installed_cli",
  "secretsIncluded": false
}
```

This checks Coinbase's public x402 Bazaar catalog, the seven canonical Omni route templates, and the exact Base Sepolia quote. It does not sign or settle a transaction.

## 2. Run the buyer lifecycle locally

```bash
npx github:InTheta/agent-capability-middleware#main demo buyer
```

Expected outcome:

1. create a bounded grant;
2. validate a fresh synthetic paid result;
3. revoke the grant; and
4. deny the next request without another receipt.

The local `0xmock_...` receipt is not a blockchain transaction.

## 3. Add ACM to an agent

```bash
mkdir acm-example && cd acm-example
npm init -y
npm install github:InTheta/agent-capability-middleware#main
```

Create `buy-market-risk.mjs`:

```js
import {
  AgentCapabilityClient,
  createOmniPaymentRequest,
  createOmniX402Recipe,
  requireFreshPaidResult,
} from "@agent-capability-middleware/sdk";

const acm = new AgentCapabilityClient(process.env.ACM_GATEWAY_URL, {
  apiKey: process.env.ACM_API_KEY,
});

const recipe = createOmniX402Recipe({ kind: "market_risk", symbol: "BTC" });
const request = createOmniPaymentRequest(
  "grant_approved_by_user",
  recipe,
  crypto.randomUUID(),
);

const result = await acm.consumeX402Testnet(request);
const data = requireFreshPaidResult(result, { expectedSchema: recipe.schema });

console.log({ schema: data.schema, freshness: data.freshness.status });
```

The agent sends intent and grant metadata. It never receives the payer private key.

## 4. Complete the controlled Base Sepolia test

Stop until an ACM operator provides a protected gateway URL and confirms its dedicated testnet payer is funded.

```bash
export ACM_GATEWAY_URL='https://provided-gateway.example'
export ACM_CONFIRM_TESTNET_SPEND=yes
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-paid-report.json
unset ACM_API_KEY ACM_CONFIRM_TESTNET_SPEND
```

If the assigned deployment enforces a workload key, enter it through a hidden prompt first:

```bash
printf 'ACM API key: '; IFS= read -r -s ACM_API_KEY; printf '\n'; export ACM_API_KEY
```

The paid report must show a public receipt, an ACM audit event, fresh `market_risk_snapshot.v1` data, `grant_revoked`, no second settlement, and no included secrets. Follow the complete [external developer checklist](design-partner-checklist.md).

## What ACM enforces

- exact resource and purpose;
- maximum amount and daily budget;
- network, asset, and receiving address;
- grant expiry and revocation;
- idempotency and replay protection;
- approval policy; and
- response freshness and schema before agent use.

## Safety rules

- Keep workload credentials server-side.
- Never put a wallet private key in the SDK, CLI, agent prompt, or `.env` shared with a tester.
- Stop on an uncertain payment result; do not blindly retry.
- Return only redacted acceptance reports.

## Optional experimental previews

These are local offer-policy helpers, not live settlement or marketplace claims:

```bash
npx github:InTheta/agent-capability-middleware#main demo developer-seller
npx github:InTheta/agent-capability-middleware#main demo user-seller
npx github:InTheta/agent-capability-middleware#main demo exchange
```

See [runnable examples](examples.md) for their exact boundaries.
