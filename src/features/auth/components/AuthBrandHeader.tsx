import { cn } from "@/lib/utils";
import { getBrandChipClass, type BrandColorKey } from "@/lib/branding";

interface AuthBrandHeaderProps {
  color?: BrandColorKey;
  logoUrl?: string | null;
  name: string;
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

export function AuthBrandHeader({
  color = "blue",
  logoUrl,
  name,
}: AuthBrandHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-8 w-8 rounded-lg object-contain"
        />
      ) : (
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white",
            getBrandChipClass(color),
          )}
        >
          {getBrandInitials(name)}
        </div>
      )}
      <div className="text-xl font-bold text-gray-iron">{name}</div>
    </div>
  );
}
