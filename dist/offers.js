const unsafeKeys = /(cookie|session|password|passcode|private.?key|secret|card|passport|driver.?licen[cs]e|raw)/i;
const lowRiskUserCapabilities = [
    "commerce.intent.",
    "preferences.shopping.",
    "preferences.food.",
    "preferences.travel.",
];
export function createDeveloperServiceOffer(request) {
    requireText(request.developerId, "developerId");
    requireText(request.endpoint, "endpoint");
    const endpoint = new URL(request.endpoint);
    if (!/^https?:$/.test(endpoint.protocol))
        throw new TypeError("endpoint must use HTTP or HTTPS");
    validateTerms(request.terms);
    return baseOffer({
        ...request,
        publisherKind: "developer",
        publisherId: request.developerId,
        endpoint: endpoint.toString(),
        provenance: "developer_asserted",
    });
}
export function createUserCapabilityOffer(request) {
    requireText(request.userId, "userId");
    if (!request.confirmedByUser)
        throw new TypeError("A user capability must be explicitly confirmed before publication");
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
export function evaluateCapabilityRequest(offer, request) {
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
        const amountUsdc = offer.terms.priceUsdc;
        if (request.maximumPriceUsdc !== undefined && amountUsdc > request.maximumPriceUsdc) {
            return { decision: "deny", offerId: offer.id, reason: "price_exceeds_limit" };
        }
        return {
            decision: "payment_required",
            offerId: offer.id,
            amountUsdc,
            payTo: offer.terms.payTo,
            network: offer.terms.network,
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
    offers = new Map();
    publish(offer) {
        if (this.offers.has(offer.id))
            throw new TypeError(`Offer ${offer.id} already exists`);
        const copy = structuredClone(offer);
        this.offers.set(copy.id, copy);
        return structuredClone(copy);
    }
    list(filter = {}) {
        return [...this.offers.values()]
            .filter((offer) => !filter.publisherKind || offer.publisherKind === filter.publisherKind)
            .filter((offer) => !filter.capability || offer.capability.includes(filter.capability))
            .map((offer) => structuredClone(offer));
    }
    request(request) {
        const offer = this.offers.get(request.offerId);
        return offer
            ? evaluateCapabilityRequest(offer, request)
            : { decision: "deny", offerId: request.offerId, reason: "offer_not_found" };
    }
}
function baseOffer(request) {
    for (const [name, value] of [["name", request.name], ["description", request.description], ["capability", request.capability], ["purpose", request.purpose]]) {
        requireText(value, name);
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
function validateTerms(terms) {
    if (terms.policy !== "paid")
        return;
    if (!Number.isFinite(terms.priceUsdc) || terms.priceUsdc <= 0) {
        throw new TypeError("Paid offers require a positive priceUsdc");
    }
    if (!terms.payTo || !/^0x[0-9a-fA-F]{40}$/.test(terms.payTo)) {
        throw new TypeError("Paid offers require an EVM payTo address");
    }
    if (!terms.network)
        throw new TypeError("Paid offers require a supported network");
}
function assertMinimumDisclosure(value, path = "projection") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        if (path === "projection")
            throw new TypeError("projection must be an object");
        return;
    }
    for (const [key, child] of Object.entries(value)) {
        if (unsafeKeys.test(key))
            throw new TypeError(`Unsafe field is not allowed in a user capability: ${path}.${key}`);
        assertMinimumDisclosure(child, `${path}.${key}`);
    }
}
function requireText(value, name) {
    if (typeof value !== "string" || !value.trim())
        throw new TypeError(`${name} is required`);
}
