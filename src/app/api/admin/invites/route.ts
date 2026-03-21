import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { generateInviteToken } from "@/lib/tenant";
import { json, error, requireAuth, handleError } from "@/lib/api";
import { sendInviteEmail } from "@/lib/email";
import { env } from "@/lib/env";

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

    const { email, role, maxUses, expiresInDays } = await req.json();
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
    const parsedMaxUses = Number.isInteger(maxUses) && maxUses > 0 ? maxUses : 1;
    const parsedExpiresInDays =
      Number.isInteger(expiresInDays) && expiresInDays > 0 ? expiresInDays : 7;
    const expiresAt = new Date(
      Date.now() + parsedExpiresInDays * 24 * 60 * 60 * 1000,
    );

    const inviteEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : null;

    const invite = await prisma.inviteToken.create({
      data: {
        tenantId: user.tenantId,
        token,
        email: inviteEmail,
        role: role === "admin" ? "admin" : "agent",
        maxUses: parsedMaxUses,
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
        role: role === "admin" ? "admin" : "agent",
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
