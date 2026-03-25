"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { useBranding } from "@/components/providers/BrandingProvider";
import { SidebarMobileMenu } from "@/components/layout/SidebarMobileMenu";
import { SidebarMobileTabBar } from "@/components/layout/SidebarMobileTabBar";
import { SidebarAccountModal } from "@/components/layout/SidebarAccountModal";
import {
  getBrandActiveNavClass,
  getBrandChipClass,
  getBrandTextClass,
} from "@/lib/branding";
import {
  Building2,
  Home,
  Kanban,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconMobile: React.ReactNode;
  badge?: number;
  mobileTab?: boolean;
}

function getNavItems(canManagePlatform: boolean): NavItem[] {
  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      iconMobile: <LayoutDashboard size={22} />,
      mobileTab: true,
    },
    {
      label: "WhatsApp",
      href: "/conversations",
      icon: <FaWhatsapp size={20} />,
      iconMobile: <FaWhatsapp size={22} />,
      mobileTab: true,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: <Users size={20} />,
      iconMobile: <Users size={22} />,
      mobileTab: true,
    },
    {
      label: "Pipeline",
      href: "/pipeline",
      icon: <Kanban size={20} />,
      iconMobile: <Kanban size={22} />,
      mobileTab: true,
    },
    {
      label: "Imóveis",
      href: "/properties",
      icon: <Home size={20} />,
      iconMobile: <Home size={22} />,
      mobileTab: true,
    },
    ...(canManagePlatform
      ? [
          {
            label: "Clientes",
            href: "/clients",
            icon: <Building2 size={20} />,
            iconMobile: <Building2 size={22} />,
            mobileTab: false,
          } satisfies NavItem,
        ]
      : []),
    {
      label: "Configurações",
      href: "/settings",
      icon: <Settings size={20} />,
      iconMobile: <Settings size={22} />,
      mobileTab: false,
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  const tabItems = navItems.filter((item) => item.mobileTab);
  const extraItems = navItems.filter((item) => !item.mobileTab);
  const userInitial = userName.charAt(0).toUpperCase();
  const brandChipClass = getBrandChipClass(branding.colorPrimary);
  const activeNavClass = getBrandActiveNavClass(branding.colorPrimary);
  const activeTextClass = getBrandTextClass(branding.colorPrimary);

  const isExtraActive = extraItems.some((item) =>
    pathname.startsWith(item.href),
  );

  return (
    <>
      <SidebarNav
        navItems={navItems}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        onOpenAccountModal={() => setShowAccountModal(true)}
        pathname={pathname}
        activeNavClass={activeNavClass}
        brandChipClass={brandChipClass}
        brandingName={branding.name}
        brandingLogoUrl={branding.logoUrl}
        userName={userName}
        userEmail={userEmail}
        userInitial={userInitial}
      />

      <SidebarMobileTabBar
        tabItems={tabItems}
        pathname={pathname}
        activeTextClass={activeTextClass}
        isExtraActive={isExtraActive}
        showMobileMenu={showMobileMenu}
        onOpenMobileMenu={() => setShowMobileMenu(true)}
      />

      {showMobileMenu && (
        <SidebarMobileMenu
          extraItems={extraItems}
          pathname={pathname}
          brandChipClass={brandChipClass}
          userName={userName}
          userEmail={userEmail}
          userInitial={userInitial}
          loggingOut={loggingOut}
          onClose={() => setShowMobileMenu(false)}
          onLogout={handleLogout}
        />
      )}

      <SidebarAccountModal
        open={showAccountModal}
        onClose={() => {
          if (!loggingOut) setShowAccountModal(false);
        }}
        brandChipClass={brandChipClass}
        userName={userName}
        userEmail={userEmail}
        userInitial={userInitial}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />
    </>
  );
}
