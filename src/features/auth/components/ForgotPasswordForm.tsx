"use client";

import { Mail } from "lucide-react";
import { AuthAlert } from "./AuthAlert";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { getResponseErrorMessage } from "../utils";
import { Form, TextField } from "@/components/forms";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
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
            "Não foi possível enviar o link.",
          ),
        );
        return;
      }

      const data = (await response.json()) as {
        message?: string;
      };

      setMessage(
        data.message ||
          "Se o email existir, enviamos um link para redefinir a senha.",
      );
    } catch {
      setError("Erro de conexão.");
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
        </div>
      ) : (
        <Form onSubmit={handleSubmit} className="space-y-5">
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
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </Form>
      )}
    </div>
  );
}
