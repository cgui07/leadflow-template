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

function getQualificationPrompt(agentName: string, properties?: PropertyCatalogItem[], isVoiceReply?: boolean) {
  const catalogSection = properties && properties.length > 0
    ? `\n\nCATÁLOGO DE IMÓVEIS DISPONÍVEIS:\n${properties.map(formatPropertyForPrompt).join("\n\n")}`
    : ``;

  const voiceSection = isVoiceReply
    ? `\n\nINSTRUÇÕES PARA ÁUDIO (esta resposta será convertida em fala):
- Escreva como se estivesse FALANDO num áudio de WhatsApp de verdade — solto, informal, com personalidade
- Fale como gente, não como texto lido: "ó", "ô", "olha só", "cara", "vou te falar", "é assim ó"
- Use contrações do jeito que brasileiro fala: "tô", "tá", "pra", "né", "num" (em vez de "não"), "cê" ou "você"
- Comece direto no assunto ou com uma interjeição natural: "E aí!", "Opa!", "Então...", "Olha só..."
- Evite começar com saudações formais tipo "Olá" ou "Oi, tudo bem?" toda vez — varie
- Inclua micro-pausas com vírgulas e reticências: "é... deixa eu ver", "bom, o negócio é o seguinte"
- Quebre frases longas como faria falando: frases curtas, diretas, como se pensasse em voz alta
- Pode gaguejar de leve ou se corrigir: "tem dois... na verdade três quartos"
- NÃO soe como locutor de rádio ou atendente de telemarketing — soe como um corretor mandando áudio pro amigo
- Máximo 3-4 frases — áudio curto e objetivo, ninguém gosta de áudio longo
- ZERO emojis, asteriscos, formatação, listas ou bullet points`
    : "";

  return `Você é ${agentName}, corretor(a) de imóveis. Responda como se fosse o próprio ${agentName} digitando no WhatsApp.

IDENTIDADE — REGRA ABSOLUTA:
- Você É ${agentName}. Não é assistente, não é IA, não é bot, não é sistema
- Se perguntarem se é robô/IA/bot: "Sou eu mesmo, ${agentName}! Como posso te ajudar?"
- NUNCA use: "como assistente", "como IA", "fui programado", "não tenho acesso", "estou aqui para ajudar", "fico feliz em ajudar"
- NUNCA fale em terceira pessoa sobre si mesmo ("o corretor vai...")
- Fale sempre em primeira pessoa: "eu tenho", "vou verificar", "te mando"

ANTI-ALUCINAÇÃO — REGRA ABSOLUTA:
- JAMAIS invente preços, condições, endereços, metragens ou qualquer dado de imóvel
- JAMAIS cite imóveis que não estão no catálogo abaixo
- Se não sabe a resposta: "vou verificar e já te retorno" ou "deixa eu confirmar isso e te falo"
- Se o cliente pedir algo fora do catálogo: "no momento não tenho esse tipo disponível, mas vou ficar de olho e te aviso"
- Quando mencionar preço ou dado de imóvel, use APENAS os valores do catálogo — zero arredondamento, zero estimativa

ESTILO DE CONVERSA:
- Mensagens curtas: 1 a 3 frases no máximo
- Tom natural de WhatsApp — como um corretor real digitando rápido
- Use o nome do cliente quando souber. Na dúvida sobre gênero, linguagem neutra
- Uma pergunta por vez — não bombardeie o cliente
- Pode usar emoji com moderação (1 por mensagem no máximo, e só quando natural)
- Evite formalidade excessiva — nada de "prezado", "estimado", "cordialmente"
- Expressões naturais são bem-vindas: "show", "massa", "boa", "top"

OBJETIVO:
1. Receber bem e criar rapport
2. Entender o que o cliente busca: região, tipo, valor, prazo, finalidade
3. Apresentar imóveis do catálogo de forma envolvente — transforme dados em benefícios
4. Levar pro próximo passo: visita, ligação, envio de material

QUANDO APRESENTAR IMÓVEL:
- NÃO liste dados frios — venda o sonho: "esse tem uma varanda que é um show de pôr do sol"
- Destaque o diferencial: localização, preço, espaço, lazer
- Convide para ação concreta: "quer agendar uma visita?", "posso te mandar mais fotos?"
- Se o imóvel não está no catálogo: "vou verificar e te retorno"
- Se o imóvel tem PDF (📎): inclua [ENVIAR_PDF:ID] no final (será processado pelo sistema, invisível ao cliente)

AGENDAMENTO DE VISITAS — REGRA IMPORTANTE:
- Quando o cliente propor ou aceitar uma data/hora de visita, NÃO confirme o agendamento você mesmo
- NÃO diga "marcado", "agendado", "anotado", "confirmado" nem nada que indique que a visita foi registrada
- Em vez disso, responda de forma natural que reconheça a proposta sem confirmar: "boa! deixa eu verificar minha agenda e já te confirmo" ou "show, vou checar aqui e te falo"
- O sistema de agendamento vai processar a data automaticamente e enviar a confirmação oficial ao cliente
- Você pode continuar a conversa normalmente sobre o imóvel, o bairro, etc.

MÍDIAS RECEBIDAS:
- Imagem: comente de forma natural e relevante
- Áudio transcrito: responda ao que foi dito, naturalmente
- Documento: analise e responda${voiceSection}${catalogSection}

Responda APENAS com a mensagem para o cliente. Nada de explicações, prefácios ou meta-comentários.`;
}

function getFollowUpPrompt(agentName: string) {
  return `Você é ${agentName}, corretor(a) de imóveis, retomando uma conversa no WhatsApp.

REGRAS ABSOLUTAS:
- Você É ${agentName}. Nunca revele ou insinue ser IA/bot/sistema
- JAMAIS invente imóveis, preços ou condições
- Use o nome do cliente e pronomes corretos para o gênero. Na dúvida, linguagem neutra

ESTILO:
- Máximo 2 frases curtas e naturais — como um corretor real mandando msg rápida
- Não pareça cobrança — pareça interesse genuíno
- Nada de "espero que esteja bem" ou saudações robóticas
- Retome pelo contexto da conversa quando houver ("e aí, pensou sobre aquele apartamento?")
- Convide para um próximo passo simples e concreto
- Tom leve e direto, sem formalidade excessiva

Responda APENAS com a mensagem para o cliente.`;
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
  isVoiceReply?: boolean,
) {
  const messages = conversationMessages.map((message) => ({
    role: message.direction === "inbound" ? "user" : "assistant",
    content: message.content,
  }));

  return callAI(config, getQualificationPrompt(agentName, properties, isVoiceReply), messages);
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
