import { prisma } from "./db";

const PRICE_KEYWORDS =
  /preço|valor|quanto|custo|orçamento|R\$|mil reais|financiamento|parcela|entrada/i;

const LOCATION_KEYWORDS =
  /bairro|localização|fica onde|onde fica|região|perto de|endereço|localizado/i;

const FEATURES_KEYWORDS =
  /quarto|suíte|suite|m²|metragem|vaga|garagem|área|tamanho|andar|piscina|academia|lazer|churrasqueira|varanda|sacada|diferencial/i;

const VISIT_KEYWORDS =
  /visita|visitar|agendar|agenda|reunião|apresentação|conhecer|ver o imóvel|quando posso|horário|disponível/i;

const DECISION_KEYWORDS =
  /comprar|fechar|negócio|proposta|financiar|documentos|sinal|decidir|fechar negócio|vou comprar|tenho interesse/i;

const INTEREST_KEYWORDS =
  /gostei|interessante|me interessa|quero saber mais|pode me passar|tem foto|me manda|mais detalhes|conta mais|fala mais sobre/i;

export interface IntentSignals {
  hasHighIntent: boolean;
  signals: string[];
}

export function detectIntentSignals(text: string): IntentSignals {
  const signals: string[] = [];

  if (PRICE_KEYWORDS.test(text)) signals.push("price");
  if (LOCATION_KEYWORDS.test(text)) signals.push("location");
  if (FEATURES_KEYWORDS.test(text)) signals.push("features");
  if (VISIT_KEYWORDS.test(text)) signals.push("visit");
  if (DECISION_KEYWORDS.test(text)) signals.push("decision");
  if (INTEREST_KEYWORDS.test(text)) signals.push("interest");

  return { hasHighIntent: signals.length > 0, signals };
}

import { MIN_REPLY_LENGTH, AUDIO_COOLDOWN_WINDOW } from "./constants";

export interface VoiceDecisionContext {
  replyText: string;
  inboundText: string;
  isFirstBotReply: boolean;
  recentOutboundMessages: Array<{ type: string }>;
  voiceEnabled: boolean;
  monthlyLimit: number;
  currentMonthUsage: number;
}

export interface VoiceDecision {
  useVoice: boolean;
  reason: string;
}

export function shouldUseVoiceReply(ctx: VoiceDecisionContext): VoiceDecision {
  if (!ctx.voiceEnabled) {
    return { useVoice: false, reason: "voice_disabled" };
  }

  if (ctx.currentMonthUsage >= ctx.monthlyLimit) {
    return { useVoice: false, reason: "monthly_limit_reached" };
  }

  if (ctx.replyText.length < MIN_REPLY_LENGTH) {
    return { useVoice: false, reason: "reply_too_short" };
  }

  const recentAudioCount = ctx.recentOutboundMessages
    .slice(0, AUDIO_COOLDOWN_WINDOW)
    .filter((m) => m.type === "audio").length;

  if (recentAudioCount > 0) {
    return { useVoice: false, reason: "audio_cooldown" };
  }

  if (ctx.isFirstBotReply) {
    return { useVoice: true, reason: "first_reply" };
  }

  const { hasHighIntent, signals } = detectIntentSignals(ctx.inboundText);
  if (hasHighIntent) {
    return { useVoice: true, reason: `intent:${signals.join(",")}` };
  }

  return { useVoice: false, reason: "no_trigger" };
}

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getVoiceUsageThisMonth(userId: string): Promise<number> {
  const month = getCurrentMonth();

  const record = await prisma.voiceReplyUsage.findUnique({
    where: { userId_month: { userId, month } },
    select: { count: true },
  });

  return record?.count ?? 0;
}

export async function incrementVoiceUsage(userId: string): Promise<void> {
  const month = getCurrentMonth();

  await prisma.voiceReplyUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, count: 1 },
    update: { count: { increment: 1 } },
  });
}
