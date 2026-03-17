"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useBranding } from "@/components/providers/BrandingProvider";
import {
  getBrandActiveNavClass,
  getBrandChipClass,
  getBrandTextClass,
} from "@/lib/branding";
import {
  Building2,
  CheckSquare,
  ChevronLeft,
  Kanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconMobile: React.ReactNode;
  badge?: number;
  mobileVisible?: boolean;
}

function getNavItems(canManagePlatform: boolean): NavItem[] {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      iconMobile: <LayoutDashboard size={22} />,
      mobileVisible: true,
    },
    {
      label: "Conversas",
      href: "/conversations",
      icon: <MessageSquare size={20} />,
      iconMobile: <MessageSquare size={22} />,
      mobileVisible: true,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <Users size={20} />,
      iconMobile: <Users size={22} />,
      mobileVisible: true,
    },
    {
      label: "Pipeline",
      href: "/pipeline",
      icon: <Kanban size={20} />,
      iconMobile: <Kanban size={22} />,
      mobileVisible: true,
    },
    {
      label: "Tarefas",
      href: "/tasks",
      icon: <CheckSquare size={20} />,
      iconMobile: <CheckSquare size={22} />,
      mobileVisible: true,
    },
    ...(canManagePlatform
      ? [
          {
            label: "Clientes",
            href: "/clients",
            icon: <Building2 size={20} />,
            iconMobile: <Building2 size={22} />,
            mobileVisible: false,
          } satisfies NavItem,
        ]
      : []),
    {
      label: "Configurações",
      href: "/settings",
      icon: <Settings size={20} />,
      iconMobile: <Settings size={22} />,
      mobileVisible: false,
    },
  ];
}

interface SidebarProps {
  canManagePlatform?: boolean;
  userName?: string;
  userEmail?: string;
  onLogout?: () => Promise<void> | void;
}

export function Sidebar({
  canManagePlatform = false,
  userName = "Usuário",
  userEmail = "user@email.com",
  onLogout,
}: SidebarProps) {
  const branding = useBranding();
  const [collapsed, setCollapsed] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const navItems = getNavItems(canManagePlatform);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      if (onLogout) {
        await onLogout();
        return;
      }

      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  }

  const mobileItems = navItems.filter((item) => item.mobileVisible);
  const userInitial = userName.charAt(0).toUpperCase();
  const brandChipClass = getBrandChipClass(branding.colorPrimary);
  const activeNavClass = getBrandActiveNavClass(branding.colorPrimary);
  const activeTextClass = getBrandTextClass(branding.colorPrimary);

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col bg-neutral-ink text-white transition-all duration-300 md:flex",
          collapsed ? "w-17" : "w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-deep px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <BrandLogo
                  src={branding.logoUrl}
                  alt={`${branding.name} logo`}
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded object-contain"
                />
              ) : null}
              <div className="text-lg font-bold tracking-tight">
                {branding.name}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
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
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? activeNavClass
                    : "text-neutral-line hover:bg-neutral-deep hover:text-white",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
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
              </Link>
            );
          })}
        </div>

        <div className="border-t border-neutral-deep p-3">
          <Button
            variant="ghost"
            onClick={() => setShowAccountModal(true)}
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
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-border bg-white-95 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {mobileItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
                  isActive
                    ? activeTextClass
                    : "text-neutral-muted active:text-neutral-steel",
                )}
              >
                <div className="shrink-0">{item.iconMobile}</div>
                <div
                  className={cn(
                    "text-[10px] font-medium leading-tight",
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
            onClick={() => setShowAccountModal(true)}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5"
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white",
                brandChipClass,
              )}
            >
              {userInitial}
            </div>
            <div className="text-[10px] font-medium leading-tight">Conta</div>
          </Button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      <Modal
        open={showAccountModal}
        onClose={() => {
          if (!loggingOut) setShowAccountModal(false);
        }}
        title="Sua conta"
        description="Acesse os dados da sua sessão e saia quando precisar."
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-neutral-surface p-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
                brandChipClass,
              )}
            >
              {userInitial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-neutral-ink">
                {userName}
              </div>
              <div className="truncate text-sm text-neutral">{userEmail}</div>
            </div>
          </div>
          <Link
            href="/settings"
            onClick={() => setShowAccountModal(false)}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-border px-4 py-3 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-surface"
          >
            <Settings size={18} />
            Configurações
          </Link>
          {canManagePlatform ? (
            <Link
              href="/clients"
              onClick={() => setShowAccountModal(false)}
              className="flex w-full items-center gap-3 rounded-xl border border-neutral-border px-4 py-3 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-surface"
            >
              <Building2 size={18} />
              Clientes
            </Link>
          ) : null}
          <Button
            variant="danger"
            fullWidth
            loading={loggingOut}
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            {loggingOut ? "Saindo..." : "Log out"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
