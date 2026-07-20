# Five-minute getting started

Requirements: Node.js 20+. No account or wallet is required for the local demos.

## Zero-install preview

```bash
npx github:InTheta/agent-capability-middleware#main demo exchange
```

This prints one developer API offer, one user capability offer, and the policy decision for each. It is local and fixed-price; no payment settles.

## Install

```bash
mkdir acm-example && cd acm-example
npm init -y
npm install github:InTheta/agent-capability-middleware#main
```

If you are evaluating ACM as an external design partner, skip the repository clone and run the
pinned acceptance command:

```bash
npx github:InTheta/agent-capability-middleware#v0.1.0-preview.13 partner-check
```

It validates the installed CLI and current public Bazaar contract without paying. Follow
[the design-partner checklist](design-partner-checklist.md) only after it passes.

## 1. Agent buys safely

Start with the no-spend lifecycle:

```bash
npx acm demo buyer
```

For the complete packed clean-room mock:

```bash
git clone https://github.com/InTheta/agent-capability-middleware.git
cd agent-capability-middleware
npm ci
npm run example:fresh-dev
```

Expected marker: `FRESH_DEV_MOCK_OK`. It creates a bounded grant, validates a synthetic fresh result, revokes the grant, and proves the next request is denied. Its `0xmock_…` receipt is not a chain transaction.

For a real testnet purchase, ask the ACM operator for a gateway URL and workload credential, then follow [x402 integration](x402-integration.md). The SDK never accepts the payer private key.

## 2. Developer sells an API

```bash
npx acm demo developer-seller
```

Or run the source example:

```bash
npm run example:developer-seller
```

The result is `payment_required` with the exact price, receiving address, network, and resource. This is the offer/policy layer. Your seller server must still implement a real x402 challenge and settlement flow.

## 3. User sells a capability

```bash
npx acm demo user-seller
```

The source example also shows local minimization from an Amazon-shaped CSV:

```bash
npm run example:user-seller
```

It publishes a user-confirmed purchase-intent projection. It does not read cookies or publish raw order rows, product titles, address, payment details, or identity documents.

## 4. Data exchange preview

```bash
npx acm demo exchange
```

The local directory can hold developer and user offers and produces explicit `allow`, `payment_required`, `requires_user_approval`, or `deny` decisions. It is not a live auction or liquidity claim.

## Policy outcomes

| Policy | Result | Typical use |
|---|---|---|
| `free` | `allow` | User chooses convenience or developer offers a free sample |
| `paid` | `payment_required` | API call or minimum-disclosure capability has a fixed price |
| `ask` | `requires_user_approval` | User wants to review every request |
| `deny` | `deny` | Capability must never be shared |

## Production rules

- Authenticate developer workload, user, and agent separately.
- Bind grants to purpose, resource, payee, asset, amount, expiry, and idempotency key.
- Keep gateway credentials server-side.
- Never give an agent raw cookies, session tokens, identity documents, card details, or wallet keys.
- Make activity, approval, and revocation visible to the user.
- Treat seller helpers as experimental until a hosted settlement and fulfilment service exists.
