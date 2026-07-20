export type OfferPolicy = "free" | "paid" | "ask" | "deny";
export type OfferPublisherKind = "user" | "developer";

export interface OfferTerms {
  policy: OfferPolicy;
  priceUsdc?: number;
  payTo?: string;
  network?: "eip155:84532" | "eip155:8453";
}

export interface CapabilityOffer {
  id: string;
  publisherKind: OfferPublisherKind;
  publisherId: string;
  name: string;
  description: string;
  capability: string;
  purpose: string;
  audience: string[];
  retention: "none" | "session" | "24h";
  terms: OfferTerms;
  endpoint?: string;
  projection?: Record<string, unknown>;
  provenance: "developer_asserted" | "user_confirmed";
  experimental: boolean;
  createdAt: string;
}

export interface DeveloperServiceOfferRequest {
  id?: string;
  developerId: string;
  name: string;
  description: string;
  capability: string;
  purpose: string;
  endpoint: string;
  audience?: string[];
  retention?: CapabilityOffer["retention"];
  terms: OfferTerms;
}

export interface UserCapabilityOfferRequest {
  id?: string;
  userId: string;
  name: string;
  description: string;
  capability: string;
  purpose: string;
  projection: Record<string, unknown>;
  confirmedByUser: boolean;
  audience?: string[];
  retention?: CapabilityOffer["retention"];
  terms: OfferTerms;
}

export interface CapabilityRequest {
  offerId: string;
  requesterId: string;
  purpose: string;
  maximumPriceUsdc?: number;
}

export type CapabilityDecision =
  | { decision: "allow"; offerId: string; data?: Record<string, unknown>; endpoint?: string; retention: CapabilityOffer["retention"] }
  | { decision: "payment_required"; offerId: string; amountUsdc: number; payTo: string; network: string; resource?: string }
  | { decision: "requires_user_approval"; offerId: string; reason: "policy_ask" }
  | { decision: "deny"; offerId: string; reason: "policy_deny" | "purpose_mismatch" | "audience_mismatch" | "price_exceeds_limit" | "offer_not_found" };

const unsafeKeys = /(cookie|session|password|passcode|private.?key|secret|card|passport|driver.?licen[cs]e|raw)/i;
const lowRiskUserCapabilities = [
  "commerce.intent.",
  "preferences.shopping.",
  "preferences.food.",
  "preferences.travel.",
];

export function createDeveloperServiceOffer(request: DeveloperServiceOfferRequest): CapabilityOffer {
  requireText(request.developerId, "developerId");
  requireText(request.endpoint, "endpoint");
  const endpoint = new URL(request.endpoint);
  if (!/^https?:$/.test(endpoint.protocol)) throw new TypeError("endpoint must use HTTP or HTTPS");
  validateTerms(request.terms);
  return baseOffer({
    ...request,
    publisherKind: "developer",
    publisherId: request.developerId,
    endpoint: endpoint.toString(),
    provenance: "developer_asserted",
  });
}

export function createUserCapabilityOffer(request: UserCapabilityOfferRequest): CapabilityOffer {
  requireText(request.userId, "userId");
  if (!request.confirmedByUser) throw new TypeError("A user capability must be explicitly confirmed before publication");
  if (!lowRiskUserCapabilities.some((prefix) => request.capability.startsWith(prefix))) {
    throw new TypeError("The preview permits only low-risk commerce, shopping, food, or travel capabilities");
  }
  assertMinimumDisclosure(request.projection);
  validateTerms(request.terms);
  return baseOffer({
    ...request,
    publisherKind: "user",
    publisherId: request.userId,
    projection: structuredClone(request.projection),
    provenance: "user_confirmed",
  });
}

