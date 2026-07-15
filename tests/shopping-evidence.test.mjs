import test from "node:test";
import assert from "node:assert/strict";
import {
  AgentCapabilityClient,
  createShoppingEvidenceImportRequest,
  listCdpX402MerchantResources,
  parseShoppingOrderCsv,
  searchCdpX402Bazaar,
} from "@agent-capability-middleware/sdk";

test("shopping evidence is minimized locally", () => {
  const csv = [
    "Order Date,Product Name,Item Total",
    '2026-06-12,"Nike Air Zoom trainer, black, size 10",89.99',
    '2026-05-01,"Nike running shoe blue size 10",74.00',
    '2026-04-04,"Patagonia hiking jacket XL",149.00',
    '2026-03-02,"Prescription medication",15.00',
  ].join("\n");
  const preview = parseShoppingOrderCsv(csv, { source: "amazon_order_history_export" });
  const request = createShoppingEvidenceImportRequest("user_test", preview);

  assert.equal(preview.rowsProcessed, 3);
  assert.equal(preview.rowsSkipped, 1);
  assert.deepEqual(preview.privacy, {
    rawRowsRetained: false,
    rawProductTitlesUploaded: false,
    cookiesRead: false,
  });
  assert.ok(preview.signals.some((signal) => signal.kind === "brand" && signal.value === "Nike" && signal.evidenceCount === 2));
  assert.doesNotMatch(JSON.stringify(request), /Air Zoom|Prescription medication/);
});

test("sensitive-only evidence produces no reusable signal", () => {
  const preview = parseShoppingOrderCsv(
    "Order Date,Product Name,Item Total\n2026-07-01,Prescription medication,15.00",
  );
  assert.equal(preview.rowsProcessed, 0);
  assert.equal(preview.rowsSkipped, 1);
  assert.deepEqual(preview.signals, []);
});

test("client applies the configured workload credential", async () => {
  let authorization;
  const client = new AgentCapabilityClient("https://gateway.example.com/", {
    apiKey: "test_api_key",
    fetch: async (_input, init) => {
      authorization = new Headers(init?.headers).get("authorization");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  await client.listAgents();
  assert.equal(authorization, "Bearer test_api_key");
});

test("quoted x402 payment delegates exact policy metadata to the gateway", async () => {
  let captured;
  const client = new AgentCapabilityClient("https://gateway.example.com", {
    fetch: async (input, init) => {
      captured = { url: String(input), method: init?.method, body: JSON.parse(String(init?.body)) };
      return Response.json({ decision: "allow", settlement: { transaction: "0xtest" } });
    },
  });
  const request = {
    grantId: "grant_test",
    resourceUrl: "https://dev.omniterminal.app/api/x402/v1/news/BTC?limit=5",
    category: "market_intelligence",
    purpose: "test_news",
    idempotencyKey: "pay_test_001",
  };

  await client.payQuotedX402Testnet(request);

  assert.deepEqual(captured, {
    url: "https://gateway.example.com/v1/pay/x402/testnet/quoted",
    method: "POST",
    body: request,
  });
});

test("CDP Bazaar helpers use public discovery endpoints without credentials", async () => {
  const requests = [];
  const mockFetch = async (input, init) => {
    requests.push({ url: String(input), authorization: new Headers(init?.headers).get("authorization") });
    return Response.json({ x402Version: 2, resources: [], partialResults: false, pagination: { limit: 25, offset: 0, total: 0 }, payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457" });
  };

  await searchCdpX402Bazaar({
    query: "crypto market news",
    network: "eip155:84532",
    payTo: "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
    limit: 5,
  }, mockFetch);
  await listCdpX402MerchantResources(
    "0x733f40A4FA0cd13d59aBADE04b9eD2e9acAc6457",
    { limit: 100 },
    mockFetch,
  );

  assert.match(requests[0].url, /\/discovery\/search\?/);
  assert.match(requests[0].url, /query=crypto\+market\+news/);
  assert.match(requests[1].url, /\/discovery\/merchant\?/);
  assert.equal(requests[0].authorization, null);
  assert.equal(requests[1].authorization, null);
});
