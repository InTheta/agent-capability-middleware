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
export type CapabilityDecision = {
    decision: "allow";
    offerId: string;
    data?: Record<string, unknown>;
    endpoint?: string;
    retention: CapabilityOffer["retention"];
} | {
    decision: "payment_required";
    offerId: string;
    amountUsdc: number;
    payTo: string;
    network: string;
    resource?: string;
} | {
    decision: "requires_user_approval";
    offerId: string;
    reason: "policy_ask";
} | {
    decision: "deny";
    offerId: string;
    reason: "policy_deny" | "purpose_mismatch" | "audience_mismatch" | "price_exceeds_limit" | "offer_not_found";
};
export declare function createDeveloperServiceOffer(request: DeveloperServiceOfferRequest): CapabilityOffer;
export declare function createUserCapabilityOffer(request: UserCapabilityOfferRequest): CapabilityOffer;
export declare function evaluateCapabilityRequest(offer: CapabilityOffer, request: CapabilityRequest): CapabilityDecision;
export declare class LocalCapabilityDirectory {
    private readonly offers;
    publish(offer: CapabilityOffer): CapabilityOffer;
    list(filter?: {
        publisherKind?: OfferPublisherKind;
        capability?: string;
    }): CapabilityOffer[];
    request(request: CapabilityRequest): CapabilityDecision;
}
//# sourceMappingURL=offers.d.ts.map