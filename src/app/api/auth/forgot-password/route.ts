import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { withPublicHandler } from "@/lib/api";
import { ForgotPasswordSchema } from "@/lib/schemas";
import { requestPasswordReset } from "@/features/auth/server";
import { checkRateLimitAsync, getIp } from "@/lib/rate-limit";

export const POST = withPublicHandler(ForgotPasswordSchema, async (data, req: NextRequest) => {
  const ip = getIp(req);
  const { allowed } = await checkRateLimitAsync(`forgot-password:${ip}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!allowed) {
    return error("Muitas tentativas. Tente novamente em breve.", 429);
  }

  const result = await requestPasswordReset(data.email, req.nextUrl.origin);
  return json(result);
});
