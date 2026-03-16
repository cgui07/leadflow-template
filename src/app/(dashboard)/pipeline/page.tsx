import { requireSession } from "@/features/auth/session";
import { listPipelineStages } from "@/features/pipeline/server";
import { PipelinePageClient } from "@/features/pipeline/components/PipelinePageClient";

export default async function PipelinePage() {
  const session = await requireSession();
  const stages = await listPipelineStages(session.user.id);

  return <PipelinePageClient initialStages={stages} />;
}
