import { ButtonLink } from "@/components/ui";
import type { LandingFooterContent } from "@/features/landing/content";

interface LandingFooterProps {
  content: LandingFooterContent;
}

export function LandingFooter({ content }: LandingFooterProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-xs text-neutral-muted sm:text-sm">
        {content.label}
      </div>
      <ButtonLink
        className="h-10 rounded-full bg-neutral-ink px-5 text-sm shadow-none hover:bg-neutral-deep"
        href={content.action.href}
        rel={content.action.external ? "noreferrer" : undefined}
        target={content.action.external ? "_blank" : undefined}
      >
        {content.action.label}
      </ButtonLink>
    </div>
  );
}
