import { handleError, json, requireAuth } from "@/lib/api";
import { getAttentionQueueItems } from "@/features/dashboard/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await getAttentionQueueItems(user.id);

    return json(items);
  } catch (err) {
    return handleError(err);
  }
}
