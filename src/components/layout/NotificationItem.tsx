"use client";

import Link from "next/link";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { AttentionQueueItem } from "@/lib/attention-queue";
import { formatTimeAgo, getNotificationHref } from "./notification-bell-utils";

interface NotificationItemProps {
  item: AttentionQueueItem;
  primaryReason: {
    label: string;
    icon: React.ReactNode;
    tone: string;
  };
  onClose: () => void;
}

export const NotificationItem = memo(function NotificationItem({ item, primaryReason, onClose }: NotificationItemProps) {
  return (
    <Link
      href={getNotificationHref(item)}
      onClick={onClose}
      className="block rounded-xl border border-neutral-border bg-neutral-surface px-3 py-3 transition-colors hover:bg-neutral-pale"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-border text-sm font-semibold text-neutral-dark">
          {item.leadName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-semibold text-neutral-ink">
              {item.leadName}
            </div>
            <div className="shrink-0 text-[11px] text-neutral-muted">
              {formatTimeAgo(item.lastRelevantAt)}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {primaryReason.icon}
            <span className={cn("truncate", primaryReason.tone)}>
              {primaryReason.label}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-muted">
            <span className="truncate">{item.leadPhone}</span>
            {item.conversationStatus && (
              <span className="inline-flex items-center gap-1">
                {item.conversationStatus === "bot" ? (
                  <Bot className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {item.conversationStatus === "bot" ? "Bot" : "Manual"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
