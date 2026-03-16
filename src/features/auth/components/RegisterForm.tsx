"use client";

import Link from "next/link";
import { AuthAlert } from "./AuthAlert";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useState, type FormEvent } from "react";
import { getResponseErrorMessage } from "../utils";
import { AuthBrandHeader } from "./AuthBrandHeader";
import type { InviteRegistrationInfo } from "../contracts";
import { PasswordField, TextField } from "@/components/forms";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-strength";
import { PasswordStrengthMeter } from "@/components/forms/PasswordStrengthMeter";

interface RegisterFormProps {
  invite: InviteRegistrationInfo;
  inviteToken: string;
}

interface RegisterFormState {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  phone: string;
}

export function RegisterForm({ invite, inviteToken }: RegisterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>({
    name: "",
    email: invite.email ?? "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const branding = invite.branding;
  const passwordsMatch =
    !form.confirmPassword || form.password === form.confirmPassword;

  function updateField(field: keyof RegisterFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          inviteToken,
        }),
      });

      if (!response.ok) {
        setError(
          await getResponseErrorMessage(response, "Erro ao criar conta."),
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
    <div>
      <div className="mb-8">
        <AuthBrandHeader branding={branding} />
        <div className="mt-3 text-sm text-gray-smoke">
          Crie sua conta para acessar a plataforma
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <AuthAlert>{error}</AuthAlert> : null}

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Nome"
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Seu nome"
            required
          />
          <TextField
            label="WhatsApp"
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="seu@email.com"
          required
          disabled={Boolean(invite.email)}
        />

        <div>
          <PasswordField
            label="Senha"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder={`Minimo ${MIN_PASSWORD_LENGTH} caracteres`}
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            required
          />
          <div className="mt-2">
            <PasswordStrengthMeter password={form.password} />
          </div>
        </div>

        <PasswordField
          label="Confirmar senha"
          value={form.confirmPassword}
          onChange={(event) =>
            updateField("confirmPassword", event.target.value)
          }
          placeholder="Repita sua senha"
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          error={!passwordsMatch ? "As senhas precisam ser iguais." : undefined}
          required
        />

        <Button
          type="submit"
          loading={loading}
          fullWidth
          size="lg"
          disabled={!passwordsMatch}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-smoke">
        Ja tem uma conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-blue-royal"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}
