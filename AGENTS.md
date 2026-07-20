# Agent Capability Middleware Public SDK — Codex Rules

## Public boundary

- Product doctrine: x402 moves money; ACM governs authority. Lead public claims with exact
  paid-resource authorization and protected payer custody. Two-way data licensing and auctions are
  future product hypotheses, not SDK release claims.
- This repository contains the dependency-light public SDK, local evidence minimizers, examples, and draft implementation profiles. It does not contain hosted vault, payer custody, provider secrets, or production policy state.
- The SDK may request a paid call from a protected ACM gateway. It must never accept, store, derive, print, or transmit a wallet private key or seed phrase.
- Keep live/funded examples opt-in. Do not run them from `test`, `verify`, package lifecycle scripts, or CI.
- Label features as implemented, verified live, prepared, planned, or hypothesis; do not turn
  testnet proof into mainnet or customer-traction language.
- The zero-key CLI may make read-only Bazaar calls. User-side **Sell one capability** remains a
  documented experimental next step; do not expose it as a production SDK contract before the two
  unaided external-developer buyer completions.

## Data learning

- Do not read cookies or browser session tokens. Prefer user-selected exports and explicit browser APIs.
- Parse/minimize locally. Upload only aggregate signals with provenance, confidence, and privacy metadata.
- Exclude raw order IDs, addresses, payment details, sensitive categories, and product titles.
- Derived candidates remain unreadable to agents until the user confirms them under a scoped grant.

## x402

- Public client methods send grant and policy metadata to a configured gateway; the gateway owns signing and reconciliation.
- Bind exact HTTPS resource, method, network, asset, amount, recipient, purpose, category, grant, and idempotency.
- Preserve the distinction between read-only challenge inspection and funded execution.
- CDP Bazaar search/merchant helpers are public and keyless. Do not attach ACM bearer tokens, payer keys, or CDP seller credentials to discovery calls, and do not claim a seller is indexed until the catalog returns it after CDP settlement.
- The reference server remains non-production and does not implement payer custody.

## Verification and documentation

- Run `npm run verify` (or `pnpm run verify`) for source, consumer typecheck, tests, package smoke,
  quickstart, and the clean-room packed install. Keep scripts package-manager neutral.
- Keep the clean-room `example:fresh-dev` in `verify`; it must install the packed artifact into a
  new temporary project, use an unmistakably mock receipt, and perform no external request or spend.
- Keep generated `dist/` tracked while the preview is installed directly from GitHub. Git-hosted
  package managers must not need to run an unapproved `prepare` script merely to expose the CLI.
- Add a focused request-shape test for every public client method.
- Update `README.md`, `docs/sdk-api.md`, relevant integration docs, examples, specs/status claims, and these rules whenever the public contract changes.
