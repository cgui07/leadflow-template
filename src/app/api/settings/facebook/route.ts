import { handleError, json, requireAuth } from "@/lib/api";
import {
  disconnectFacebook,
  getFacebookConnectionStatus,
} from "@/lib/facebook";

export async function GET() {
  try {
    const user = await requireAuth();
    const status = await getFacebookConnectionStatus(user.id);
    return json(status);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    await disconnectFacebook(user.id);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
