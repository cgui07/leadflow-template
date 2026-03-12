"use client";

import { MoreVertical } from "lucide-react";
import { Dropdown } from "./Dropdown";

interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
}

export function ActionMenu({ items, className }: ActionMenuProps) {
  return (
    <Dropdown
      className={className}
      trigger={
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      }
      items={items}
    />
  );
}
