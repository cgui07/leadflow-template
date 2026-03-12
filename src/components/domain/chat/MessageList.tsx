"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

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

// Date separator for grouping messages
interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
        {date}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
