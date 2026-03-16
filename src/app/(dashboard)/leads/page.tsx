import { listLeads } from "@/features/leads/server";
import { requireSession } from "@/features/auth/session";
import { LeadsPageClient } from "@/features/leads/components/LeadsPageClient";

export default async function LeadsPage() {
  const session = await requireSession();
  const data = await listLeads(session.user.id, {
    status: "all",
    page: 1,
    limit: 20,
    sort: "createdAt",
    order: "desc",
    search: "",
  });

  return <LeadsPageClient initialData={data} />;
}
