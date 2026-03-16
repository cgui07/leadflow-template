import { prisma } from "@/lib/db";
import { json, error } from "@/lib/api";
import { NextRequest } from "next/server";
import { validateInviteToken } from "@/lib/tenant";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { DEFAULT_PIPELINE_STAGE_COLORS } from "@/lib/ui-colors";
import {
  hashPassword,
  normalizeEmail,
  signToken,
  setAuthCookie,
} from "@/lib/auth";

const INVITE_CONSUMED_ERROR = "INVITE_CONSUMED";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, confirmPassword, phone, inviteToken } =
      await req.json();

    if (!inviteToken) {
      return error("Cadastro disponível apenas por convite", 403);
    }

    const invite = await validateInviteToken(inviteToken);

    if (!invite) {
      return error("Convite inválido, expirado ou já utilizado", 403);
    }

    if (!name || !email || !password || !confirmPassword) {
      return error("Nome, email, senha e confirmação são obrigatórios");
    }

    const normalizedEmail = normalizeEmail(email);

    if (invite.email && normalizeEmail(invite.email) !== normalizedEmail) {
      return error("Este convite foi gerado para outro email", 403);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return error(
        `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    if (password !== confirmPassword) {
      return error("As senhas não coincidem");
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return error("Email já cadastrado");
    }

    const passwordHash = await hashPassword(password);
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

    const user = await prisma.$transaction(async (tx) => {
      const inviteClaim = await tx.inviteToken.updateMany({
        where: {
          id: invite.id,
          expiresAt: { gt: new Date() },
          usedCount: { lt: invite.maxUses },
        },
        data: {
          usedCount: { increment: 1 },
        },
      });

      if (inviteClaim.count !== 1) {
        throw new Error(INVITE_CONSUMED_ERROR);
      }

      const createdUser = await tx.user.create({
        data: {
          tenantId: invite.tenantId,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: phone?.trim() || null,
          role: invite.role,
          settings: { create: {} },
        },
      });

      await tx.pipelineStage.createMany({
        data: stages.map((stage) => ({ ...stage, userId: createdUser.id })),
      });

      return createdUser;
    });

    const token = signToken(user.id);
    await setAuthCookie(token);

    return json(
      { user: { id: user.id, name: user.name, email: user.email } },
      201,
    );
  } catch (err) {
    if (err instanceof Error && err.message === INVITE_CONSUMED_ERROR) {
      return error("Convite inválido, expirado ou já utilizado", 403);
    }

    console.error(err);
    return error("Erro ao criar conta", 500);
  }
}
