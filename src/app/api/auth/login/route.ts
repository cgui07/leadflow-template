import { prisma } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return error("Email e senha são obrigatórios");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error("Credenciais inválidas", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return error("Credenciais inválidas", 401);
    }

    const token = signToken(user.id);
    await setAuthCookie(token);

    return json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return error("Erro ao fazer login", 500);
  }
}
