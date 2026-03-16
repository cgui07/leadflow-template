import { NextRequest } from "next/server";
import { error, handleError, json } from "@/lib/api";
import {
  AuthFlowError,
  requestPasswordReset,
} from "@/features/auth/server";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as { email?: string };
    const result = await requestPasswordReset(
      payload.email ?? "",
      req.nextUrl.origin,
    );

    return json(result);
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
