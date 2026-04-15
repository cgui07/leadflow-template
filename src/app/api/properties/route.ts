import { prisma } from "@/lib/db";
import { CreatePropertySchema } from "@/lib/schemas";
import { error, handleError, json, requireAuth, withApiHandler } from "@/lib/api";
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

export const POST = withApiHandler(CreatePropertySchema, async (user, data) => {
  // Se só o nome foi fornecido (sem descrição), cria o imóvel diretamente sem chamar a IA
  if (!data.rawText || data.rawText.trim().length < 10) {
    const property = await prisma.properties.create({
      data: {
        user_id: user.id,
        raw_text: data.name,
        title: data.name,
      },
    });
    return json({ ...property, pdfs: [] }, 201);
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

  const property = await extractAndSaveProperty(user.id, data.name, data.rawText, aiConfig);
  return json(property, 201);
});
