import { cn } from "@/lib/utils";

interface LandingSectionIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function LandingSectionIntro({
  eyebrow,
  title,
  description,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: LandingSectionIntroProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <div
        className={cn(
          "font-display text-xs font-semibold uppercase tracking-[0.28em] sm:text-sm",
          eyebrowClassName,
        )}
      >
        {eyebrow}
      </div>
      <div
        className={cn(
          "font-display mt-4 text-2xl font-semibold tracking-tight sm:mt-5 sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </div>
      <div
        className={cn(
          "font-body mt-4 text-base leading-7 sm:mt-5 sm:text-lg sm:leading-8",
          descriptionClassName,
        )}
      >
        {description}
      </div>
    </div>
  );
}
