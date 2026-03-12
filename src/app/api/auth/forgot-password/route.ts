import { NextRequest } from "next/server";
import { json, error } from "@/lib/api";
import { createPasswordResetToken, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return error("Email obrigatorio");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    let previewUrl: string | undefined;

    if (user) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      previewUrl = `${appUrl}/reset-password?token=${token}`;

      console.info(`[auth] Password reset link for ${user.email}: ${previewUrl}`);
    }

    return json({
      message: "Se o email existir, enviamos um link para redefinir a senha.",
      previewUrl: process.env.NODE_ENV === "production" ? undefined : previewUrl,
    });
  } catch (err) {
    console.error(err);
    return error("Erro ao solicitar redefinicao de senha", 500);
  }
}
