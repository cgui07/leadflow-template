import { activateCanalPro } from "@/lib/canal-pro";
import { handleError, json, requireAuth } from "@/lib/api";

export async function POST() {
  try {
    const user = await requireAuth();
    const result = await activateCanalPro(user.id);
    return json(result);
  } catch (err) {
    return handleError(err);
  }
}
