"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PropertyCard } from "./PropertyCard";
import type { Property, PdfEntry } from "../types";
import { EmptyState } from "@/components/ui/EmptyState";
import { PropertyImportForm } from "./PropertyImportForm";

export function PropertiesClient({
  initialProperties,
}: {
  initialProperties: Property[];
}) {
  const [properties, setProperties] = useState(initialProperties);

  function handlePropertyCreated(property: Property) {
    setProperties((prev) => [property, ...prev]);
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
      <PropertyImportForm onPropertyCreated={handlePropertyCreated} />

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
