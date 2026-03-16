import Link from "next/link";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { getSearchParamValue } from "@/features/auth/utils";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { AuthAlert } from "@/features/auth/components/AuthAlert";
import { AuthBackLink } from "@/features/auth/components/AuthBackLink";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { AuthHeroPanel } from "@/features/auth/components/AuthHeroPanel";
import { AuthSplitPage } from "@/features/auth/components/AuthSplitPage";
import { AuthCenteredPage } from "@/features/auth/components/AuthCenteredPage";
import {
  AuthFlowError,
  getInviteRegistrationInfo,
} from "@/features/auth/server";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function RegisterUnavailableState({ message }: { message: string }) {
  return (
    <AuthCenteredPage>
      <div className="space-y-8">
        <AuthBackLink href="/login" label="Voltar para login" />
        <AuthCard>
          <div className="space-y-4 text-center">
            <div className="text-xl font-bold text-gray-iron">
              Cadastro indisponivel
            </div>
            <AuthAlert className="text-left">{message}</AuthAlert>
            <div className="text-sm text-gray-smoke">
              O acesso a este sistema e controlado. Solicite um convite ao
              administrador.
            </div>
            <Link
              href="/login"
              className="inline-flex text-sm font-semibold text-primary transition-colors hover:text-blue-royal"
            >
              Ir para login
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthCenteredPage>
  );
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session) {
    redirect("/dashboard");
  }

  const inviteToken = getSearchParamValue(params.token);

  if (!inviteToken) {
    return (
      <RegisterUnavailableState message="Cadastro disponivel apenas por convite." />
    );
  }

  let invite:
    | Awaited<ReturnType<typeof getInviteRegistrationInfo>>
    | null = null;
  let inviteError = "";

  try {
    invite = await getInviteRegistrationInfo(inviteToken);
  } catch (error) {
    if (error instanceof AuthFlowError) {
      inviteError = error.message;
    } else {
      throw error;
    }
  }

  if (!invite) {
    return <RegisterUnavailableState message={inviteError} />;
  }

  return (
    <AuthSplitPage
      hero={
        <AuthHeroPanel
          className="bg-linear-to-br from-blue-navy via-primary to-secondary"
          title={`Bem-vindo ao ${invite.tenantName}.`}
          description="Voce recebeu um convite para acessar a plataforma. Crie sua conta e comece a usar agora."
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white-10 bg-white-10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-20">
                <Check className="h-5 w-5 text-green-mint" />
              </div>
              <div>
                <div className="font-semibold">Acesso controlado</div>
                <div className="text-sm text-blue-ice-60">
                  Apenas usuarios convidados podem acessar
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white-10 bg-white-10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-20">
                <Check className="h-5 w-5 text-green-mint" />
              </div>
              <div>
                <div className="font-semibold">Plataforma personalizada</div>
                <div className="text-sm text-blue-ice-60">
                  Configurada especialmente para sua operacao
                </div>
              </div>
            </div>
          </div>
        </AuthHeroPanel>
      }
    >
      <RegisterForm invite={invite} inviteToken={inviteToken} />
    </AuthSplitPage>
  );
}
