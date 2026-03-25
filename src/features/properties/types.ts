export type PdfCategory = "BOOK" | "FLUXO" | "RENTABILIDADE" | "PRODUTO_PRONTO";

export const PDF_CATEGORIES: PdfCategory[] = [
  "BOOK",
  "FLUXO",
  "RENTABILIDADE",
  "PRODUTO_PRONTO",
];

export const PDF_CATEGORY_LABELS: Record<PdfCategory, string> = {
  BOOK: "Book",
  FLUXO: "Fluxo de Pagamento",
  RENTABILIDADE: "Rentabilidade",
  PRODUTO_PRONTO: "Produto Pronto",
};

export const PDF_CATEGORY_OPTIONS = PDF_CATEGORIES.map((c) => ({
  value: c,
  label: PDF_CATEGORY_LABELS[c],
}));

export function isValidPdfCategory(value: unknown): value is PdfCategory {
  return typeof value === "string" && PDF_CATEGORIES.includes(value as PdfCategory);
}

export function parsePdfEntries(raw: unknown): PdfEntry[] {
  if (Array.isArray(raw)) return raw as PdfEntry[];
  return [];
}

export interface PdfEntry {
  url: string;
  filename: string;
  size: number;
  category: PdfCategory;
}

export interface Property {
  id: string;
  raw_text: string;
  title: string | null;
  type: string | null;
  purpose: string | null;
  price: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  amenities: string[];
  description: string | null;
  pdfs: PdfEntry[];
  createdAt: string;
}
