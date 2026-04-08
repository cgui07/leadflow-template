import { requireSession } from "@/features/auth/session";
import {
  listConversationMessages,
  listConversations,
} from "@/features/conversations/server";
import { ConversationsPageClient } from "@/features/conversations/components/ConversationsPageClient";

const DEFAULT_SUBTITLE = "Gerencie suas conversas do WhatsApp";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const conversationId =
    typeof params.conversationId === "string" ? params.conversationId : null;
  const search = typeof params.search === "string" ? params.search : null;
  const initialMessages = conversationId
    ? await listConversationMessages(session.user.id, conversationId).catch(() => null)
    : null;
  const conversations = await listConversations(session.user.id, search);

  return (
    <ConversationsPageClient
      initialConversations={conversations}
      initialMessages={initialMessages}
      initialSearch={search || ""}
      initialSelectedConversationId={conversationId}
      showSummary={session.branding.featureFlags.conversationSummary}
      subtitle={DEFAULT_SUBTITLE}
    />
  );
}
