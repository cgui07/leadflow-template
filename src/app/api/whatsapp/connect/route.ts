import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { json, requireAuth, handleError } from "@/lib/api";
import { resolveAppUrl, buildWebhookUrl } from "@/lib/webhook-url";
import { getEvolutionProvider } from "@/providers/whatsapp/factory";

function createWebhookToken() {
  return randomBytes(24).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const provider = getEvolutionProvider();
    const instanceName = provider.instanceIdForUser(user.id);

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    const existingInstance = settings?.whatsappPhoneId === instanceName;
    const webhookToken = settings?.whatsappWebhookToken || createWebhookToken();
    const appUrl = resolveAppUrl(req.nextUrl.origin);
    const webhookUrl = buildWebhookUrl(appUrl, webhookToken);
    let qrcode: string | null = null;

    if (existingInstance) {
      try {
        await provider.setWebhook(instanceName, webhookUrl);
        const info = await provider.getConnectionStatus(instanceName);

        if (info.state === "connected") {
          await prisma.userSettings.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              whatsappPhoneId: instanceName,
              whatsappWebhookToken: webhookToken,
            },
            update: {
              whatsappPhoneId: instanceName,
              whatsappWebhookToken: webhookToken,
            },
          });

          return json({ status: "connected", qrcode: null });
        }

        qrcode = await provider.getQrCode(instanceName);
      } catch (error) {
        if (
          error instanceof Error &&
          /not exist|not found|404/i.test(error.message)
        ) {
          const result = await provider.createConnection(user.id, {
            method: "qrcode",
            webhookUrl,
            webhookToken,
          });
          qrcode = result.qrCode || null;
        } else {
          throw error;
        }
      }
    } else {
      const result = await provider.createConnection(user.id, {
        method: "qrcode",
        webhookUrl,
        webhookToken,
      });
      qrcode = result.qrCode || null;

      if (!qrcode) {
        qrcode = await provider.getQrCode(instanceName);
      }
    }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        whatsappPhoneId: instanceName,
        whatsappWebhookToken: webhookToken,
      },
      update: {
        whatsappPhoneId: instanceName,
        whatsappWebhookToken: webhookToken,
      },
    });

    return json({ status: "connecting", qrcode });
  } catch (err) {
    return handleError(err);
  }
}
