import { prisma } from "@/lib/db";
import { handleError, json, requireAuth } from "@/lib/api";

export async function DELETE() {
  try {
    const user = await requireAuth();

    await prisma.userSettings.update({
      where: { userId: user.id },
      data: {
        gmailAccessToken: null,
        gmailRefreshToken: null,
        gmailTokenExpiresAt: null,
      },
    });

    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
