import assert from "node:assert/strict";
import { CANONICAL_OMNI_ROUTES, runDesignPartnerCheck } from "../dist/index.js";

const receiver = "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457";
const listing = {
  resource: "https://omniterminal.app/api/x402/v1/market-risk/:symbol",
  type: "http",
  x402Version: 2,
  accepts: [{
    scheme: "exact",
    network: "eip155:84532",
    amount: "3000",
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    payTo: receiver,
  }],
};
const listings = CANONICAL_OMNI_ROUTES.map((resource) => resource === listing.resource
  ? listing
  : { ...listing, resource });

const noSpend = await runDesignPartnerCheck({
  fetch: async () => Response.json({
    x402Version: 2,
    payTo: receiver,
    resources: listings,
    pagination: { limit: 100, offset: 0, total: listings.length },
  }),
});
assert.equal(noSpend.mode, "no_spend");
assert.deepEqual(noSpend.catalog.canonicalRoutes, CANONICAL_OMNI_ROUTES);
assert.equal(noSpend.catalog.canonicalMarketRisk.amountUsdc, 0.003);
assert.equal(noSpend.secretsIncluded, false);
assert.equal("payment" in noSpend, false);

const requests = [];
const paid = await runDesignPartnerCheck({
  gatewayUrl: "https://gateway.example",
  apiKey: "never_report_this_key",
  confirmTestnetSpend: true,
  fetch: async (input, init) => {
    const url = new URL(String(input));
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({
      path: url.pathname,
      authorization: new Headers(init?.headers).get("authorization"),
      body,
    });
    if (url.hostname === "api.cdp.coinbase.com") {
      return Response.json({
        x402Version: 2,
        payTo: receiver,
        resources: listings,
        pagination: { limit: 100, offset: 0, total: listings.length },
      });
    }
    if (url.pathname === "/v1/agents/register") {
      return Response.json({
        id: "agent_partner",
        name: body.name,
        redirectUris: [],
        allowedOrigins: [],
        metadata: {},
        createdAt: "2026-07-20T00:00:00.000Z",
      });
    }
    if (url.pathname === "/v1/grants") {
      return Response.json({
        id: "grant_partner",
        userId: body.userId,
        agentId: body.agentId,
        scopes: body.scopes,
        deniedScopes: body.deniedScopes,
        expiresAt: "2026-07-20T00:15:00.000Z",
      });
    }
    if (url.pathname === "/v1/grants/grant_partner/revoke") {
      return Response.json({
        id: "grant_partner",
        userId: "user_demo",
        agentId: "agent_partner",
        scopes: ["x402.pay"],
        deniedScopes: [],
        expiresAt: "2026-07-20T00:15:00.000Z",
        revokedAt: "2026-07-20T00:01:00.000Z",
      });
    }
    if (url.pathname === "/v1/pay/x402/testnet/quoted") {
      const priorPayments = requests.filter((request) => request.path === url.pathname).length;
      return priorPayments === 1
        ? Response.json({
            decision: "paid",
            status: 200,
            receiptId: "0xpublic_receipt",
            auditEventId: "evt_paid",
            resourceBody: {
              schema: "market_risk_snapshot.v1",
              freshness: { status: "fresh" },
            },
          })
        : Response.json({
            decision: "deny",
            reason: "grant_revoked",
            auditEventId: "evt_denied",
          });
    }
    return Response.json({ reason: "unexpected_path" }, { status: 404 });
  },
});
assert.equal(paid.mode, "paid_testnet");
assert.equal(paid.payment?.receiptId, "0xpublic_receipt");
assert.equal(paid.revocation?.secondSettlementCreated, false);
assert.doesNotMatch(JSON.stringify(paid), /never_report_this_key/);
assert.ok(requests.some((request) => request.authorization === "Bearer never_report_this_key"));
assert.equal(requests.filter((request) => request.path === "/v1/pay/x402/testnet/quoted").length, 2);

console.log("DESIGN_PARTNER_V3_VERIFICATION_OK");
