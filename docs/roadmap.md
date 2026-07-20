# Public Roadmap

## Available in the developer preview

- typed TypeScript client;
- agent registration and narrowly scoped x402 grants;
- protected-payer quoted testnet settlement with no SDK-held key;
- exact amount, network, asset, payee, domain, category and idempotency binding;
- typed paid-response consumption and freshness validation;
- packaged `requireFreshPaidResult` validation for payment, receipt, body, freshness and schema;
- read-only CDP Bazaar discovery and a real six-product Omni external-service catalog;
- one-command external package install, no-spend catalog preflight and redacted partner report;
- one-command paid acceptance that validates freshness, revokes the grant and proves the next
  request is denied before settlement;
- user confirmation, revocation, privacy-safe shopping extraction and semantic-memory methods as secondary reference capabilities;
- public implementation profiles;
- clean local reference flow on Node.js 20 and 22;
- clean-room packed-SDK install and complete mock grant/pay/validate/revoke flow;
- clean-clone external-package and live Bazaar rehearsal, plus an independently gated funded
  Base Sepolia run through the protected preview gateway.
- zero-key `acm doctor` and read-only `acm inspect` CLI entry points, including installation direct
  from the public GitHub repository before npm publication.

## Next

- npm trusted publishing with provenance;
- two controlled external-developer completions of the canonical market-risk flow;
- measure and reduce README-to-first-paid-result time;
- publish a versioned OpenAPI document for the private preview gateway;
- decide whether repeat adoption justifies workload identity and tenant isolation.
- after the two external completions, expose one experimental user-side standing capability through
  a hosted seller agent; do not add auctions or broad profile export.

## Later

- hosted developer sandbox with project credentials and tenant isolation;
- MCP framework packages beyond the existing private adapter;
- browser-compatible storage and importer examples;
- explicit retention and data-use obligations;
- capability proof-of-possession profile;
- trusted identity and age-claim provider adapters;
- OpenID4VC-compatible claim exchange;
- additional user-approved importers;
- multi-agent delegation with attenuation and audit-chain verification;
- hosted production settlement operations, additional supported rails, and reconciliation tooling;
- policy simulation and enterprise controls.

Roadmap items are directional, not claims of current implementation.
