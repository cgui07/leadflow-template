import { json, error } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Não autorizado", 401);
  return json({ user });
}
