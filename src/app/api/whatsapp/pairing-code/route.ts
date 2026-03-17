import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  buildWebhookUrl,
  createInstance,
  deleteInstance,
  getPairingCode,
  instanceNameForUser,
  logoutInstance,
  resolveAppUrl,
  setInstanceWebhook,
} from "@/lib/evolution";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return error("Número de telefone é obrigatório", 400);
    }

    const digits = phoneNumber.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      return error("Número de telefone inválido", 400);
    }

    const instanceName = instanceNameForUser(user.id);

    try { await logoutInstance(instanceName); } catch {}
    try { await deleteInstance(instanceName); } catch {}

    await createInstance(user.id, false);

    const pairingCode = await getPairingCode(instanceName, digits);

    if (!pairingCode) {
      return error("Não foi possível gerar o código de pareamento", 400);
    }

    const webhookToken = randomBytes(24).toString("hex");
    const appUrl = resolveAppUrl(req.nextUrl.origin);
    const webhookUrl = buildWebhookUrl(appUrl, webhookToken);

    await setInstanceWebhook(instanceName, webhookUrl);
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, whatsappPhoneId: instanceName, whatsappWebhookToken: webhookToken },
      update: { whatsappPhoneId: instanceName, whatsappWebhookToken: webhookToken },
    });

    return json({ pairingCode });
  } catch (err) {
    return handleError(err);
  }
}
