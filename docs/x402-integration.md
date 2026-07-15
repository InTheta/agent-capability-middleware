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
