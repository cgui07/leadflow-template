import { NextRequest } from "next/server";
import { json, error } from "@/lib/api";
import {
  hashPassword,
  hashPasswordResetToken,
  setAuthCookie,
  signToken,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return error("Token obrigatorio");
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetTokenHash: hashPasswordResetToken(token) },
      select: { passwordResetExpiresAt: true },
    });

    const isValid =
      !!user?.passwordResetExpiresAt && user.passwordResetExpiresAt.getTime() > Date.now();

    if (!isValid) {
      return error("Token invalido ou expirado", 400);
    }

    return json({ valid: true });
  } catch (err) {
    console.error(err);
    return error("Erro ao validar token", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirmPassword } = await req.json();

    if (!token || !password || !confirmPassword) {
      return error("Token, senha e confirmacao sao obrigatorios");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return error(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    if (password !== confirmPassword) {
      return error("As senhas nao coincidem");
    }

    const user = await prisma.user.findUnique({
      where: { passwordResetTokenHash: hashPasswordResetToken(token) },
    });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() <= Date.now()) {
      return error("Token invalido ou expirado", 400);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    const authToken = signToken(user.id);
    await setAuthCookie(authToken);

    return json({
      message: "Senha redefinida com sucesso",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error(err);
    return error("Erro ao redefinir senha", 500);
  }
}
