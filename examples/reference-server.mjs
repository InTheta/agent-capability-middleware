import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.PORT ?? 18789);
const agents = new Map();
const grants = new Map();
const candidates = new Map();
const attributes = new Map();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
    const body = request.method === "POST" ? await readJson(request) : undefined;

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, { ok: true, mode: "non_production_reference" });
    }

    if (request.method === "POST" && url.pathname === "/v1/agents/register") {
      const agent = {
        id: body.id ?? `agent_${randomUUID()}`,
        developerId: body.developerId,
        name: body.name,
        publicKey: body.publicKey,
        redirectUris: body.redirectUris ?? [],
        allowedOrigins: body.allowedOrigins ?? [],
        reputationScore: body.reputationScore,
        metadata: body.metadata ?? {},
        createdAt: new Date().toISOString(),
      };
      agents.set(agent.id, agent);
      return json(response, 201, agent);
    }

    if (request.method === "GET" && url.pathname === "/v1/agents") {
      return json(response, 200, [...agents.values()]);
    }

    if (request.method === "POST" && url.pathname === "/v1/imports/shopping-evidence") {
      const created = [];
      for (const [kind, attribute] of [
        ["brand", "preferences.shopping.brands"],
        ["category", "preferences.shopping.categories"],
        ["color", "preferences.shopping.colors"],
        ["size", "preferences.shopping.sizes"],
        ["price_band", "preferences.shopping.price_bands"],
      ]) {
        const values = body.signals.filter((signal) => signal.kind === kind).map((signal) => signal.value);
        if (!values.length) continue;
        const candidate = {
          id: `candidate_${randomUUID()}`,
          userId: body.userId,
          attribute,
          proposedValue: [...new Set(values)],
          confidence: 0.8,
          explanation: `Derived locally from ${body.rowsProcessed} shopping rows`,
          status: "pending_review",
        };
        candidates.set(candidate.id, candidate);
        created.push(candidate);
      }
      return json(response, 201, {
        memory: snapshot(body.userId),
        summary: {
          source: body.source,
          rowsProcessed: body.rowsProcessed,
          acceptedSignals: body.signals.length,
          candidatesCreated: created.length,
          rawEvidenceStored: false,
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/grants") {
      const grant = {
        id: `grant_${randomUUID()}`,
        userId: body.userId ?? "user_demo",
        agentId: body.agentId ?? "agent_demo",
        scopes: body.scopes ?? [],
        deniedScopes: body.deniedScopes ?? [],
        expiresAt: new Date(Date.now() + Number(body.expiresInSeconds ?? 3600) * 1_000).toISOString(),
      };
      grants.set(grant.id, grant);
      return json(response, 201, grant);
    }

    const confirmMatch = url.pathname.match(/^\/v1\/candidates\/([^/]+)\/confirm$/);
    if (request.method === "POST" && confirmMatch) {
      const candidate = candidates.get(decodeURIComponent(confirmMatch[1]));
      if (!candidate || candidate.userId !== body.userId) return json(response, 404, { reason: "candidate_not_found" });
      candidate.status = "confirmed";
      attributes.set(`${candidate.userId}:${candidate.attribute}`, {
        id: `attribute_${randomUUID()}`,
        userId: candidate.userId,
        attribute: candidate.attribute,
        value: candidate.proposedValue,
        provenance: "user_confirmed",
        version: 1,
      });
      return json(response, 200, snapshot(candidate.userId));
    }

    const revokeMatch = url.pathname.match(/^\/v1\/grants\/([^/]+)\/revoke$/);
    if (request.method === "POST" && revokeMatch) {
      const grant = grants.get(decodeURIComponent(revokeMatch[1]));
      if (!grant) return json(response, 404, { reason: "grant_not_found" });
      grant.revokedAt = new Date().toISOString();
      return json(response, 200, grant);
    }

    const attributeMatch = url.pathname.match(/^\/v1\/context\/attributes\/(.+)$/);
    if (request.method === "GET" && attributeMatch) {
      const attribute = decodeURIComponent(attributeMatch[1]);
      const grant = grants.get(String(request.headers["x-grant-id"] ?? ""));
      if (!grant) return json(response, 200, { decision: "deny", reason: "grant_not_found" });
      if (grant.revokedAt) return json(response, 200, { decision: "deny", reason: "grant_revoked" });
      if (new Date(grant.expiresAt).getTime() <= Date.now()) return json(response, 200, { decision: "deny", reason: "grant_expired" });
      if (grant.deniedScopes.some((scope) => scopeMatches(scope, `attributes.${attribute}.read`))) {
        return json(response, 200, { decision: "deny", reason: "explicitly_denied" });
      }
      if (!grant.scopes.includes(`attributes.${attribute}.read`)) {
        return json(response, 200, { decision: "deny", reason: "scope_not_granted" });
      }
      const stored = attributes.get(`${grant.userId}:${attribute}`);
      if (!stored) return json(response, 404, { reason: "attribute_not_found" });
      return json(response, 200, {
        decision: "allow",
        purpose: request.headers["x-purpose"],
        data: { attribute: stored.attribute, value: stored.value, provenance: stored.provenance },
      });
    }

    return json(response, 404, { reason: "route_not_found" });
  } catch (error) {
    return json(response, 400, { reason: "invalid_request", message: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`REFERENCE_SERVER_READY http://127.0.0.1:${port}\n`);
});

function snapshot(userId) {
  return {
    userId,
    encryptedAtRest: false,
    storageMode: "memory",
    candidates: [...candidates.values()].filter((candidate) => candidate.userId === userId),
    attributes: [...attributes.values()].filter((attribute) => attribute.userId === userId),
  };
}

function scopeMatches(pattern, scope) {
  return pattern === scope || (pattern.endsWith(".*") && scope.startsWith(pattern.slice(0, -1)));
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
