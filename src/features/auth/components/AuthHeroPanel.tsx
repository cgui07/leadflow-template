import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuthHeroPanelProps {
  children?: ReactNode;
  className?: string;
  description: ReactNode;
  eyebrow?: string;
  title: ReactNode;
}

export function AuthHeroPanel({
  children,
  className,
  description,
  eyebrow,
  title,
}: AuthHeroPanelProps) {
  return (
    <aside
      className={cn(
        "relative hidden items-center justify-center overflow-hidden p-12 lg:flex lg:w-1/2",
        className,
      )}
    >
      <div className="absolute inset-0">
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-white-10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-info-10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg text-white">
        {eyebrow ? (
          <div className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-blue-ice-70">
            {eyebrow}
          </div>
        ) : null}
        <div className="text-4xl font-bold leading-tight tracking-tight">
          {title}
        </div>
        <div className="mt-6 text-lg leading-relaxed text-blue-ice-80">
          {description}
        </div>
        {children ? <div className="mt-12">{children}</div> : null}
      </div>
    </aside>
  );
}
