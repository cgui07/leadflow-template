"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Property, PdfEntry } from "../types";
import { FileField } from "@/components/forms/FileField";
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
  Trash2,
  X,
} from "lucide-react";

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

interface PropertyCardProps {
  property: Property;
  onDelete: (id: string) => void;
  onPdfsChange: (id: string, pdfs: PdfEntry[]) => void;
}

export function PropertyCard({ property, onDelete, onPdfsChange }: PropertyCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdfUrl, setDeletingPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          onClick={() => setDeleteModalOpen(true)}
          className="text-neutral-muted hover:text-danger shrink-0 -mr-1"
        />
      </CardHeader>

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
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
          </div>
          {price && (
            <div className="shrink-0 text-sm font-bold text-neutral-ink">
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
          <div className="wrap-break-word text-xs text-neutral leading-relaxed border-t border-neutral-pale pt-3">
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
        <div className="flex items-center gap-2 w-full">
          {property.pdfs.length > 0 && (
            <button
              type="button"
              onClick={() => property.pdfs.length === 1 ? undefined : setPdfModalOpen(true)}
              className={`flex items-center gap-2 rounded-lg border border-neutral-pale bg-neutral-surface px-2.5 py-1.5 min-w-0 flex-1 ${property.pdfs.length > 1 ? "cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors" : ""}`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                <FileText size={12} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-medium text-neutral-ink leading-tight">
                  {property.pdfs[0].filename}
                </div>
                <div className="text-[10px] text-neutral-muted leading-tight">
                  {formatFileSize(property.pdfs[0].size)}
                </div>
              </div>
              {property.pdfs.length === 1 && (
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePdfDelete(property.pdfs[0].url);
                  }}
                  disabled={deletingPdfUrl === property.pdfs[0].url}
                  className="shrink-0 rounded p-0.5 text-neutral-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <X size={12} />
                </Button>
              )}
              {property.pdfs.length > 1 && (
                <div className="shrink-0 flex items-center justify-center h-6 min-w-[28px] rounded-full bg-primary/10 text-primary text-[11px] font-semibold px-1.5">
                  +{property.pdfs.length - 1}
                </div>
              )}
            </button>
          )}
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf}
            className="flex items-center gap-1.5 text-xs text-neutral hover:text-primary transition-colors shrink-0"
          >
            <FileUp size={13} />
            {uploadingPdf ? "Enviando..." : property.pdfs.length > 0 ? "Adicionar" : "Adicionar PDF"}
          </Button>
        </div>
      </CardFooter>

      <Modal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title="Documentos PDF"
        description={`${property.pdfs.length} arquivo${property.pdfs.length !== 1 ? "s" : ""} anexado${property.pdfs.length !== 1 ? "s" : ""} a "${property.title ?? "este imóvel"}"`}
        size="md"
      >
        <div className="flex flex-col gap-2">
          {property.pdfs.map((pdf, index) => (
            <div
              key={pdf.url}
              className="group flex items-center gap-3 rounded-xl border border-neutral-pale bg-neutral-surface p-3 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-ink">
                  {pdf.filename}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-muted">
                    {formatFileSize(pdf.size)}
                  </span>
                  <span className="text-neutral-pale">·</span>
                  <span className="text-xs text-neutral-muted">
                    PDF {index + 1} de {property.pdfs.length}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => handlePdfDelete(pdf.url)}
                disabled={deletingPdfUrl === pdf.url}
                className="shrink-0 rounded-lg p-1.5 text-neutral-muted opacity-0 group-hover:opacity-100 transition-all hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-neutral-pale">
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf}
            className="flex items-center gap-2 text-sm text-neutral hover:text-primary transition-colors w-full justify-center py-2"
          >
            <FileUp size={15} />
            {uploadingPdf ? "Enviando..." : "Adicionar mais PDFs"}
          </Button>
        </div>
      </Modal>

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
