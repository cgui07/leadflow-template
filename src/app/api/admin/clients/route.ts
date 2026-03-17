import { NextRequest } from "next/server";
import { error, handleError, json, requireAuth } from "@/lib/api";
import {
  assertPlatformAdminAccess,
  PlatformAdminAccessError,
} from "@/lib/platform-admin";
import {
  createPlatformClient,
  listPlatformClients,
  PlatformClientError,
} from "@/features/platform-admin/server";

function getAppUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    assertPlatformAdminAccess(user);

    const clients = await listPlatformClients({
      appUrl: getAppUrl(req),
      excludeTenantId: user.tenantId,
    });

    return json(clients);
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

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    assertPlatformAdminAccess(user);

    const client = await createPlatformClient(await req.json(), {
      appUrl: getAppUrl(req),
    });

    return json(client, 201);
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
