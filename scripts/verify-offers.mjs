import assert from "node:assert/strict";
import {
  createDeveloperServiceOffer,
  createUserCapabilityOffer,
  evaluateCapabilityRequest,
  LocalCapabilityDirectory,
} from "../dist/index.js";

const payTo = "0x1111111111111111111111111111111111111111";
const paid = createDeveloperServiceOffer({
  developerId: "developer_test",
  name: "Test API",
  description: "Test service",
  capability: "api.test.current",
  purpose: "test_purpose",
  endpoint: "https://example.com/x402/test",
  terms: { policy: "paid", priceUsdc: 0.01, payTo, network: "eip155:84532" },
});
assert.equal(evaluateCapabilityRequest(paid, {
  offerId: paid.id,
  requesterId: "agent_test",
  purpose: paid.purpose,
  maximumPriceUsdc: 0.02,
}).decision, "payment_required");
assert.equal(evaluateCapabilityRequest(paid, {
  offerId: paid.id,
  requesterId: "agent_test",
  purpose: paid.purpose,
  maximumPriceUsdc: 0.001,
}).decision, "deny");

assert.throws(() => createUserCapabilityOffer({
  userId: "user_test",
  name: "Unconfirmed",
  description: "Must fail",
  capability: "commerce.intent.shoes",
  purpose: "match_shoes",
  confirmedByUser: false,
  projection: { category: "shoes" },
  terms: { policy: "free" },
}), /explicitly confirmed/);
assert.throws(() => createUserCapabilityOffer({
  userId: "user_test",
  name: "Unsafe",
  description: "Must fail",
  capability: "commerce.intent.shoes",
  purpose: "match_shoes",
  confirmedByUser: true,
  projection: { rawOrderRows: [] },
  terms: { policy: "free" },
}), /Unsafe field/);

const directory = new LocalCapabilityDirectory();
const ask = directory.publish(createUserCapabilityOffer({
  userId: "user_test",
  name: "Shoe intent",
  description: "Confirmed minimum disclosure",
  capability: "commerce.intent.shoes",
  purpose: "match_shoes",
  confirmedByUser: true,
  projection: { category: "shoes", budgetBand: "GBP_50_100" },
  audience: ["merchant_agent"],
  terms: { policy: "ask" },
}));
assert.equal(directory.request({ offerId: ask.id, requesterId: "merchant_agent", purpose: ask.purpose }).decision, "requires_user_approval");
assert.deepEqual(directory.request({ offerId: ask.id, requesterId: "other_agent", purpose: ask.purpose }), {
  decision: "deny",
  offerId: ask.id,
  reason: "audience_mismatch",
});
assert.equal(directory.request({ offerId: ask.id, requesterId: "merchant_agent", purpose: "unrelated" }).decision, "deny");
assert.equal(directory.list({ publisherKind: "user" }).length, 1);

console.log("OFFER_POLICY_VERIFICATION_OK");
