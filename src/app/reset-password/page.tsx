"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    let cancelled = false;

    async function validateToken() {
      if (!token) {
        setStatus("invalid");
        setError("Link de redefinicao invalido.");
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);

        if (!res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setStatus("invalid");
            setError(data.error || "Esse link nao e mais valido.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("ready");
          setError("");
        }
      } catch {
        if (!cancelled) {
          setStatus("invalid");
          setError("Nao foi possivel validar o link.");
        }
      }
    }

    void validateToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nao foi possivel redefinir a senha");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Redefinir senha</h1>
          <p className="mt-2 text-sm text-slate-500">
            Crie uma nova senha para acessar sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {status === "checking" && (
            <div className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
              Validando seu link de redefinicao...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {status === "invalid" ? (
            <div className="text-sm text-slate-600">
              <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Gerar um novo link
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nova senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder={`Minimo ${MIN_PASSWORD_LENGTH} caracteres`}
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    disabled={status !== "ready"}
                  />
                  <div className="mt-2">
                    <PasswordStrengthMeter password={password} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Repita a nova senha"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    disabled={status !== "ready"}
                  />
                  {!passwordsMatch && (
                    <p className="mt-1 text-xs text-red-600">As senhas precisam ser iguais.</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || status !== "ready" || !passwordsMatch}
                className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Salvando nova senha..." : "Redefinir senha"}
              </button>
            </>
          )}

          <p className="mt-4 text-center text-sm text-slate-500">
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Voltar para login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
