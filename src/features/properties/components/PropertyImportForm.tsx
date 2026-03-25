"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { uploadPdfDirect } from "../upload-pdf";
import { PDF_CATEGORY_OPTIONS } from "../types";
import { FileField } from "@/components/forms/FileField";
import { SelectField } from "@/components/forms/SelectField";
import { FileText, FileUp, Sparkles, X } from "lucide-react";
import type { Property, PdfEntry, PdfCategory } from "../types";
import { TextareaField } from "@/components/forms/TextareaField";
import { Card, CardHeader, CardFooter } from "@/components/ui/Card";

interface PendingPdf {
  file: File;
  category: PdfCategory | "";
}

const MAX_PDF_SIZE = 100 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PropertyImportFormProps {
  onPropertyCreated: (property: Property) => void;
}

export function PropertyImportForm({ onPropertyCreated }: PropertyImportFormProps) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPdfs, setPendingPdfs] = useState<PendingPdf[]>([]);
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
    setPendingPdfs((prev) => [...prev, { file, category: "" }]);
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

      let pdfError = false;
      for (const pending of pendingPdfs) {
        try {
          const newEntry = await uploadPdfDirect(
            property.id,
            pending.file,
            pending.category as PdfCategory,
          );
          property.pdfs.push(newEntry);
        } catch {
          pdfError = true;
        }
      }
      if (pdfError) {
        setError("Imóvel salvo, mas houve erro ao fazer upload de um ou mais PDFs.");
      }
      setPendingPdfs([]);

      onPropertyCreated(property);
      setRawText("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
          <div className="flex flex-col gap-2.5">
            {pendingPdfs.map((pending, i) => (
              <div
                key={i}
                className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText size={13} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-neutral-ink">
                      {pending.file.name}
                    </div>
                    <div className="text-xs text-neutral-muted">
                      {formatFileSize(pending.file.size)}
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
                <SelectField
                  placeholder="Tipo do material"
                  options={PDF_CATEGORY_OPTIONS}
                  value={pending.category}
                  onChange={(val) =>
                    setPendingPdfs((prev) =>
                      prev.map((p, j) =>
                        j === i ? { ...p, category: val as PdfCategory } : p,
                      ),
                    )
                  }
                  fieldSize="sm"
                />
              </div>
            ))}
          </div>
        )}
        {/* Mobile: mesmo visual do desktop mas sem texto de arrastar */}
        <Button
          variant="ghost"
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-border bg-neutral-surface px-4 pt-6 pb-6 text-neutral transition-colors hover:border-primary hover:text-primary md:hidden"
        >
          <FileUp size={16} className="text-neutral-muted" />
          <div className="space-y-0">
            <div className="text-sm font-medium">Toque para adicionar PDF</div>
            <div className="text-xs text-neutral-muted">Opcional · Máximo 100MB</div>
          </div>
        </Button>

        {/* Desktop: área de drag & drop maior */}
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
            "hidden w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 pt-6 pb-8 text-center transition-colors md:flex",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-neutral-border bg-neutral-surface text-neutral hover:border-primary hover:text-primary",
          ].join(" ")}
        >
          <FileUp
            size={24}
            className={dragOver ? "text-primary" : "text-neutral-muted"}
          />
          <div className="space-y-1">
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
          disabled={
            rawText.trim().length < 10 ||
            pendingPdfs.some((p) => !p.category)
          }
          icon={<Sparkles size={14} />}
        >
          {loading ? "Extraindo..." : "Extrair com IA"}
        </Button>
      </CardFooter>
    </Card>
  );
}
