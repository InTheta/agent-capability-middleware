# x402 Integration

x402 describes how an HTTP resource can request and verify payment. Agent Capability Middleware adds user and developer policy around that exchange.

```mermaid
sequenceDiagram
    participant A as Agent
    participant G as Capability gateway
    participant U as User policy
    participant S as Paid service
    participant W as Protected wallet

    A->>S: Request resource
    S-->>A: 402 payment challenge
    A->>G: Request spend for exact challenge
    G->>U: Check scope, amount, payee and approval rule
    alt denied
      G-->>A: deny
    else human approval required
      G-->>A: requires_approval
    else allowed
      G->>W: Sign exact bounded payment
      W-->>G: payment proof
      G->>S: Retry with proof
      S-->>G: Resource and settlement response
      G-->>A: Scoped result
    end
```

## Required bindings

Before signing, a production integration should bind permission to:

- scheme and network;
- atomic amount and asset contract;
- recipient;
- request method and normalized resource;
- purpose and category;
- expiry;
- unique idempotency key;
- the active user, agent and grant.

Budget should be reserved transactionally before signing. Ambiguous settlement needs reconciliation rather than an automatic retry with a new payment.

## Preview behavior

Public resource discovery and challenge inspection are read-only. The public reference server does not sign or settle payments. Funded testnet execution belongs in a protected gateway deployment and must never require placing a private key in this SDK repository.

The standalone `searchCdpX402Bazaar` and `listCdpX402MerchantResources` helpers call Coinbase's public discovery API without credentials. A seller appears only after it declares valid Bazaar metadata and settles through the CDP facilitator; an x402.org test settlement is not a CDP listing.

The SDK methods `payQuotedX402Testnet`, typed `consumeX402Testnet<T>`, and `payQuotedX402` call such a gateway. They do not sign locally.

## Real Omni example

Omni Terminal currently exposes six canonical Base Sepolia paid route forms:

| Product | Resource | Price |
|---|---|---:|
| AI News Pulse | `/api/x402/v1/news/{symbol}?limit=5` | `0.001` test USDC |
| Market News Pulse | `/api/x402/v1/news` | `0.001` test USDC |
| Public Trader Profile | `/api/x402/v1/trader-profile/{address}` | `0.002` test USDC |
| Liquidation Map | `/api/x402/v1/liquidations/{symbol}` | `0.002` test USDC |
| Trader Leaderboard | `/api/x402/v1/traders/{symbol}` | `0.002` test USDC |
| Market Risk Snapshot | `/api/x402/v1/market-risk/{symbol}` | `0.003` test USDC |

Successful Omni responses expose `schema`, `generated_at`, `data_as_of`, and `freshness`. Consumers
using a current route should fail closed unless `freshness.status` is `fresh`; an exact historical
news window may deliberately report `historical`. The composite market-risk response includes
component freshness for both its live Hyperliquid projection and news context.

Create a grant that allows only `x402.pay`, category `market_intelligence`, domain `omniterminal.app`, and a small USDC cap. Then run:

```bash
ACM_GATEWAY_URL=http://127.0.0.1:8787 \
ACM_CONFIRM_TESTNET_SPEND=yes \
npm run partner:check
```

Use `consumeX402Testnet<T>()` when the agent needs a typed paid body and must validate that data
before acting. `payQuotedX402Testnet()` remains supported for compatibility; both call the same
protected quoted-payment endpoint.

Without `ACM_CONFIRM_TESTNET_SPEND=yes`, the partner check packs and externally installs the SDK,
then performs only the public CDP merchant lookup. It writes a redacted acceptance report.
`ACM_GATEWAY_URL` identifies the protected buyer gateway. The partner check intentionally pins the
canonical market-risk resource and must not be repurposed for another priced route. Never set the
gateway variable to a wallet private key.

On 15 July 2026, the funded ACM payer completed the News Pulse purchase. The Base Sepolia receipt has status `1`:

- AI News Pulse: [`0x160b…fe1d`](https://sepolia.basescan.org/tx/0x160b9fc0216a3dbb1eb1582acf45603b308bfe217690ce26f5aebc265b4efe1d)

A later opt-in catalog smoke paid 14 query variants: latest/context/window news, liquidation
summary/buckets/clusters/flow, best/worst/largest/risk traders, a public trader profile and the
composite market-risk snapshot. All 14 returned live protected results. The CDP receiver catalog
currently returns all six canonical route forms.

## Mainnet boundary

`payQuotedX402` can target a mainnet challenge only when the protected gateway has a separate
mainnet payer, explicit network/asset/payee allowlists, durable budget/idempotency state and human
approval. Use `getMainnetWalletStatus` and `getMainnetWalletBalances` for public readiness checks.
Funding or enabling that payer remains a human action; the SDK never automates either one.

The main and dev seller paths are public through a dedicated Cloudflare Access application scoped only to `/api/x402/*`; neither parent site is bypassed. Use the main domain as the public default and the dev domain for staging tests.

## Client safety checklist

- Use a unique idempotency key per logical purchase.
- Keep the grant short-lived and limited to the exact domain/category and a low testnet cap.
- Inspect or log only redacted settlement metadata, never the payment signature.
- Treat denial, approval-required, and uncertain settlement as distinct states.
- Do not automatically retry a payment with a new idempotency key.
- Keep this example out of automated test and package lifecycle scripts.
