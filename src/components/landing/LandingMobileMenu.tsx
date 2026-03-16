"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import type { LandingAction } from "@/features/landing/content";

interface LandingMobileMenuProps {
  flowAction: LandingAction;
  contactAction: LandingAction;
}

export function LandingMobileMenu({
  flowAction,
  contactAction,
}: LandingMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen((currentState) => !currentState);

  return (
    <>
      <Button
        aria-controls="landing-mobile-menu"
        aria-expanded={isOpen}
        aria-label="Abrir menu"
        className="sm:hidden"
        icon={isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        onClick={toggleMenu}
        size="sm"
        variant="outline"
      />
      {isOpen ? (
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 flex flex-col gap-2 rounded-2xl border border-neutral-border bg-white p-4 shadow-lg sm:hidden"
          id="landing-mobile-menu"
        >
          <ButtonLink
            className="h-auto rounded-xl px-4 py-2.5 text-sm"
            href={flowAction.href}
            onClick={closeMenu}
            variant="outline"
          >
            {flowAction.label}
          </ButtonLink>
          <ButtonLink
            className="h-auto rounded-xl bg-neutral-ink px-4 py-2.5 text-sm hover:bg-neutral-deep"
            href={contactAction.href}
            onClick={closeMenu}
            rel={contactAction.external ? "noreferrer" : undefined}
            target={contactAction.external ? "_blank" : undefined}
          >
            {contactAction.label}
          </ButtonLink>
        </div>
      ) : null}
    </>
  );
}
