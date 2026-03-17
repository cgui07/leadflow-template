import { prisma } from "./db";
import { checkHotLeadAlert } from "./alerts";
import { upsertLeadActionFromAI } from "./lead-actions";
import { DEFAULT_AI_MODEL_BY_PROVIDER, isSupportedAIProvider } from "./ai-models";
import {
  calculateLeadScore,
  getLeadStatusFromScore,
  getLeadTemperatureLabel,
  normalizeExtractedLeadProfile,
} from "./lead-scoring";

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
}

type AnthropicContentPart =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } };

export type MessageContent = string | AnthropicContentPart[];

function getQualificationPrompt(agentName: string) {
  return `Você é o corretor ${agentName}. Você NÃO é um assistente, NÃO é uma IA e NÃO é um bot. Nunca revele, insinue ou dê a entender que é uma inteligência artificial, um sistema automatizado ou qualquer coisa que não seja o próprio corretor. Se o cliente perguntar se está falando com um robô, responda naturalmente que é o ${agentName}.

Seu objetivo é:
1. Receber o cliente de forma educada e profissional
2. Fazer perguntas curtas e objetivas para qualificar o interesse
3. Coletar: região desejada, tipo de imóvel, faixa de valor, prazo de compra e finalidade (morar ou investir)
4. Identificar o nível de interesse do cliente
5. Quando o lead estiver qualificado, combinar um próximo passo (visita, ligação, envio de opções)

Regras:
- Mensagens curtas, com no máximo 2 frases
- Tom profissional, mas amigável e humano
- Preste atenção ao nome do cliente e use pronomes e artigos corretos para o gênero (ex: "a Renata", "o Carlos", "ela", "ele"). Na dúvida, use linguagem neutra
- Não invente informações sobre imóveis disponíveis
- Não mencione preços específicos de imóveis
- Faça uma pergunta por vez
- Se o cliente perguntar sobre um imóvel específico, diga que vai verificar as opções e retornará
- Quando o cliente enviar uma imagem, analise o conteúdo visual e responda de forma relevante
- Quando receber a transcrição de um áudio, responda ao conteúdo falado naturalmente
- Quando o cliente enviar um documento, analise o conteúdo e responda de forma relevante
- Nunca use termos como "como assistente", "como IA", "fui programado", "não tenho acesso" ou similares

Responda apenas com a mensagem para o cliente, sem explicações adicionais.`;
}

function getFollowUpPrompt(agentName: string) {
  return `Você é o corretor ${agentName}. Você NÃO é um assistente, NÃO é uma IA e NÃO é um bot. Nunca revele ou insinue que é uma inteligência artificial.

Sua tarefa é retomar uma conversa parada com naturalidade e foco comercial.

Regras:
- Escreva uma mensagem curta, humana e objetiva
- Preste atenção ao nome do cliente e use pronomes e artigos corretos para o gênero (ex: "a Renata", "o Carlos"). Na dúvida, use linguagem neutra
- Não faça parecer cobrança
- Não repita uma saudação robótica
- Não invente imóveis, preços ou condições
- Retome com base no contexto da conversa, quando houver
- Convide o lead a responder com um próximo passo simples
- Máximo de 2 frases curtas

Responda apenas com a mensagem para o cliente, sem explicações adicionais.`;
}

function getExtractionPrompt() {
  return `Analise a conversa abaixo e extraia as informações do lead em formato JSON. Retorne apenas o JSON, sem markdown ou explicações.

Formato esperado:
{
  "region": "região mencionada ou null",
  "propertyType": "apartamento|casa|terreno|comercial ou null",
  "priceMin": número ou null,
  "priceMax": número ou null,
  "purpose": "morar|investir|alugar ou null",
  "timeline": "imediato|30dias|60dias|90dias|semestre|ano ou null",
  "bedrooms": número ou null,
  "interestLevel": "baixo|medio|alto",
  "intentLevel": "curioso|avaliando|decidindo",
  "objectionLevel": "nenhuma|alguma|forte",
  "requestedVisit": true|false,
  "requestedProposal": true|false,
  "requestedFinancing": true|false,
  "notes": "resumo breve do interesse do cliente"
}

Definições:
- interestLevel baixo: curioso, respostas vagas, sem sinais claros de compra
- interestLevel medio: demonstra interesse real, responde perguntas e aceita continuar
- interestLevel alto: quer avançar logo, mostra forte interesse ou iniciativa
- intentLevel curioso: apenas explorando possibilidades
- intentLevel avaliando: compara opções e avalia compra com alguma seriedade
- intentLevel decidindo: quer visita, proposta, simulação ou compra em prazo curto
- objectionLevel nenhuma: sem travas relevantes
- objectionLevel alguma: há dúvidas normais sobre preço, região, timing ou financiamento
- objectionLevel forte: há bloqueios claros ou falta de condição para avançar agora

Regras importantes:
- Seja conservador: não infle interesse ou urgência
- Use null quando a informação não apareceu
- Use false quando o sinal não apareceu de forma clara
- Não retorne score; o score será calculado pelo sistema com base nessas respostas`;
}

