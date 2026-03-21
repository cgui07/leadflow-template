import { prisma } from "@/lib/db";
import { extractLeadProfile } from "@/lib/ai";
import type { AIConfig } from "@/lib/ai-client";
import { checkHotLeadAlert } from "@/lib/alerts";
import { upsertLeadActionFromAI } from "@/lib/lead-actions";
import {
  calculateLeadScore,
  getLeadStatusFromScore,
  getLeadTemperatureLabel,
  normalizeExtractedLeadProfile,
} from "@/lib/lead-scoring";

export async function qualifyLead(leadId: string, config: AIConfig) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      conversation: {
        include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
      },
    },
  });

  if (!lead?.conversation?.messages.length) return null;

  const extractedProfile = await extractLeadProfile(
    config,
    lead.conversation.messages,
  );
  if (!extractedProfile) return null;

  const normalizedProfile = normalizeExtractedLeadProfile(extractedProfile);
  const inboundMessageCount = lead.conversation.messages.filter((message) => {
    return message.direction === "inbound";
  }).length;
  const score = calculateLeadScore(normalizedProfile, inboundMessageCount);
  const previousScore = lead.score;
  const temperatureLabel = getLeadTemperatureLabel(score);

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      region: normalizedProfile.region,
      propertyType: normalizedProfile.propertyType,
      priceMin: normalizedProfile.priceMin,
      priceMax: normalizedProfile.priceMax,
      purpose: normalizedProfile.purpose,
      timeline: normalizedProfile.timeline,
      bedrooms: normalizedProfile.bedrooms,
      score,
      notes: normalizedProfile.notes,
      status: getLeadStatusFromScore(score),
    },
  });

  await checkHotLeadAlert(leadId, previousScore, score);

  await prisma.activity.create({
    data: {
      userId: lead.userId,
      leadId: lead.id,
      type: "ai_qualification",
      title: "Lead qualificado pela IA",
      description: `Score: ${score}/100 (${temperatureLabel}) - ${normalizedProfile.notes || "Sem observações relevantes."}`,
      metadata: {
        ...normalizedProfile,
        score,
        temperature: temperatureLabel,
        inboundMessageCount,
      },
    },
  });

  const actionPromises: Promise<unknown>[] = [];
  if (normalizedProfile.requestedVisit) {
    actionPromises.push(upsertLeadActionFromAI(lead.userId, lead.id, "visit"));
  }
  if (normalizedProfile.requestedProposal) {
    actionPromises.push(
      upsertLeadActionFromAI(lead.userId, lead.id, "proposal"),
    );
  }
  if (normalizedProfile.requestedFinancing) {
    actionPromises.push(
      upsertLeadActionFromAI(lead.userId, lead.id, "financing"),
    );
  }
  if (actionPromises.length > 0) {
    await Promise.all(actionPromises);
  }

  return updated;
}
