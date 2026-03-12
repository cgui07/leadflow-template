"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  ChevronLeft,
  Kanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "Leads", href: "/leads", icon: <Users size={20} /> },
  { label: "Pipeline", href: "/pipeline", icon: <Kanban size={20} /> },
  { label: "Tarefas", href: "/tasks", icon: <CheckSquare size={20} /> },
  {
    label: "Conversas",
    href: "/conversations",
    icon: <MessageSquare size={20} />,
  },
  { label: "Configuracoes", href: "/settings", icon: <Settings size={20} /> },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => Promise<void> | void;
}

export function Sidebar({
  userName = "Usuario",
  userEmail = "user@email.com",
  onLogout,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

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

  return (
    <>
      <aside
        className={cn(
          "flex h-screen shrink-0 flex-col bg-slate-900 text-white transition-all duration-300",
          collapsed ? "w-17" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          {!collapsed && <span className="text-lg font-bold tracking-tight">LeadFlow</span>}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 transition-colors hover:bg-slate-800"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-800",
              collapsed && "justify-center px-1"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="truncate text-xs text-slate-400">{userEmail}</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      <Modal
        open={showAccountModal}
        onClose={() => {
          if (!loggingOut) setShowAccountModal(false);
        }}
        title="Sua conta"
        description="Acesse os dados da sua sessao e saia quando precisar."
        size="sm"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-sm text-slate-500">{userEmail}</p>
            </div>
          </div>

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
