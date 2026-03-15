"use client";

import { useState } from "react";
import Link from "next/link";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { KeyRound, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPreviewUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nao foi possivel enviar o link");
        return;
      }

      setMessage(data.message || "Se o email existir, enviamos um link para redefinir a senha.");
      setPreviewUrl(data.previewUrl || "");
    } catch {
      setError("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-pale via-white to-blue-pale px-4">
      <div className="w-full max-w-md">
        {/* Voltar */}
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-smoke hover:text-gray-charcoal transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>

        <div className="rounded-2xl border border-gray-ash bg-white p-8 shadow-sm">
          {/* Icone */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-iron">Recuperar senha</h1>
            <p className="mt-2 text-sm text-gray-smoke">
              Informe seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-pale border border-red-blush p-3 text-sm text-danger">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {message ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-4">
                <CheckCircle className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm text-gray-charcoal">{message}</p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-royal transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Abrir link de redefinicao
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                icon={<Mail className="h-4 w-4" />}
                required
              />

              <Button type="submit" loading={loading} fullWidth size="lg">
                {loading ? "Enviando..." : "Enviar link de recuperacao"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
