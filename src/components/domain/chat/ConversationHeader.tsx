import { cn } from "@/lib/utils";
import { Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConversationHeaderProps {
  name: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-slate-300",
  away: "bg-amber-500",
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
        "flex items-center justify-between px-4 py-3 border-b border-slate-200 flex-shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {status && (
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                statusColors[status]
              )}
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {name}
          </p>
          <p className="text-xs text-slate-500">
            {subtitle ?? (status ? statusLabels[status] : "")}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {actions ?? (
          <>
            <Button variant="ghost" size="sm" icon={<Phone className="h-4 w-4" />} />
            <Button variant="ghost" size="sm" icon={<MoreVertical className="h-4 w-4" />} />
          </>
        )}
      </div>
    </div>
  );
}
