import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { getButtonClassName } from "@/components/ui/Button";
import { getSearchParamValue } from "@/features/auth/utils";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthBackLink } from "@/features/auth/components/AuthBackLink";
import { AuthCenteredPage } from "@/features/auth/components/AuthCenteredPage";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import {
  assertValidPasswordResetToken,
  AuthFlowError,
} from "@/features/auth/server";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function InvalidResetPasswordState({ message }: { message: string }) {
  return (
    <AuthCenteredPage>
      <div className="space-y-8">
        <AuthBackLink href="/login" label="Voltar para login" />
        <AuthCard>
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-10">
              <ShieldCheck className="h-7 w-7 text-danger" />
            </div>
            <div className="text-xl font-bold text-gray-iron">
              Link indisponivel
            </div>
            <AuthAlert className="text-left">{message}</AuthAlert>
            <Link
              href="/forgot-password"
              className={getButtonClassName({
                variant: "outline",
                fullWidth: true,
              })}
            >
              Solicitar novo link
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthCenteredPage>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const token = getSearchParamValue(params.token);

  if (!token) {
    return (
      <InvalidResetPasswordState message="Link de redefinicao invalido." />
    );
  }

  try {
    await assertValidPasswordResetToken(token);
  } catch (error) {
    if (error instanceof AuthFlowError) {
      return <InvalidResetPasswordState message={error.message} />;
    }

    throw error;
  }

  return (
    <AuthCenteredPage>
      <div className="space-y-8">
        <AuthBackLink href="/login" label="Voltar para login" />
        <AuthCard>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="text-xl font-bold text-gray-iron">
              Redefinir senha
            </div>
            <div className="mt-2 text-sm text-gray-smoke">
              Crie uma nova senha segura para sua conta.
            </div>
          </div>
          <ResetPasswordForm token={token} />
        </AuthCard>
      </div>
    </AuthCenteredPage>
  );
}
