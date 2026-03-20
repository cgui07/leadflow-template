import { prisma } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { env } from "@/lib/env";
import { getEvolutionProvider } from "@/providers/whatsapp/factory";

function resolveAppUrl(fallbackOrigin?: string) {
  const appUrl = env.APP_URL || env.NEXT_PUBLIC_APP_URL || fallbackOrigin;
  if (!appUrl) throw new Error("APP_URL não configurada para o webhook do WhatsApp");
  return appUrl.replace(/\/+$/, "");
}

function buildWebhookUrl(appUrl: string, webhookToken: string) {
  const url = new URL("/api/whatsapp/webhook", appUrl);
  url.searchParams.set("token", webhookToken);
  return url.toString();
}

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

    const provider = getEvolutionProvider();
    const webhookToken = randomBytes(24).toString("hex");
    const appUrl = resolveAppUrl(req.nextUrl.origin);
    const webhookUrl = buildWebhookUrl(appUrl, webhookToken);

    const result = await provider.createConnection(user.id, {
      method: "pairing-code",
      phoneNumber: digits,
      webhookUrl,
      webhookToken,
    });

    if (!result.pairingCode) {
      return error("Não foi possível gerar o código de pareamento", 400);
    }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, whatsappPhoneId: result.instanceId, whatsappWebhookToken: webhookToken },
      update: { whatsappPhoneId: result.instanceId, whatsappWebhookToken: webhookToken },
    });

    return json({ pairingCode: result.pairingCode });
  } catch (err) {
    return handleError(err);
  }
}
