# x402 Policy Binding Implementation Profile

Status: public draft; the reference server does not settle payments, while compatible protected ACM gateways have completed the profile on Base Sepolia testnet. Base mainnet support is implemented behind explicit funding, configuration and human-approval gates.

Version: 0.1

Related documentation: [`../docs/x402-integration.md`](../docs/x402-integration.md), [`../SECURITY.md`](../SECURITY.md)

Every payment authorization must bind policy to the exact paid resource.

Production x402 handling must preserve the protocol's versioned headers, represent money as atomic integer strings or database numeric values, reserve budget before signing and reconcile uncertain settlement.

The public SDK does not custody keys or sign x402 payloads. It sends a bounded payment intent to a protected ACM gateway. The gateway owns challenge validation, policy enforcement, signing, settlement and receipt persistence.

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

## Settlement-policy checks

For a quoted payment, the gateway must independently validate all of the following after receiving the seller challenge and again immediately before signing:

- Network is explicitly allowed by the grant.
- Asset contract, symbol and decimals exactly match an allowed asset tuple.
- `payTo` is explicitly allowlisted; wildcard payees are forbidden on mainnet.
- Resource URL, method and request body match the user's authorized intent.
- The re-quoted resource, amount, network, asset and payee have not changed.
- The idempotency key is atomically reserved before signing.
- Per-request and daily budgets are atomically reserved before signing.
- Mainnet is globally enabled only for a controlled execution window.
- Mainnet settlement has an explicit, unexpired human approval when the grant requires it.

## Mainnet safety profile

The current compatibility profile is intentionally narrow:

- Base mainnet only (`eip155:8453`).
- Native Base USDC only, using the configured exact contract address.
- A separate mainnet payer key from all testnet wallets.
- The payer key remains in a protected server-side file or secret manager and is never returned through the API.
- Read-only wallet status and balance endpoints may be exposed to an authenticated operator; private material may not.
- Mainnet remains disabled until the operator funds the dedicated payer and deliberately enables the controlled test window.

This profile can be extended later, but adding another network or asset is a policy and threat-model change rather than a permissive fallback.
