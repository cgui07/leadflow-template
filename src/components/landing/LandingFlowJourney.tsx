import { Fragment } from "react";
import { Badge, Card, CardContent } from "@/components/ui";
import {
  ArrowRight,
  Bot,
  Handshake,
  MessageCircleMore,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type {
  LandingProcessOutcome,
  LandingProcessSectionContent,
  LandingProcessStage,
  LandingProcessStageIcon,
} from "@/features/landing/content";

interface LandingFlowJourneyProps {
  content: Pick<
    LandingProcessSectionContent,
    | "customerPerspectiveDescription"
    | "customerPerspectiveEyebrow"
    | "customerPerspectiveTitle"
    | "journeyBadge"
    | "journeyDescription"
    | "journeyLabel"
    | "journeyTitle"
    | "outcomes"
    | "stages"
  >;
}

interface LandingFlowStageCardProps {
  stage: LandingProcessStage;
  stageNumber: string;
}

interface LandingFlowOutcomeCardProps {
  outcome: LandingProcessOutcome;
}

const stageIconMap: Record<LandingProcessStageIcon, typeof MessageCircleMore> = {
  lead: MessageCircleMore,
  reply: Bot,
  qualify: ScanSearch,
  prioritize: TrendingUp,
  handoff: Handshake,
};

export function LandingFlowJourney({ content }: LandingFlowJourneyProps) {
  return (
    <Card
      className="landing-flow-spotlight overflow-hidden rounded-[1.75rem] border-neutral-border bg-landing-flow-journey text-white shadow-hero-soft sm:rounded-[2rem]"
      noPadding
    >
      <CardContent className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl text-center lg:max-w-none lg:flex-1 lg:text-left">
            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-teal-aqua sm:text-xs">
              {content.journeyLabel}
            </div>
            <div className="font-display mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem] lg:max-w-4xl">
              {content.journeyTitle}
            </div>
            <div className="mt-3 max-w-2xl text-sm leading-6 text-neutral-silver sm:text-base sm:leading-7">
              {content.journeyDescription}
            </div>
          </div>
          <Badge className="self-center bg-white-10 px-3 py-1.5 text-[11px] font-semibold text-white sm:text-xs lg:self-auto">
            {content.journeyBadge}
          </Badge>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-2">
          {content.stages.map((stage, index) => (
            <Fragment key={stage.title}>
              <LandingFlowStageCard
                stage={stage}
                stageNumber={String(index + 1).padStart(2, "0")}
              />
              {index < content.stages.length - 1 ? (
                <div className="hidden items-center justify-center text-white-35 lg:flex">
                  <ArrowRight className="h-5 w-5" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-3xl border border-white-10 bg-white-8 p-4 backdrop-blur sm:p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-yellow-butter sm:text-xs">
              {content.customerPerspectiveEyebrow}
            </div>
            <div className="font-display mt-3 text-xl font-semibold text-white sm:text-2xl">
              {content.customerPerspectiveTitle}
            </div>
            <div className="mt-3 max-w-xl text-sm leading-6 text-neutral-silver sm:text-base sm:leading-7">
              {content.customerPerspectiveDescription}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {content.outcomes.map((outcome) => (
              <LandingFlowOutcomeCard key={outcome.label} outcome={outcome} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LandingFlowStageCard({
  stage,
  stageNumber,
}: LandingFlowStageCardProps) {
  const Icon = stageIconMap[stage.icon];

  return (
    <div className="flex-1 rounded-3xl border border-white-10 bg-white-7 p-4 backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white-10 text-teal-aqua">
          <Icon className="h-5 w-5" />
        </div>
        <Badge className="bg-white-10 px-2.5 py-1 text-[10px] font-semibold text-white">
          {stage.metric}
        </Badge>
      </div>
      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white-55 sm:text-xs">
        etapa {stageNumber}
      </div>
      <div className="mt-2 text-sm font-semibold text-teal-aqua sm:text-base">
        {stage.label}
      </div>
      <div className="mt-2 font-display text-lg font-semibold leading-tight text-white sm:text-xl">
        {stage.title}
      </div>
      <div className="mt-3 text-sm leading-6 text-neutral-silver">
        {stage.description}
      </div>
    </div>
  );
}

function LandingFlowOutcomeCard({ outcome }: LandingFlowOutcomeCardProps) {
  return (
    <div className="rounded-3xl border border-white-10 bg-white-8 p-4 backdrop-blur sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-butter-12 text-yellow-butter">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white-55 sm:text-xs">
        {outcome.label}
      </div>
      <div className="font-display mt-2 text-lg font-semibold text-white sm:text-xl">
        {outcome.value}
      </div>
      <div className="mt-2 text-sm leading-6 text-neutral-silver">
        {outcome.description}
      </div>
    </div>
  );
}
