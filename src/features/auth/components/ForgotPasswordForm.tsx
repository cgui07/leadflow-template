"use client";

import { Mail } from "lucide-react";
import { AuthAlert } from "./AuthAlert";
import { TextField } from "@/components/forms";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { getResponseErrorMessage } from "../utils";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPreviewUrl("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError(
          await getResponseErrorMessage(
            response,
            "Nao foi possivel enviar o link.",
          ),
        );
        return;
      }

      const data = (await response.json()) as {
        message?: string;
        previewUrl?: string;
      };

      setMessage(
        data.message ||
          "Se o email existir, enviamos um link para redefinir a senha.",
      );
      setPreviewUrl(data.previewUrl || "");
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <AuthAlert>{error}</AuthAlert> : null}

      {message ? (
        <div className="space-y-4 text-center">
          <AuthAlert tone="success">{message}</AuthAlert>
          {previewUrl ? (
            <a
              href={previewUrl}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-blue-royal"
            >
              <Mail className="h-4 w-4" />
              Abrir link de redefinicao
            </a>
          ) : null}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
  );
}
