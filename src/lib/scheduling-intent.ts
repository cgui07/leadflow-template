import type { AIConfig } from "./ai";

export interface SchedulingIntent {
  hasIntent: boolean;
  proposedDate: string | null; // YYYY-MM-DD
  proposedTime: string | null; // HH:MM
  address: string | null;
  isConfirmation: boolean;
  isCancellation: boolean;
  isReschedulingRequest: boolean;
}

function getSchedulingExtractionPrompt(): string {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return `Você é um extrator de intenções de agendamento de visitas de imóveis. Analise as mensagens abaixo e identifique se o cliente está propondo, confirmando ou cancelando uma data/hora de visita. Retorne APENAS o JSON, sem markdown ou explicações.

Formato esperado:
{
  "hasIntent": true|false,
  "proposedDate": "YYYY-MM-DD" ou null,
  "proposedTime": "HH:MM" ou null,
  "address": "endereço mencionado pelo cliente ou null",
  "isConfirmation": true|false,
  "isCancellation": true|false,
  "isReschedulingRequest": true|false
}

Regras:
- hasIntent = true se o cliente propõe uma data/hora, confirma, cancela ou quer remarcar uma visita
- proposedDate e proposedTime devem ser extraídos da última mensagem do cliente (quando houver)
- isConfirmation = true se o cliente está confirmando uma visita já proposta (ex: "sim", "pode ser", "confirmado") — sem data nova
- isCancellation = true se o cliente está cancelando (ex: "preciso cancelar", "não vou poder", "não consigo ir", "desmarca"). Não precisa de data — hasIntent=true e isCancellation=true
- isReschedulingRequest = true se o cliente quer MUDAR uma visita existente para outro horário (ex: "consegue mudar pra terça?", "vamos remarcar pra 15h?")
- Se o cliente propõe uma data NOVA sem mencionar remarcar, é um agendamento novo (isReschedulingRequest=false)
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
  };

  const recentMessages = messages.slice(-6);
  const conversationText = recentMessages
    .map((m) =>
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
      address:
        typeof parsed.address === "string" ? parsed.address : null,
      isConfirmation: Boolean(parsed.isConfirmation),
      isCancellation: Boolean(parsed.isCancellation),
      isReschedulingRequest: Boolean(parsed.isReschedulingRequest),
    };
  } catch (err) {
    console.error("[scheduling-intent] extraction failed:", err);
    return defaultResult;
  }
}
