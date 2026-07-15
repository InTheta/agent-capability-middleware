# Audit Log Implementation Profile

Status: public draft

Version: 0.1

Related documentation: [`../docs/architecture.md`](../docs/architecture.md), [`../SECURITY.md`](../SECURITY.md)

Audit events are append-only records of policy decisions and payment actions.

This profile describes a minimum interoperable event shape. Production audit work must use durable, redacted and versioned schemas with an integrity mechanism appropriate to the deployment.

```json
{
  "id": "evt_123",
  "created_at": "2026-07-09T10:33:12Z",
  "user_id": "user_demo",
  "agent_id": "agent_research_demo",
  "grant_id": "grant_123",
  "action": "x402.pay",
  "resource": "https://api.example.com/premium/orderbook/BTC-USD",
  "decision": "allow",
  "reason": "within_scope_and_policy",
  "amount": 0.01,
  "currency": "USDC",
  "metadata": {
    "category": "market_data",
    "idempotency_key": "idem_001"
  }
}
```

## Requirements

- Log allowed and denied decisions.
- Include enough context for user review.
- Do not store raw secrets.
- Do not store capability tokens, payment signatures, private keys, seed phrases, raw vault values, or provider payloads.
- Prefer opaque identifiers and hashes for sensitive resources in production.
