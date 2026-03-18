import { requireSession } from "@/features/auth/session";
import { listProperties } from "@/features/properties/server";
import { PropertiesClient } from "@/features/properties/components/PropertiesClient";

export const metadata = { title: "Imóveis" };

export default async function PropertiesPage() {
  const session = await requireSession();
  const properties = await listProperties(session.user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div>
        <div className="text-2xl font-bold text-neutral-ink">Imóveis</div>
        <div className="mt-1 text-sm text-neutral">
          Cole a descrição de qualquer imóvel e a IA extrai os dados
          automaticamente.
        </div>
      </div>
      <PropertiesClient
        initialProperties={JSON.parse(JSON.stringify(properties))}
      />
    </div>
  );
}
