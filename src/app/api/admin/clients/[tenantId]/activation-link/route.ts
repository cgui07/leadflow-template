import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  assertPlatformAdminAccess,
  PlatformAdminAccessError,
} from "@/lib/platform-admin";
import {
  regeneratePlatformActivationLink,
  PlatformClientError,
} from "@/features/platform-admin/server";

function getAppUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
}

type RouteContext = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    assertPlatformAdminAccess(user);
    const { tenantId } = await context.params;

    const result = await regeneratePlatformActivationLink(
      tenantId,
      await req.json(),
      {
        appUrl: getAppUrl(req),
        forbidTenantId: user.tenantId,
      },
    );

    return json(result, 201);
  } catch (err) {
    if (err instanceof PlatformAdminAccessError) {
      return error("Acesso negado", 403);
    }

    if (err instanceof PlatformClientError) {
      return error(err.message, err.status);
    }

    if (err instanceof SyntaxError) {
      return error("Payload inválido");
    }

    return handleError(err);
  }
}
