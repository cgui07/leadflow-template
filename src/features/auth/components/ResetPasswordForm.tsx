"use client";

import { AuthAlert } from "./AuthAlert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/forms";
import { getResponseErrorMessage } from "../utils";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (!response.ok) {
        setError(
          await getResponseErrorMessage(
            response,
            "Nao foi possivel redefinir a senha.",
          ),
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Erro de conexao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <div>
        <PasswordField
          label="Nova senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`Minimo ${MIN_PASSWORD_LENGTH} caracteres`}
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
        onChange={(event) => setConfirmPassword(event.target.value)}
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
  );
}
