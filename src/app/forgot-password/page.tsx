"use client";

import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
          <p className="mt-2 text-sm text-slate-500">
            Informe seu email para gerar o link de redefinicao.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {message && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <p>{message}</p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  className="mt-2 inline-block font-medium text-emerald-800 underline"
                >
                  Abrir link de redefinicao
                </a>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="seu@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Gerando link..." : "Enviar link"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Lembrou da senha?{" "}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Voltar para login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
