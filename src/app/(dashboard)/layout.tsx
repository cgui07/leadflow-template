"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BrandingProvider } from "@/components/providers/BrandingProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, branding, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-line border-t-primary" />
      </div>
    );
  }

  return (
    <BrandingProvider branding={branding}>
      <div className="flex h-screen overflow-hidden bg-neutral-surface">
        <Sidebar
          userName={user.name}
          userEmail={user.email}
          onLogout={logout}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 md:pb-6">
            {children}
          </div>
        </div>
      </div>
    </BrandingProvider>
  );
}
