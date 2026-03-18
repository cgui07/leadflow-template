"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextareaField } from "@/components/forms/TextareaField";
import { Card, CardHeader, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  Home,
  MapPin,
  Maximize2,
  Sparkles,
  Trash2,
} from "lucide-react";

interface Property {
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
  createdAt: string;
}

function formatPrice(price: string | null) {
  if (!price) return null;
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function purposeVariant(purpose: string | null) {
  if (purpose === "venda") return "success" as const;
  if (purpose === "aluguel") return "info" as const;
  return "default" as const;
}

function purposeLabel(purpose: string | null) {
  if (purpose === "venda") return "Venda";
  if (purpose === "aluguel") return "Aluguel";
  return purpose ?? "";
}

function typeIcon(type: string | null) {
  if (type === "casa") return <Home size={14} />;
  return <Building2 size={14} />;
}

function PropertyCard({
  property,
  onDelete,
}: {
  property: Property;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remover este imóvel?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/properties/${property.id}`, { method: "DELETE" });
      onDelete(property.id);
    } finally {
      setDeleting(false);
    }
  }

  const location = [property.neighborhood, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  const price = formatPrice(property.price);

  return (
    <Card noPadding hoverable>
      <CardHeader className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {typeIcon(property.type)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-neutral-ink text-sm leading-snug">
              {property.title ?? "Imóvel sem título"}
            </div>
            {location && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral truncate">
                <MapPin size={11} />
                {location}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} />}
          loading={deleting}
          onClick={handleDelete}
          className="text-neutral-muted hover:text-danger shrink-0 -mr-1"
        />
      </CardHeader>

      <div className="px-5 py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {property.purpose && (
            <Badge variant={purposeVariant(property.purpose)} dot>
              {purposeLabel(property.purpose)}
            </Badge>
          )}
          {property.type && (
            <Badge variant="default">
              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            </Badge>
          )}
          {price && (
            <div className="ml-auto text-sm font-bold text-neutral-ink">
              {price}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral">
          {property.area && (
            <div className="flex items-center gap-1.5">
              <Maximize2 size={12} className="text-neutral-muted" />
              <div>{Number(property.area).toFixed(0)} m²</div>
            </div>
          )}
          {property.bedrooms !== null && (
            <div className="flex items-center gap-1.5">
              <BedDouble size={12} className="text-neutral-muted" />
              <div>{property.bedrooms} quarto{property.bedrooms !== 1 ? "s" : ""}</div>
            </div>
          )}
          {property.bathrooms !== null && (
            <div className="flex items-center gap-1.5">
              <Bath size={12} className="text-neutral-muted" />
              <div>{property.bathrooms} banheiro{property.bathrooms !== 1 ? "s" : ""}</div>
            </div>
          )}
          {property.parking_spots !== null && property.parking_spots > 0 && (
            <div className="flex items-center gap-1.5">
              <Car size={12} className="text-neutral-muted" />
              <div>{property.parking_spots} vaga{property.parking_spots !== 1 ? "s" : ""}</div>
            </div>
          )}
        </div>

        {property.description && (
          <div className="text-xs text-neutral leading-relaxed border-t border-neutral-pale pt-3">
            {property.description}
          </div>
        )}
      </div>

      {property.amenities.length > 0 && (
        <CardFooter className="px-5 py-3 flex flex-wrap gap-1.5">
          {property.amenities.map((a) => (
            <Badge key={a} variant="default" size="sm">
              {a}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}

export function PropertiesClient({
  initialProperties,
}: {
  initialProperties: Property[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao extrair dados do imóvel.");
        return;
      }

      setProperties((prev) => [data, ...prev]);
      setRawText("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <Card noPadding>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-semibold text-neutral-ink text-sm">Cadastrar imóvel por texto</div>
              <div className="text-xs text-neutral mt-0.5">
                Cole qualquer descrição — a IA extrai os dados automaticamente.
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 py-4 space-y-4">
          <TextareaField
            placeholder="Ex: Apartamento 3 quartos, 2 banheiros, 1 vaga, 90m², R$ 650.000, Moema - SP. Varanda gourmet, piscina, academia..."
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          {error && (
            <div className="text-xs text-danger">{error}</div>
          )}
        </div>

        <CardFooter className="px-6 py-4 flex justify-end">
          <Button
            onClick={handleExtract}
            loading={loading}
            disabled={rawText.trim().length < 10}
            icon={<Sparkles size={14} />}
          >
            {loading ? "Extraindo..." : "Extrair com IA"}
          </Button>
        </CardFooter>
      </Card>

      {properties.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-ink">Imóveis cadastrados</div>
            <Badge variant="default">{properties.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<Building2 size={22} />}
            title="Nenhum imóvel cadastrado"
            description="Cole a descrição de um imóvel acima e a IA estrutura os dados para você."
          />
        </Card>
      )}
    </div>
  );
}
