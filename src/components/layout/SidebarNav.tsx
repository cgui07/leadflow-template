import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NavLink } from "@/components/ui/NavLink";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconMobile: React.ReactNode;
  badge?: number;
  mobileTab?: boolean;
}

interface SidebarNavProps {
  navItems: NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenAccountModal: () => void;
  pathname: string;
  activeNavClass: string;
  brandChipClass: string;
  brandingName: string;
  brandingLogoUrl: string | null;
  userName: string;
  userEmail: string;
  userInitial: string;
}

export function SidebarNav({
  navItems,
  collapsed,
  onToggleCollapsed,
  onOpenAccountModal,
  pathname,
  activeNavClass,
  brandChipClass,
  brandingName,
  brandingLogoUrl,
  userName,
  userEmail,
  userInitial,
}: SidebarNavProps) {
  return (
    <div
      className={cn(
        "hidden h-screen shrink-0 flex-col bg-neutral-ink text-white transition-all duration-300 md:flex",
        collapsed ? "w-17" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-neutral-deep px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {brandingLogoUrl ? (
              <BrandLogo
                src={brandingLogoUrl}
                alt={`${brandingName} logo`}
                width={24}
                height={24}
                className="h-6 w-6 rounded object-contain"
              />
            ) : null}
            <div className="text-lg font-bold tracking-tight">
              {brandingName}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapsed}
          icon={
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
          }
        />
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? activeNavClass
                  : "text-neutral-line hover:bg-neutral-deep hover:text-white",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">{item.label}</div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-xs font-bold text-white">
                      {item.badge}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-neutral-deep p-3">
        <Button
          variant="ghost"
          onClick={onOpenAccountModal}
          className={cn(
            "flex w-full items-center justify-start gap-3 rounded-xl px-2 py-2 text-left",
            collapsed && "justify-center px-1",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
              brandChipClass,
            )}
          >
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-neutral-muted">
                {userEmail}
              </div>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
