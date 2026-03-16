import { prisma } from "./db";
import { generateAutoReply, qualifyLead } from "./ai";
import { normalizeAutoReplyDelaySeconds } from "./auto-reply-delay";
import {
  getWhatsAppConfig,
  resolveSendTarget,
  sendAndSaveMessage,
} from "./whatsapp";

interface ProcessScheduledAutoReplyInput {
  conversationId: string;
  triggerMessageId: string;
  delaySeconds: number;
  remoteJid: string;
  remoteJidAlt?: string | null;
  wasActiveConversation: boolean;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function processScheduledAutoReply(
  input: ProcessScheduledAutoReplyInput,
) {
  const delaySeconds = normalizeAutoReplyDelaySeconds(input.delaySeconds);

  if (delaySeconds > 0) {
    await wait(delaySeconds * 1000);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      lead: {
        include: {
          user: {
            include: {
              settings: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return;
  }

  const settings = conversation.lead.user.settings;

  if (!settings?.whatsappPhoneId || !settings.autoReplyEnabled) {
    return;
  }

  if (conversation.status !== "bot" && conversation.status !== "active") {
    return;
  }

  const latestMessage = conversation.messages[0];

  if (
    !latestMessage ||
    latestMessage.id !== input.triggerMessageId ||
    latestMessage.direction !== "inbound"
  ) {
    return;
  }

  const replyJid = resolveSendTarget(
    input.remoteJidAlt,
    input.remoteJid,
    conversation.whatsappChatId,
    conversation.lead.phone,
  );

  if (!replyJid) {
    console.warn(
      "[auto-reply] Skipping reply because the target JID could not be resolved:",
      input.remoteJid,
    );
    return;
  }

  const orderedMessages = [...conversation.messages].reverse();

  if (settings.aiApiKey) {
    const aiConfig = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel,
    };
    const reply = await generateAutoReply(
      aiConfig,
      conversation.lead.user.name,
      orderedMessages.map((message) => ({
        direction: message.direction,
        content: message.content,
        sender: message.sender,
      })),
    );

    if (!reply) {
      return;
    }

    await sendAndSaveMessage(
      getWhatsAppConfig(settings.whatsappPhoneId),
      conversation.id,
      replyJid,
      reply,
      "bot",
    );

    const messageCount = orderedMessages.length + 1;

    if (messageCount >= 3 && messageCount % 2 === 1) {
      await qualifyLead(conversation.lead.id, aiConfig);
    }

    return;
  }

  if (!input.wasActiveConversation || !settings.greetingMessage) {
    return;
  }

  await sendAndSaveMessage(
    getWhatsAppConfig(settings.whatsappPhoneId),
    conversation.id,
    replyJid,
    settings.greetingMessage,
    "bot",
  );
}
