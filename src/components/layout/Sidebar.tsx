"use client";

import { cn } from "@/lib/utils";
import {
  CheckSquare,
  ChevronLeft,
  Kanban,
  LayoutDashboard,
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
  { label: "Configurações", href: "/settings", icon: <Settings size={20} /> },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  userName = "Usuário",
  userEmail = "user@email.com",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 shrink-0",
        collapsed ? "w-17" : "w-64",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">LeadFlow</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
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
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
