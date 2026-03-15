import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "LeadFlow <noreply@leadflow.com>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Redefinir sua senha — LeadFlow",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
        <div style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 16px;">
          Redefinir senha
        </div>
        <div style="font-size: 15px; line-height: 1.6; color: #64748b; margin: 0 0 24px;">
          Recebemos uma solicitacao para redefinir a senha da sua conta LeadFlow.
          Clique no botao abaixo para criar uma nova senha.
        </div>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: #0f172a; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 9999px;"
        >
          Redefinir minha senha
        </a>
        <div style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0;">
          Este link expira em 1 hora. Se voce nao solicitou essa alteracao, ignore este email.
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Failed to send password reset email:", error);
    throw new Error("Falha ao enviar email de redefinicao");
  }
}
