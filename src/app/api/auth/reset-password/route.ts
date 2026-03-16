import { NextRequest } from "next/server";
import { error, handleError, json } from "@/lib/api";
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

export async function POST(req: NextRequest) {
  try {
    const user = await resetPasswordWithToken(await req.json());
    return json({
      message: "Senha redefinida com sucesso",
      user,
    });
  } catch (err) {
    if (err instanceof AuthFlowError) {
      return error(err.message, err.status);
    }

    if (err instanceof SyntaxError) {
      return error("Payload invalido");
    }

    return handleError(err);
  }
}
