import { withPublicHandler } from "@/lib/api";
import { LoginSchema } from "@/lib/schemas";
import { loginWithPassword } from "@/features/auth/server";
import { json } from "@/lib/api";

export const POST = withPublicHandler(LoginSchema, async (data) => {
  const user = await loginWithPassword(data);
  return json({ user });
});
