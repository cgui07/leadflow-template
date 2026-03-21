import { withPublicHandler, json, error } from "@/lib/api";
import { LoginSchema } from "@/lib/schemas";
import { loginWithPassword } from "@/features/auth/server";
import { checkRateLimit, getIp } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

const handler = withPublicHandler(LoginSchema, async (data) => {
  const user = await loginWithPassword(data);
  return json({ user });
});

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(`login:${getIp(req)}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!allowed) return error("Muitas tentativas. Tente novamente em breve.", 429);
  return handler(req);
}
