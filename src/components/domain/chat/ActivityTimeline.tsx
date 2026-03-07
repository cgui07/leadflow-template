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
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  email: {
    icon: <Mail className="h-3.5 w-3.5" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  note: {
    icon: <StickyNote className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  meeting: {
    icon: <CalendarCheck className="h-3.5 w-3.5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  task: {
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  status_change: {
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  message: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
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
            {/* Timeline line + icon */}
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
                <div className="w-px flex-1 bg-slate-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={cn("pb-5 min-w-0", isLast && "pb-0")}>
              <p className="text-sm font-medium text-slate-900">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                  {activity.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-400">
                  {formatTimestamp(activity.timestamp)}
                </span>
                {activity.user && (
                  <span className="text-[11px] text-slate-400">
                    por {activity.user.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
