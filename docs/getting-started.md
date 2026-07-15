# Getting Started

## Choose a development mode

### Local reference mode

Use this to understand the lifecycle with synthetic data:

```bash
npm ci
npm run quickstart
```

The reference server keeps state in memory, has no authentication and is destroyed when the example exits. It is not the hosted product.

### Gateway mode

Use the SDK against an Agent Capability Middleware-compatible gateway:

```ts
import { AgentCapabilityClient } from "@agent-capability-middleware/sdk";

const acm = new AgentCapabilityClient(process.env.ACM_GATEWAY_URL!, {
  apiKey: process.env.ACM_API_KEY,
});
```

Keep gateway credentials on a server or in a protected workload environment. Do not embed a privileged API key in a public browser bundle.

## Minimum integration

1. Register the agent identity.
2. Ask the user to create or approve a narrow grant.
3. Request only the attribute or action required for the stated purpose.
4. Handle `allow`, `deny`, `requires_approval` and `payment_required` decisions explicitly.
5. Make revocation and activity history visible to the user.

```ts
const agent = await acm.registerAgent({ name: "Restaurant Finder" });
const grant = await acm.createGrant({
  userId: "user_123",
  agentId: agent.id,
  scopes: ["attributes.preferences.dietary_requirements.read"],
  expiresInSeconds: 900,
});

const result = await acm.getConfirmedAttribute(
  grant.id,
  "preferences.dietary_requirements",
  "restaurant_recommendation",
);
```

## Production checklist

- Authenticate both developer workload and end user.
- Bind the grant to the correct tenant, user and agent.
- Prefer short-lived grants and least-privilege scopes.
- Require explicit user approval for sensitive identity or payment actions.
- Never give an agent raw cookies, session tokens, identity documents or wallet keys.
- Record redacted allow and deny decisions.
- Test revocation and replay behavior before launch.
