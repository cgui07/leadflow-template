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

  const property = await extractAndSaveProperty(user.id, data.rawText, aiConfig);
  return json(property, 201);
});
