# What is publicly usable?

Contract reviewed 15 October 2026 for preview.25. ACM is a developer preview, not a public hosted wallet service.

| Surface | Access | First step |
|---|---|---|
| Public CLI and SDK, `@agent-capability-middleware/sdk` | Public GitHub archive, Node 20+, no account or wallet for no-spend commands | [Test ACM](test-acm.md) |
| Public local buyer preview | Synthetic result validation; no gateway, grant mutation or payment | `acm demo buyer` |
| Paid SDK calls | Separately provisioned protected gateway and approved grant | [Private testnet checklist](design-partner-checklist.md) |
| ACM dashboard | Private operator demo; no public signup or tenant isolation | Ask your operator for assigned access |
| `@agent-permission-wallet/sdk` | Separate operator-supplied tarball with a different API | Use that package's bundled README, not this package's examples |

## One-command start

```sh
npx --yes https://github.com/InTheta/agent-capability-middleware/archive/refs/tags/v0.1.0-preview.25.tar.gz doctor
```

This reads the live catalog, makes no payment and does not start a dashboard. Installation
does not create a hosted account, fund a payer, or authorize any spending. The current
distribution is the pinned GitHub archive; do not assume an npm registry release exists.

## Coverage is not the entire seller catalog

The pinned public preview includes typed recipes for nine HTTP route templates and five bounded
paid MCP tools. The live Omni seller and private dashboard currently advertise thirteen HTTP
templates and five paid MCP tools. Premarket research is included in the paid MCP tool union; the premarket HTTP route
and three screenshot routes are not typed public-preview HTTP recipes. A successful nine-route `doctor` result means the supported
subset passed; it does not mean every seller endpoint or the private gateway was tested.

Use [the recipe reference](omni-agent-recipes.md) and [SDK API](sdk-api.md) for the released
contract. Do not substitute the operator package's mainnet methods into this SDK. Paid tests
need separate authorization; passing local tests is not proof of current live settlement,
secure multi-user hosting, or production readiness.


Preview.25 binds news recipes to 0.010 USDC and includes
`get_premarket_roundup` (0.100 USDC) in the five-tool paid MCP union. Preview.24
remains immutable with its historical news price and four-tool union; upgrade
before using the news recipe at the reviewed current price. Installation does
not grant authority or enable spending. No key enters the SDK.
