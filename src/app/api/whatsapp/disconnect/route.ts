import { prisma } from "@/lib/db";
import { logoutInstance } from "@/lib/evolution";
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

    return json({ status: "disconnected" });
  } catch (err) {
    return handleError(err);
  }
}
