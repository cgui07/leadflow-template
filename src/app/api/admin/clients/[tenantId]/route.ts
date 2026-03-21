import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  assertPlatformAdminAccess,
  PlatformAdminAccessError,
} from "@/lib/platform-admin";
import {
  deletePlatformClient,
  PlatformClientError,
} from "@/features/platform-admin/server";

type RouteContext = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    assertPlatformAdminAccess(user);
    const { tenantId } = await context.params;

    await deletePlatformClient(tenantId, {
      forbidTenantId: user.tenantId,
    });

    return json({ ok: true });
  } catch (err) {
    if (err instanceof PlatformAdminAccessError) {
      return error("Acesso negado", 403);
    }

    if (err instanceof PlatformClientError) {
      return error(err.message, err.status);
    }

    return handleError(err);
  }
}
