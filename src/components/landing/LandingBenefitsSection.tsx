import { Card, CardContent } from "@/components/ui";
import { LandingSectionIntro } from "./LandingSectionIntro";
import type {
  LandingBenefit,
  LandingBenefitsSectionContent,
} from "@/features/landing/content";

interface LandingBenefitsSectionProps {
  content: LandingBenefitsSectionContent;
}

interface LandingBenefitCardProps {
  benefit: LandingBenefit;
}

export function LandingBenefitsSection({
  content,
}: LandingBenefitsSectionProps) {
  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-neutral-border bg-neutral-ink p-6 text-white shadow-hero-soft sm:rounded-[2rem] sm:p-8">
        <LandingSectionIntro
          description={content.description}
          descriptionClassName="text-neutral-muted"
          eyebrow={content.eyebrow}
          eyebrowClassName="text-green-mint"
          title={content.title}
          titleClassName="text-white"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {content.items.map((benefit) => (
          <LandingBenefitCard
            benefit={benefit}
            key={benefit.description}
          />
        ))}
      </div>
    </div>
  );
}

function LandingBenefitCard({ benefit }: LandingBenefitCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm sm:rounded-[1.75rem]" noPadding>
      <CardContent className="p-5 sm:p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-butter text-base text-yellow-dark sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
          +
        </div>
        <div className="font-body mt-4 text-sm leading-6 text-neutral sm:mt-5 sm:text-lg sm:leading-7">
          {benefit.description}
        </div>
      </CardContent>
    </Card>
  );
}
