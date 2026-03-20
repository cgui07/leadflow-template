import { SectionContainer } from "@/components/layout/SectionContainer";

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  createdAt: string;
}

interface LeadActivitiesTabProps {
  activities: Activity[];
}

export function LeadActivitiesTab({ activities }: LeadActivitiesTabProps) {
  return (
    <SectionContainer title="Histórico de Atividades">
      {!activities.length ? (
        <div className="text-sm text-neutral-muted">Nenhuma atividade registrada</div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 border-b border-gray-ghost pb-3 text-sm">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="flex-1">
                <div className="font-medium text-neutral-dark">{activity.title}</div>
                {activity.description ? (
                  <div className="mt-0.5 text-xs text-neutral-muted">{activity.description}</div>
                ) : null}
              </div>
              <div className="whitespace-nowrap text-xs text-neutral-muted">
                {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionContainer>
  );
}
