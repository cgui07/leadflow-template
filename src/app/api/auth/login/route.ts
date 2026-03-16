import { prisma } from "@/lib/db";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import {
  normalizeEmail,
  verifyPassword,
  signToken,
  setAuthCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return error("Email e senha são obrigatórios");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        status: true,
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!user) {
      return error("Credenciais inválidas", 401);
    }

    if (user.status !== "active" || user.tenant?.status === "inactive") {
      return error("Conta suspensa. Entre em contato com o administrador.", 403);
    }

    if (!user.passwordHash) {
      return error(
        "Esta conta usa login com Google. Clique em 'Continuar com Google'.",
        401,
      );
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
