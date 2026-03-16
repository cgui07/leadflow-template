import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui";
import {
  getBrandChipClass,
  type TenantBranding,
} from "@/lib/branding";

type AuthBrandIdentity = Pick<TenantBranding, "colorPrimary" | "logoUrl" | "name">;

interface AuthBrandHeaderProps {
  branding: AuthBrandIdentity;
}

function getBrandInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length > 0) {
    return words.map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function AuthBrandHeader({ branding }: AuthBrandHeaderProps) {
  const { colorPrimary, logoUrl, name } = branding;

  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <BrandLogo
          src={logoUrl}
          alt={`${name} logo`}
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg object-contain"
        />
      ) : (
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white",
            getBrandChipClass(colorPrimary),
          )}
        >
          {getBrandInitials(name)}
        </div>
      )}
      <div className="text-xl font-bold text-gray-iron">{name}</div>
    </div>
  );
}
