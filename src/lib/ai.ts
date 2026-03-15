import { prisma } from "./db";
import { checkHotLeadAlert } from "./alerts";
import {
  calculateLeadScore,
  getLeadStatusFromScore,
  getLeadTemperatureLabel,
  normalizeExtractedLeadProfile,
} from "./lead-scoring";

interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
}

function getQualificationPrompt(agentName: string) {
  return `Voce e um assistente de atendimento imobiliario que trabalha para o corretor ${agentName}. Seu objetivo é:

1. Receber o cliente de forma educada e profissional
2. Fazer perguntas curtas e objetivas para qualificar o interesse
3. Coletar: regiao desejada, tipo de imovel, faixa de valor, prazo de compra, finalidade (morar/investir)
4. Identificar o nivel de interesse do cliente (frio, morno, quente)
5. Quando o lead estiver qualificado, informar que o corretor entrara em contato

Regras:
- Mensagens CURTAS (maximo 2 frases por mensagem)
- Tom profissional mas amigavel
- NAO invente informacoes sobre imoveis disponiveis
- NAO mencione precos especificos de imoveis
- Faca UMA pergunta por vez
- Se o cliente perguntar sobre um imovel especifico, diga que o corretor vai entrar em contato com opcoes

Responda APENAS com a mensagem para o cliente, sem explicacoes adicionais.`;
}

function getExtractionPrompt() {
  return `Analise a conversa abaixo e extraia as informacoes do lead em formato JSON. Retorne APENAS o JSON, sem markdown ou explicacoes.

Formato esperado:
{
  "region": "regiao mencionada ou null",
  "propertyType": "apartamento|casa|terreno|comercial ou null",
  "priceMin": numero ou null,
  "priceMax": numero ou null,
  "purpose": "morar|investir|alugar ou null",
  "timeline": "imediato|30dias|60dias|90dias|semestre|ano ou null",
  "bedrooms": numero ou null,
  "interestLevel": "baixo|medio|alto",
  "intentLevel": "curioso|avaliando|decidindo",
  "objectionLevel": "nenhuma|alguma|forte",
  "requestedVisit": true|false,
  "requestedProposal": true|false,
  "requestedFinancing": true|false,
  "notes": "resumo breve do interesse do cliente"
}

Definicoes:
- interestLevel baixo: curioso, respostas vagas, sem sinais claros de compra
- interestLevel medio: demonstra interesse real, responde perguntas e aceita continuar
- interestLevel alto: quer avancar logo, mostra forte interesse ou iniciativa
- intentLevel curioso: apenas explorando possibilidades
- intentLevel avaliando: compara opcoes e avalia compra com alguma seriedade
- intentLevel decidindo: quer visita, proposta, simulacao ou compra em prazo curto
- objectionLevel nenhuma: sem travas relevantes
- objectionLevel alguma: ha duvidas normais sobre preco, regiao, timing ou financiamento
- objectionLevel forte: ha bloqueios claros ou falta de condicao para avancar agora

Regras importantes:
- Seja conservador: nao infle interesse ou urgencia
- Use null quando a informacao nao apareceu
- Use false quando o sinal nao apareceu de forma clara
- Nao retorne score; o score sera calculado pelo sistema com base nessas respostas`;
}

async function callAI(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
) {
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
        messages: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
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
  console.log(
    "[ai] OpenAI response status:",
    res.status,
    "data:",
    JSON.stringify(data).substring(0, 300),
  );
  return data.choices?.[0]?.message?.content || "";
}

export async function generateAutoReply(
  config: AIConfig,
  agentName: string,
  conversationMessages: Array<{
    direction: string;
    content: string;
    sender: string;
  }>,
) {
  const systemPrompt = getQualificationPrompt(agentName);

  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(config, systemPrompt, messages);
}

export async function extractLeadProfile(
  config: AIConfig,
  conversationMessages: Array<{ direction: string; content: string }>,
) {
  const conversationText = conversationMessages
    .map((message) => {
      return `${message.direction === "inbound" ? "Cliente" : "Assistente"}: ${message.content}`;
    })
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

function getSummaryPrompt() {
  return `Voce e um assistente que gera resumos operacionais de conversas imobiliarias para corretores.

Analise a conversa abaixo e gere um resumo curto e objetivo. Retorne APENAS o JSON, sem markdown ou explicacoes.

Formato esperado:
{
  "interesse": "descricao curta do interesse do lead",
  "regiao": "regiao desejada ou Nao informada",
  "tipoImovel": "tipo de imovel ou Nao informado",
  "faixaValor": "faixa de valor ou Nao informada",
  "prazoCompra": "prazo de compra ou Nao informado",
  "objecoes": "principais objecoes ou duvidas, ou Nenhuma identificada",
  "ultimaIntencao": "ultima intencao percebida do lead",
  "proximoPasso": "proximo passo sugerido para o corretor"
}

Regras:
- Seja direto e operacional
- Cada campo deve ter no maximo 1-2 frases curtas
- Se a informacao nao apareceu na conversa, escreva "Nao informado(a)"
- O proximo passo deve ser uma acao concreta para o corretor`;
}

export async function generateConversationSummary(
  config: AIConfig,
  conversationMessages: Array<{ direction: string; content: string; sender: string }>,
) {
  const conversationText = conversationMessages
    .map((msg) => {
      const role = msg.direction === "inbound" ? "Cliente" : msg.sender === "bot" ? "Bot" : "Corretor";
      return `${role}: ${msg.content}`;
    })
    .join("\n");

  const result = await callAI(config, getSummaryPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI summary:", result);
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

  const extractedProfile = await extractLeadProfile(config, lead.conversation.messages);
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
      description: `Score: ${score}/100 (${temperatureLabel}) - ${normalizedProfile.notes || "Sem observacoes relevantes."}`,
      metadata: {
        ...normalizedProfile,
        score,
        temperature: temperatureLabel,
        inboundMessageCount,
      },
    },
  });

  return updated;
}
