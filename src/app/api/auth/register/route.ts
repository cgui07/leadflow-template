import { RegisterSchema } from "@/lib/schemas";
import type { NextRequest } from "next/server";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
import { withPublicHandler, json, error } from "@/lib/api";
import { registerWithInvite } from "@/features/auth/server";

const handler = withPublicHandler(RegisterSchema, async (data) => {
  const user = await registerWithInvite(data);
  return json({ user }, 201);
});

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(`register:${getIp(req)}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!allowed) return error("Muitas tentativas. Tente novamente em breve.", 429);
  return handler(req);
}
