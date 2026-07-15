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

const DEFAULT_BRANDS = [
  "Adidas", "Amazon Basics", "Apple", "Asics", "Bose", "Columbia", "Garmin", "Google",
  "Hoka", "Ikea", "Lego", "Levi's", "Microsoft", "New Balance", "Nike", "Nintendo",
  "North Face", "Patagonia", "Puma", "Salomon", "Samsung", "Sony", "Under Armour",
];

const COLORS = [
  "black", "blue", "brown", "cream", "gold", "green", "grey", "gray", "navy", "orange",
  "pink", "purple", "red", "silver", "tan", "white", "yellow",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  footwear: ["trainer", "sneaker", "shoe", "boot", "sandal", "slipper"],
  clothing: ["shirt", "t-shirt", "trouser", "jeans", "jacket", "hoodie", "dress", "sock", "shorts"],
  electronics: ["headphone", "earbud", "laptop", "tablet", "monitor", "keyboard", "mouse", "charger"],
  outdoors: ["camping", "hiking", "cycling", "bicycle", "tent", "backpack", "outdoor"],
  home: ["kitchen", "bedding", "lamp", "furniture", "storage", "cookware"],
  books: ["paperback", "hardcover", "kindle", "book"],
  toys: ["lego", "toy", "puzzle", "board game"],
};

const SENSITIVE_TERMS = [
  "adult product", "contraceptive", "firearm", "gun accessory", "medical device", "medication",
  "pregnancy", "prescription", "religious", "sex toy", "sexual health", "weapon",
];

const HEADER_ALIASES = {
  title: ["product name", "product", "title", "item", "item title", "product title"],
  brand: ["brand", "manufacturer"],
  category: ["category", "product category"],
  color: ["color", "colour"],
  size: ["size", "product size"],
  price: ["item total", "total", "price", "purchase price", "item subtotal"],
  date: ["order date", "purchase date", "date"],
} as const;

export function parseShoppingOrderCsv(csv: string, options: ParseShoppingCsvOptions = {}): ShoppingEvidencePreview {
  if (new TextEncoder().encode(csv).byteLength > 5_000_000) {
    throw new Error("Shopping export is larger than the 5 MB local-import limit");
  }
  const rows = parseCsv(csv);
  if (rows.length < 2) {
    throw new Error("Shopping export must contain a header and at least one order row");
  }
  const headers = rows[0]!.map(normalizeHeader);
  const indexes = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([field, aliases]) => [field, headers.findIndex((header) => (aliases as readonly string[]).includes(header))]),
  ) as Record<keyof typeof HEADER_ALIASES, number>;
  if (indexes.title < 0 && indexes.brand < 0 && indexes.category < 0) {
    throw new Error("No supported product, brand, or category column was found");
  }

  const maxRows = Math.min(Math.max(options.maxRows ?? 2_000, 1), 5_000);
  const brands = [...DEFAULT_BRANDS, ...(options.knownBrands ?? [])]
    .map((brand) => brand.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const aggregate = new Map<string, ShoppingEvidenceSignal>();
  let rowsProcessed = 0;
  let rowsSkipped = 0;

  for (const row of rows.slice(1, maxRows + 1)) {
    const title = cell(row, indexes.title);
    const searchable = title.toLowerCase();
    if (!title && indexes.brand < 0 && indexes.category < 0) {
      rowsSkipped += 1;
      continue;
    }
    const sensitivityText = [title, cell(row, indexes.brand), cell(row, indexes.category)].join(" ").toLowerCase();
    if (SENSITIVE_TERMS.some((term) => sensitivityText.includes(term))) {
      rowsSkipped += 1;
      continue;
    }
    rowsProcessed += 1;
    const month = parseMonth(cell(row, indexes.date));
    const explicitBrand = safeLabel(cell(row, indexes.brand));
    const brand = explicitBrand || brands.find((candidate) => containsPhrase(searchable, candidate.toLowerCase()));
    if (brand) addSignal(aggregate, "brand", canonicalLabel(brand), month);

    const explicitCategory = safeLabel(cell(row, indexes.category));
    const category = explicitCategory || Object.entries(CATEGORY_KEYWORDS).find(([, terms]) => terms.some((term) => containsPhrase(searchable, term)))?.[0];
    if (category) addSignal(aggregate, "category", canonicalLabel(category), month);

    const explicitColor = safeLabel(cell(row, indexes.color));
    const color = explicitColor || COLORS.find((candidate) => containsPhrase(searchable, candidate));
    if (color) addSignal(aggregate, "color", color === "gray" ? "grey" : canonicalLabel(color), month);

    const explicitSize = safeLabel(cell(row, indexes.size));
    const size = explicitSize || extractSize(title);
    if (size) addSignal(aggregate, "size", size.toUpperCase(), month);

    const priceBand = toPriceBand(cell(row, indexes.price));
    if (priceBand) addSignal(aggregate, "price_band", priceBand, month);
  }

  const warnings: string[] = [];
  if (rows.length - 1 > maxRows) warnings.push(`Only the first ${maxRows} rows were processed locally.`);
  if (rowsSkipped) warnings.push(`${rowsSkipped} empty or potentially sensitive rows were excluded.`);
  if (!aggregate.size) warnings.push("No reusable shopping preferences could be derived from this export.");

  return {
    source: options.source ?? "shopping_order_export",
    rowsProcessed,
    rowsSkipped,
    signals: [...aggregate.values()].sort((a, b) => b.evidenceCount - a.evidenceCount || a.kind.localeCompare(b.kind)),
    warnings,
    privacy: { rawRowsRetained: false, rawProductTitlesUploaded: false, cookiesRead: false },
  };
}

