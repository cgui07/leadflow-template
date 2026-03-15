"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

interface MessageListProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  className?: string;
}

export function MessageList({
  children,
  autoScroll = true,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  });

  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      {children}
      <div ref={bottomRef} />
    </div>
  );
}

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-neutral-border" />
      <div className="text-xs font-medium text-neutral-muted whitespace-nowrap">
        {date}
      </div>
      <div className="flex-1 h-px bg-neutral-border" />
    </div>
  );
}
