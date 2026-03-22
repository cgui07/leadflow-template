"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A thin progress bar at the top of the viewport that animates during
 * page navigations. Automatically starts when the pathname is about to
 * change and completes when it does.
 *
 * Must be used together with `TopProgressBarTrigger` context — or it
 * listens for clicks on any internal `<a>` to detect navigation start.
 */
export function TopProgressBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "completing">(
    "idle",
  );
  const prevPathname = useRef(pathname);

  // Listen for clicks on internal links to detect navigation start
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      // Check if we're already on this page
      const isAlreadyOnPage =
        href === "/"
          ? pathname === "/"
          : pathname.startsWith(href);

      if (!isAlreadyOnPage) {
        setState("loading");
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  // Complete animation when pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      if (state === "loading") {
        setState("completing");
        const timeout = setTimeout(() => setState("idle"), 300);
        return () => clearTimeout(timeout);
      }
    }
  }, [pathname, state]);

  if (state === "idle") return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-[100] h-0.5",
        className,
      )}
    >
      <div
        className={cn(
          "h-full bg-primary transition-all ease-out",
          state === "loading" &&
            "animate-progress-bar w-[70%] duration-[8s]",
          state === "completing" && "w-full duration-300",
        )}
      />
    </div>
  );
}
