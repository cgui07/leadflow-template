import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { BotFlow, BotNode, BotContent } from "./bot-flow-types";
import { getWhatsAppConfig, sendAndSaveMessage, sendPresenceUpdate } from "@/lib/whatsapp";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((kw) => {
    const normalizedKw = normalizeText(kw);
    if (!normalizedKw) return false;
    return normalized === normalizedKw || normalized.includes(normalizedKw);
  });
}

function findNextNode(
  currentNode: BotNode,
  inboundText: string,
  nodes: BotNode[],
): BotNode | null {
  if (currentNode.conditions && currentNode.conditions.length > 0) {
    for (const condition of currentNode.conditions) {
      if (matchesKeywords(inboundText, condition.keywords)) {
        return nodes.find((n) => n.id === condition.nextNodeId) ?? null;
      }
    }
  }

  if (currentNode.defaultNextNodeId) {
    return nodes.find((n) => n.id === currentNode.defaultNextNodeId) ?? null;
  }

  return null;
}

async function sendNodeContents(
  contents: BotContent[],
  whatsappPhoneId: string,
  conversationId: string,
  replyJid: string,
) {
  const config = getWhatsAppConfig(whatsappPhoneId);

  for (const content of contents) {
    if (content.type === "text") {
      if (!content.value.trim()) continue;
      await sendPresenceUpdate(config, replyJid, "composing");
      await sendAndSaveMessage(config, conversationId, replyJid, content.value, "bot");
    } else if (content.type === "image") {
      await sendAndSaveMessage(config, conversationId, replyJid, content.caption ?? "", "bot", {
        type: "image",
        url: content.url,
        caption: content.caption,
      });
    } else if (content.type === "audio") {
      await sendAndSaveMessage(config, conversationId, replyJid, "", "bot", {
        type: "audio",
        url: content.url,
        mimetype: "audio/mpeg",
      });
    } else if (content.type === "pdf") {
      await sendAndSaveMessage(config, conversationId, replyJid, content.filename, "bot", {
        type: "document",
        url: content.url,
        caption: content.filename,
        fileName: content.filename,
        mimetype: "application/pdf",
      });
    }
  }
}

export function parseBotFlow(raw: unknown): BotFlow | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.nodes)) return null;
  return raw as BotFlow;
}

export async function executeBotFlow(params: {
  flow: BotFlow;
  conversationId: string;
  botCurrentNodeId: string | null;
  inboundText: string;
  whatsappPhoneId: string;
  replyJid: string;
}): Promise<boolean> {
  const { flow, conversationId, botCurrentNodeId, inboundText, whatsappPhoneId, replyJid } = params;

  if (!flow.nodes || flow.nodes.length === 0) return false;

  let targetNode: BotNode | null = null;

  if (botCurrentNodeId === null) {
    const firstNode = flow.nodes[0];
    const firstHasContent = firstNode.contents.some(
      (c) => c.type !== "text" || (c as { value: string }).value.trim() !== "",
    );

    if (!firstHasContent && firstNode.conditions && firstNode.conditions.length > 0) {
      // First node is a pure condition gateway (no content) —
      // treat the incoming message as a response to it directly.
      targetNode = findNextNode(firstNode, inboundText, flow.nodes);
      if (!targetNode) {
        // No condition matched — set state to first node and wait for a valid response
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { botCurrentNodeId: firstNode.id },
        });
        logger.info("[bot-flow] no condition matched on gateway node, waiting", { nodeId: firstNode.id });
        return true;
      }
    } else {
      // First node has content — send it as the opening message
      targetNode = firstNode;
    }
  } else {
    const currentNode = flow.nodes.find((n) => n.id === botCurrentNodeId);
    if (!currentNode) {
      logger.warn("[bot-flow] current node not found, restarting", { botCurrentNodeId });
      targetNode = flow.nodes[0];
    } else {
      targetNode = findNextNode(currentNode, inboundText, flow.nodes);
    }
  }

  if (!targetNode) {
    logger.info("[bot-flow] no next node, flow complete");
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { botCurrentNodeId: null },
    });
    return true;
  }

  // Chain through nodes that have no conditions (auto-send sequences)
  const nodesToSend: BotNode[] = [];
  let cursor: BotNode = targetNode;

  for (;;) {
    nodesToSend.push(cursor);
    const hasConditions = cursor.conditions && cursor.conditions.length > 0;
    if (hasConditions) break;
    const nextId = cursor.defaultNextNodeId;
    const next = nextId ? flow.nodes.find((n) => n.id === nextId) : undefined;
    if (!next) break;
    cursor = next;
  }

  const lastSent = nodesToSend[nodesToSend.length - 1];
  const willWait = !!(lastSent.conditions && lastSent.conditions.length > 0);

  for (const node of nodesToSend) {
    await sendNodeContents(node.contents, whatsappPhoneId, conversationId, replyJid);
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { botCurrentNodeId: willWait ? lastSent.id : null },
  });

  logger.info("[bot-flow] sent nodes", {
    count: nodesToSend.length,
    waitingAt: willWait ? lastSent.id : null,
  });

  return true;
}
