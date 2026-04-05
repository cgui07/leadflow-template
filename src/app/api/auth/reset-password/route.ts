import { NextRequest } from "next/server";
import { ResetPasswordSchema } from "@/lib/schemas";
import { checkRateLimitAsync, getIp } from "@/lib/rate-limit";
import { error, handleError, json, withPublicHandler } from "@/lib/api";
import {
  assertValidPasswordResetToken,
  AuthFlowError,
  resetPasswordWithToken,
} from "@/features/auth/server";

export async function GET(req: NextRequest) {
  try {
    const ip = getIp(req);
    const { allowed } = await checkRateLimitAsync(`reset-password:${ip}`, {
      windowMs: 60_000,
      maxRequests: 10,
    });
    if (!allowed) {
      return error("Muitas tentativas. Tente novamente em breve.", 429);
    }

    await assertValidPasswordResetToken(req.nextUrl.searchParams.get("token"));
    return json({ valid: true });
  } catch (err) {
    if (err instanceof AuthFlowError) {
      return error(err.message, err.status);
    }
    return handleError(err);
  }
}

export const POST = withPublicHandler(ResetPasswordSchema, async (data, req: NextRequest) => {
  const ip = getIp(req);
  const { allowed } = await checkRateLimitAsync(`reset-password:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!allowed) {
    return error("Muitas tentativas. Tente novamente em breve.", 429);
  }

  const user = await resetPasswordWithToken(data);
  return json({ message: "Senha redefinida com sucesso", user });
});
