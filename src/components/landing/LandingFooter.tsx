import { BrandLogo } from "@/components/ui";
import { LandingContactAction } from "./LandingContactAction";
import type {
  LandingBrand,
  LandingFooterContent,
} from "@/features/landing/content";

interface LandingFooterProps {
  brand: LandingBrand;
  content: LandingFooterContent;
}

export function LandingFooter({ brand, content }: LandingFooterProps) {
  return (
    <div className="space-y-3 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:space-y-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 rounded-full border border-neutral-border bg-white-70 px-3 py-1.5 shadow-sm backdrop-blur sm:gap-3 sm:px-4 sm:py-2">
          {brand.logoUrl ? (
            <BrandLogo
              src={brand.logoUrl}
              alt={`${brand.name} logo`}
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg bg-white p-1 object-contain shadow-sm sm:h-8 sm:w-8 sm:rounded-xl"
            />
          ) : null}
          <div className="font-display truncate text-xs font-semibold uppercase tracking-[0.18em] text-teal-dark sm:text-sm sm:tracking-[0.22em]">
            {brand.name}
          </div>
        </div>
        <LandingContactAction
          action={content.action}
          align="center"
          buttonClassName="h-9 shrink-0 rounded-full bg-neutral-ink px-3.5 text-xs shadow-none hover:bg-neutral-deep sm:h-10 sm:px-5 sm:text-sm"
          noteClassName="hidden"
        />
      </div>
      <div className="text-center text-xs text-neutral-muted sm:text-left sm:text-sm">
        {content.label}
      </div>
    </div>
  );
}
