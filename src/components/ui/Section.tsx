import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Container } from "./Container";

type SectionSpacing = "default" | "compact" | "none";

const spacingStyles: Record<SectionSpacing, string> = {
  default: "py-14 sm:py-20",
  compact: "py-6 sm:py-8",
  none: "",
};

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  spacing?: SectionSpacing;
}

export function Section({
  children,
  className,
  containerClassName,
  id,
  spacing = "default",
}: SectionProps) {
  return (
    <div className={cn(spacingStyles[spacing], className)} id={id}>
      <Container className={containerClassName}>{children}</Container>
    </div>
  );
}
