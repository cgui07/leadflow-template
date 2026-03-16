"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField, TextField } from "@/components/forms";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import {
  buildBranding,
  getBrandChipClass,
  getBrandHeroGradientClass,
  type TenantBranding,
} from "@/lib/branding";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

interface InviteInfo {
  email: string | null;
  tenantName: string;
  branding: TenantBranding;
}

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch =
    !form.confirmPassword || form.password === form.confirmPassword;
  const branding = buildBranding(invite?.branding);
  const brandName = branding.name;
  const brandInitials = brandName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!inviteToken) {
      setInviteError("Cadastro disponível apenas por convite.");
      setLoadingInvite(false);
      return;
    }

    fetch(`/api/auth/invite?token=${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        return (await res.json()) as InviteInfo;
      })
      .then((data) => {
        setInvite({
          ...data,
          branding: buildBranding(data.branding),
        });
        if (data.email) {
          setForm((prev) => ({ ...prev, email: data.email ?? "" }));
        }
      })
      .catch(() =>
        setInviteError("Convite inválido, expirado ou já utilizado."),
      )
      .finally(() => setLoadingInvite(false));
  }, [inviteToken]);

  function update(field: keyof RegisterFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteToken }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar conta");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-line border-t-primary" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10">
              <svg
                className="h-6 w-6 text-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-iron">{inviteError}</div>
          <div className="mt-2 text-sm text-gray-smoke">
            O acesso a este sistema é controlado. Solicite um convite ao
            administrador.
          </div>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-primary transition-colors hover:text-blue-royal"
          >
            Ir para login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div
        className={cn(
          "relative hidden items-center justify-center overflow-hidden p-12 lg:flex lg:w-1/2",
          getBrandHeroGradientClass(branding.colorPrimary),
        )}
      >
        <div className="absolute left-0 top-0 h-full w-full opacity-10">
          <div className="absolute right-16 top-32 h-80 w-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-16 left-20 h-64 w-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg text-white">
          <div className="text-4xl font-bold leading-tight tracking-tight">
            Bem-vindo ao {brandName}.
          </div>
          <div className="mt-6 text-lg leading-relaxed text-blue-ice/80">
            Você recebeu um convite para acessar a plataforma. Crie sua conta e
            comece a usar agora.
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <svg
                  className="h-5 w-5 text-green-mint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Acesso controlado</div>
                <div className="text-sm text-blue-ice/60">
                  Apenas usuários convidados podem acessar
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <svg
                  className="h-5 w-5 text-green-mint"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Plataforma personalizada</div>
                <div className="text-sm text-blue-ice/60">
                  Configurada especialmente para sua operação
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-1 flex items-center gap-2">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoUrl}
                  alt={brandName}
                  className="h-8 w-8 rounded-lg object-contain"
                />
              ) : (
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white",
                    getBrandChipClass(branding.colorPrimary),
                  )}
                >
                  {brandInitials}
                </div>
              )}
              <div className="text-xl font-bold text-gray-iron">{brandName}</div>
            </div>
            <div className="mt-3 text-sm text-gray-smoke">
              Crie sua conta para acessar a plataforma
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-blush bg-red-pale p-3 text-sm text-danger">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Nome"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Seu nome"
                required
              />
              <TextField
                label="WhatsApp"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={Boolean(invite?.email)}
            />
            <div>
              <PasswordField
                label="Senha"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                required
              />
              <div className="mt-2">
                <PasswordStrengthMeter password={form.password} />
              </div>
            </div>
            <PasswordField
              label="Confirmar senha"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Repita sua senha"
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              error={!passwordsMatch ? "As senhas precisam ser iguais." : undefined}
              required
            />
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              disabled={!passwordsMatch}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-smoke">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary transition-colors hover:text-blue-royal"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
