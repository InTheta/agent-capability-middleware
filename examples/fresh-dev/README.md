# Fresh developer example

This example is the fastest way to understand ACM without credentials, a wallet, or a live
payment. It runs the canonical lifecycle against a deterministic local mock:

```text
register → grant → simulated paid result → validate → revoke → denied before payment
```

From the repository root:

```bash
npm ci
npm run example:fresh-dev
```

The runner packs the public SDK, installs that tarball into a new temporary project, copies only
the two files in this directory, and runs them as an external consumer. Success ends with:

```text
FRESH_DEV_MOCK_OK
```

The receipt is intentionally named `0xmock_base_sepolia_receipt`. No seller is called, no private
key is configured, and no testnet or mainnet asset moves. Use the separate
[`omni-x402.mjs`](../omni-x402.mjs) example for the explicitly spend-gated live Base Sepolia flow.
