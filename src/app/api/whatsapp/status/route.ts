import { prisma } from "@/lib/db";
import { getConnectionStatus } from "@/lib/evolution";
import { json, requireAuth, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.whatsappPhoneId) {
      return json({ status: "disconnected", instanceName: null });
    }

    const liveStatus = await getConnectionStatus(settings.whatsappPhoneId);

    return json({ status: liveStatus, instanceName: settings.whatsappPhoneId });
  } catch (err) {
    return handleError(err);
  }
}
