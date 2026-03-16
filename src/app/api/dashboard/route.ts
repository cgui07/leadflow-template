import { handleError, json, requireAuth } from "@/lib/api";
import { getDashboardData } from "@/features/dashboard/server";

export async function GET() {
  try {
    const user = await requireAuth();
    const data = await getDashboardData(user.id);

    return json(data);
  } catch (err) {
    return handleError(err);
  }
}
