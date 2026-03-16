import { cn } from "@/lib/utils";
import { Badge, Card, CardContent } from "@/components/ui";
import type {
  LandingConversationContent,
  LandingConversationEntry,
  LandingPreviewContent,
  LandingPreviewSummary,
  LandingPriorityLead,
  LandingProfileField,
  LandingSupportCard,
} from "@/features/landing/content";

interface LandingDashboardPreviewProps {
  content: LandingPreviewContent;
}

interface LeadPriorityPanelProps {
  summary: LandingPreviewSummary;
  priorityLeads: readonly LandingPriorityLead[];
}

interface PriorityLeadCardProps {
  lead: LandingPriorityLead;
}

interface ConversationPreviewProps {
  conversation: LandingConversationContent;
}

interface ConversationBubbleProps {
  entry: LandingConversationEntry;
}

interface ProfileFieldCardProps {
  field: LandingProfileField;
}

interface PreviewSupportCardProps {
  card: LandingSupportCard;
}

export function LandingDashboardPreview({
  content,
}: LandingDashboardPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-border bg-neutral-ink p-3 text-white shadow-hero sm:rounded-[2rem] sm:p-4">
      <div className="grid gap-3 sm:gap-4 lg:items-start lg:grid-cols-[0.8fr_1.2fr] xl:grid-cols-[0.78fr_1.22fr]">
        <LeadPriorityPanel
          priorityLeads={content.priorityLeads}
          summary={content.summary}
        />
        <div className="space-y-3 sm:space-y-4">
          <ConversationPreview conversation={content.conversation} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-4">
            {content.supportCards.map((card) => (
              <PreviewSupportCard card={card} key={card.title} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadPriorityPanel({
  summary,
  priorityLeads,
}: LeadPriorityPanelProps) {
  return (
    <div className="self-start rounded-xl bg-white/6 p-3 sm:rounded-3xl sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-muted sm:text-xs">
        {summary.label}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
        <div className="text-xl font-semibold sm:shrink-0 sm:whitespace-nowrap sm:text-2xl">
          {summary.value}
        </div>
        <Badge
          className="shrink-0 whitespace-nowrap bg-green-emerald/18 px-3 py-1 text-[10px] font-medium text-green-sage sm:text-xs"
          size="sm"
        >
          {summary.badge}
        </Badge>
      </div>
      <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
        {priorityLeads.map((lead) => (
          <PriorityLeadCard key={lead.name} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function PriorityLeadCard({ lead }: PriorityLeadCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:rounded-[1.25rem] sm:p-4">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold sm:text-base">{lead.name}</div>
        <Badge
          className="shrink-0 whitespace-nowrap bg-orange-amber/15 px-3 py-1 text-[10px] font-semibold text-yellow-lemon sm:text-xs"
          size="sm"
        >
          {lead.score}
        </Badge>
      </div>
      <div className="mt-1 text-xs text-neutral-muted sm:text-sm">
        {lead.stage}
      </div>
      <div className="mt-2 text-xs leading-5 text-neutral-muted sm:mt-3 sm:text-sm sm:leading-6">
        {lead.detail}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-neutral sm:mt-4 sm:text-xs">
        <div>Proxima acao</div>
        <div>{lead.eta}</div>
      </div>
    </div>
  );
}

function ConversationPreview({ conversation }: ConversationPreviewProps) {
  return (
    <Card className="rounded-xl text-neutral-ink sm:rounded-3xl" noPadding>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-[0.24em] text-neutral sm:text-xs">
            {conversation.label}
          </div>
          <Badge className="bg-teal-dark px-3 py-1 text-[10px] font-semibold text-white sm:text-xs">
            {conversation.badge}
          </Badge>
        </div>
        <div className="font-display mt-2 text-xl font-semibold sm:text-2xl">
          {conversation.leadName}
        </div>
        <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-3">
          {conversation.messages.map((entry, index) => (
            <ConversationBubble
              entry={entry}
              key={`${entry.role}-${entry.message}-${index}`}
            />
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-neutral-border bg-white px-3 py-3 sm:mt-5 sm:rounded-[1.25rem] sm:px-4 sm:py-4">
          <div className="text-[10px] uppercase tracking-[0.24em] text-neutral sm:text-xs">
            {conversation.profileLabel}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-4 sm:gap-3.5 lg:grid-cols-1">
            {conversation.profileFields.map((field) => (
              <ProfileFieldCard field={field} key={field.label} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConversationBubble({ entry }: ConversationBubbleProps) {
  const isAssistantMessage = entry.role === "Assistente";
  const bubbleClassName = isAssistantMessage
    ? "bg-neutral-surface text-neutral-dark"
    : "ml-auto bg-teal-dark text-white";

  return (
    <div
      className={cn(
        "max-w-[92%] rounded-xl px-3 py-2.5 text-xs leading-5 shadow-sm sm:rounded-[1.25rem] sm:px-4 sm:py-3 sm:text-sm sm:leading-6",
        bubbleClassName,
      )}
    >
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.24em] opacity-65 sm:text-[11px]">
        {entry.role}
      </div>
      <div>{entry.message}</div>
    </div>
  );
}

function ProfileFieldCard({ field }: ProfileFieldCardProps) {
  return (
    <div className="rounded-xl bg-neutral-surface p-2.5 sm:min-h-[7rem] sm:rounded-2xl sm:p-3.5 lg:min-h-0">
      <div className="text-[10px] leading-4 text-neutral-muted sm:text-[11px]">
        {field.label}
      </div>
      <div className="mt-1 text-sm font-semibold leading-5 tracking-tight text-neutral-ink sm:text-[1.05rem] sm:leading-6 lg:mt-2">
        {field.value}
      </div>
    </div>
  );
}

function PreviewSupportCard({ card }: PreviewSupportCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/6 p-3 sm:rounded-3xl sm:p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-neutral-muted sm:text-xs">
        {card.title}
      </div>
      <div className="mt-1.5 text-xs font-medium text-white sm:mt-2 sm:text-sm">
        {card.description}
      </div>
    </div>
  );
}
