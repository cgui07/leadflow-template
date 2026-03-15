import { cn } from "@/lib/utils";

interface ChatContainerProps {
  header?: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
  className?: string;
}

export function ChatContainer({
  header,
  messages,
  input,
  className,
}: ChatContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white rounded-xl border border-neutral-border overflow-hidden",
        className
      )}
    >
      {header}
      <div className="flex-1 overflow-y-auto">{messages}</div>
      <div className="flex-shrink-0">{input}</div>
    </div>
  );
}
