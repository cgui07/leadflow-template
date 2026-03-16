import { NextRequest } from "next/server";
import { error, handleError, json } from "@/lib/api";
import { AuthFlowError, registerWithInvite } from "@/features/auth/server";

export async function POST(req: NextRequest) {
  try {
    const user = await registerWithInvite(await req.json());
    return json({ user }, 201);
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
