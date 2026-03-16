import type { ReactNode } from "react";

interface AuthSplitPageProps {
  children: ReactNode;
  hero: ReactNode;
}

export function AuthSplitPage({ children, hero }: AuthSplitPageProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {hero}
      <main className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
