# Capability Token Implementation Profile

Status: public draft; not implemented by the reference server

Version: 0.1

Related documentation: [`../docs/architecture.md`](../docs/architecture.md), [`../SECURITY.md`](../SECURITY.md)

This profile is deliberately format-neutral. A production capability should be asymmetric, audience-bound and short-lived, with key rotation, grant-version binding, revocation-epoch binding and optional proof of possession. Deployments should use mature signing libraries and managed keys rather than custom cryptography.

Future signed capability tokens should be short-lived and bound to:

- issuer
- user
- agent
- grant
- scope
- resource
- purpose
- nonce
- maximum uses
- expiry

Example payload:

```json
{
  "iss": "https://issuer.example.com",
  "sub": "agent:agent_research_demo",
  "user": "user:user_demo",
  "grant_id": "grant_123",
  "scope": "x402.pay",
  "resource": "https://api.example.com/premium/orderbook/BTC-USD",
  "purpose": "market_data_analysis",
  "max_uses": 1,
  "nonce": "nonce_123",
  "expires_at": "2026-07-09T12:30:00Z"
}
```

Production should use mature signing and key-management primitives rather than custom cryptography.

## MVP redemption checks

- token signature is valid,
- token has not expired,
- token ID exists server-side,
- token hash matches the issued token,
- token has not exceeded `max_uses`,
- requested scope matches the token scope,
- requested resource matches the token resource,
- requested purpose matches if supplied,
- underlying grant is still active,
- audit event is written for allow and deny outcomes.
