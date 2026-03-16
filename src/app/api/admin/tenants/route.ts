import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { isPlatformAdminEmail } from "@/lib/tenant";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  buildBranding,
  normalizeBrandColor,
  type BrandColorKey,
} from "@/lib/branding";

function requirePlatformAdmin(user: Awaited<ReturnType<typeof requireAuth>>) {
  if (user.role !== "admin" || !isPlatformAdminEmail(user.email)) {
    throw new Error("PLATFORM_ADMIN_ONLY");
  }
}

export async function GET() {
  try {
    const user = await requireAuth();
    requirePlatformAdmin(user);

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    });

    return json({ tenants });
  } catch (err) {
    if (err instanceof Error && err.message === "PLATFORM_ADMIN_ONLY") {
      return error("Acesso negado", 403);
    }

    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    requirePlatformAdmin(user);

    const { name, slug, logoUrl, colorPrimary, colorSecondary, featureFlags, customTexts } =
      await req.json();

    if (!name || !slug) {
      return error("Nome e slug são obrigatórios");
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return error(
        "Slug deve conter apenas letras minúsculas, números e hífens",
      );
    }

    const existing = await prisma.tenant.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return error("Slug já está em uso");
    }

    const branding = buildBranding({
      name,
      logoUrl,
      colorPrimary: normalizeBrandColor(
        typeof colorPrimary === "string" ? colorPrimary : null,
        "blue" satisfies BrandColorKey,
      ),
      colorSecondary: normalizeBrandColor(
        typeof colorSecondary === "string" ? colorSecondary : null,
        "purple" satisfies BrandColorKey,
      ),
      customTexts,
      featureFlags,
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: branding.name,
        slug: slug.trim().toLowerCase(),
        logoUrl: branding.logoUrl,
        colorPrimary: branding.colorPrimary,
        colorSecondary: branding.colorSecondary,
        featureFlags: branding.featureFlags,
        customTexts: branding.customTexts,
      },
    });

    return json({ tenant }, 201);
  } catch (err) {
    if (err instanceof Error && err.message === "PLATFORM_ADMIN_ONLY") {
      return error("Acesso negado", 403);
    }

    return handleError(err);
  }
}
