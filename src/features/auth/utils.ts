import { sanitizeAppRedirect } from "@/lib/redirect";

export type SearchParamValue = string | string[] | undefined;

export function getLoginErrorMessage(code?: string | null): string {
  switch (code) {
    case "no_account":
      return "Conta não encontrada. O acesso e por convite.";
    case "account_suspended":
      return "Conta suspensa. Entre em contato com o administrador.";
    case "google_auth_failed":
      return "Não foi possível concluir o login com Google.";
    case "google_token_failed":
    case "google_userinfo_failed":
    case "google_no_email":
    case "google_internal_error":
      return "Não foi possível concluir o login com Google. Tente novamente.";
    default:
      return "";
  }
}

export function getAuthRedirectPath(value?: string | null): string {
  return sanitizeAppRedirect(value);
}

export function getSearchParamValue(value: SearchParamValue): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  return null;
}

export async function getResponseErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const data = await response.json().catch(() => null);

  return typeof data?.error === "string" && data.error.trim()
    ? data.error
    : fallback;
}
