import { prisma } from "@/lib/db";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken, normalizeEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return error("Email obrigatório");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    let previewUrl: string | undefined;

    if (user) {
      if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
        return error("O envio de e-mail não está configurado.", 500);
      }

      const { token, tokenHash, expiresAt } = createPasswordResetToken();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });

      if (process.env.RESEND_API_KEY) {
        try {
          await sendPasswordResetEmail(user.email, resetUrl);
        } catch (emailErr) {
          console.error("[auth] Password reset email failed:", emailErr);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordResetTokenHash: null,
              passwordResetExpiresAt: null,
            },
          });
          return error(
            "Não foi possível enviar o e-mail de redefinição agora. Tente novamente em instantes.",
            502,
          );
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
    return error("Erro ao solicitar redefinição de senha", 500);
  }
}
