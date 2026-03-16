import { notFound } from "next/navigation";
import { getLeadDetail } from "@/features/leads/server";
import { requireSession } from "@/features/auth/session";
import { LeadDetailPageClient } from "@/features/leads/components/LeadDetailPageClient";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const lead = await getLeadDetail(session.user.id, id);

  if (!lead) {
    notFound();
  }

  return <LeadDetailPageClient initialLead={lead} leadId={id} />;
}
