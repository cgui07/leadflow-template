"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A thin progress bar at the top of the viewport that animates during
 * page navigations. Listens for clicks on internal `<a>` elements to
 * detect navigation start, and hides once the pathname changes.
 */
export function TopProgressBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "completing">(
    "idle",
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const prevPathname = useRef(pathname);

  const startLoading = useCallback(() => {
    setState("loading");
  }, []);

  // Listen for clicks on internal links to detect navigation start
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      const currentPath = prevPathname.current;
      const isAlreadyOnPage =
        href === "/"
          ? currentPath === "/"
          : currentPath.startsWith(href);

      if (!isAlreadyOnPage) {
        startLoading();
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  // Complete animation when pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      if (stateRef.current === "loading") {
        setState("completing");
        const timeout = setTimeout(() => setState("idle"), 300);
        return () => clearTimeout(timeout);
      } else {
        // Navigation completed but we weren't in loading state — reset
        setState("idle");
      }
    }
  }, [pathname]);

  if (state === "idle") return null;

  return (
    <div
      className={cn("fixed inset-x-0 top-0 z-[100] h-0.5", className)}
    >
      <div
        className={cn(
          "h-full bg-primary ease-out",
          state === "loading" &&
            "animate-progress-bar w-[70%] duration-[8s]",
          state === "completing" &&
            "w-full transition-[width] duration-300",
        )}
      />
    </div>
  );
}
