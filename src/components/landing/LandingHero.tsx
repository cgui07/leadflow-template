import { Card, CardContent } from "@/components/ui";
import { LandingHeroSignals } from "./LandingHeroSignals";
import { LandingContactAction } from "./LandingContactAction";
import type {
  LandingHeroContent,
  LandingHighlight,
} from "@/features/landing/content";

interface LandingHeroProps {
  content: LandingHeroContent;
}

interface HeroHighlightCardProps {
  highlight: LandingHighlight;
}

export function LandingHero({ content }: LandingHeroProps) {
  return (
    <div className="max-w-2xl">
      <div className="mb-6 sm:mb-8">
        <LandingHeroSignals signals={content.signals} />
      </div>
      <div className="flex justify-center sm:justify-start">
        <div className="inline-flex rounded-full border border-teal-dark-15 bg-white-85 px-3 py-1.5 text-center text-xs font-medium text-teal-deep shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
          {content.eyebrow}
        </div>
      </div>
      <div className="font-display mt-6 text-center text-3xl font-semibold leading-[1.08] tracking-tight text-neutral-ink sm:mt-8 sm:text-left sm:text-5xl lg:text-6xl">
        {content.title}
      </div>
      <div className="font-body mx-auto mt-5 max-w-xl text-center text-base leading-7 text-neutral sm:mx-0 sm:mt-6 sm:text-left sm:text-lg sm:leading-8 lg:text-xl">
        {content.description}
      </div>
      <div className="mt-8 sm:mt-10">
        <LandingContactAction
          action={content.primaryAction}
          align="mobile-center"
          buttonClassName="w-full rounded-full bg-neutral-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-deep sm:w-auto"
          noteClassName="max-w-lg"
          size="lg"
        />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 xl:mt-12">
        {content.highlights.map((highlight) => (
          <HeroHighlightCard highlight={highlight} key={highlight.label} />
        ))}
      </div>
    </div>
  );
}

function HeroHighlightCard({ highlight }: HeroHighlightCardProps) {
  return (
    <Card
      className="rounded-2xl border-neutral-border bg-white-90 shadow-sm backdrop-blur sm:rounded-3xl"
      noPadding
    >
      <CardContent className="flex min-h-[5.5rem] flex-col items-center justify-between p-4 text-center sm:min-h-[6.5rem] sm:items-start sm:p-5 sm:text-left">
        <div className="text-[10px] text-neutral-muted sm:text-xs">
          {highlight.label}
        </div>
        <div className="font-display text-lg font-semibold leading-tight text-neutral-ink sm:text-[1.75rem]">
          {highlight.value}
        </div>
      </CardContent>
    </Card>
  );
}
