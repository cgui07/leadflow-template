import { env } from "./env";
import { error } from "./api";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    return error("Não autorizado — CRON_SECRET não configurado", 401);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  const valid =
    expected.length === received.length &&
    timingSafeEqual(expected, received);

  if (!valid) {
    return error("Não autorizado", 401);
  }

  return null;
}
