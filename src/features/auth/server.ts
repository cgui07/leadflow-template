import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";
import { buildBranding } from "@/lib/branding";
import { validateInviteToken } from "@/lib/tenant";
import { sendPasswordResetEmail } from "@/lib/email";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { DEFAULT_PIPELINE_STAGE_COLORS } from "@/lib/ui-colors";
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  normalizeEmail,
  setAuthCookie,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import type {
  AuthUserSummary,
  InviteRegistrationInfo,
  LoginFormInput,
  PasswordResetRequestResult,
  RegisterFormInput,
  ResetPasswordInput,
} from "./contracts";

export class AuthFlowError extends AppError {
  constructor(
    code: string,
    status = 400,
    message?: string,
  ) {
    super(code, message ?? code, status);
  }
}

function mapUserSummary(user: {
  id: string;
  name: string;
  email: string;
}): AuthUserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function assertRequiredString(
  value: unknown,
  code: string,
  fieldName: string,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AuthFlowError(code, 400, fieldName);
  }

  return value.trim();
}

export async function loginWithPassword(
  input: LoginFormInput,
): Promise<AuthUserSummary> {
  const email = assertRequiredString(
    input.email,
    "LOGIN_MISSING_CREDENTIALS",
    "Email e senha são obrigatórios",
  );
  const password = assertRequiredString(
    input.password,
    "LOGIN_MISSING_CREDENTIALS",
    "Email e senha são obrigatórios",
  );
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      status: true,
      token_version: true,
      tenant: {
        select: {
          status: true,
        },
      },
    },
  });

  const GENERIC_LOGIN_ERROR = "Email ou senha incorretos";

  if (!user) {
    throw new AuthFlowError(
      "LOGIN_INVALID_CREDENTIALS",
      401,
      GENERIC_LOGIN_ERROR,
    );
  }

  if (user.status !== "active" || user.tenant?.status === "inactive") {
    throw new AuthFlowError(
      "LOGIN_INVALID_CREDENTIALS",
      401,
      GENERIC_LOGIN_ERROR,
    );
  }

  if (!user.passwordHash) {
    throw new AuthFlowError(
      "LOGIN_INVALID_CREDENTIALS",
      401,
      GENERIC_LOGIN_ERROR,
    );
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthFlowError(
      "LOGIN_INVALID_CREDENTIALS",
      401,
      GENERIC_LOGIN_ERROR,
    );
  }

  const token = signToken(user.id, user.token_version);
  await setAuthCookie(token);

  return mapUserSummary(user);
}

export async function getInviteRegistrationInfo(
  token: string | null | undefined,
): Promise<InviteRegistrationInfo> {
  const inviteToken = assertRequiredString(
    token,
    "INVITE_TOKEN_REQUIRED",
    "Token de convite é obrigatório",
  );
  const invite = await validateInviteToken(inviteToken);

  if (!invite) {
    throw new AuthFlowError(
      "INVITE_INVALID",
      403,
      "Convite inválido, expirado ou já utilizado",
    );
  }

  return {
    email: invite.email,
    tenantName: invite.tenant.name,
    branding: buildBranding(invite.tenant),
  };
}

