import { Badge } from "@/components/ui/Badge";

interface ConversationStatusBadgeProps {
  status: string;
}

export function ConversationStatusBadge({
  status,
}: ConversationStatusBadgeProps) {
  const isBot = status === "bot";

  return (
    <Badge variant={isBot ? "purple" : "success"} dot size="sm">
      {isBot ? "Bot ativo" : "Atendimento manual"}
    </Badge>
  );
}
