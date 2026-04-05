import { NextRequest } from "next/server";
import { UpdateTenantCustomizationSchema } from "@/lib/schemas";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  TenantAccessError,
  getTenantCustomization,
  updateTenantCustomization,
} from "@/features/settings/server";

function getTenantContext(user: Awaited<ReturnType<typeof requireAuth>>) {
  return {
    role: user.role,
    tenantId: user.tenantId,
  };
}

export async function GET() {
  try {
    const user = await requireAuth();
    const tenant = await getTenantCustomization(getTenantContext(user));

    if (!tenant) {
      return error("Tenant não encontrado", 404);
    }

    return json({ tenant });
  } catch (err) {
    if (err instanceof TenantAccessError) {
      return error("Acesso negado", 403);
    }

    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = UpdateTenantCustomizationSchema.parse(await req.json());
    const tenant = await updateTenantCustomization(
      getTenantContext(user),
      body as Record<string, unknown>,
    );

    if (!tenant) {
      return error("Tenant não encontrado", 404);
    }

    return json({ tenant });
  } catch (err) {
    if (err instanceof TenantAccessError) {
      return error("Acesso negado", 403);
    }

    if (err instanceof Error && err.message === "TENANT_NAME_REQUIRED") {
      return error("Nome da marca é obrigatório");
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
