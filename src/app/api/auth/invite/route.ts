import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { validateInviteToken, getTenantBranding } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return error("Token de convite é obrigatório", 400);
  }

  const invite = await validateInviteToken(token);

  if (!invite) {
    return error("Convite inválido, expirado ou já utilizado", 403);
  }

  const branding = await getTenantBranding(invite.tenantId);

  return json({
    email: invite.email,
    tenantName: invite.tenant.name,
    branding,
  });
}
