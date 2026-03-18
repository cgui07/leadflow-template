import { prisma } from "./db";
import { checkHotLeadAlert } from "./alerts";
import { upsertLeadActionFromAI } from "./lead-actions";
import {
  DEFAULT_AI_MODEL_BY_PROVIDER,
  isSupportedAIProvider,
} from "./ai-models";
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
  transcriptionApiKey?: string;
}

type AnthropicContentPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "document";
      source: { type: "base64"; media_type: string; data: string };
    };

export type MessageContent = string | AnthropicContentPart[];

interface PropertyCatalogItem {
  id?: string;
  title: string | null;
  type: string | null;
  purpose: string | null;
  price: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  amenities: string[];
  description: string | null;
  hasPdf?: boolean;
}

function formatPropertyForPrompt(p: PropertyCatalogItem, index: number) {
  const idTag = p.id ? ` [ID:${p.id}]` : "";
  const parts: string[] = [`${index + 1}.${idTag} ${p.title ?? "Imóvel"}`];
  if (p.type) parts.push(`   Tipo: ${p.type}`);
  if (p.purpose) parts.push(`   Finalidade: ${p.purpose}`);
  if (p.price) parts.push(`   Preço: R$ ${Number(p.price).toLocaleString("pt-BR")}`);
  if (p.area) parts.push(`   Área: ${p.area} m²`);
  const quartos = [
    p.bedrooms != null ? `${p.bedrooms} quarto(s)` : null,
    p.bathrooms != null ? `${p.bathrooms} banheiro(s)` : null,
    p.parking_spots != null && p.parking_spots > 0 ? `${p.parking_spots} vaga(s)` : null,
  ].filter(Boolean).join(", ");
  if (quartos) parts.push(`   Detalhes: ${quartos}`);
  const location = [p.neighborhood, p.city, p.state].filter(Boolean).join(", ");
  if (location) parts.push(`   Localização: ${location}`);
  if (p.amenities.length > 0) parts.push(`   Comodidades: ${p.amenities.join(", ")}`);
  if (p.description) parts.push(`   Descrição: ${p.description}`);
  if (p.hasPdf) parts.push(`   📎 PDF disponível`);
  return parts.join("\n");
}

