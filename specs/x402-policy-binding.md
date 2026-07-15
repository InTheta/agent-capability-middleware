# x402 Policy Binding Implementation Profile

Status: public draft; the reference server does not settle payments, while compatible protected ACM gateways have completed the profile on Base Sepolia testnet

Version: 0.1

Related documentation: [`../docs/x402-integration.md`](../docs/x402-integration.md), [`../SECURITY.md`](../SECURITY.md)

Every payment authorization must bind policy to the exact paid resource.

Production x402 handling must preserve the protocol's versioned headers, represent money as atomic integer strings or database numeric values, reserve budget before signing and reconcile uncertain settlement.

## Required payment request fields

```json
{
  "payment_id": "payreq_123",
  "amount_atomic": "10000",
  "currency": "USDC",
  "network": "base-sepolia",
  "pay_to": "0xabc",
  "resource": "https://api.example.com/premium/orderbook/BTC-USD",
  "resource_hash": "sha256:...",
  "category": "market_data",
  "expires_at": "2026-07-09T12:00:00Z"
}
```

## MVP checks

- Grant is active.
- Grant has `x402.pay`.
- Payment category is allowed.
- Resource domain is allowed.
- Currency matches spend policy.
- Amount is below per-request cap.
- Daily spend remains below cap.
- Idempotency key has not been used for a different request.
- Payment proof is single-use.
- Proof resource and hash match the resource being accessed.
