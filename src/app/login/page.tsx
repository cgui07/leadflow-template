import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/session";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthHeroPanel } from "@/features/auth/components/AuthHeroPanel";
import { AuthSplitPage } from "@/features/auth/components/AuthSplitPage";
import {
  getAuthRedirectPath,
  getLoginErrorMessage,
  getSearchParamValue,
} from "@/features/auth/utils";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const redirectPath = getAuthRedirectPath(getSearchParamValue(params.redirect));

  if (session) {
    redirect(redirectPath);
  }

  const initialError = getLoginErrorMessage(getSearchParamValue(params.error));

  return (
    <AuthSplitPage
      hero={
        <AuthHeroPanel
          className="bg-linear-to-br from-blue-navy via-primary to-secondary"
          title="Transforme contatos em clientes reais."
          description="Organize seus leads, qualifique automaticamente com IA e garanta que você nunca perca uma oportunidade."
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white-10 bg-white-10 p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">3x</div>
              <div className="mt-1 text-xs text-blue-ice-70">mais respostas</div>
            </div>
            <div className="rounded-2xl border border-white-10 bg-white-10 p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">-70%</div>
              <div className="mt-1 text-xs text-blue-ice-70">
                tempo de triagem
              </div>
            </div>
            <div className="rounded-2xl border border-white-10 bg-white-10 p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">24/7</div>
              <div className="mt-1 text-xs text-blue-ice-70">atendimento IA</div>
            </div>
          </div>
        </AuthHeroPanel>
      }
    >
      <LoginForm initialError={initialError} redirectPath={redirectPath} />
    </AuthSplitPage>
  );
}
