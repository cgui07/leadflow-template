import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { generateInviteToken } from "@/lib/tenant";
import { json, error, requireAuth, handleError } from "@/lib/api";

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
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, status: true },
    });

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

    const invite = await prisma.inviteToken.create({
      data: {
        tenantId: user.tenantId,
        token,
        email:
          typeof email === "string" && email.trim()
            ? email.trim().toLowerCase()
            : null,
        role: role === "admin" ? "admin" : "agent",
        maxUses: parsedMaxUses,
        expiresAt,
      },
    });

    return json(
      {
        invite,
        inviteUrl: `/register?token=${token}`,
      },
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}
