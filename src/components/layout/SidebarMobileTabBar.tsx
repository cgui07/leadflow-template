import Link from "next/link";
import { cn } from "@/lib/utils";
import { Grid2x2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconMobile: React.ReactNode;
  badge?: number;
  mobileTab?: boolean;
}

interface SidebarMobileTabBarProps {
  tabItems: NavItem[];
  pathname: string;
  activeTextClass: string;
  isExtraActive: boolean;
  showMobileMenu: boolean;
  onOpenMobileMenu: () => void;
}

export function SidebarMobileTabBar({
  tabItems,
  pathname,
  activeTextClass,
  isExtraActive,
  showMobileMenu,
  onOpenMobileMenu,
}: SidebarMobileTabBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-border bg-white/95 backdrop-blur-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {tabItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors min-w-0",
                isActive
                  ? activeTextClass
                  : "text-neutral-muted active:text-neutral-steel",
              )}
            >
              <div className="shrink-0">{item.iconMobile}</div>
              <div
                className={cn(
                  "text-[10px] font-medium leading-tight truncate",
                  isActive && "font-semibold",
                )}
              >
                {item.label}
              </div>
            </Link>
          );
        })}

        <Button
          variant="ghost"
          type="button"
          onClick={onOpenMobileMenu}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors min-w-0",
            isExtraActive || showMobileMenu
              ? activeTextClass
              : "text-neutral-muted active:text-neutral-steel",
          )}
        >
          <Grid2x2 size={22} />
          <div
            className={cn(
              "text-[10px] font-medium leading-tight",
              (isExtraActive || showMobileMenu) && "font-semibold",
            )}
          >
            Mais
          </div>
        </Button>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
