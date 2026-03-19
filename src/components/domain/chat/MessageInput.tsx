"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MessageInputProps {
  onSend?: (message: string) => void | Promise<void>;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  onAttach,
  placeholder = "Mensagem",
  disabled,
  sending,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed || disabled || sending || submitting) return;

    try {
      setSubmitting(true);
      await onSend?.(trimmed);
      setMessage("");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isLoading = sending || submitting;
  const canSend = message.trim().length > 0 && !disabled && !isLoading;

  return (
    <div
      className={cn(
        "flex items-end gap-2 bg-neutral-surface px-3 py-2 sm:px-4 sm:py-3",
        className,
      )}
    >
      {onAttach && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAttach}
          disabled={disabled || isLoading}
          icon={<Paperclip className="h-5 w-5 text-neutral" />}
          className="shrink-0"
        />
      )}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border-0 bg-white px-4 py-2.5 text-sm shadow-sm",
          "placeholder:text-neutral-muted",
          "focus:outline-none focus:ring-2 focus:ring-teal-DEFAULT/30",
          "disabled:bg-neutral-surface disabled:cursor-not-allowed",
          "max-h-32",
        )}
      />
      <Button
        onClick={handleSend}
        loading={isLoading}
        disabled={!canSend}
        icon={<Send className="h-5 w-5" />}
        className={cn(
          "shrink-0 rounded-full",
          canSend
            ? "bg-whatsapp text-white hover:bg-whatsapp-dark"
            : "bg-neutral-border text-neutral-muted",
        )}
      />
    </div>
  );
}
