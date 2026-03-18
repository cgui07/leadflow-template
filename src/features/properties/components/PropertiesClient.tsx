"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileField } from "@/components/forms/FileField";
import { TextareaField } from "@/components/forms/TextareaField";
import { Card, CardHeader, CardFooter } from "@/components/ui/Card";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  FileText,
  FileUp,
  Home,
  MapPin,
  Maximize2,
  Sparkles,
  Trash2,
  X,
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
  pdf_url: string | null;
  pdf_filename: string | null;
  pdf_size: number | null;
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PropertyCard({
  property,
  onDelete,
  onPdfChange,
}: {
  property: Property;
  onDelete: (id: string) => void;
  onPdfChange: (
    id: string,
    pdf: {
      pdf_url: string | null;
      pdf_filename: string | null;
      pdf_size: number | null;
    },
  ) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDeleteClick() {
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await fetch(`/api/properties/${property.id}`, { method: "DELETE" });
      onDelete(property.id);
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("O arquivo excede o limite de 10MB.");
      return;
    }
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch(`/api/properties/${property.id}/pdf`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        onPdfChange(property.id, data);
      }
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePdfDelete() {
    setDeletingPdf(true);
    try {
      const res = await fetch(`/api/properties/${property.id}/pdf`, {
        method: "DELETE",
      });
      if (res.ok) {
        onPdfChange(property.id, {
          pdf_url: null,
          pdf_filename: null,
          pdf_size: null,
        });
      }
    } finally {
      setDeletingPdf(false);
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
          onClick={handleDeleteClick}
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
              <div>
                {property.bedrooms} quarto{property.bedrooms !== 1 ? "s" : ""}
              </div>
            </div>
          )}
          {property.bathrooms !== null && (
            <div className="flex items-center gap-1.5">
              <Bath size={12} className="text-neutral-muted" />
              <div>
                {property.bathrooms} banheiro
                {property.bathrooms !== 1 ? "s" : ""}
              </div>
            </div>
          )}
          {property.parking_spots !== null && property.parking_spots > 0 && (
            <div className="flex items-center gap-1.5">
              <Car size={12} className="text-neutral-muted" />
              <div>
                {property.parking_spots} vaga
                {property.parking_spots !== 1 ? "s" : ""}
              </div>
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
        <div className="px-5 py-3 border-t border-neutral-pale flex flex-wrap gap-1.5">
          {property.amenities.map((a) => (
            <Badge key={a} variant="default" size="sm">
              {a}
            </Badge>
          ))}
        </div>
      )}

      <CardFooter className="px-5 py-3 border-t border-neutral-pale">
        <FileField
          ref={fileInputRef}
          accept=".pdf"
          hidden
          onChange={handlePdfUpload}
        />
        {property.pdf_url ? (
          <div className="flex items-center gap-2 w-full">
            <FileText size={14} className="text-primary shrink-0" />
            <span className="text-xs text-neutral-ink truncate flex-1">
              {property.pdf_filename ?? "documento.pdf"}
            </span>
            {property.pdf_size && (
              <span className="text-xs text-neutral-muted shrink-0">
                {formatFileSize(property.pdf_size)}
              </span>
            )}
            <Button
              variant="ghost"
              onClick={handlePdfDelete}
              disabled={deletingPdf}
              className="text-neutral-muted hover:text-danger shrink-0 p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf}
            className="flex items-center gap-2 text-xs text-neutral hover:text-primary transition-colors"
          >
            <FileUp size={14} />
            {uploadingPdf ? "Enviando..." : "Anexar PDF"}
          </Button>
        )}
      </CardFooter>

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remover imóvel"
        description={`Tem certeza que deseja remover "${property.title ?? "este imóvel"}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        loading={deleting}
      />
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

  function handlePdfChange(
    id: string,
    pdf: {
      pdf_url: string | null;
      pdf_filename: string | null;
      pdf_size: number | null;
    },
  ) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...pdf } : p)),
    );
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
              <div className="font-semibold text-neutral-ink text-sm">
                Cadastrar imóvel por texto
              </div>
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
          {error && <div className="text-xs text-danger">{error}</div>}
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
            <div className="text-sm font-semibold text-neutral-ink">
              Imóveis cadastrados
            </div>
            <Badge variant="default">{properties.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onDelete={handleDelete}
                onPdfChange={handlePdfChange}
              />
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
