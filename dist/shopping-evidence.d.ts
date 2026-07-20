export type ShoppingSignalKind = "brand" | "category" | "color" | "size" | "price_band";
export interface ShoppingEvidenceSignal {
    kind: ShoppingSignalKind;
    value: string;
    evidenceCount: number;
    lastObservedMonth?: string;
}
export interface ShoppingEvidencePreview {
    source: "amazon_order_history_export" | "shopping_order_export";
    rowsProcessed: number;
    rowsSkipped: number;
    signals: ShoppingEvidenceSignal[];
    warnings: string[];
    privacy: {
        rawRowsRetained: false;
        rawProductTitlesUploaded: false;
        cookiesRead: false;
    };
}
export interface ShoppingEvidenceImportRequest {
    userId: string;
    source: ShoppingEvidencePreview["source"];
    rowsProcessed: number;
    signals: ShoppingEvidenceSignal[];
}
export interface ParseShoppingCsvOptions {
    source?: ShoppingEvidencePreview["source"];
    knownBrands?: string[];
    maxRows?: number;
}
export declare function parseShoppingOrderCsv(csv: string, options?: ParseShoppingCsvOptions): ShoppingEvidencePreview;
export declare function createShoppingEvidenceImportRequest(userId: string, preview: ShoppingEvidencePreview): ShoppingEvidenceImportRequest;
//# sourceMappingURL=shopping-evidence.d.ts.map