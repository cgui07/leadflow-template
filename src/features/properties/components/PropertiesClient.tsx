"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PropertyCard } from "./PropertyCard";
import { Button } from "@/components/ui/Button";
import type { Property, PdfEntry } from "../types";
import { EmptyState } from "@/components/ui/EmptyState";
import { PropertyImportForm } from "./PropertyImportForm";

type Tab = "add" | "list";

export function PropertiesClient({
  initialProperties,
}: {
  initialProperties: Property[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [properties, setProperties] = useState(initialProperties);
  const [hasNew, setHasNew] = useState(false);

  function handlePropertyCreated(property: Property) {
    setProperties((prev) => [property, ...prev]);
    setHasNew(true);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "list") setHasNew(false);
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
    <div className="space-y-0">
      <div className="flex border-b border-neutral-border">
        <TabButton
          active={activeTab === "add"}
          onClick={() => handleTabChange("add")}
        >
          Adicionar imóvel
        </TabButton>

        <TabButton
          active={activeTab === "list"}
          onClick={() => handleTabChange("list")}
        >
          <div className="flex items-center gap-2">
            <span>Meus imóveis</span>
            {properties.length > 0 && (
              <div
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  activeTab === "list"
                    ? "bg-blue-ice text-blue-royal"
                    : "bg-neutral-pale text-neutral",
                )}
              >
                {properties.length}
              </div>
            )}
            {hasNew && (
              <div className="h-2 w-2 rounded-full bg-green-DEFAULT" />
            )}
          </div>
        </TabButton>
      </div>

      <div className="pt-6">
        {activeTab === "add" && (
          <PropertyImportForm onPropertyCreated={handlePropertyCreated} />
        )}

        {activeTab === "list" && (
          <>
            {properties.length > 0 ? (
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
            ) : (
              <Card>
                <EmptyState
                  icon={<Building2 size={22} />}
                  title="Nenhum imóvel cadastrado"
                  description="Vá para a aba Adicionar imóvel e cole uma descrição — a IA estrutura os dados para você."
                />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "-mb-px h-auto border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap rounded-none",
        active
          ? "border-blue-royal text-blue-royal"
          : "border-transparent text-neutral hover:border-neutral-line hover:text-neutral-dark",
      )}
    >
      {children}
    </Button>
  );
}
