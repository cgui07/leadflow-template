import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) return error("Configurações não encontradas", 404);

    return json({
      ...settings,
      whatsappToken: settings.whatsappToken ? "••••••" + settings.whatsappToken.slice(-4) : null,
      aiApiKey: settings.aiApiKey ? "••••••" + settings.aiApiKey.slice(-4) : null,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await req.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return json(settings);
  } catch (err) {
    return handleError(err);
  }
}
