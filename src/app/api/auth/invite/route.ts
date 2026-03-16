import { NextRequest } from "next/server";
import { error, handleError, json } from "@/lib/api";
import {
  AuthFlowError,
  getInviteRegistrationInfo,
} from "@/features/auth/server";

export async function GET(req: NextRequest) {
  try {
    const invite = await getInviteRegistrationInfo(
      req.nextUrl.searchParams.get("token"),
    );

    return json(invite);
  } catch (err) {
    if (err instanceof AuthFlowError) {
      return error(err.message, err.status);
    }

    return handleError(err);
  }
}
