import { cn } from "@/lib/utils";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { MessageDirection, MessageStatus } from "@/types";

interface MessageBubbleProps {
  content: string;
  direction: MessageDirection;
  timestamp: string;
  status?: MessageStatus;
  senderName?: string;
  senderAvatar?: string;
  className?: string;
}

const statusIcons: Record<MessageStatus, React.ReactNode> = {
  sending: <Clock className="h-3 w-3 text-slate-400" />,
  sent: <Check className="h-3 w-3 text-slate-400" />,
  delivered: <CheckCheck className="h-3 w-3 text-slate-400" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  failed: <AlertCircle className="h-3 w-3 text-red-500" />,
};

export function MessageBubble({
  content,
  direction,
  timestamp,
  status,
  senderName,
  senderAvatar,
  className,
}: MessageBubbleProps) {
  const isSent = direction === "sent";

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[75%]",
        isSent ? "ml-auto flex-row-reverse" : "mr-auto",
        className
      )}
    >
      {/* Avatar (only for received) */}
      {!isSent && (
        <div className="flex-shrink-0 mt-auto">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName ?? ""}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
              {senderName?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div>
        {!isSent && senderName && (
          <p className="text-xs font-medium text-slate-500 mb-1 ml-1">
            {senderName}
          </p>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm leading-relaxed",
            isSent
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-slate-100 text-slate-900 rounded-bl-md"
          )}
        >
          {content}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isSent ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-[11px] text-slate-400">{timestamp}</span>
          {isSent && status && statusIcons[status]}
        </div>
      </div>
    </div>
  );
}
