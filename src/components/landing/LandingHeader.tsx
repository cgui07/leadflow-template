import { ButtonLink, WhatsAppIcon } from "@/components/ui";
import type { LandingAction, LandingBrand } from "@/features/landing/content";

interface LandingHeaderProps {
  brand: LandingBrand;
  contactAction: LandingAction;
}

export function LandingHeader({
  brand,
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
        <ButtonLink
          className="h-11 rounded-full bg-whatsapp px-4 text-xs text-white shadow-none hover:bg-whatsapp-dark focus-visible:ring-whatsapp sm:px-5"
          icon={<WhatsAppIcon className="h-4 w-4 shrink-0" />}
          href={contactAction.href}
          rel={contactAction.external ? "noreferrer" : undefined}
          target={contactAction.external ? "_blank" : undefined}
        >
          {contactAction.label}
        </ButtonLink>
      </div>
    </div>
  );
}
