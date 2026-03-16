import { Container, Section } from "@/components/ui";
import { landingContent } from "@/features/landing/content";
import {
  LandingBenefitsSection,
  LandingDashboardPreview,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingProcessSection,
} from "@/components/landing";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-hero font-sans text-neutral-ink">
      <Container className="flex min-h-screen flex-col py-6">
        <LandingHeader
          brand={landingContent.brand}
          contactAction={landingContent.header.contactAction}
          flowAction={landingContent.header.flowAction}
        />
        <div className="grid flex-1 gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <LandingHero content={landingContent.hero} />
          <LandingDashboardPreview content={landingContent.preview} />
        </div>
      </Container>
      <Section
        className="border-y border-neutral-border bg-white/70 backdrop-blur"
        id={landingContent.process.id}
      >
        <LandingProcessSection content={landingContent.process} />
      </Section>
      <Section>
        <LandingBenefitsSection content={landingContent.benefits} />
      </Section>
      <Section className="border-t border-neutral-border" spacing="compact">
        <LandingFooter content={landingContent.footer} />
      </Section>
    </div>
  );
}
