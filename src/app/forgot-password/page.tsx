import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthBackLink } from "@/features/auth/components/AuthBackLink";
import { AuthCenteredPage } from "@/features/auth/components/AuthCenteredPage";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthCenteredPage>
      <div className="space-y-8">
        <AuthBackLink href="/login" label="Voltar para login" />
        <AuthCard>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-10">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <div className="text-xl font-bold text-gray-iron">
              Recuperar senha
            </div>
            <div className="mt-2 text-sm text-gray-smoke">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </div>
          </div>
          <ForgotPasswordForm />
        </AuthCard>
      </div>
    </AuthCenteredPage>
  );
}
