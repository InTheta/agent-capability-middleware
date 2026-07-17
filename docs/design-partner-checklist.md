# Controlled Design-Partner Checklist

This preview tests one question: can an external agent developer obtain a fresh paid Omni
market-risk result through ACM policy without handling a wallet key?

It is not a test of personal-data learning, identity verification, auctions, browser extensions or
mainnet payments.

## Part 1: public no-spend check

Requirements: Node.js 20 or 22.

```bash
git clone https://github.com/InTheta/agent-capability-middleware.git
cd agent-capability-middleware
npm ci
npm run partner:check
```

Expected final marker:

```text
OMNI_X402_NO_SPEND_READY
```

This confirms the canonical route is present in CDP Bazaar with the expected Base Sepolia USDC
asset, `0.003` price and Omni receiver. It also packs the SDK and installs it into a temporary
external project. It creates no payment and needs no key.

The command writes `.acm-design-partner-report.json`. The report contains timing, public catalog
metadata and pass/fail status only; it does not contain keys, API credentials or response bodies.

## Part 2: controlled paid check

The ACM operator provides a private gateway URL and, when workload authentication is enabled, a
server-only API key. Never place the key in browser code or commit it.

```bash
ACM_GATEWAY_URL='https://provided-private-gateway' \
ACM_API_KEY='provided-server-only-key-if-required' \
ACM_CONFIRM_TESTNET_SPEND=yes \
npm run partner:check
```

The example creates a 15-minute grant restricted to:

- scope `x402.pay`;
- domain `omniterminal.app`;
- category `market_intelligence`;
- Base Sepolia USDC;
- the Omni receiver;
- maximum `0.003` USDC per request.

The current private preview creates this as a synthetic demo-operator grant. It is not a claim of
production end-user authentication or consent.

It fails unless settlement succeeds and the returned composite response reports
`freshness.status = fresh`. Success prints `OMNI_X402_PAID_FRESH_OK` and updates the same redacted
report with the public receipt/audit identifiers, schema, freshness, item count and position count.

Never send `.env`, shell history or terminal output containing `ACM_API_KEY`. The report is the
only artifact the tester should return.

## Report only these outcomes

1. Minutes from opening the README to `OMNI_X402_NO_SPEND_READY`.
2. Minutes from receiving gateway access to the first paid fresh response.
3. Any step requiring undocumented help or a workaround.
4. Whether protected custody, policy binding and audit are valuable compared with paying directly.
5. Whether the developer would integrate or pay for this control layer.

Do not request more integrations during this test. Record them separately as evidence, not as MVP
scope.
