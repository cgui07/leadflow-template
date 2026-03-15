import { prisma } from "@/lib/db";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { DEFAULT_PIPELINE_STAGE_COLORS } from "@/lib/ui-colors";
import { hashPassword, normalizeEmail, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirmPassword, phone } = await req.json();

    if (!name || !email || !password || !confirmPassword) {
      return error("Nome, email, senha e confirmação são obrigatórios");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return error(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    if (password !== confirmPassword) {
      return error("As senhas não coincidem");
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      return error("Email já cadastrado");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        settings: { create: {} },
      },
    });

    const stages = [
      { name: "Novo", color: DEFAULT_PIPELINE_STAGE_COLORS[0], order: 0 },
      { name: "Contato feito", color: DEFAULT_PIPELINE_STAGE_COLORS[1], order: 1 },
      { name: "Qualificado", color: DEFAULT_PIPELINE_STAGE_COLORS[2], order: 2 },
      { name: "Visita agendada", color: DEFAULT_PIPELINE_STAGE_COLORS[3], order: 3 },
      { name: "Proposta", color: DEFAULT_PIPELINE_STAGE_COLORS[4], order: 4 },
      { name: "Negociação", color: DEFAULT_PIPELINE_STAGE_COLORS[5], order: 5 },
      { name: "Fechado", color: DEFAULT_PIPELINE_STAGE_COLORS[6], order: 6 },
      { name: "Perdido", color: DEFAULT_PIPELINE_STAGE_COLORS[7], order: 7 },
    ];

    await prisma.pipelineStage.createMany({
      data: stages.map((stage) => ({ ...stage, userId: user.id })),
    });

    const token = signToken(user.id);
    await setAuthCookie(token);

    return json({ user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (err) {
    console.error(err);
    return error("Erro ao criar conta", 500);
  }
}
