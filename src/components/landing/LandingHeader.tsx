import { ButtonLink } from "@/components/ui";
import { LandingMobileMenu } from "./LandingMobileMenu";
import type { LandingAction, LandingBrand } from "@/features/landing/content";

interface LandingHeaderProps {
  brand: LandingBrand;
  flowAction: LandingAction;
  contactAction: LandingAction;
}

export function LandingHeader({
  brand,
  flowAction,
  contactAction,
}: LandingHeaderProps) {
  return (
    <div className="relative border-b border-neutral-border pb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-sm font-bold uppercase tracking-[0.32em] text-teal-dark sm:text-base">
            {brand.name}
          </div>
          <div className="mt-1 hidden text-sm text-neutral sm:block">
            {brand.description}
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <ButtonLink
            className="h-10 rounded-full bg-white/80 px-4 text-xs shadow-sm backdrop-blur hover:bg-white"
            href={flowAction.href}
            variant="outline"
          >
            {flowAction.label}
          </ButtonLink>
          <ButtonLink
            className="h-10 rounded-full bg-neutral-ink px-4 text-xs shadow-none hover:bg-neutral-deep"
            href={contactAction.href}
            rel={contactAction.external ? "noreferrer" : undefined}
            target={contactAction.external ? "_blank" : undefined}
          >
            {contactAction.label}
          </ButtonLink>
        </div>
        <LandingMobileMenu
          contactAction={contactAction}
          flowAction={flowAction}
        />
      </div>
    </div>
  );
}