function getQualificationPrompt(agentName: string, properties?: PropertyCatalogItem[]) {
  const catalogSection = properties && properties.length > 0
    ? `\n\nCATÁLOGO DE IMÓVEIS DISPONÍVEIS:\n${properties.map(formatPropertyForPrompt).join("\n\n")}`
    : ``;

  return `Você é o corretor ${agentName}. Você NÃO é um assistente, NÃO é uma IA e NÃO é um bot. Nunca revele, insinue ou dê a entender que é uma inteligência artificial, um sistema automatizado ou qualquer coisa que não seja o próprio corretor. Se o cliente perguntar se está falando com um robô, responda naturalmente que é o ${agentName}.

Seu objetivo é:
1. Receber o cliente de forma educada e profissional
2. Qualificar o interesse: região desejada, tipo de imóvel, faixa de valor, prazo e finalidade (morar ou investir)
3. Quando o cliente perguntar sobre um imóvel do catálogo, apresentá-lo de forma envolvente e persuasiva — destacando os pontos mais atraentes, despertando desejo e criando senso de oportunidade
4. Conduzir o cliente ao próximo passo: visita, ligação ou envio de mais detalhes

Regras gerais:
- Mensagens curtas, com no máximo 2-3 frases
- Tom profissional, caloroso e entusiasmado — como um corretor apaixonado pelo que vende
- Use o nome do cliente e pronomes corretos para o gênero. Na dúvida, use linguagem neutra
- Faça uma pergunta por vez para manter o diálogo fluindo

Quando apresentar um imóvel do catálogo:
- NÃO liste dados frios — transforme-os em benefícios reais para o cliente
- Destaque o que é mais especial: localização privilegiada, espaço, lazer, custo-benefício, valorização
- Use linguagem que gere emoção e desejo ("perfeito para quem busca...", "imagine acordar com...", "uma oportunidade única...")
- Ao final, convide para um próximo passo concreto (visita, mais fotos, ligação)
- Se o imóvel não estiver no catálogo, diga que vai verificar e retornará em breve
- Quando mencionar um imóvel que possui PDF disponível (marcado com 📎), inclua a tag [ENVIAR_PDF:ID] no final da sua mensagem (substitua ID pelo código entre colchetes do imóvel). Essa tag será processada pelo sistema e não será visível ao cliente

Outros tipos de mensagem:
- Imagem: analise e responda de forma relevante
- Áudio transcrito: responda ao conteúdo falado naturalmente
- Documento: analise e responda de forma relevante
- Nunca use termos como "como assistente", "como IA", "fui programado", "não tenho acesso" ou similares${catalogSection}

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

function formatContentForOpenAI(
  content: MessageContent,
): string | Array<Record<string, unknown>> {
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
      return {
        type: "text",
        text: "[Documento recebido - conteúdo não suportado neste provedor]",
      };
    }
    return { type: "text", text: "" };
  });
}

async function callAI(
  config: AIConfig,
  systemPrompt: string,
  messages: Array<{ role: string; content: MessageContent }>,
) {
  const provider = isSupportedAIProvider(config.provider)
    ? config.provider
    : "openai";
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
  properties?: PropertyCatalogItem[],
) {
  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(config, getQualificationPrompt(agentName, properties), messages);
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

  const result = await callAI(config, getExtractionPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI extraction:", result);
    return null;
  }
}

export async function generateConversationSummary(
  config: AIConfig,
  conversationMessages: Array<{
    direction: string;
    content: string;
    sender: string;
  }>,
) {
  const conversationText = conversationMessages
    .map((message) => {
      const role =
        message.direction === "inbound"
          ? "Cliente"
          : message.sender === "bot"
            ? "Bot"
            : "Corretor";
      return `${role}: ${message.content}`;
    })
    .join("\n");

  const result = await callAI(config, getSummaryPrompt(), [
    { role: "user", content: conversationText },
  ]);

  try {
    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
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

export interface ExtractedProperty {
  title: string | null;
  type: string | null;
  purpose: string | null;
  price: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  amenities: string[];
  description: string | null;
}

export async function extractPropertyData(
  config: AIConfig,
  rawText: string,
): Promise<ExtractedProperty | null> {
  const systemPrompt = `Você é um assistente especializado em imóveis. Analise o texto abaixo e extraia os dados estruturados do imóvel. Retorne APENAS o JSON, sem markdown ou explicações.

Formato esperado:
{
  "title": "título curto do imóvel (ex: Apartamento 3 quartos no Leblon) ou null",
  "type": "apartamento|casa|terreno|comercial|studio|cobertura|galpao|sala ou null",
  "purpose": "venda|aluguel ou null",
  "price": número em reais sem pontos ou vírgulas (ex: 850000) ou null,
  "area": número em m² (ex: 120) ou null,
  "bedrooms": número inteiro ou null,
  "bathrooms": número inteiro ou null,
  "parkingSpots": número inteiro ou null,
  "address": "endereço completo ou null",
  "neighborhood": "bairro ou null",
  "city": "cidade ou null",
  "state": "sigla do estado (ex: SP) ou null",
  "amenities": ["lista", "de", "comodidades"] ou [],
  "description": "descrição limpa e comercial do imóvel em 2-3 frases ou null"
}

Regras:
- Extraia apenas o que está explicitamente no texto
- Não invente informações
- price deve ser número puro (sem R$, pontos ou vírgulas)
- amenities: piscina, churrasqueira, academia, portaria 24h, varanda, etc.`;

  try {
    const result = await callAI(config, systemPrompt, [
      { role: "user", content: rawText },
    ]);
    if (!result) return null;
    const parsed = JSON.parse(result);
    return {
      title: parsed.title ?? null,
      type: parsed.type ?? null,
      purpose: parsed.purpose ?? null,
      price: typeof parsed.price === "number" ? parsed.price : null,
      area: typeof parsed.area === "number" ? parsed.area : null,
      bedrooms: typeof parsed.bedrooms === "number" ? parsed.bedrooms : null,
      bathrooms: typeof parsed.bathrooms === "number" ? parsed.bathrooms : null,
      parkingSpots:
        typeof parsed.parkingSpots === "number" ? parsed.parkingSpots : null,
      address: parsed.address ?? null,
      neighborhood: parsed.neighborhood ?? null,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
      description: parsed.description ?? null,
    };
  } catch (err) {
    console.error("[ai] extractPropertyData failed:", err);
    return null;
  }
}
