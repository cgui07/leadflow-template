import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as Record<string, unknown>;
    const settings = await updateUserSettings(user.id, body, {
      maskApiKey: true,
    });

    return json(settings);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return error("Payload invalido");
    }

    return handleError(err);
  }
}
