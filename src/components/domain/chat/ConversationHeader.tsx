import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { MoreVertical, Phone } from "lucide-react";

interface ConversationHeaderProps {
  name: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const statusColors: Record<string, string> = {
  online: "bg-green-emerald",
  offline: "bg-neutral-line",
  away: "bg-orange-amber",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  away: "Ausente",
};

export function ConversationHeader({
  name,
  avatar,
  status,
  subtitle,
  actions,
  className,
}: ConversationHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-neutral-border shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-ice flex items-center justify-center text-sm font-bold text-blue-royal">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {status && (
            <div
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                statusColors[status],
              )}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-ink truncate">
            {name}
          </div>
          <div className="text-xs text-neutral">
            {subtitle ?? (status ? statusLabels[status] : "")}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {actions ?? (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={<Phone className="h-4 w-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<MoreVertical className="h-4 w-4" />}
            />
          </>
        )}
      </div>
    </div>
  );
}
