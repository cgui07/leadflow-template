"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends ComponentProps<typeof Link> {
  /** Icon shown by default */
  icon?: ReactNode;
  /** If true, shows a spinner replacing the icon while navigating */
  showLoadingIcon?: boolean;
  children?: ReactNode;
}

/**
 * A Link wrapper that detects navigation loading state.
 * When clicked, it enters a loading state until the pathname changes.
 * Useful for sidebar/nav items that need visual feedback.
 */
export function NavLink({
  href,
  icon,
  showLoadingIcon = true,
  onClick,
  children,
  className,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const targetHref = useRef<string>("");

  const hrefString = typeof href === "string" ? href : href.pathname ?? "";

  // Reset loading when pathname changes (navigation completed)
  useEffect(() => {
    if (isLoading) {
      setIsLoading(false);
      targetHref.current = "";
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const isAlreadyOnPage =
      hrefString === "/"
        ? pathname === "/"
        : pathname.startsWith(hrefString);

    // Don't show loading if we're already on this page
    if (!isAlreadyOnPage) {
      setIsLoading(true);
      targetHref.current = hrefString;
    }

    onClick?.(e);
  }

  const loadingIcon =
    isLoading && showLoadingIcon ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : null;

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {showLoadingIcon ? (
        <div className="shrink-0">{loadingIcon ?? icon}</div>
      ) : (
        icon && <div className="shrink-0">{icon}</div>
      )}
      {children}
      {isLoading && !showLoadingIcon && (
        <Loader2 className="ml-auto h-4 w-4 animate-spin opacity-60" />
      )}
    </Link>
  );
}

export { type NavLinkProps };
