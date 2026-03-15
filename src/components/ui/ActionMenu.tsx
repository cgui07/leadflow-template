"use client";

import { MoreVertical } from "lucide-react";
import { Dropdown } from "./Dropdown";
import { Button } from "./Button";

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
        <Button variant="ghost" size="sm" icon={<MoreVertical className="h-4 w-4" />} />
      }
      items={items}
    />
  );
}
