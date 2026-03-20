import { getCurrentUser } from "./auth";
import { logger } from "./logger";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "./errors";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function error(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export class AuthError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "Unauthorized", 401);
  }
}

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return error(err.message, err.status);
  }
  logger.error("Unhandled error", { error: err instanceof Error ? err.message : String(err) });
  return error("Erro interno do servidor", 500);
}

export type AuthUser = Awaited<ReturnType<typeof requireAuth>>;

export function withApiHandler<T = unknown>(
  schema: ZodSchema<T> | null,
  handler: (user: AuthUser, data: T, req: NextRequest) => Promise<ReturnType<typeof json>>,
) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth();
      const data = schema ? schema.parse(await req.json()) : (null as T);
      return await handler(user, data, req);
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join("; ");
        return error(message, 400);
      }
      return handleError(err);
    }
  };
}

export function withPublicHandler<T = unknown>(
  schema: ZodSchema<T> | null,
  handler: (data: T, req: NextRequest) => Promise<ReturnType<typeof json>>,
) {
  return async (req: NextRequest) => {
    try {
      const data = schema ? schema.parse(await req.json()) : (null as T);
      return await handler(data, req);
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join("; ");
        return error(message, 400);
      }
      return handleError(err);
    }
  };
}
