# Daily use cases

ACM is useful when an agent needs a fact, tool, or payment authority that should not be copied into the agent’s permanent memory.

## Personal shopper

The user confirms a shoe-size band, budget band, and preferred brands once. A shopping agent requests only those fields for `find_running_shoes`, with session-only retention. A merchant may return products for free or pay for a confirmed purchase-intent projection.

**Benefit:** fewer repeated questions, less form filling, no raw order history, and a clear revoke button.

## Travel assistant

The agent receives departure airport, travel dates, and an `identity_verified` or `passport_valid_for_trip` attestation from a future trusted provider. It does not receive the passport image or number. It can separately buy current disruption data through x402.

**Benefit:** the travel agent gets a reliable answer and fresh data without becoming another identity silo.

## Restaurant assistant

The user allows dietary requirements and coarse location for `find_restaurant`, but denies exact GPS and any unrelated purpose.

**Benefit:** better recommendations with minimum disclosure and purpose-bound access.

## Delivery agent

The service asks for `delivery_area` while comparing options. The exact address is released only to the chosen fulfilment service at checkout and only for the order session.

**Benefit:** services can quote accurately without every comparison site storing a home address.

## Trading or treasury agent

The agent buys a fresh market-risk snapshot, enriched news window, liquidation map, or public trader profile from a developer API. ACM rejects changed payment terms, stale output, overspend, replay, or a revoked grant.

**Benefit:** the agent receives current structured context, while the user keeps custody and a bounded budget.

## Research agent

The primary agent discovers a specialist paid service, requests one exact result, and records why it was bought. The user or business can later audit the result, price, payee, and purpose.

**Benefit:** specialist data becomes composable without distributing one unrestricted corporate wallet across agents.

## User-side data licensing

A user publishes `commerce.intent.running_shoes`, not their browsing history. The offer contains a confirmed projection, policy, purpose, retention, price, and receiving address. A requester can accept the fixed terms, trigger approval, or be denied.

**Benefit:** the user controls the disclosure and can optionally receive value. This remains an experiment: installing ACM does not guarantee demand or earnings.

## Developer-side API monetization

A developer publishes a weather, news, fraud, research, market, or compute endpoint with an x402 price. ACM lets buyer agents discover it and pay only when a matching grant permits the exact request.

**Benefit:** no subscription signup or long-lived buyer API key is required for each agent-to-service relationship.

## Why agents prefer this interface

1. Structured capabilities reduce hallucination and ambiguity.
2. Confirmed or attested facts are more useful than scraped guesses.
3. Freshness metadata prevents acting on stale paid data.
4. Purpose, retention, and audience are machine-readable.
5. Fixed budgets prevent accidental unlimited spending.
6. One grant can be revoked without rotating every downstream credential.
7. Audit receipts make autonomous actions explainable to users and businesses.
