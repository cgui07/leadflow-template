import { error, json } from "@/lib/api";
import { getSession } from "@/features/auth/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return error("Não autorizado", 401);
  }

  return json({
    user: session.user,
    branding: session.branding,
  });
}
