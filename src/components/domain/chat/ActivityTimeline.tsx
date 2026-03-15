import { cn } from "@/lib/utils";
import {
  Phone,
  Mail,
  StickyNote,
  CalendarCheck,
  CheckSquare,
  ArrowRightLeft,
  MessageSquare,
} from "lucide-react";
import type { Activity, ActivityType } from "@/types";

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

const typeConfig: Record<
  ActivityType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  call: {
    icon: <Phone className="h-3.5 w-3.5" />,
    color: "text-blue-royal",
    bg: "bg-blue-pale",
  },
  email: {
    icon: <Mail className="h-3.5 w-3.5" />,
    color: "text-purple-violet",
    bg: "bg-purple-pale",
  },
  note: {
    icon: <StickyNote className="h-3.5 w-3.5" />,
    color: "text-yellow-gold",
    bg: "bg-yellow-pale",
  },
  meeting: {
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    color: "text-green-dark",
    bg: "bg-green-pale",
  },
  task: {
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    color: "text-neutral-steel",
    bg: "bg-neutral-pale",
  },
  status_change: {
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    color: "text-orange-dark",
    bg: "bg-orange-pale",
  },
  message: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: "text-teal-dark",
    bg: "bg-teal-pale",
  },
};

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ActivityTimeline({
  activities,
  className,
}: ActivityTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {activities.map((activity, index) => {
        const config = typeConfig[activity.type];
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-full flex-shrink-0",
                  config.bg,
                  config.color
                )}
              >
                {config.icon}
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-neutral-border my-1" />
              )}
            </div>
            <div className={cn("pb-5 min-w-0", isLast && "pb-0")}>
              <div className="text-sm font-medium text-neutral-ink">
                {activity.title}
              </div>
              {activity.description && (
                <div className="text-xs text-neutral mt-0.5 line-clamp-2">
                  {activity.description}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <div className="text-[11px] text-neutral-muted">
                  {formatTimestamp(activity.timestamp)}
                </div>
                {activity.user && (
                  <div className="text-[11px] text-neutral-muted">
                    por {activity.user.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
