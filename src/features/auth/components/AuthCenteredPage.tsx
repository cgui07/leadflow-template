import type { ReactNode } from "react";

interface AuthCenteredPageProps {
  children: ReactNode;
}

export function AuthCenteredPage({ children }: AuthCenteredPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-pale via-white to-blue-pale px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
