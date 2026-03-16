import { Card, CardContent } from "@/components/ui";
import { LandingFlowJourney } from "./LandingFlowJourney";
import { LandingSectionIntro } from "./LandingSectionIntro";
import type {
  LandingProcessSectionContent,
  LandingProcessStep,
} from "@/features/landing/content";

interface LandingProcessSectionProps {
  content: LandingProcessSectionContent;
}

interface LandingProcessStepCardProps {
  step: LandingProcessStep;
  stepNumber: string;
}

export function LandingProcessSection({
  content,
}: LandingProcessSectionProps) {
  return (
    <div>
      <LandingSectionIntro
        className="mx-auto text-center sm:mx-0 sm:max-w-none sm:text-left"
        description={content.description}
        descriptionClassName="text-neutral sm:max-w-none"
        eyebrow={content.eyebrow}
        eyebrowClassName="text-yellow-gold"
        title={content.title}
        titleClassName="text-neutral-ink sm:max-w-none"
      />
      <div className="mt-8 sm:mt-10">
        <LandingFlowJourney
          content={{
            customerPerspectiveDescription:
              content.customerPerspectiveDescription,
            customerPerspectiveEyebrow: content.customerPerspectiveEyebrow,
            customerPerspectiveTitle: content.customerPerspectiveTitle,
            journeyBadge: content.journeyBadge,
            journeyDescription: content.journeyDescription,
            journeyLabel: content.journeyLabel,
            journeyTitle: content.journeyTitle,
            outcomes: content.outcomes,
            stages: content.stages,
          }}
        />
      </div>
      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-5 lg:grid-cols-3">
        {content.steps.map((step, index) => (
          <LandingProcessStepCard
            key={step.title}
            step={step}
            stepNumber={String(index + 1).padStart(2, "0")}
          />
        ))}
      </div>
    </div>
  );
}

function LandingProcessStepCard({
  step,
  stepNumber,
}: LandingProcessStepCardProps) {
  return (
    <Card
      className="rounded-2xl border-neutral-border bg-white-90 shadow-soft backdrop-blur sm:rounded-[1.75rem]"
      noPadding
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-ink text-sm font-semibold text-white sm:h-12 sm:w-12 sm:rounded-2xl sm:text-lg">
            {stepNumber}
          </div>
          <div className="rounded-full bg-neutral-pale px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-dark sm:text-xs">
            etapa essencial
          </div>
        </div>
        <div className="font-display mt-5 text-xl font-semibold text-neutral-ink sm:mt-6 sm:text-2xl">
          {step.title}
        </div>
        <div className="font-body mt-3 text-sm leading-6 text-neutral sm:mt-4 sm:text-base sm:leading-7">
          {step.description}
        </div>
      </CardContent>
    </Card>
  );
}
