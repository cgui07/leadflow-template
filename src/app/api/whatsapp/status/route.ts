import { prisma } from "@/lib/db";
import { json, requireAuth, handleError } from "@/lib/api";
import { resolveProviderForUser } from "@/providers/whatsapp/factory";

export async function GET() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.whatsappPhoneId) {
      return json({ status: "disconnected", instanceName: null });
    }

    const { provider, instanceId } = await resolveProviderForUser(user.id);
    const info = await provider.getConnectionStatus(instanceId);

    return json({ status: info.state, instanceName: instanceId });
  } catch (err) {
    return handleError(err);
  }
}
