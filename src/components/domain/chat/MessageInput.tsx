"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Paperclip } from "lucide-react";

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
        "flex items-end gap-2 px-4 py-3 border-t border-slate-200",
        className
      )}
    >
      {onAttach && (
        <button
          type="button"
          onClick={onAttach}
          disabled={disabled}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <Paperclip className="h-5 w-5" />
        </button>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm",
          "placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-slate-50 disabled:cursor-not-allowed",
          "max-h-32"
        )}
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={cn(
          "p-2 rounded-lg transition-colors",
          message.trim()
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-slate-100 text-slate-400",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
