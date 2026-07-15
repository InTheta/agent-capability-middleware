# Agent Capability Middleware

The open TypeScript SDK and reference profiles for adding user-controlled permissions, private context and payment policy to AI-agent interactions.

> Developer preview. The SDK is usable today; the included server is an in-memory reference implementation and must not be used with real personal data or funds.

## Why this exists

MCP lets agents call tools. OAuth/OIDC can identify clients and users. Verifiable credentials can carry trusted claims. x402 can carry payment requirements and proofs. None of those standards alone decides what an agent may know, do, delegate or spend for a particular user.

Agent Capability Middleware composes those existing standards behind a capability and policy layer. It does not replace them or introduce a new transport protocol.

```mermaid
flowchart LR
    U["User vault"] --> P["Permission and policy gateway"]
    A["Agent or MCP client"] --> P
    P --> S["Agent, MCP tool or service"]
    P -. "optional payment" .-> X["x402 rail"]
    P -. "identity or claims" .-> I["OAuth, OIDC and verifiable credentials"]
```

## Run the real local lifecycle

Requirements: Node.js 20 or 22.

```bash
git clone https://github.com/InTheta/agent-capability-middleware.git
cd agent-capability-middleware
npm ci
npm run quickstart
```

The quickstart:

1. parses an Amazon-shaped order CSV locally;
2. uploads aggregate shopping signals, not raw rows;
3. creates unconfirmed memory candidates;
4. proves an agent cannot read an unconfirmed preference;
5. confirms the candidate as the user;
6. returns only the specifically granted attribute;
7. revokes the grant and proves the next read is denied.

## Install the SDK

Until the first npm release, install the tagged GitHub package:

```bash
npm install github:InTheta/agent-capability-middleware#v0.1.0-preview.3
```

```ts
import { AgentCapabilityClient } from "@agent-capability-middleware/sdk";

const acm = new AgentCapabilityClient("https://gateway.example.com", {
  apiKey: process.env.ACM_API_KEY,
});

const agent = await acm.registerAgent({
  name: "Shopping Assistant",
  developerId: "developer_example",
});

const grant = await acm.createGrant({
  userId: "user_example",
  agentId: agent.id,
  scopes: ["attributes.preferences.shopping.brands.read"],
  deniedScopes: ["cookies.*", "identity.*", "medical.*"],
  expiresInSeconds: 600,
});
```

## Privacy-safe shopping learning

```ts
import {
  createShoppingEvidenceImportRequest,
  parseShoppingOrderCsv,
} from "@agent-capability-middleware/sdk";

const preview = parseShoppingOrderCsv(await file.text(), {
  source: "amazon_order_history_export",
});

// Display preview.signals for the user's review before upload.
await acm.importShoppingEvidence(
  createShoppingEvidenceImportRequest("user_example", preview),
);
```

The parser does not read cookies. It does not include order IDs, addresses, payment details or raw product titles in the import request. Potentially sensitive purchase categories are excluded, and all learned attributes remain pending until confirmed.

## x402 boundary

The SDK can inspect x402 resources and call a compatible gateway's bounded payment endpoints. It never accepts or stores a private key. A production gateway must bind payment approval to the exact resource, amount, network, recipient, purpose and idempotency key before a separately configured wallet signs.

## Repository map

- `src/` — dependency-light TypeScript SDK and local evidence parser.
- `examples/` — end-to-end external-consumer flow and non-production reference server.
- `docs/` — developer guides, architecture and public roadmap.
- `specs/` — versioned implementation profiles for capabilities, audit and x402 policy binding.
- `tests/` — privacy and package contract checks.

## Public versus hosted components

Open here:

- SDK and types;
- privacy-safe local importers;
- public implementation profiles;
- reference examples and tests.

Not included:

- hosted multi-tenant vault;
- production identity verification integrations;
- custody or funded-wallet keys;
- fraud/risk engine;
- enterprise policy control plane;
- production connectors and operational configuration.

## Documentation

- [Getting started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Privacy-safe learning](docs/privacy-safe-learning.md)
- [SDK API](docs/sdk-api.md)
- [x402 integration](docs/x402-integration.md)
- [Public roadmap](docs/roadmap.md)
- [Security policy](SECURITY.md)

Licensed under [Apache-2.0](LICENSE).
