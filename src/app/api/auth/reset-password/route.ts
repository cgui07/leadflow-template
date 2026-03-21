import { NextRequest } from "next/server";
import { ResetPasswordSchema } from "@/lib/schemas";
import { error, handleError, json, withPublicHandler } from "@/lib/api";
import {
  assertValidPasswordResetToken,
  AuthFlowError,
  resetPasswordWithToken,
} from "@/features/auth/server";

export async function GET(req: NextRequest) {
  try {
    await assertValidPasswordResetToken(req.nextUrl.searchParams.get("token"));
    return json({ valid: true });
  } catch (err) {
    if (err instanceof AuthFlowError) {
      return error(err.message, err.status);
    }
    return handleError(err);
  }
}

export const POST = withPublicHandler(ResetPasswordSchema, async (data) => {
  const user = await resetPasswordWithToken(data);
  return json({ message: "Senha redefinida com sucesso", user });
});
