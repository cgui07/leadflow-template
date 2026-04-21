import { logger } from "./logger";
import { getWhatsAppConfig } from "./whatsapp";
import { getInstanceOwnerJid } from "./evolution";
import { sendWhatsAppMessage } from "./whatsapp-client";
import { transcribeAudio, downloadMediaFromEvolution } from "./media";

interface NotifyAudioTranscriptionInput {
  instanceName: string;
  messageId: string;
  mimeType: string;
  leadName: string;
  openaiApiKey: string;
}

export async function notifyAudioTranscription(input: NotifyAudioTranscriptionInput): Promise<void> {
  const { instanceName, messageId, mimeType, leadName, openaiApiKey } = input;

  try {
    const base64 = await downloadMediaFromEvolution(instanceName, messageId);
    if (!base64) {
      logger.warn("[audio-transcription] could not download audio", { messageId });
      return;
    }

    const transcription = await transcribeAudio(base64, mimeType, openaiApiKey);
    if (!transcription) {
      logger.warn("[audio-transcription] transcription returned empty", { messageId });
      return;
    }

    const ownerJid = await getInstanceOwnerJid(instanceName);
    if (!ownerJid) {
      logger.warn("[audio-transcription] could not resolve ownerJid", { instanceName });
      return;
    }

    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const text = `🎙 *${leadName}* enviou um áudio:\n\n_${transcription}_\n\n⏰ ${now}`;

    const config = getWhatsAppConfig(instanceName);
    await sendWhatsAppMessage(config, ownerJid, text);

    logger.info("[audio-transcription] notification sent", { instanceName, leadName });
  } catch (err) {
    logger.error("[audio-transcription] failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
