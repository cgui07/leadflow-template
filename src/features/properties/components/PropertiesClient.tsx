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

interface PdfEntry {
  url: string;
  filename: string;
  size: number;
}

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
  pdfs: PdfEntry[];
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
  onPdfsChange,
}: {
  property: Property;
  onDelete: (id: string) => void;
  onPdfsChange: (id: string, pdfs: PdfEntry[]) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdfUrl, setDeletingPdfUrl] = useState<string | null>(null);
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
    if (file.size > 100 * 1024 * 1024) {
      alert("O arquivo excede o limite de 100MB.");
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
        const newEntry: PdfEntry = await res.json();
        onPdfsChange(property.id, [...property.pdfs, newEntry]);
      }
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePdfDelete(pdfUrl: string) {
    setDeletingPdfUrl(pdfUrl);
    try {
      const res = await fetch(
        `/api/properties/${property.id}/pdf?url=${encodeURIComponent(pdfUrl)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onPdfsChange(
          property.id,
          property.pdfs.filter((p) => p.url !== pdfUrl),
        );
      }
    } finally {
      setDeletingPdfUrl(null);
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
        <div className="flex flex-col gap-2 w-full">
          {property.pdfs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {property.pdfs.map((pdf) => (
                <div
                  key={pdf.url}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-pale bg-neutral-surface px-2.5 py-1.5"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                    <FileText size={12} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-neutral-ink leading-tight">
                      {pdf.filename}
                    </div>
                    <div className="text-[10px] text-neutral-muted leading-tight">
                      {formatFileSize(pdf.size)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => handlePdfDelete(pdf.url)}
                    disabled={deletingPdfUrl === pdf.url}
                    className="shrink-0 rounded p-0.5 text-neutral-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf}
            className="flex items-center gap-1.5 text-xs text-neutral hover:text-primary transition-colors"
          >
            <FileUp size={13} />
            {uploadingPdf ? "Enviando..." : "Adicionar PDF"}
          </Button>
        </div>
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

const MAX_PDF_SIZE = 100 * 1024 * 1024;

export function PropertiesClient({
  initialProperties,
}: {
  initialProperties: Property[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPdfs, setPendingPdfs] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  function validateAndAddPdf(file: File) {
    if (file.type !== "application/pdf") {
      setError("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setError("O arquivo excede o limite de 100MB.");
      return;
    }
    setError(null);
    setPendingPdfs((prev) => [...prev, file]);
  }

  function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndAddPdf(file);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndAddPdf(file);
  }

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

      const property = { ...(data as Property), pdfs: [] as PdfEntry[] };

      for (const file of pendingPdfs) {
        const formData = new FormData();
        formData.append("pdf", file);
        const pdfRes = await fetch(`/api/properties/${property.id}/pdf`, {
          method: "POST",
          body: formData,
        });
        if (pdfRes.ok) {
          const newEntry: PdfEntry = await pdfRes.json();
          property.pdfs.push(newEntry);
        }
      }
      setPendingPdfs([]);

      setProperties((prev) => [property, ...prev]);
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

  function handlePdfsChange(id: string, pdfs: PdfEntry[]) {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pdfs } : p)),
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

        <div className="px-6 py-4 space-y-3">
          <TextareaField
            placeholder="Ex: Apartamento 3 quartos, 2 banheiros, 1 vaga, 90m², R$ 650.000, Moema - SP. Varanda gourmet, piscina, academia..."
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <FileField
            ref={pdfInputRef}
            accept=".pdf"
            hidden
            onChange={handlePdfSelect}
          />
          {pendingPdfs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pendingPdfs.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText size={13} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-ink">
                      {file.name}
                    </div>
                    <div className="text-xs text-neutral-muted">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setPendingPdfs((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="shrink-0 rounded-md p-1 text-neutral-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={[
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/5 text-primary"
                : "border-neutral-border bg-neutral-surface text-neutral hover:border-primary hover:text-primary",
            ].join(" ")}
          >
            <FileUp
              size={20}
              className={dragOver ? "text-primary" : "text-neutral-muted"}
            />
            <div className="space-y-0.5">
              <div className="text-sm font-medium">
                {dragOver
                  ? "Solte o PDF aqui"
                  : "Arraste um PDF ou clique para adicionar"}
              </div>
              <div className="text-xs text-neutral-muted">
                Opcional · Máximo 100MB por arquivo
              </div>
            </div>
          </Button>
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
                onPdfsChange={handlePdfsChange}
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
