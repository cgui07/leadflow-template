"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TextField } from "@/components/forms";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { Button } from "@/components/ui/Button";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = !form.confirmPassword || form.password === form.confirmPassword;

  function update(field: keyof RegisterForm, value: string) {
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
      setError("As senhas nao coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar conta");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-secondary via-primary to-blue-navy items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-32 right-16 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-16 left-20 w-64 h-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 max-w-lg text-white">
          <div className="text-4xl font-bold leading-tight tracking-tight">
            Comece a converter mais leads hoje.
          </div>
          <div className="mt-6 text-lg leading-relaxed text-blue-ice/80">
            Crie sua conta em segundos e tenha acesso a um CRM inteligente
            feito para corretores que querem resultados.
          </div>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <svg className="h-5 w-5 text-green-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Resposta automatica via WhatsApp</div>
                <div className="text-sm text-blue-ice/60">Nunca deixe um lead sem resposta</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <svg className="h-5 w-5 text-green-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Qualificacao com IA</div>
                <div className="text-sm text-blue-ice/60">Saiba quem esta pronto para comprar</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
                <svg className="h-5 w-5 text-green-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-semibold">Follow-ups programados</div>
                <div className="text-sm text-blue-ice/60">Recupere leads frios automaticamente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <div className="text-white font-bold text-sm">LF</div>
              </div>
              <div className="text-xl font-bold text-gray-iron">LeadFlow</div>
            </div>
            <div className="mt-3 text-sm text-gray-smoke">
              Crie sua conta e comece a organizar seus leads
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-pale border border-red-blush p-3 text-sm text-danger">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
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
            />
            <div>
              <TextField
                label="Senha"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={`Minimo ${MIN_PASSWORD_LENGTH} caracteres`}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
              <div className="mt-2">
                <PasswordStrengthMeter password={form.password} />
              </div>
            </div>
            <TextField
              label="Confirmar senha"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Repita sua senha"
              minLength={MIN_PASSWORD_LENGTH}
              error={!passwordsMatch ? "As senhas precisam ser iguais." : undefined}
              required
            />
            <Button type="submit" loading={loading} fullWidth size="lg" disabled={!passwordsMatch}>
              {loading ? "Criando conta..." : "Criar conta gratis"}
            </Button>
          </form>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-ash" />
            <div className="text-xs text-gray-smoke">ou</div>
            <div className="h-px flex-1 bg-gray-ash" />
          </div>
          <a
            href="/api/auth/google"
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-ash bg-white px-4 py-3 text-sm font-medium text-gray-iron shadow-sm transition-colors hover:bg-neutral-surface"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                className="fill-google-blue"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                className="fill-google-green"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                className="fill-google-yellow"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                className="fill-google-red"
              />
            </svg>
            Criar conta com Google
          </a>
          <div className="mt-6 text-center text-sm text-gray-smoke">
            Ja tem uma conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-blue-royal transition-colors">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
