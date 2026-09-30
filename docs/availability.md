# What is publicly usable?

Checked 30 September 2026. ACM is a developer preview, not a public hosted wallet service.

| Surface | Access | First step |
|---|---|---|
| Public CLI and SDK, `@agent-capability-middleware/sdk` | Public GitHub archive, Node 20+, no account or wallet for no-spend commands | [Test ACM](test-acm.md) |
| Public local buyer preview | Synthetic result validation; no gateway, grant mutation or payment | `acm demo buyer` |
| Paid SDK calls | Separately provisioned protected gateway and approved grant | [Private testnet checklist](design-partner-checklist.md) |
| ACM dashboard | Private operator demo; no public signup or tenant isolation | Ask your operator for assigned access |
| `@agent-permission-wallet/sdk` | Separate operator-supplied tarball with a different API | Use that package's bundled README, not this package's examples |

## One-command start

```sh
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.24.tar.gz doctor
```

This reads the live catalog, makes no payment and does not start a dashboard. Installation
does not create a hosted account, fund a payer, or authorize any spending. The current
distribution is the pinned GitHub archive; do not assume an npm registry release exists.

## Coverage is not the entire seller catalog

The pinned public preview includes typed recipes for nine route templates and four bounded
paid MCP tools. The live Omni seller and private dashboard currently advertise thirteen HTTP
templates and five paid MCP tools. The additional premarket and screenshot products are not
typed public-preview recipes. A successful nine-route `doctor` result means the supported
subset passed; it does not mean every seller endpoint or the private gateway was tested.

Use [the recipe reference](omni-agent-recipes.md) and [SDK API](sdk-api.md) for the released
contract. Do not substitute the operator package's mainnet methods into this SDK. Paid tests
need separate authorization; passing local tests is not proof of current live settlement,
secure multi-user hosting, or production readiness.
