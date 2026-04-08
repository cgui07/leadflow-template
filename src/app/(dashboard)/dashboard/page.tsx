import { requireSession } from "@/features/auth/session";
import { DashboardPageContent } from "@/features/dashboard/components/DashboardPageContent";
import {
  getAttentionQueueItems,
  getDashboardData,
} from "@/features/dashboard/server";

const DEFAULT_TITLE = "Dashboard";
const DEFAULT_SUBTITLE = "Visão geral dos seus leads e atendimentos";

export default async function DashboardPage() {
  const session = await requireSession();
  const [data, attentionQueueItems] = await Promise.all([
    getDashboardData(session.user.id),
    session.branding.featureFlags.attentionQueue
      ? getAttentionQueueItems(session.user.id)
      : Promise.resolve([]),
  ]);

  return (
    <DashboardPageContent
      attentionQueueItems={attentionQueueItems}
      data={data}
      showAttentionQueue={session.branding.featureFlags.attentionQueue}
      subtitle={DEFAULT_SUBTITLE}
      title={DEFAULT_TITLE}
    />
  );
}
