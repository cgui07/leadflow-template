import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { json, error, requireAuth, handleError } from "@/lib/api";
import {
  buildBranding,
  normalizeBrandColor,
  sanitizeTenantCustomTexts,
  sanitizeTenantFeatureFlags,
  type BrandColorKey,
} from "@/lib/branding";

function isTenantAdmin(user: Awaited<ReturnType<typeof requireAuth>>) {
  return user.role === "admin" && !!user.tenantId;
}

export async function GET() {
  try {
    const user = await requireAuth();

    if (!isTenantAdmin(user)) {
      return error("Acesso negado", 403);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId! },
      select: {
        id: true,
        slug: true,
        status: true,
        name: true,
        logoUrl: true,
        colorPrimary: true,
        colorSecondary: true,
        customTexts: true,
        featureFlags: true,
      },
    });

    if (!tenant) {
      return error("Tenant não encontrado", 404);
    }

    return json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        status: tenant.status,
        ...buildBranding(tenant),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isTenantAdmin(user)) {
      return error("Acesso negado", 403);
    }

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return error("Nome da marca é obrigatório");
    }

    const customTexts = sanitizeTenantCustomTexts(body.customTexts);
    const featureFlags = sanitizeTenantFeatureFlags(body.featureFlags);
    const branding = buildBranding({
      name,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : null,
      colorPrimary: normalizeBrandColor(
        typeof body.colorPrimary === "string" ? body.colorPrimary : null,
        "blue" satisfies BrandColorKey,
      ),
      colorSecondary: normalizeBrandColor(
        typeof body.colorSecondary === "string" ? body.colorSecondary : null,
        "purple" satisfies BrandColorKey,
      ),
      customTexts,
      featureFlags,
    });

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId! },
      data: {
        name: branding.name,
        logoUrl: branding.logoUrl,
        colorPrimary: branding.colorPrimary,
        colorSecondary: branding.colorSecondary,
        customTexts: branding.customTexts,
        featureFlags: branding.featureFlags,
      },
      select: {
        id: true,
        slug: true,
        status: true,
        name: true,
        logoUrl: true,
        colorPrimary: true,
        colorSecondary: true,
        customTexts: true,
        featureFlags: true,
      },
    });

    return json({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        status: tenant.status,
        ...buildBranding(tenant),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
