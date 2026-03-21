export interface PdfEntry {
  url: string;
  filename: string;
  size: number;
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
