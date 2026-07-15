# Permission Manifest Implementation Profile

Status: public draft

Version: 0.1

Related documentation: [`../docs/architecture.md`](../docs/architecture.md), [`../docs/sdk-api.md`](../docs/sdk-api.md)

Permission manifests describe the authority a user grants to an agent.

This profile represents the preview grant shape. A production grant schema should add versioned resource/action URIs, a purpose registry, field projections, retention, audience, assurance, delegation constraints and decision obligations.

```yaml
version: "0.1"
agent:
  id: "agent_research_demo"
  name: "Research Agent Demo"

grant:
  user_id: "user_demo"
  expires_in: "24h"

allowed_scopes:
  - attributes.preferences.shopping.brands.read
  - x402.pay

denied_scopes:
  - trading.execute
  - wallet.transfer
  - location.precise.read

spend_policy:
  currency: "USDC"
  per_request_max: 0.05
  daily_max: 5.00
  approval_required_above: 1.00

resource_policy:
  allowed_categories:
    - market_data
  allowed_domains:
    - api.example.com
  denied_categories:
    - gambling
    - adult
    - medical
  denied_domains: []

security:
  require_idempotency_key: true
  require_resource_hash_binding: true
  max_token_ttl_seconds: 600

audit:
  log_allowed: true
  log_denied: true
```

Denied scopes are evaluated before allowed scopes. Wildcard denied scopes such as `medical.*` block any matching child scope even if that exact child appears in `allowed_scopes`.
