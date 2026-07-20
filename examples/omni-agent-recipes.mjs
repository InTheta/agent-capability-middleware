import {
  createOmniPaymentRequest,
  createOmniRecipeGrant,
  listOmniAgentRecipes,
} from "@agent-capability-middleware/sdk";

const recipes = listOmniAgentRecipes();
const selected = recipes.filter(({ kind }) =>
  ["hourly_market_briefing", "traders", "liquidations", "market_risk"].includes(kind)
);
const grant = createOmniRecipeGrant("agent_example", selected, {
  userId: "user_example",
  expiresInSeconds: 900,
});
const requests = selected.map((recipe, index) => ({
  recipe: recipe.label,
  schema: recipe.schema,
  priceUsdc: recipe.priceUsdc,
  request: createOmniPaymentRequest("grant_created_by_gateway", recipe, `logical_request_${index + 1}`),
}));

console.log(JSON.stringify({
  mode: "request_plan_only",
  grant,
  requests,
  paid: false,
  privateKeyUsed: false,
  note: "Submit the grant to a protected ACM gateway, then consume only the recipes the user approved.",
}, null, 2));
console.log("OMNI_AGENT_RECIPES_NO_SPEND_OK");
