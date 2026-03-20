import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ChevronRight, LogOut, X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconMobile: React.ReactNode;
  badge?: number;
  mobileTab?: boolean;
}

interface SidebarMobileMenuProps {
  extraItems: NavItem[];
  pathname: string;
  brandChipClass: string;
  userName: string;
  userEmail: string;
  userInitial: string;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function SidebarMobileMenu({
  extraItems,
  pathname,
  brandChipClass,
  userName,
  userEmail,
  userInitial,
  loggingOut,
  onClose,
  onLogout,
}: SidebarMobileMenuProps) {
  return (
    <div className="fixed inset-0 z-60 md:hidden">
      <div
        className="absolute inset-0 bg-neutral-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-hero">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="h-1 w-10 rounded-full bg-neutral-border mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="text-base font-semibold text-neutral-ink pt-2">
            Menu
          </div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            icon={<X size={18} />}
            className="rounded-full p-1.5 text-neutral-muted hover:bg-neutral-surface hover:text-neutral-dark transition-colors"
          />
        </div>

        <div className="px-4 pb-3 space-y-1">
          {extraItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-neutral-dark hover:bg-neutral-surface",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-neutral-pale text-neutral-steel",
                  )}
                >
                  {item.iconMobile}
                </div>
                <div className="flex-1">{item.label}</div>
                <ChevronRight
                  size={16}
                  className={cn(
                    isActive ? "text-primary" : "text-neutral-border",
                  )}
                />
              </Link>
            );
          })}
        </div>

        <div className="mx-4 border-t border-neutral-border" />

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-surface px-4 py-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
                brandChipClass,
              )}
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-neutral-ink">
                {userName}
              </div>
              <div className="truncate text-xs text-neutral">
                {userEmail}
              </div>
            </div>
          </div>

          <Button
            variant="danger"
            fullWidth
            loading={loggingOut}
            icon={<LogOut className="h-4 w-4" />}
            onClick={onLogout}
          >
            {loggingOut ? "Saindo..." : "Log out"}
          </Button>
        </div>

        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
