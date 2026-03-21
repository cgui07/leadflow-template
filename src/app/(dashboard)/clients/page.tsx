import { env } from "@/lib/env";
import { redirect } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { listPlatformClients } from "@/features/platform-admin/server";
import { PlatformClientsPageClient } from "@/features/platform-admin/components/PlatformClientsPageClient";

export default async function ClientsPage() {
  const session = await requireSession();

  if (!session.canManagePlatform) {
    redirect("/dashboard");
  }

  const initialData = await listPlatformClients({
    appUrl: env.NEXT_PUBLIC_APP_URL,
    excludeTenantId: session.user.tenantId,
  });

  return <PlatformClientsPageClient initialData={initialData} />;
}
