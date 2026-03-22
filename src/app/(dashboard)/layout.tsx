import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireSession } from "@/features/auth/session";
import { TopProgressBar } from "@/components/ui/TopProgressBar";
import { BrandingProvider } from "@/components/providers/BrandingProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <BrandingProvider branding={session.branding}>
      <TopProgressBar />
      <div className="flex h-screen overflow-hidden bg-neutral-surface">
        <Sidebar
          canManagePlatform={session.canManagePlatform}
          userName={session.user.name}
          userEmail={session.user.email}
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
