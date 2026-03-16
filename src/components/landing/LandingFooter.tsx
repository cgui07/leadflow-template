import { LandingContactAction } from "./LandingContactAction";
import type { LandingFooterContent } from "@/features/landing/content";

interface LandingFooterProps {
  content: LandingFooterContent;
}

export function LandingFooter({ content }: LandingFooterProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-center text-xs text-neutral-muted sm:text-left sm:text-sm">
        {content.label}
      </div>
      <LandingContactAction
        action={content.action}
        align="center"
        buttonClassName="h-10 rounded-full bg-neutral-ink px-5 text-sm shadow-none hover:bg-neutral-deep"
        noteClassName="hidden"
      />
    </div>
  );
}
