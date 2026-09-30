# Test ACM — no wallet required

ACM is a developer-preview client for exact paid-resource authorization through a protected
payer. This first test needs **Node.js 20+ with npm and internet access**, but no Git clone,
account, gateway, wallet, API key, or funds. It does not enable payment.

## 1. Check your setup and the public catalog

Start a timer if you can. These single-line commands work in PowerShell and Bash:

```sh
node --version
npm --version
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.24.tar.gz doctor
```

The first run downloads the pinned CLI. The doctor makes read-only requests to the public
Bazaar catalog. Success includes `ok: true`, `mode: "live_no_spend"`, `canonicalRoutes: 9`,
`spent: false`, and `secretsIncluded: false`. It creates no grant, signature, or payment.

## 2. Try the local synthetic buyer preview

```sh
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.24.tar.gz demo buyer
```

Look for `ACM_BUYER_DEMO_OK`, `spent: false`, and
`acceptedSchema: "market_risk_snapshot.v1"`. The demo validates a synthetic result without
contacting a seller or gateway. It does not create/revoke a real grant or move money;
a mock receipt is not an onchain transaction. Downloading the CLI still needs internet.

## 3. Tell us what happened — including failures

[Open the tester feedback form](https://github.com/InTheta/agent-capability-middleware/issues/new?template=tester-feedback.yml).
Submitting a GitHub issue requires a GitHub account; running the test does not. If an operator
invited you, you can instead return the [feedback template](design-partner-feedback-template.md)
through your existing private conversation.

Tell us your OS, Node version, last step reached, approximate time, first confusing instruction
or redacted error, and what you would use ACM for. A stopped or failed test is useful feedback.
Do not attach full logs or reports by default. Review any excerpt manually: never post keys,
tokens, `.env` files, shell history, private gateway URLs, user data, or paid response bodies.
A report's `secretsIncluded: false` flag is not a substitute for that review.
Report vulnerabilities privately as described in [SECURITY.md](../SECURITY.md).

## If something fails

| Problem | Next step |
|---|---|
| `node`/`npm` missing, or Node below 20 | Install Node 20+ with npm, then reopen your terminal. |
| PowerShell blocks `npx.ps1` | Use `npx.cmd` in place of `npx`; do not weaken execution policy. |
| Download blocked by a proxy or network | Check access to GitHub and npm; do not disable TLS checks. Report the redacted error if blocked. |
| Catalog check fails | Retry once if connectivity was interrupted. Try the local preview independently; a live catalog failure does not authorize spending. |
| Local preview fails | Stop and report the command, Node version, and reviewed error excerpt. |

## Optional: request a private integration pilot

Use the feedback form's pilot-interest field to describe your use case. This is an expression
of interest, not automatic access or a promise of acceptance. An operator must separately
arrange protected access and confirm a dedicated Base Sepolia testnet payer before you follow
the [private-pilot checklist](design-partner-checklist.md).

The pilot checks grant → pay → validate → revoke → deny. Do not use a mainnet wallet, send
funds, or enable `ACM_CONFIRM_TESTNET_SPEND` for the public test. Never send a payer key.
Passing the local preview is not evidence of live payment, custody safety, or production readiness.
