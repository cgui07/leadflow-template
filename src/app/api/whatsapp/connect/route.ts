import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { json, requireAuth, handleError } from "@/lib/api";
import {
  buildWebhookUrl,
  createInstance,
  deleteInstance,
  getConnectionStatus,
  getQrCode,
  instanceNameForUser,
  logoutInstance,
  resolveAppUrl,
  setInstanceWebhook,
} from "@/lib/evolution";

function createWebhookToken() {
  return randomBytes(24).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const instanceName = instanceNameForUser(user.id);

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
        await setInstanceWebhook(instanceName, webhookUrl);
        const status = await getConnectionStatus(instanceName);

        if (status === "connected") {
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

        qrcode = await getQrCode(instanceName);
      } catch (error) {
        if (
          error instanceof Error &&
          /not exist|not found|404/i.test(error.message)
        ) {
          const result = await createInstance(user.id);
          await setInstanceWebhook(instanceName, webhookUrl);
          qrcode = result.qrcode;
        } else {
          throw error;
        }
      }
    } else {
      try {
        await logoutInstance(instanceName);
      } catch {}
      try {
        await deleteInstance(instanceName);
      } catch {}

      let result: Awaited<ReturnType<typeof createInstance>> | null = null;

      try {
        result = await createInstance(user.id);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !/exists|already/i.test(error.message)
        ) {
          throw error;
        }
      }

      await setInstanceWebhook(instanceName, webhookUrl);
      qrcode = result?.qrcode || null;

      if (!qrcode) {
        qrcode = await getQrCode(instanceName);
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
