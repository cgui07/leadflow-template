import { prisma } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";
import { DEFAULT_PIPELINE_STAGE_COLORS } from "@/lib/ui-colors";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return error("Nome, email e senha são obrigatórios");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error("Email já cadastrado");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
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
      data: stages.map((s) => ({ ...s, userId: user.id })),
    });

    const token = signToken(user.id);
    await setAuthCookie(token);

    return json({ user: { id: user.id, name: user.name, email: user.email } }, 201);
  } catch (err) {
    console.error(err);
    return error("Erro ao criar conta", 500);
  }
}
