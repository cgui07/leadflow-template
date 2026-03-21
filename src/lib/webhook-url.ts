import { env } from "@/lib/env";

/**
 * Resolve a URL base da aplicacao para montar webhooks.
 * Prioridade: APP_URL → NEXT_PUBLIC_APP_URL → origin da request.
 */
export function resolveAppUrl(fallbackOrigin?: string): string {
  const appUrl = env.APP_URL || env.NEXT_PUBLIC_APP_URL || fallbackOrigin;
  if (!appUrl) throw new Error("APP_URL não configurada para o webhook do WhatsApp");
  return appUrl.replace(/\/+$/, "");
}

/**
 * Monta a URL completa do webhook do WhatsApp, incluindo o token de verificacao.
 */
export function buildWebhookUrl(appUrl: string, webhookToken: string): string {
  const url = new URL("/api/whatsapp/webhook", appUrl);
  url.searchParams.set("token", webhookToken);
  return url.toString();
}
