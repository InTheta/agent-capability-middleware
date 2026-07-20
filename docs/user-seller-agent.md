# Planned User-Side Seller Agent

This is an experimental next step, not a production SDK claim.

The first ACM release path is **Buy safely**: developers let an agent consume one exact x402 resource
through a bounded grant and a protected payer. After two external developers complete that flow
without assistance, ACM will pilot **Sell one capability** for users.

## One-way use

A user will be able to use ACM only as a seller. They will confirm one low-risk capability, choose a
standing policy and designate a Base USDC receiver. A matching `paid` request can be fulfilled while
the user is away; `ask` still requires their approval.

This is passive fulfilment, not guaranteed passive income. Installing ACM does not create buyer
demand. The pilot therefore requires one real requester integration before it expands.

## Intended user flow

```text
Create ACM Agent
  -> Sell one capability
  -> import or enter one source
  -> review one minimum-disclosure result
  -> choose Free / Paid / Ask / Deny
  -> connect a Base USDC receiver
  -> publish and retain a revoke button
```

Normal users will use a hosted web or signed desktop app. They should not need Node.js, YAML, x402
knowledge, a funded payer, a private-key environment variable or a publicly reachable home server.
The seller receives funds; a separate buyer-side ACM gateway owns payer custody.

The first capability is a synthetic/user-confirmed commerce intent. Raw cookies, session tokens,
identity documents, order rows, payment credentials and full-profile downloads remain outside the
contract. Fixed pricing comes before auctions.
