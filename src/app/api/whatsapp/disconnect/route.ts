import { prisma } from "@/lib/db";
import { deleteInstance, logoutInstance } from "@/lib/evolution";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.whatsappPhoneId) {
      return error("Nenhuma instância conectada", 404);
    }

    try {
      await logoutInstance(settings.whatsappPhoneId);
    } catch (err) {
      console.error("[whatsapp] Logout error:", err);
    }

    try {
      await deleteInstance(settings.whatsappPhoneId);
    } catch (err) {
      console.error("[whatsapp] Delete error:", err);
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
