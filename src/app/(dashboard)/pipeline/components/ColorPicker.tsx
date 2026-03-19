"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_PIPELINE_STAGE_COLORS,
  getPipelineColorDotClass,
  type PipelineColorToken,
} from "@/lib/ui-colors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div>
      <div className="mb-1.5 block text-sm font-medium text-neutral-dark">
        Cor
      </div>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_PIPELINE_STAGE_COLORS.map((color: PipelineColorToken) => (
          <Button
            variant="unstyled"
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full p-0 transition-all",
              value === color
                ? "ring-2 ring-primary ring-offset-2"
                : "hover:ring-2 hover:ring-neutral-border hover:ring-offset-1",
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full",
                getPipelineColorDotClass(color),
              )}
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
