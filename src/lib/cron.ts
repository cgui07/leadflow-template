import { env } from "./env";
import { error } from "./api";
import { NextRequest, NextResponse } from "next/server";

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    if (env.NODE_ENV === "production") {
      return error("Não autorizado", 401);
    }

    return null;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return error("Não autorizado", 401);
  }

  return null;
}