export function createShoppingEvidenceImportRequest(userId: string, preview: ShoppingEvidencePreview): ShoppingEvidenceImportRequest {
  return { userId, source: preview.source, rowsProcessed: preview.rowsProcessed, signals: preview.signals };
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]!;
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field.trim()); field = ""; }
    else if (character === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
    else if (character !== "\r") field += character;
  }
  if (quoted) throw new Error("Shopping export contains an unterminated quoted field");
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows.filter((candidate) => candidate.some(Boolean));
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function cell(row: string[], index: number): string {
  return index >= 0 ? (row[index] ?? "").trim().slice(0, 512) : "";
}

function safeLabel(value: string): string | undefined {
  const clean = value.replace(/[<>]/g, "").trim().slice(0, 80);
  return clean && /^[\p{L}\p{N} &'().+/-]+$/u.test(clean) ? clean : undefined;
}

function canonicalLabel(value: string): string {
  return value.split(/\s+/).map((part) => part.length <= 3 && part === part.toUpperCase() ? part : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`).join(" ");
}

function containsPhrase(text: string, phrase: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(phrase)}([^a-z0-9]|$)`, "i").test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSize(title: string): string | undefined {
  const labelled = title.match(/\bsize\s*[:=-]?\s*(xs|s|m|l|xl|xxl|xxxl|\d{1,2}(?:\.5)?)\b/i)?.[1];
  if (labelled) return labelled;
  return title.match(/\b(XXXL|XXL|XL|XS)\b/i)?.[1];
}

function toPriceBand(raw: string): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.replace(/[^0-9,.-]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount < 0) return undefined;
  if (amount < 25) return "under_25";
  if (amount < 50) return "25_50";
  if (amount < 100) return "50_100";
  if (amount < 250) return "100_250";
  return "250_plus";
}

function parseMonth(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 7);
}

function addSignal(aggregate: Map<string, ShoppingEvidenceSignal>, kind: ShoppingSignalKind, value: string, month?: string): void {
  const key = `${kind}:${value.toLowerCase()}`;
  const current = aggregate.get(key);
  if (current) {
    current.evidenceCount += 1;
    if (month && (!current.lastObservedMonth || month > current.lastObservedMonth)) current.lastObservedMonth = month;
    return;
  }
  aggregate.set(key, { kind, value, evidenceCount: 1, ...(month ? { lastObservedMonth: month } : {}) });
}
