"use client";

import Link from "next/link";
import { AuthAlert } from "./AuthAlert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { DEFAULT_BRANDING } from "@/lib/branding";
import { getResponseErrorMessage } from "../utils";
import { AuthBrandHeader } from "./AuthBrandHeader";
import { Form, PasswordField, TextField } from "@/components/forms";

interface LoginFormProps {
  initialError: string;
  redirectPath: string;
}

export function LoginForm({ initialError, redirectPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(
          await getResponseErrorMessage(response, "Erro ao fazer login."),
        );
        return;
      }

      router.replace(redirectPath);
      router.refresh();
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-10">
        <AuthBrandHeader branding={DEFAULT_BRANDING} />
        <div className="mt-3 text-sm text-gray-smoke">
          Entre na sua conta para acessar a plataforma
        </div>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-5">
        {error ? <AuthAlert>{error}</AuthAlert> : null}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          required
        />

        <div>
          <PasswordField
            label="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            required
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary-70 transition-colors hover:text-primary"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={loading} fullWidth size="lg">
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </Form>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-ash" />
        <div className="text-xs text-gray-smoke">ou</div>
        <div className="h-px flex-1 bg-gray-ash" />
      </div>

      <a
        href={`/api/auth/google?redirect=${encodeURIComponent(redirectPath)}`}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-ash bg-white px-4 py-3 text-sm font-medium text-gray-iron shadow-sm transition-colors hover:bg-neutral-surface"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
        Continuar com Google
      </a>

      <div className="mt-6 text-center text-sm text-gray-smoke">
        O acesso e controlado por convite.
      </div>
    </div>
  );
}
