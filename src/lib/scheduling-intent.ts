import type { AIConfig } from "./ai";

export interface SchedulingIntent {
  hasIntent: boolean;
  proposedDate: string | null;
  proposedTime: string | null;
  address: string | null;
  isConfirmation: boolean;
  isCancellation: boolean;
  isReschedulingRequest: boolean;
  originalDate: string | null; // date of the appointment being cancelled/rescheduled
}

function getSchedulingExtractionPrompt(): string {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Sao_Paulo",
  });
  return `Você é um extrator de intenções de agendamento de visitas de imóveis. Analise as mensagens abaixo e identifique se o cliente está propondo, confirmando ou cancelando uma data/hora de visita. Retorne APENAS o JSON, sem markdown ou explicações.

Formato esperado:
{
  "hasIntent": true|false,
  "proposedDate": "YYYY-MM-DD" ou null,
  "proposedTime": "HH:MM" ou null,
  "address": "endereço mencionado pelo cliente ou null",
  "isConfirmation": true|false,
  "isCancellation": true|false,
  "isReschedulingRequest": true|false,
  "originalDate": "YYYY-MM-DD" ou null
}

Regras:
- hasIntent = true se o cliente propõe uma data/hora, confirma, cancela ou quer remarcar uma visita
- proposedDate e proposedTime devem ser extraídos da ÚLTIMA mensagem do cliente (quando houver)
- isConfirmation = true se o cliente está confirmando uma visita já proposta (ex: "sim", "pode ser", "confirmado") — sem data nova
- isCancellation = true se o cliente está cancelando (ex: "preciso cancelar", "não vou poder", "não consigo ir", "desmarca"). hasIntent=true e isCancellation=true. Se o cliente mencionar qual data quer cancelar, preencha proposedDate (ex: "cancela a do dia 21" → proposedDate="2026-03-21")
- isReschedulingRequest = true APENAS se o cliente quer TROCAR uma visita existente por outro horário (ex: "consegue mudar pra terça?", "vamos remarcar", "troca aquela visita pra 15h"). Preencha originalDate com a data da visita que o cliente quer mudar, se mencionada
- originalDate = data da visita original que o cliente quer cancelar ou remarcar (ex: "cancela a do dia 21" → originalDate="2026-03-21", "muda a visita de sexta pra segunda" → originalDate=data da sexta). null se não mencionada
- Se o cliente pede uma visita ADICIONAL com data nova (ex: "marca outra pro dia 27", "quero visitar outro imóvel dia 29", "agenda mais uma visita"), isso é um NOVO agendamento (isReschedulingRequest=false), mesmo que já tenha visitas marcadas
- IMPORTANTE: analise apenas a ÚLTIMA mensagem do cliente para determinar a intenção. Não confunda visitas anteriores já confirmadas com a solicitação atual
- Se a data for relativa ("amanhã", "sábado", "próxima semana"), calcule com base na data de hoje: ${today}
- Horários como "14h", "14:00", "duas da tarde" → "14:00"
- Se não houver intenção clara de agendamento, cancelamento ou remarcação, retorne hasIntent=false`;
}

export async function extractSchedulingIntent(
  config: AIConfig,
  messages: Array<{ direction: string; content: string }>,
): Promise<SchedulingIntent> {
  const defaultResult: SchedulingIntent = {
    hasIntent: false,
    proposedDate: null,
    proposedTime: null,
    address: null,
    isConfirmation: false,
    isCancellation: false,
    isReschedulingRequest: false,
    originalDate: null,
  };

  const lastConfirmIdx = messages.findLastIndex(
    (m) =>
      m.direction === "outbound" &&
      /✅\s*Visita (agendada|remarcada|confirmada)/.test(m.content),
  );
  const messagesAfterLastConfirm =
    lastConfirmIdx >= 0 ? messages.slice(lastConfirmIdx + 1) : messages;
  const recentMessages = messagesAfterLastConfirm.slice(-6);

  if (recentMessages.length === 0) return defaultResult;

  const conversationText = recentMessages
    .map(
      (m) =>
        `${m.direction === "inbound" ? "Cliente" : "Assistente"}: ${m.content}`,
    )
    .join("\n");

  try {
    let result = "";

    if (config.provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 300,
          system: getSchedulingExtractionPrompt(),
          messages: [{ role: "user", content: conversationText }],
        }),
      });
      const data = (await res.json()) as {
        content?: Array<{ text?: string }>;
      };
      result = data.content?.[0]?.text ?? "";
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 300,
          messages: [
            { role: "system", content: getSchedulingExtractionPrompt() },
            { role: "user", content: conversationText },
          ],
        }),
      });
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      result = data.choices?.[0]?.message?.content ?? "";
    }

    const cleaned = result
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      hasIntent: Boolean(parsed.hasIntent),
      proposedDate:
        typeof parsed.proposedDate === "string" ? parsed.proposedDate : null,
      proposedTime:
        typeof parsed.proposedTime === "string" ? parsed.proposedTime : null,
      address: typeof parsed.address === "string" ? parsed.address : null,
      isConfirmation: Boolean(parsed.isConfirmation),
      isCancellation: Boolean(parsed.isCancellation),
      isReschedulingRequest: Boolean(parsed.isReschedulingRequest),
      originalDate:
        typeof parsed.originalDate === "string" ? parsed.originalDate : null,
    };
  } catch (err) {
    console.error("[scheduling-intent] extraction failed:", err);
    return defaultResult;
  }
}
