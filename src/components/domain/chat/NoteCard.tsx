import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Pencil, StickyNote, Trash2 } from "lucide-react";

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
        "bg-yellow-pale border border-yellow-butter rounded-lg p-4 space-y-2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-yellow-gold shrink-0" />
          <div className="text-xs font-medium text-yellow-dark">{author}</div>
          <div className="text-xs text-orange-amber">{timestamp}</div>
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
      <div className="text-sm text-neutral-dark leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