function getSummaryPrompt() {
  return `Você é um assistente que gera resumos operacionais de conversas imobiliárias para corretores.

Analise a conversa abaixo e gere um resumo curto e objetivo. Retorne apenas o JSON, sem markdown ou explicações.

Formato esperado:
{
  "interesse": "descrição curta do interesse do lead",
  "regiao": "região desejada ou Não informada",
  "tipoImovel": "tipo de imóvel ou Não informado",
  "faixaValor": "faixa de valor ou Não informada",
  "prazoCompra": "prazo de compra ou Não informado",
  "objecoes": "principais objeções ou dúvidas, ou Nenhuma identificada",
  "ultimaIntencao": "última intenção percebida do lead",
  "próximoPasso": "próximo passo sugerido para o corretor"
}

Regras:
- Seja direto e operacional
- Cada campo deve ter no máximo 1 ou 2 frases curtas
- Se a informação não apareceu na conversa, escreva "Não informado(a)"
- O próximo passo deve ser uma ação concreta para o corretor`;
}

function formatContentForOpenAI(content: MessageContent): string | Array<Record<string, unknown>> {
  if (typeof content === "string") return content;

  return content.map((part) => {
    if (part.type === "text") return part;
    if (part.type === "image") {
      return {
        type: "image_url",
        image_url: {
          url: `data:${part.source.media_type};base64,${part.source.data}`,
          detail: "low",
        },
      };
    }
    if (part.type === "document") {
      return { type: "text", text: "[Documento recebido - conteúdo não suportado neste provedor]" };
    }
    return { type: "text", text: "" };
  });
}

async function callAI(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: string; content: MessageContent }>,
) {
  const provider = isSupportedAIProvider(config.provider) ? config.provider : "openai";
  const model = config.model || DEFAULT_AI_MODEL_BY_PROVIDER[provider];
  const hasMultimodal = messages.some((m) => Array.isArray(m.content));
  const maxTokens = hasMultimodal ? 1024 : 300;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content,
        })),
      }),
    });
    const data = await res.json();
    console.log(
      "[ai] Anthropic response status:",
      res.status,
      "model:",
      model,
      "data:",
      JSON.stringify(data).substring(0, 300),
    );
    if (!res.ok) {
      console.error("[ai] Anthropic API error:", JSON.stringify(data));
      return "";
    }
    return data.content?.[0]?.text || "";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: formatContentForOpenAI(m.content),
        })),
      ],
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
    content: MessageContent;
    sender: string;
  }>,
) {
  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(config, getQualificationPrompt(agentName), messages);
}

export async function generateFollowUpMessage(
  config: AIConfig,
  agentName: string,
  conversationMessages: Array<{
    direction: string;
    content: string;
    sender: string;
  }>,
) {
  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(config, getFollowUpPrompt(agentName), messages);
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

  const result = await callAI(config, getExtractionPrompt(), [{ role: "user", content: conversationText }]);

  try {
    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI extraction:", result);
    return null;
  }
}

export async function generateConversationSummary(
  config: AIConfig,
  conversationMessages: Array<{ direction: string; content: string; sender: string }>,
) {
  const conversationText = conversationMessages
    .map((message) => {
      const role =
        message.direction === "inbound" ? "Cliente" : message.sender === "bot" ? "Bot" : "Corretor";
      return `${role}: ${message.content}`;
    })
    .join("\n");

  const result = await callAI(config, getSummaryPrompt(), [{ role: "user", content: conversationText }]);

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
    actionPromises.push(upsertLeadActionFromAI(lead.userId, lead.id, "proposal"));
  }
  if (normalizedProfile.requestedFinancing) {
    actionPromises.push(upsertLeadActionFromAI(lead.userId, lead.id, "financing"));
  }
  if (actionPromises.length > 0) {
    await Promise.all(actionPromises);
  }

  return updated;
}
