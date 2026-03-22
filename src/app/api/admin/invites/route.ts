import { z } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { sendInviteEmail } from "@/lib/email";
import { generateInviteToken } from "@/lib/tenant";
import { json, error, requireAuth, handleError } from "@/lib/api";

const createInviteSchema = z.object({
  email: z.string().email("Email inválido").optional().or(z.literal("")).transform(v => v || null),
  role: z.enum(["admin", "agent"]).default("agent"),
  maxUses: z.number().int().positive().default(1),
  expiresInDays: z.number().int().positive().max(365).default(7),
});

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "admin") {
      return error("Acesso negado", 403);
    }

    if (!user.tenantId) {
      return error("Admin sem tenant vinculado", 400);
    }

    const invites = await prisma.inviteToken.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { name: true, slug: true } } },
    });

    return json({ invites });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "admin") {
      return error("Acesso negado", 403);
    }

    if (!user.tenantId) {
      return error("Admin sem tenant vinculado", 400);
    }

    const body = await req.json().catch(() => null);
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message ?? "Dados inválidos", 400);
    }
    const { email, role, maxUses, expiresInDays } = parsed.data;
    const [tenant, inviter] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { id: true, status: true, name: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      }),
    ]);

    if (!tenant || tenant.status !== "active") {
      return error("Tenant não encontrado ou inativo", 404);
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const inviteEmail = email ? email.trim().toLowerCase() : null;

    const invite = await prisma.inviteToken.create({
      data: {
        tenantId: user.tenantId,
        token,
        email: inviteEmail,
        role,
        maxUses,
        expiresAt,
      },
    });

    const appUrl = env.APP_URL || env.NEXT_PUBLIC_APP_URL;
    const inviteUrl = `/register?token=${token}`;

    if (inviteEmail) {
      await sendInviteEmail({
        to: inviteEmail,
        tenantName: tenant.name,
        inviterName: inviter?.name || "Um administrador",
        inviteLink: `${appUrl}${inviteUrl}`,
        expiresAt: expiresAt.toISOString(),
        role,
      });
    }

    return json(
      {
        invite,
        inviteUrl,
      },
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
