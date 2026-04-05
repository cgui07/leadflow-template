import { clearAuthCookie } from "@/lib/auth";
import { json, requireAuth } from "@/lib/api";

export async function POST() {
  // requireAuth ensures only authenticated users can trigger logout (CSRF protection)
  await requireAuth();
  await clearAuthCookie();
  return json({ ok: true });
}
