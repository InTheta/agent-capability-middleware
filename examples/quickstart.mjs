import { readFile } from "node:fs/promises";
import {
  AgentCapabilityApiError,
  AgentCapabilityClient,
  createShoppingEvidenceImportRequest,
  parseShoppingOrderCsv,
} from "@agent-capability-middleware/sdk";

const gatewayUrl = (process.env.ACM_GATEWAY_URL ?? "http://127.0.0.1:18789").replace(/\/$/, "");
const fixturePath = process.argv[2] ?? "amazon-orders-demo.csv";
const runId = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
const userId = `user_sdk_${runId}`;
const agentId = `agent_sdk_${runId}`;
const client = new AgentCapabilityClient(gatewayUrl);

const preview = parseShoppingOrderCsv(await readFile(fixturePath, "utf8"), {
  source: "amazon_order_history_export",
});
if (!preview.signals.length) throw new Error("No shopping signals were derived from the fixture");
if (preview.privacy.rawRowsRetained || preview.privacy.rawProductTitlesUploaded || preview.privacy.cookiesRead) {
  throw new Error("The local parser violated its privacy contract");
}

const imported = await client.importShoppingEvidence(createShoppingEvidenceImportRequest(userId, preview));
const brandsCandidate = imported.memory.candidates.find((candidate) => candidate.attribute === "preferences.shopping.brands");
if (!brandsCandidate) throw new Error("The import did not produce a shopping-brand candidate");

await client.registerAgent({
  id: agentId,
  developerId: "sdk_quickstart",
  name: "Public SDK Quickstart Agent",
  metadata: { example: "shopping_preference_lifecycle" },
});
const grant = await client.createGrant({
  userId,
  agentId,
  scopes: ["attributes.preferences.shopping.brands.read"],
  deniedScopes: ["cookies.*", "identity.*", "payment.*", "medical.*"],
  expiresInSeconds: 600,
});

let deniedBeforeConfirmation = false;
try {
  await client.getConfirmedAttribute(grant.id, "preferences.shopping.brands", "personalized_shopping_demo");
} catch (error) {
  deniedBeforeConfirmation = error instanceof AgentCapabilityApiError
    && error.status === 404
    && error.body?.reason === "attribute_not_found";
}
if (!deniedBeforeConfirmation) throw new Error("The pending candidate was unexpectedly readable");

await client.confirmCandidate(brandsCandidate.id, userId);
const allowed = await client.getConfirmedAttribute(
  grant.id,
  "preferences.shopping.brands",
  "personalized_shopping_demo",
);
if (allowed.decision !== "allow") throw new Error("Confirmed preference was not returned to the scoped agent");

await client.revokeGrant(grant.id);
const deniedAfterRevocation = await client.getConfirmedAttribute(
  grant.id,
  "preferences.shopping.brands",
  "personalized_shopping_demo",
);
if (deniedAfterRevocation.decision !== "deny") throw new Error("Revoked grant remained usable");

console.log(JSON.stringify({
  ok: true,
  gatewayUrl,
  localPrivacy: preview.privacy,
  rowsProcessedLocally: preview.rowsProcessed,
  minimizedSignalsSubmitted: preview.signals.length,
  rawEvidenceStored: imported.summary.rawEvidenceStored,
  candidateReadableBeforeConfirmation: false,
  confirmedAttribute: allowed.data?.attribute,
  confirmedValue: allowed.data?.value,
  revokedGrantDecision: deniedAfterRevocation.decision,
}, null, 2));
