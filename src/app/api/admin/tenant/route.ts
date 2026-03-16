import { NextRequest } from "next/server";
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
      return error("Tenant nao encontrado", 404);
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
    const body = (await req.json()) as Record<string, unknown>;
    const tenant = await updateTenantCustomization(getTenantContext(user), body);

    if (!tenant) {
      return error("Tenant nao encontrado", 404);
    }

    return json({ tenant });
  } catch (err) {
    if (err instanceof TenantAccessError) {
      return error("Acesso negado", 403);
    }

    if (err instanceof Error && err.message === "TENANT_NAME_REQUIRED") {
      return error("Nome da marca e obrigatorio");
    }

    if (err instanceof SyntaxError) {
      return error("Payload invalido");
    }

    return handleError(err);
  }
}
