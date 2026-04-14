"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { uploadPdfDirect } from "../upload-pdf";
import { FileField } from "@/components/forms/FileField";
import { SelectField } from "@/components/forms/SelectField";
import type { Property, PdfEntry, PdfCategory } from "../types";
import { Card, CardHeader, CardFooter } from "@/components/ui/Card";
import { PDF_CATEGORY_LABELS, PDF_CATEGORY_OPTIONS } from "../types";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import {
  BadgeDollarSign,
  Bath,
  BedDouble,
  BookOpen,
  Building2,
  Car,
  FileText,
  FileUp,
  Home,
  Key,
  LayoutList,
  MapPin,
  Maximize2,
  PackageCheck,
  Table2,
  TrendingUp,
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

function pdfCategoryVariant(category: PdfCategory): "purple" | "orange" | "success" | "info" | "default" {
  switch (category) {
    case "BOOK": return "purple";
    case "FLUXO": return "orange";
    case "RENTABILIDADE": return "success";
    case "PRODUTO_PRONTO": return "info";
    case "TABELA": return "default";
  }
}

function pdfCategoryIcon(category: PdfCategory) {
  switch (category) {
    case "BOOK": return <BookOpen size={10} />;
    case "FLUXO": return <LayoutList size={10} />;
    case "RENTABILIDADE": return <TrendingUp size={10} />;
    case "PRODUTO_PRONTO": return <PackageCheck size={10} />;
    case "TABELA": return <Table2 size={10} />;
  }
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

export function PropertyCard({
  property,
  onDelete,
  onPdfsChange,
}: PropertyCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingPdfUrl, setDeletingPdfUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<PdfCategory | "">("");
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

  function handlePdfSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("O arquivo excede o limite de 100MB.");
      return;
    }
    setUploadError(null);
    setPendingFile(file);
    setPendingCategory("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleConfirmUpload() {
    if (!pendingFile || !pendingCategory) return;
    setUploadingPdf(true);
    setUploadError(null);
    try {
      const newEntry = await uploadPdfDirect(
        property.id,
        pendingFile,
        pendingCategory,
      );
      onPdfsChange(property.id, [...property.pdfs, newEntry]);
      setPendingFile(null);
      setPendingCategory("");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Erro ao fazer upload do PDF.",
      );
    } finally {
      setUploadingPdf(false);
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
              <Badge
                variant={purposeVariant(property.purpose)}
                icon={property.purpose === "venda" ? <BadgeDollarSign size={11} /> : <Key size={11} />}
              >
                {purposeLabel(property.purpose)}
              </Badge>
            )}
            {property.type && (
              <Badge variant="purple" icon={typeIcon(property.type)}>
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
            <Badge key={a} variant="teal" size="sm">
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
          onChange={handlePdfSelect}
        />
        {uploadError && (
          <div className="mb-2 text-xs text-danger">{uploadError}</div>
        )}
        {pendingFile && (
          <div className="mb-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText size={13} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-neutral-ink">
                  {pendingFile.name}
                </div>
                <div className="text-xs text-neutral-muted">
                  {formatFileSize(pendingFile.size)}
                </div>
              </div>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setPendingCategory("");
                }}
                className="shrink-0 rounded-md p-1 text-neutral-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <X size={14} />
              </Button>
            </div>
            <SelectField
              placeholder="Tipo do material"
              options={PDF_CATEGORY_OPTIONS}
              value={pendingCategory}
              onChange={(val) => setPendingCategory(val as PdfCategory)}
              fieldSize="sm"
            />
            <Button
              size="sm"
              onClick={handleConfirmUpload}
              disabled={!pendingCategory}
              loading={uploadingPdf}
              fullWidth
            >
              Enviar PDF
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          {property.pdfs.length > 0 && (
            <div
              role={property.pdfs.length > 1 ? "button" : undefined}
              tabIndex={property.pdfs.length > 1 ? 0 : undefined}
              onClick={() =>
                property.pdfs.length > 1 ? setPdfModalOpen(true) : undefined
              }
              className={`flex items-center gap-2 rounded-lg border border-neutral-pale bg-neutral-surface px-2.5 py-1.5 min-w-0 flex-1 ${property.pdfs.length > 1 ? "cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors" : ""}`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                <FileText size={12} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-medium text-neutral-ink leading-tight">
                  {property.pdfs[0].filename}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {property.pdfs[0].category && (
                    <Badge
                      variant={pdfCategoryVariant(property.pdfs[0].category)}
                      size="sm"
                      icon={pdfCategoryIcon(property.pdfs[0].category)}
                    >
                      {PDF_CATEGORY_LABELS[property.pdfs[0].category] ?? property.pdfs[0].category}
                    </Badge>
                  )}
                  <span className="text-[10px] text-neutral-muted leading-tight">
                    {formatFileSize(property.pdfs[0].size)}
                  </span>
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
                <Badge variant="default" size="sm">
                  +{property.pdfs.length - 1}
                </Badge>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPdf || !!pendingFile}
            className="flex items-center gap-1.5 text-xs text-neutral hover:text-primary transition-colors shrink-0"
          >
            <FileUp size={13} />
            {property.pdfs.length > 0 ? "Adicionar" : "Adicionar PDF"}
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
              className="group rounded-xl border border-neutral-pale bg-neutral-surface p-3 transition-colors hover:border-primary/20 space-y-2"
            >
              <div className="flex items-center gap-3">
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
              <SelectField
                placeholder="Tipo do material"
                options={PDF_CATEGORY_OPTIONS}
                value={pdf.category ?? ""}
                onChange={async (val) => {
                  const previous = property.pdfs;
                  const updated = property.pdfs.map((p) =>
                    p.url === pdf.url
                      ? { ...p, category: val as PdfCategory }
                      : p,
                  );
                  onPdfsChange(property.id, updated);
                  try {
                    const res = await fetch(`/api/properties/${property.id}/pdf/category`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: pdf.url, category: val }),
                    });
                    if (!res.ok) {
                      onPdfsChange(property.id, previous);
                      setUploadError("Erro ao atualizar categoria.");
                    }
                  } catch {
                    onPdfsChange(property.id, previous);
                    setUploadError("Erro ao atualizar categoria.");
                  }
                }}
                fieldSize="sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-neutral-pale">
          <Button
            variant="ghost"
            onClick={() => {
              setPdfModalOpen(false);
              fileInputRef.current?.click();
            }}
            disabled={uploadingPdf}
            className="flex items-center gap-2 text-sm text-neutral hover:text-primary transition-colors w-full justify-center py-2"
          >
            <FileUp size={15} />
            Adicionar mais PDFs
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