export function evaluateCapabilityRequest(offer: CapabilityOffer, request: CapabilityRequest): CapabilityDecision {
  if (request.purpose !== offer.purpose) {
    return { decision: "deny", offerId: offer.id, reason: "purpose_mismatch" };
  }
  if (!offer.audience.includes("*") && !offer.audience.includes(request.requesterId)) {
    return { decision: "deny", offerId: offer.id, reason: "audience_mismatch" };
  }
  if (offer.terms.policy === "deny") {
    return { decision: "deny", offerId: offer.id, reason: "policy_deny" };
  }
  if (offer.terms.policy === "ask") {
    return { decision: "requires_user_approval", offerId: offer.id, reason: "policy_ask" };
  }
  if (offer.terms.policy === "paid") {
    const amountUsdc = offer.terms.priceUsdc as number;
    if (request.maximumPriceUsdc !== undefined && amountUsdc > request.maximumPriceUsdc) {
      return { decision: "deny", offerId: offer.id, reason: "price_exceeds_limit" };
    }
    return {
      decision: "payment_required",
      offerId: offer.id,
      amountUsdc,
      payTo: offer.terms.payTo as string,
      network: offer.terms.network as string,
      ...(offer.endpoint ? { resource: offer.endpoint } : {}),
    };
  }
  return {
    decision: "allow",
    offerId: offer.id,
    ...(offer.projection ? { data: structuredClone(offer.projection) } : {}),
    ...(offer.endpoint ? { endpoint: offer.endpoint } : {}),
    retention: offer.retention,
  };
}

export class LocalCapabilityDirectory {
  private readonly offers = new Map<string, CapabilityOffer>();

  publish(offer: CapabilityOffer): CapabilityOffer {
    if (this.offers.has(offer.id)) throw new TypeError(`Offer ${offer.id} already exists`);
    const copy = structuredClone(offer);
    this.offers.set(copy.id, copy);
    return structuredClone(copy);
  }

  list(filter: { publisherKind?: OfferPublisherKind; capability?: string } = {}): CapabilityOffer[] {
    return [...this.offers.values()]
      .filter((offer) => !filter.publisherKind || offer.publisherKind === filter.publisherKind)
      .filter((offer) => !filter.capability || offer.capability.includes(filter.capability))
      .map((offer) => structuredClone(offer));
  }

  request(request: CapabilityRequest): CapabilityDecision {
    const offer = this.offers.get(request.offerId);
    return offer
      ? evaluateCapabilityRequest(offer, request)
      : { decision: "deny", offerId: request.offerId, reason: "offer_not_found" };
  }
}

interface BaseOfferInput {
  id?: string;
  name: string;
  description: string;
  capability: string;
  purpose: string;
  audience?: string[];
  retention?: CapabilityOffer["retention"];
  terms: OfferTerms;
  publisherKind: OfferPublisherKind;
  publisherId: string;
  provenance: CapabilityOffer["provenance"];
  endpoint?: string;
  projection?: Record<string, unknown>;
}

function baseOffer(request: BaseOfferInput): CapabilityOffer {
  for (const [name, value] of [["name", request.name], ["description", request.description], ["capability", request.capability], ["purpose", request.purpose]]) {
    requireText(value as string, name);
  }
  return {
    id: request.id ?? `offer_${globalThis.crypto.randomUUID()}`,
    publisherKind: request.publisherKind,
    publisherId: request.publisherId,
    name: request.name,
    description: request.description,
    capability: request.capability,
    purpose: request.purpose,
    audience: [...(request.audience ?? ["*"])],
    retention: request.retention ?? "none",
    terms: { ...request.terms },
    ...(request.endpoint ? { endpoint: request.endpoint } : {}),
    ...(request.projection ? { projection: structuredClone(request.projection) } : {}),
    provenance: request.provenance,
    experimental: true,
    createdAt: new Date().toISOString(),
  };
}

function validateTerms(terms: OfferTerms): void {
  if (terms.policy !== "paid") return;
  if (!Number.isFinite(terms.priceUsdc) || (terms.priceUsdc as number) <= 0) {
    throw new TypeError("Paid offers require a positive priceUsdc");
  }
  if (!terms.payTo || !/^0x[0-9a-fA-F]{40}$/.test(terms.payTo)) {
    throw new TypeError("Paid offers require an EVM payTo address");
  }
  if (!terms.network) throw new TypeError("Paid offers require a supported network");
}

function assertMinimumDisclosure(value: unknown, path = "projection"): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (path === "projection") throw new TypeError("projection must be an object");
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (unsafeKeys.test(key)) throw new TypeError(`Unsafe field is not allowed in a user capability: ${path}.${key}`);
    assertMinimumDisclosure(child, `${path}.${key}`);
  }
}

function requireText(value: string, name: string): void {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${name} is required`);
}
