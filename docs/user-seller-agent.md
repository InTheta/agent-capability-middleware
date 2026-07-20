# User seller preview

The public SDK now includes a local, keyless preview of **Sell one capability**. It is deliberately narrower than a data marketplace.

## Try it

```bash
npx github:InTheta/agent-capability-middleware#main demo user-seller
```

The example creates one user-confirmed running-shoe purchase intent and evaluates a fixed-price request. It does not settle payment.

## Intended user experience

```text
Create ACM Agent
  -> import or enter one low-risk source
  -> review one minimum-disclosure projection
  -> explicitly confirm it
  -> choose Free / Paid / Ask / Deny
  -> add a Base USDC receiving address if Paid
  -> publish, view activity, or revoke
```

A normal user should eventually do this in a hosted web or signed desktop app. They should not need Node.js, YAML, x402 knowledge, a funded payer, a private-key environment variable, or a publicly reachable home server.

## What can be offered in the preview

- commerce intent;
- shopping preferences;
- food preferences; and
- travel preferences.

The helper requires explicit confirmation and rejects obvious raw, cookie, session, secret, card, passport, driving-licence, and private-key fields. Production will require stronger schema allowlists, classification, policy review, encryption, abuse controls, and independent security assessment.

## Economics

Users may choose:

- `free` for convenience;
- `paid` at a fixed USDC price;
- `ask` to approve every request; or
- `deny` to block access.

This is passive fulfilment, not guaranteed passive income. Installing ACM does not create requester demand. Fixed pricing comes before auctions, and the pilot should not expand until there is at least one genuine requester integration.

## Boundary with the buyer path

The user seller receives funds at their configured address. The buyer-side ACM gateway owns the separate protected payer and enforces the buyer’s grant. The public SDK owns neither key.
