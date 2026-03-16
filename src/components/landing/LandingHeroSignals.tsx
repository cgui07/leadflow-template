import { Badge, Card, CardContent } from "@/components/ui";
import { Handshake, MessageCircleMore, ScanSearch } from "lucide-react";
import type {
  LandingHeroSignal,
  LandingHeroSignalIcon,
} from "@/features/landing/content";

interface LandingHeroSignalsProps {
  signals: readonly LandingHeroSignal[];
}

interface LandingHeroSignalCardProps {
  signal: LandingHeroSignal;
}

const signalIconMap: Record<LandingHeroSignalIcon, typeof MessageCircleMore> = {
  lead: MessageCircleMore,
  qualify: ScanSearch,
  handoff: Handshake,
};

export function LandingHeroSignals({ signals }: LandingHeroSignalsProps) {
  return (
    <div className="hidden gap-3 sm:grid lg:grid-cols-3">
      {signals.map((signal) => (
        <LandingHeroSignalCard key={signal.title} signal={signal} />
      ))}
    </div>
  );
}

function LandingHeroSignalCard({ signal }: LandingHeroSignalCardProps) {
  const Icon = signalIconMap[signal.icon];

  return (
    <Card
      className="rounded-[1.5rem] border-white-70 bg-white-78 shadow-soft backdrop-blur"
      noPadding
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-mist text-teal-deep">
            <Icon className="h-4 w-4" />
          </div>
          <Badge className="bg-neutral-ink px-2.5 py-1 text-[10px] font-semibold text-white">
            {signal.badge}
          </Badge>
        </div>
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-muted">
          {signal.label}
        </div>
        <div className="mt-2 text-sm font-semibold leading-6 text-neutral-ink">
          {signal.title}
        </div>
        <div className="mt-2 text-xs leading-5 text-neutral-steel">
          {signal.description}
        </div>
      </CardContent>
    </Card>
  );
}
