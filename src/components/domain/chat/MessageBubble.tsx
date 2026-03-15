import { cn } from "@/lib/utils";
import type { MessageDirection, MessageStatus } from "@/types";
import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import Image from "next/image";

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
  sending: <Clock className="h-3 w-3 text-neutral-muted" />,
  sent: <Check className="h-3 w-3 text-neutral-muted" />,
  delivered: <CheckCheck className="h-3 w-3 text-neutral-muted" />,
  read: <CheckCheck className="h-3 w-3 text-blue" />,
  failed: <AlertCircle className="h-3 w-3 text-danger" />,
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
        className,
      )}
    >
      {!isSent && (
        <div className="shrink-0 mt-auto">
          {senderAvatar ? (
            <Image
              src={senderAvatar}
              alt={senderName ?? ""}
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-neutral-border flex items-center justify-center text-xs font-bold text-neutral">
              {senderName?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      )}
      <div>
        {!isSent && senderName && (
          <div className="text-xs font-medium text-neutral mb-1 ml-1">
            {senderName}
          </div>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm leading-relaxed",
            isSent
              ? "bg-blue-royal text-white rounded-br-md"
              : "bg-neutral-pale text-neutral-ink rounded-bl-md",
          )}
        >
          {content}
        </div>
        <div
          className={cn(
            "flex items-center gap-1 mt-1 px-1",
            isSent ? "justify-end" : "justify-start",
          )}
        >
          <div className="text-[11px] text-neutral-muted">{timestamp}</div>
          {isSent && status && statusIcons[status]}
        </div>
      </div>
    </div>
  );
}
