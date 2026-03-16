"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/forms";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { ShieldCheck, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";

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
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">(
    "checking",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  useEffect(() => {
    let cancelled = false;

    async function validateToken() {
      if (!token) {
        setStatus("invalid");
        setError("Link de redefinição inválido.");
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
        );

        if (!res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setStatus("invalid");
            setError(data.error || "Esse link não é mais válido.");
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
          setError("Não foi possível validar o link.");
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
      setError("As senhas não coincidem");
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
        setError(data.error || "Não foi possível redefinir a senha");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-pale via-white to-blue-pale px-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-smoke transition-colors hover:text-gray-charcoal"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
        <div className="rounded-2xl border border-gray-ash bg-white p-8 shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="mb-6 text-center">
            <div className="text-xl font-bold text-gray-iron">Redefinir senha</div>
            <div className="mt-2 text-sm text-gray-smoke">
              Crie uma nova senha segura para sua conta.
            </div>
          </div>
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-8 text-gray-smoke">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-sm">Validando seu link...</div>
            </div>
          )}

          {status === "invalid" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="h-7 w-7 text-danger" />
              </div>
              <div className="mb-4 text-sm text-gray-charcoal">{error}</div>
              <Link href="/forgot-password">
                <Button variant="outline" fullWidth>
                  Solicitar novo link
                </Button>
              </Link>
            </div>
          )}

          {status === "ready" && (
            <>
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-blush bg-red-pale p-3 text-sm text-danger">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <PasswordField
                    label="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    required
                  />
                  <div className="mt-2">
                    <PasswordStrengthMeter password={password} />
                  </div>
                </div>
                <PasswordField
                  label="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  required
                  error={!passwordsMatch ? "As senhas precisam ser iguais." : undefined}
                />
                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="lg"
                  disabled={!passwordsMatch}
                >
                  {loading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
