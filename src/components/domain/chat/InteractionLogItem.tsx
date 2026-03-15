import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react";

type InteractionType =
  | "call_in"
  | "call_out"
  | "call_missed"
  | "email"
  | "message"
  | "video";

interface InteractionLogItemProps {
  type: InteractionType;
  title: string;
  description?: string;
  timestamp: string;
  duration?: string;
  className?: string;
}

const interactionConfig: Record<
  InteractionType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  call_in: {
    icon: <PhoneIncoming className="h-4 w-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  call_out: {
    icon: <PhoneOutgoing className="h-4 w-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  call_missed: {
    icon: <PhoneMissed className="h-4 w-4" />,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  email: {
    icon: <Mail className="h-4 w-4" />,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  message: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  video: {
    icon: <Video className="h-4 w-4" />,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
};

export function InteractionLogItem({
  type,
  title,
  description,
  timestamp,
  duration,
  className,
}: InteractionLogItemProps) {
  const config = interactionConfig[type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 border-b border-slate-100 last:border-0",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0",
          config.bg,
          config.color
        )}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        {description && (
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {description}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs text-slate-400">{timestamp}</div>
        {duration && (
          <div className="text-xs text-slate-400 mt-0.5">{duration}</div>
        )}
      </div>
    </div>
  );
}
