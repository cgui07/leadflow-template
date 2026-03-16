import type { TenantBranding } from "@/lib/branding";

export interface AuthUserSummary {
  email: string;
  id: string;
  name: string;
}

export interface InviteRegistrationInfo {
  branding: TenantBranding;
  email: string | null;
  tenantName: string;
}

export interface LoginFormInput {
  email: string;
  password: string;
}

export interface RegisterFormInput {
  confirmPassword: string;
  email: string;
  inviteToken: string;
  name: string;
  password: string;
  phone?: string;
}

export interface PasswordResetRequestResult {
  message: string;
  previewUrl?: string;
}

export interface ResetPasswordInput {
  confirmPassword: string;
  password: string;
  token: string;
}
