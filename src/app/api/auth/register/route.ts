import { withPublicHandler } from "@/lib/api";
import { RegisterSchema } from "@/lib/schemas";
import { registerWithInvite } from "@/features/auth/server";
import { json } from "@/lib/api";

export const POST = withPublicHandler(RegisterSchema, async (data) => {
  const user = await registerWithInvite(data);
  return json({ user }, 201);
});
