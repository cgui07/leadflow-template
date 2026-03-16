import { ButtonLink, Card, CardContent } from "@/components/ui";
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
      <div className="inline-flex rounded-full border border-teal-dark/15 bg-white/85 px-3 py-1.5 text-xs font-medium text-teal-deep shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
        {content.eyebrow}
      </div>
      <div className="font-display mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-neutral-ink sm:mt-8 sm:text-5xl lg:text-6xl">
        {content.title}
      </div>
      <div className="font-body mt-5 max-w-xl text-base leading-7 text-neutral sm:mt-6 sm:text-lg sm:leading-8 lg:text-xl">
        {content.description}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4">
        <ButtonLink
          className="rounded-full bg-neutral-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-deep"
          href={content.primaryAction.href}
          rel={content.primaryAction.external ? "noreferrer" : undefined}
          size="lg"
          target={content.primaryAction.external ? "_blank" : undefined}
        >
          {content.primaryAction.label}
        </ButtonLink>
        <ButtonLink
          className="rounded-full border-neutral-border bg-white/80 text-neutral-dark shadow-sm backdrop-blur hover:bg-white"
          href={content.secondaryAction.href}
          size="lg"
          variant="outline"
        >
          {content.secondaryAction.label}
        </ButtonLink>
      </div>
      <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-3 sm:mt-12 sm:gap-4">
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
      className="min-h-[7.5rem] rounded-2xl border-neutral-border bg-white/90 shadow-sm backdrop-blur sm:min-h-[8.5rem] sm:rounded-3xl"
      noPadding
    >
      <CardContent className="flex min-h-[7.5rem] flex-col justify-between p-4 sm:min-h-[8.5rem] sm:p-6">
        <div className="text-[10px] text-neutral-muted sm:text-sm">
          {highlight.label}
        </div>
        <div className="font-display text-lg font-semibold leading-tight text-neutral-ink sm:text-2xl lg:text-[2rem]">
          {highlight.value}
        </div>
      </CardContent>
    </Card>
  );
}
