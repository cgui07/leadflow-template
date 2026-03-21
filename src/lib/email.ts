import { env } from "./env";
import { Resend } from "resend";
import { logger } from "./logger";
import { appColors } from "../../tailwind.config";

const resend = new Resend(env.RESEND_API_KEY);

const DEVELOPMENT_FROM_EMAIL = env.EMAIL_FROM_DEV;
const PRODUCTION_FROM_EMAIL = env.EMAIL_FROM;

const emailColors = {
  heading: appColors.neutral.deep,
  body: appColors.neutral.DEFAULT,
  buttonBg: appColors.neutral.ink,
  buttonText: appColors.white.DEFAULT,
  muted: appColors.neutral.muted,
} as const;

function getFromEmail() {
  return env.NODE_ENV === "production"
    ? PRODUCTION_FROM_EMAIL
    : DEVELOPMENT_FROM_EMAIL;
}

export async function sendActivationEmail(params: {
  to: string;
  tenantName: string;
  activationLink: string;
  expiresAt: string;
}) {
  const expiresDate = new Date(params.expiresAt).toLocaleDateString("pt-BR");

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: params.to,
    subject: `Seu acesso ao LeadFlow está pronto — ${params.tenantName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3366ff 60%, #7c3aed 100%); padding: 40px 32px; border-radius: 16px 16px 0 0;">
          <div style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 6px;">
            LeadFlow
          </div>
          <div style="font-size: 14px; color: rgba(255,255,255,0.75);">
            Plataforma de CRM para corretores
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 36px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <div style="font-size: 22px; font-weight: 700; color: ${emailColors.heading}; margin: 0 0 12px;">
            Seu workspace está pronto 🎉
          </div>
          <div style="font-size: 15px; line-height: 1.7; color: ${emailColors.body}; margin: 0 0 8px;">
            O workspace <strong>${params.tenantName}</strong> foi criado e está esperando por você.
            Clique no botão abaixo para criar sua conta e começar a usar a plataforma.
          </div>

          <!-- CTA -->
          <div style="margin: 32px 0;">
            <a
              href="${params.activationLink}"
              style="display: inline-block; background: #3366ff; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 9999px; letter-spacing: 0.01em;"
            >
              Ativar minha conta
            </a>
          </div>

          <!-- Features -->
          <div style="background: #f8faff; border: 1px solid #dbeafe; border-radius: 12px; padding: 20px 24px; margin: 0 0 28px;">
            <div style="font-size: 13px; font-weight: 600; color: #1e3a8a; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
              O que você vai encontrar
            </div>
            <div style="font-size: 14px; color: #374151; line-height: 1.8;">
              ✦ &nbsp;Gestão de leads com IA<br/>
              ✦ &nbsp;Respostas automáticas no WhatsApp<br/>
              ✦ &nbsp;Pipeline de vendas visual<br/>
              ✦ &nbsp;Follow-ups automáticos
            </div>
          </div>

          <!-- Link fallback -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin: 0 0 24px;">
            <div style="font-size: 12px; color: ${emailColors.muted}; margin: 0 0 6px;">
              Se o botão não funcionar, copie e cole o link abaixo no navegador:
            </div>
            <div style="font-size: 12px; color: #3366ff; word-break: break-all;">
              ${params.activationLink}
            </div>
          </div>

          <!-- Expiry notice -->
          <div style="font-size: 13px; color: ${emailColors.muted}; line-height: 1.6;">
            Este link de ativação expira em <strong>${expiresDate}</strong>.
            Após o cadastro, use seu login e senha normalmente.
          </div>
        </div>

      </div>
    `,
  });

  if (error) {
    logger.error("Failed to send activation email", { error: JSON.stringify(error) });
    throw new Error("Falha ao enviar e-mail de ativação");
  }
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
          Recebemos uma solicitação para redefinir a senha da sua conta LeadFlow.
          Clique no botão abaixo para criar uma nova senha.
        </div>
        <a
          href="${resetUrl}"
          style="display: inline-block; background: ${emailColors.buttonBg}; color: ${emailColors.buttonText}; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 9999px;"
        >
          Redefinir minha senha
        </a>
        <div style="font-size: 13px; line-height: 1.6; color: ${emailColors.muted}; margin: 24px 0 0;">
          Este link expira em 1 hora. Se você não solicitou essa alteração, ignore este e-mail.
        </div>
      </div>
    `,
  });

  if (error) {
    logger.error("Failed to send password reset email", { error: String(error) });
    throw new Error("Falha ao enviar e-mail de redefinição");
  }
}
