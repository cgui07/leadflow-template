import { json, error } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { buildBranding } from "@/lib/branding";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Não autorizado", 401);

  const branding = buildBranding(user.tenant);

  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tenantId: user.tenantId,
    },
    branding,
  });
}
