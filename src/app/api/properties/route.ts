import { NextRequest } from "next/server";
import { requireAuth, json, error, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  extractAndSaveProperty,
  listProperties,
} from "@/features/properties/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const properties = await listProperties(user.id);
    return json(properties);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 10) {
      return error("Texto muito curto para extrair dados do imóvel.", 400);
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings?.aiApiKey) {
      return error(
        "Configure uma chave de IA nas configurações antes de usar esta funcionalidade.",
        400,
      );
    }

    const aiConfig = {
      provider: settings.aiProvider,
      apiKey: settings.aiApiKey,
      model: settings.aiModel,
    };

    const property = await extractAndSaveProperty(user.id, rawText, aiConfig);
    return json(property, 201);
  } catch (err) {
    if (err instanceof SyntaxError) return error("Payload inválido");
    return handleError(err);
  }
}
