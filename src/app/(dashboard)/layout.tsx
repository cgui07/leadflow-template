"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/lib/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-line border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-surface overflow-hidden">
      <Sidebar userName={user?.name} userEmail={user?.email} onLogout={logout} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
