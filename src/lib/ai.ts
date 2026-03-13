import { prisma } from "./db";
import { checkHotLeadAlert } from "./alerts";

interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
}

function getQualificationPrompt(agentName: string) {
  return `Você é um assistente de atendimento imobiliário que trabalha para o corretor ${agentName}. Seu objetivo é:

1. Receber o cliente de forma educada e profissional
2. Fazer perguntas curtas e objetivas para qualificar o interesse
3. Coletar: região desejada, tipo de imóvel, faixa de valor, prazo de compra, finalidade (morar/investir)
4. Identificar o nível de interesse do cliente (frio, morno, quente)
5. Quando o lead estiver qualificado, informar que o corretor entrará em contato

Regras:
- Mensagens CURTAS (máximo 2 frases por mensagem)
- Tom profissional mas amigável
- NÃO invente informações sobre imóveis disponíveis
- NÃO mencione preços específicos de imóveis
- Faça UMA pergunta por vez
- Se o cliente perguntar sobre um imóvel específico, diga que o corretor vai entrar em contato com opções

Responda APENAS com a mensagem para o cliente, sem explicações adicionais.`;
}

function getExtractionPrompt() {
  return `Analise a conversa abaixo e extraia as informações do lead em formato JSON. Retorne APENAS o JSON, sem markdown ou explicações.

Formato esperado:
{
  "region": "região mencionada ou null",
  "propertyType": "apartamento|casa|terreno|comercial ou null",
  "priceMin": número ou null,
  "priceMax": número ou null,
  "purpose": "morar|investir|alugar ou null",
  "timeline": "imediato|30dias|60dias|90dias|semestre|ano ou null",
  "bedrooms": número ou null,
  "score": número de 0 a 100,
  "notes": "resumo breve do interesse do cliente"
}

Score guide:
- 0-30: Apenas pesquisando, sem urgência
- 31-60: Interesse moderado, pode comprar em breve
- 61-80: Interesse alto, sabe o que quer
- 81-100: Pronto para comprar, urgente`;
}

async function callAI(config: AIConfig, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  if (config.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model || "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      max_tokens: 300,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });
  const data = await res.json();
  console.log("[ai] OpenAI response status:", res.status, "data:", JSON.stringify(data).substring(0, 300));
  return data.choices?.[0]?.message?.content || "";
}

export async function generateAutoReply(
  config: AIConfig,
  agentName: string,
  conversationMessages: Array<{ direction: string; content: string; sender: string }>
) {
  const systemPrompt = getQualificationPrompt(agentName);

  const messages = conversationMessages.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.content,
  }));

  return callAI(config, systemPrompt, messages);
}

export async function extractLeadProfile(
  config: AIConfig,
  conversationMessages: Array<{ direction: string; content: string }>
) {
  const conversationText = conversationMessages
    .map((m) => `${m.direction === "inbound" ? "Cliente" : "Assistente"}: ${m.content}`)
    .join("\n");

  const result = await callAI(config, getExtractionPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI extraction:", result);
    return null;
  }
}

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

  const profile = await extractLeadProfile(config, lead.conversation.messages);
  if (!profile) return null;

  const previousScore = lead.score;

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      region: profile.region,
      propertyType: profile.propertyType,
      priceMin: profile.priceMin,
      priceMax: profile.priceMax,
      purpose: profile.purpose,
      timeline: profile.timeline,
      bedrooms: profile.bedrooms,
      score: profile.score || 0,
      notes: profile.notes,
      status: profile.score >= 70 ? "qualified" : profile.score >= 40 ? "qualifying" : "contacted",
    },
  });

  // Check if lead became hot → create alert task
  await checkHotLeadAlert(leadId, previousScore, profile.score || 0);

  await prisma.activity.create({
    data: {
      userId: lead.userId,
      leadId: lead.id,
      type: "ai_qualification",
      title: "Lead qualificado pela IA",
      description: `Score: ${profile.score}/100 - ${profile.notes}`,
      metadata: profile,
    },
  });

  return updated;
}
