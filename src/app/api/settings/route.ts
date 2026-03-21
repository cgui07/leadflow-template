import { UpdateSettingsSchema } from "@/lib/schemas";
import { handleError, json, requireAuth, withApiHandler } from "@/lib/api";
import {
  getUserSettings,
  updateUserSettings,
} from "@/features/settings/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const settings = await getUserSettings(user.id, { maskApiKey: true });

    return json(settings);
  } catch (err) {
    return handleError(err);
  }
}

export const PATCH = withApiHandler(UpdateSettingsSchema, async (user, data) => {
  const settings = await updateUserSettings(user.id, data as Record<string, unknown>, {
    maskApiKey: true,
  });
  return json(settings);
});
