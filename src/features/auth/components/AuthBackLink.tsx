import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthBackLinkProps {
  href: string;
  label: string;
}

export function AuthBackLink({ href, label }: AuthBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-gray-smoke transition-colors hover:text-gray-charcoal"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
