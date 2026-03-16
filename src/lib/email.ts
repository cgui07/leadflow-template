import { Resend } from "resend";
import { appColors } from "../../tailwind.config";

const resend = new Resend(process.env.RESEND_API_KEY);

const DEVELOPMENT_FROM_EMAIL =
  process.env.EMAIL_FROM_DEV || "LeadFlow <onboarding@resend.dev>";
const PRODUCTION_FROM_EMAIL =
  process.env.EMAIL_FROM || "LeadFlow <noreply@leadflow.com>";

const emailColors = {
  heading: appColors.neutral.deep,
  body: appColors.neutral.DEFAULT,
  buttonBg: appColors.neutral.ink,
  buttonText: appColors.white.DEFAULT,
  muted: appColors.neutral.muted,
} as const;

function getFromEmail() {
  return process.env.NODE_ENV === "production"
    ? PRODUCTION_FROM_EMAIL
    : DEVELOPMENT_FROM_EMAIL;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: "Redefinir sua senha - LeadFlow",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <div style="font-size: 20px; font-weight: 600; color: ${emailColors.heading}; margin: 0 0 16px;">
          Redefinir senha
        </div>
        <div style="font-size: 15px; line-height: 1.6; color: ${emailColors.body}; margin: 0 0 24px;">
          Recebemos uma solicitacao para redefinir a senha da sua conta LeadFlow.
          Clique no botao abaixo para criar uma nova senha.
        </div>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: ${emailColors.buttonBg}; color: ${emailColors.buttonText}; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 9999px;"
        >
          Redefinir minha senha
        </a>
        <div style="font-size: 13px; line-height: 1.6; color: ${emailColors.muted}; margin: 24px 0 0;">
          Este link expira em 1 hora. Se voce nao solicitou essa alteracao, ignore este e-mail.
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Failed to send password reset email:", error);
    throw new Error("Falha ao enviar e-mail de redefinicao");
  }
}
