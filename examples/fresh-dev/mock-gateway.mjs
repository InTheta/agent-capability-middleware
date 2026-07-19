import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const grants = new Map();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
    const body = request.method === "POST" ? await readJson(request) : {};

    if (request.method === "POST" && url.pathname === "/v1/agents/register") {
      return json(response, 201, {
        id: `agent_${randomUUID()}`,
        name: body.name,
        developerId: body.developerId,
        redirectUris: [],
        allowedOrigins: [],
        metadata: {},
        createdAt: new Date().toISOString(),
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/grants") {
      const grant = {
        id: `grant_${randomUUID()}`,
        userId: body.userId,
        agentId: body.agentId,
        scopes: body.scopes ?? [],
        deniedScopes: body.deniedScopes ?? [],
        expiresAt: new Date(Date.now() + Number(body.expiresInSeconds ?? 900) * 1_000).toISOString(),
      };
      grants.set(grant.id, grant);
      return json(response, 201, grant);
    }

    const revoke = url.pathname.match(/^\/v1\/grants\/([^/]+)\/revoke$/);
    if (request.method === "POST" && revoke) {
      const grant = grants.get(decodeURIComponent(revoke[1]));
      if (!grant) return json(response, 404, { reason: "grant_not_found" });
      grant.revokedAt = new Date().toISOString();
      return json(response, 200, grant);
    }

    if (request.method === "POST" && url.pathname === "/v1/pay/x402/testnet/quoted") {
      const grant = grants.get(body.grantId);
      if (!grant) return json(response, 200, { decision: "deny", reason: "grant_not_found" });
      if (grant.revokedAt) {
        return json(response, 200, {
          decision: "deny",
          reason: "grant_revoked",
          auditEventId: `evt_${randomUUID()}`,
        });
      }
      if (!grant.scopes.includes("x402.pay")) {
        return json(response, 200, { decision: "deny", reason: "scope_not_granted" });
      }
      return json(response, 200, {
        decision: "paid",
        status: 200,
        receiptId: "0xmock_base_sepolia_receipt",
        auditEventId: `evt_${randomUUID()}`,
        resourceBody: {
          schema: "market_risk_snapshot.v1",
          service: "mock.omni.market_risk_snapshot",
          symbol: "BTC",
          freshness: { status: "fresh", checkedAt: new Date().toISOString() },
          summary: "Synthetic clean-room result. No payment or external request occurred.",
        },
      });
    }

    return json(response, 404, { reason: "route_not_found" });
  } catch (error) {
    return json(response, 400, {
      reason: "invalid_request",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Mock gateway did not bind a TCP port");
  process.stdout.write(`MOCK_ACM_GATEWAY_READY http://127.0.0.1:${address.port}\n`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}
