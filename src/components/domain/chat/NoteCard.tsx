import { cn } from "@/lib/utils";
import { StickyNote, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NoteCardProps {
  content: string;
  author: string;
  timestamp: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function NoteCard({
  content,
  author,
  timestamp,
  onEdit,
  onDelete,
  className,
}: NoteCardProps) {
  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-medium text-amber-700">{author}</span>
          <span className="text-xs text-amber-500">{timestamp}</span>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                icon={<Pencil className="h-3.5 w-3.5" />}
              />
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                icon={<Trash2 className="h-3.5 w-3.5" />}
              />
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
