import { error } from "./api";
import { env } from "./env";
import { NextRequest, NextResponse } from "next/server";

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    if (env.NODE_ENV === "production") {
      return error("CRON_SECRET não configurado", 500);
    }

    return null;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return error("Não autorizado", 401);
  }

  return null;
}
