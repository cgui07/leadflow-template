import { json } from "@/lib/api";
import { NextRequest } from "next/server";
import { withPublicHandler } from "@/lib/api";
import { ForgotPasswordSchema } from "@/lib/schemas";
import { requestPasswordReset } from "@/features/auth/server";

export const POST = withPublicHandler(ForgotPasswordSchema, async (data, req: NextRequest) => {
  const result = await requestPasswordReset(data.email, req.nextUrl.origin);
  return json(result);
});
