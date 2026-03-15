"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MessageInputProps {
  onSend?: (message: string) => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  onAttach,
  placeholder = "Digite uma mensagem...",
  disabled,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  function handleSend() {
    const trimmed = message.trim();
    if (trimmed) {
      onSend?.(trimmed);
      setMessage("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 px-4 py-3 border-t border-neutral-border",
        className
      )}
    >
      {onAttach && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAttach}
          disabled={disabled}
          icon={<Paperclip className="h-5 w-5" />}
        />
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-lg border border-neutral-border px-3 py-2 text-sm",
          "placeholder:text-neutral-muted",
          "focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent",
          "disabled:bg-neutral-surface disabled:cursor-not-allowed",
          "max-h-32"
        )}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        icon={<Send className="h-5 w-5" />}
      />
    </div>
  );
}