export async function registerWithInvite(
  input: RegisterFormInput,
): Promise<AuthUserSummary> {
  const inviteToken = assertRequiredString(
    input.inviteToken,
    "REGISTER_INVITE_REQUIRED",
    "Cadastro disponível apenas por convite",
  );
  const invite = await validateInviteToken(inviteToken);

  if (!invite) {
    throw new AuthFlowError(
      "REGISTER_INVITE_INVALID",
      403,
      "Convite inválido, expirado ou já utilizado",
    );
  }

  const name = assertRequiredString(
    input.name,
    "REGISTER_REQUIRED_FIELDS",
    "Nome, email, senha e confirmação são obrigatórios",
  );
  const email = assertRequiredString(
    input.email,
    "REGISTER_REQUIRED_FIELDS",
    "Nome, email, senha e confirmação são obrigatórios",
  );
  const password = assertRequiredString(
    input.password,
    "REGISTER_REQUIRED_FIELDS",
    "Nome, email, senha e confirmação são obrigatórios",
  );
  const confirmPassword = assertRequiredString(
    input.confirmPassword,
    "REGISTER_REQUIRED_FIELDS",
    "Nome, email, senha e confirmação são obrigatórios",
  );
  const normalizedEmail = normalizeEmail(email);

  if (invite.email && normalizeEmail(invite.email) !== normalizedEmail) {
    throw new AuthFlowError(
      "REGISTER_INVITE_EMAIL_MISMATCH",
      403,
      "Este convite foi gerado para outro email",
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthFlowError(
      "REGISTER_PASSWORD_TOO_SHORT",
      400,
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }

  if (password !== confirmPassword) {
    throw new AuthFlowError(
      "REGISTER_PASSWORD_MISMATCH",
      400,
      "As senhas não coincidem",
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    throw new AuthFlowError("REGISTER_EMAIL_TAKEN", 409, "Email já cadastrado");
  }

  const passwordHash = await hashPassword(password);
  const stages = [
    { name: "Novo", color: DEFAULT_PIPELINE_STAGE_COLORS[0], order: 0 },
    {
      name: "Contato feito",
      color: DEFAULT_PIPELINE_STAGE_COLORS[1],
      order: 1,
    },
    { name: "Qualificado", color: DEFAULT_PIPELINE_STAGE_COLORS[2], order: 2 },
    {
      name: "Visita agendada",
      color: DEFAULT_PIPELINE_STAGE_COLORS[3],
      order: 3,
    },
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
      throw new AuthFlowError(
        "REGISTER_INVITE_INVALID",
        403,
        "Convite inválido, expirado ou já utilizado",
      );
    }

    const createdUser = await tx.user.create({
      data: {
        tenantId: invite.tenantId,
        name,
        email: normalizedEmail,
        passwordHash,
        phone:
          typeof input.phone === "string" && input.phone.trim()
            ? input.phone.trim()
            : null,
        role: invite.role,
        settings: { create: {} },
      },
    });

    await tx.pipelineStage.createMany({
      data: stages.map((stage) => ({ ...stage, userId: createdUser.id })),
    });

    return createdUser;
  });

  const authToken = signToken(user.id);
  await setAuthCookie(authToken);

  return mapUserSummary(user);
}

export async function requestPasswordReset(
  email: string,
  origin: string,
): Promise<PasswordResetRequestResult> {
  const normalizedEmail = normalizeEmail(
    assertRequiredString(
      email,
      "PASSWORD_RESET_EMAIL_REQUIRED",
      "Email obrigatório",
    ),
  );
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (user) {
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      throw new AuthFlowError(
        "PASSWORD_RESET_EMAIL_NOT_CONFIGURED",
        500,
        "O envio de e-mail não está configurado.",
      );
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    const appUrl = env.NEXT_PUBLIC_APP_URL || origin;
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    if (env.RESEND_API_KEY) {
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (error) {
        logger.error("Password reset email failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
          },
        });
        throw new AuthFlowError(
          "PASSWORD_RESET_EMAIL_FAILED",
          502,
          "Não foi possível enviar o e-mail de redefinição agora. Tente novamente em instantes.",
        );
      }
    }

    logger.info("Password reset email sent", { email: user.email });
  }

  return {
    message: "Se o email existir, enviamos um link para redefinir a senha.",
  };
}

export async function assertValidPasswordResetToken(
  token: string | null | undefined,
) {
  const rawToken = assertRequiredString(
    token,
    "PASSWORD_RESET_TOKEN_REQUIRED",
    "Token obrigatório",
  );

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashPasswordResetToken(rawToken) },
    select: { passwordResetExpiresAt: true },
  });

  const isValid =
    !!user?.passwordResetExpiresAt &&
    user.passwordResetExpiresAt.getTime() > Date.now();

  if (!isValid) {
    throw new AuthFlowError(
      "PASSWORD_RESET_TOKEN_INVALID",
      400,
      "Token inválido ou expirado",
    );
  }
}

export async function resetPasswordWithToken(
  input: ResetPasswordInput,
): Promise<AuthUserSummary> {
  const token = assertRequiredString(
    input.token,
    "PASSWORD_RESET_REQUIRED_FIELDS",
    "Token, senha e confirmação são obrigatórios",
  );
  const password = assertRequiredString(
    input.password,
    "PASSWORD_RESET_REQUIRED_FIELDS",
    "Token, senha e confirmação são obrigatórios",
  );
  const confirmPassword = assertRequiredString(
    input.confirmPassword,
    "PASSWORD_RESET_REQUIRED_FIELDS",
    "Token, senha e confirmação são obrigatórios",
  );

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthFlowError(
      "PASSWORD_RESET_PASSWORD_TOO_SHORT",
      400,
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }

  if (password !== confirmPassword) {
    throw new AuthFlowError(
      "PASSWORD_RESET_PASSWORD_MISMATCH",
      400,
      "As senhas não coincidem",
    );
  }

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashPasswordResetToken(token) },
  });

  if (
    !user ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() <= Date.now()
  ) {
    throw new AuthFlowError(
      "PASSWORD_RESET_TOKEN_INVALID",
      400,
      "Token inválido ou expirado",
    );
  }

  const passwordHash = await hashPassword(password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      token_version: { increment: 1 },
    },
    select: {
      id: true,
      email: true,
      name: true,
      token_version: true,
    },
  });

  const authToken = signToken(updatedUser.id, updatedUser.token_version);
  await setAuthCookie(authToken);

  return mapUserSummary(updatedUser);
}
