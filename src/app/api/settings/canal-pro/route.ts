import { handleError, json, requireAuth } from "@/lib/api";
import {
  disconnectCanalPro,
  getCanalProConnectionStatus,
} from "@/lib/canal-pro";

export async function GET() {
  try {
    const user = await requireAuth();
    const status = await getCanalProConnectionStatus(user.id);
    return json(status);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const user = await requireAuth();
    await disconnectCanalPro(user.id);
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
