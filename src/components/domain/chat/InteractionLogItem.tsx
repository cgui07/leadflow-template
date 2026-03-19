import { cn } from "@/lib/utils";
import { FaWhatsapp } from "react-icons/fa";
import {
  Mail,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
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
    color: "text-green-dark",
    bg: "bg-green-pale",
  },
  call_out: {
    icon: <PhoneOutgoing className="h-4 w-4" />,
    color: "text-blue-royal",
    bg: "bg-blue-pale",
  },
  call_missed: {
    icon: <PhoneMissed className="h-4 w-4" />,
    color: "text-red-crimson",
    bg: "bg-red-pale",
  },
  email: {
    icon: <Mail className="h-4 w-4" />,
    color: "text-purple-violet",
    bg: "bg-purple-pale",
  },
  message: {
    icon: <FaWhatsapp className="h-4 w-4" />,
    color: "text-teal-dark",
    bg: "bg-teal-pale",
  },
  video: {
    icon: <Video className="h-4 w-4" />,
    color: "text-indigo-deep",
    bg: "bg-indigo-pale",
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
        "flex items-start gap-3 py-3 border-b border-neutral-pale last:border-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
          config.bg,
          config.color,
        )}
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-neutral-ink">{title}</div>
        {description && (
          <div className="text-xs text-neutral mt-0.5 truncate">
            {description}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-neutral-muted">{timestamp}</div>
        {duration && (
          <div className="text-xs text-neutral-muted mt-0.5">{duration}</div>
        )}
      </div>
    </div>
  );
}
