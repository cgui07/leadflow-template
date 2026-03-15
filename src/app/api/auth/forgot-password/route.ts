import { prisma } from "@/lib/db";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken, normalizeEmail } from "@/lib/auth";

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
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      if (process.env.RESEND_API_KEY) {
        try {
          await sendPasswordResetEmail(user.email, resetUrl);
        } catch (emailErr) {
          console.error("[auth] Email send failed, continuing:", emailErr);
        }
      }

      if (process.env.NODE_ENV !== "production") {
        previewUrl = resetUrl;
        console.info(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
      }
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
