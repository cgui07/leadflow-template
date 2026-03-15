"use client";

import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push(redirect);
    } catch {
      setError("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-navy via-primary to-secondary items-center justify-center p-12 relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-info blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Transforme contatos em clientes reais.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-blue-ice/80">
            O LeadFlow organiza seus leads do WhatsApp, qualifica automaticamente
            com IA e garante que voce nunca perca uma oportunidade.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold">3x</p>
              <p className="mt-1 text-xs text-blue-ice/70">mais respostas</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold">-70%</p>
              <p className="mt-1 text-xs text-blue-ice/70">tempo de triagem</p>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-center">
              <p className="text-3xl font-bold">24/7</p>
              <p className="mt-1 text-xs text-blue-ice/70">atendimento IA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Painel direito - formulario */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">LF</span>
              </div>
              <h1 className="text-xl font-bold text-gray-iron">LeadFlow</h1>
            </div>
            <p className="mt-3 text-sm text-gray-smoke">
              Entre na sua conta para gerenciar seus leads
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-pale border border-red-blush p-3 text-sm text-danger">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />

            <div>
              <TextField
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary/70 hover:text-primary transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-ash" />
            <span className="text-xs text-gray-smoke">ou</span>
            <div className="h-px flex-1 bg-gray-ash" />
          </div>

          <a
            href={`/api/auth/google?redirect=${encodeURIComponent(redirect)}`}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-ash bg-white px-4 py-3 text-sm font-medium text-gray-iron shadow-sm transition-colors hover:bg-slate-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </a>

          <p className="mt-6 text-center text-sm text-gray-smoke">
            Ainda nao tem conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:text-blue-royal transition-colors"
            >
              Criar conta gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
