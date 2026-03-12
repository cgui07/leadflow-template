import { getCurrentUser } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Não autorizado", 401);
  return json({ user });
}
