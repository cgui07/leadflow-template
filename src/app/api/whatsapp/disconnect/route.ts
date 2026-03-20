import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { resolveProviderForUser } from "@/providers/whatsapp/factory";

export async function POST() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.whatsappPhoneId) {
      return error("Nenhuma instância conectada", 404);
    }

    const { provider, instanceId } = await resolveProviderForUser(user.id);

    try {
      await provider.disconnect(instanceId);
    } catch (err) {
      logger.error("WhatsApp disconnect error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    await prisma.userSettings.update({
      where: { userId: user.id },
      data: { whatsappPhoneId: null, whatsappWebhookToken: null },
    });

    return json({ status: "disconnected" });
  } catch (err) {
    return handleError(err);
  }
}
