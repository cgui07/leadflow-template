import { prisma } from "@/lib/db";
import { getQrCode } from "@/lib/evolution";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.whatsappPhoneId) {
      return error("Instância não encontrada. Clique em Conectar primeiro.", 404);
    }

    const qrcode = await getQrCode(settings.whatsappPhoneId);

    return json({ qrcode });
  } catch (err) {
    return handleError(err);
  }
}
