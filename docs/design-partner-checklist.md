# External developer test script

This test answers one question:

> Can an external agent developer install ACM and complete discover → grant → pay → validate →
> revoke without handling a wallet key or receiving live help?

It is not a test of user data, identity, auctions, browser extensions, mainnet, or the experimental
seller directory.

## Rules for the tester

- Start a timer before the first command.
- Use Node.js 20 or newer on a clean machine or project.
- Follow only this page; do not request a screen-share unless a step fails.
- Never send a wallet key, ACM API key, `.env`, or shell history.
- Return only the generated redacted reports and the five feedback answers.

## Step 1 — installed no-spend check

No clone, Git installation, account, environment file, or wallet is required:

```bash
node --version
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-no-spend-report.json
```

Open `acm-no-spend-report.json`. Success requires:

```json
{
  "reportVersion": "design_partner_check.v3",
  "ok": true,
  "mode": "no_spend",
  "packageInstall": "installed_cli",
  "secretsIncluded": false
}
```

The catalog section should name all seven canonical Omni route templates and show the canonical
`0.003` Base Sepolia USDC market-risk quote. This
step performs a read-only CDP Bazaar request and creates no signature or payment.

Record the minutes from opening this page to the successful report.

## Step 2 — controlled paid check

Stop here until the ACM operator provides:

- a protected gateway URL;
- confirmation that the dedicated testnet payer is ready.

The operator may also provide a server-only workload credential if the assigned deployment
enforces one. The current credential field is optional; private-network reachability remains a
separate control.

Enter the credential through a hidden prompt:

```bash
export ACM_GATEWAY_URL='https://provided-gateway.example'
export ACM_CONFIRM_TESTNET_SPEND=yes
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.18.tar.gz partner-check \
  > acm-paid-report.json
unset ACM_API_KEY ACM_CONFIRM_TESTNET_SPEND
```

Only when the operator supplies a workload key, enter it before the command:

```bash
printf 'ACM API key: '; IFS= read -r -s ACM_API_KEY; printf '\n'; export ACM_API_KEY
```

The command creates one 15-minute grant restricted to:

- scope `x402.pay`;
- `omniterminal.app` and `market_intelligence`;
- exactly `0.003` USDC on Base Sepolia;
- the canonical USDC contract and Omni receiver;
- no wallet transfer, trading execution, or cookies.

It then buys one current BTC market-risk result, rejects it unless paid, receipted, fresh, and
`market_risk_snapshot.v1`, revokes the grant, and proves the next request is denied before a second
settlement.

Success requires the paid report to contain:

- `"mode": "paid_testnet"`;
- a public `receiptId` and ACM `auditEventId`;
- `"freshness": "fresh"`;
- `"denialReason": "grant_revoked"`;
- `"secondSettlementCreated": false`; and
- `"secretsIncluded": false`.

The private payer key never enters the CLI or SDK. When supplied, the API key authenticates the
developer workload; it is not a wallet key and must still be kept server-side. Do not describe an
API key as enforced unless the assigned gateway deployment actually validates it.

## Step 3 — return evidence

Return:

1. `acm-no-spend-report.json`;
2. `acm-paid-report.json`;
3. minutes to the no-spend result;
4. minutes from receiving credentials to the paid result; and
5. answers to the questions in [the feedback template](design-partner-feedback-template.md).

Do not return terminal history or credentials.

## Failure guide

| Failure | What to do |
|---|---|
| Node is older than 20 | Install Node.js 20 or 22 and rerun. |
| `step: catalog` | Confirm internet access, then retry once. Do not enable spend. |
| `step: gateway` | Check the supplied URL and re-enter the workload key through the hidden prompt. |
| `step: payment` | Stop. Return the redacted error and do not blindly retry uncertain settlement. |
| `step: revocation` | Stop. Return the redacted error; do not perform another paid call. |

## Evidence status

The exact pinned `v0.1.0-preview.18` command completed an operator no-spend clean-install check on
22 July 2026 against all seven canonical Bazaar templates. The same installed command then completed
the funded Base Sepolia flow in 3.491 seconds: fresh `market_risk_snapshot.v1`, public receipt
`0xff57ccc4b5da7121d679eb47178be563427b21b81bc88406bba1f78e9a9e5283`, ACM audit event
`evt_000074`, revoked grant `grant_000072`, `grant_revoked` denial, and no second settlement.

This is operator repeatability evidence, not either of the two required unaided external developer
completions.
