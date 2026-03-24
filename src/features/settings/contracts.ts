import type { TenantBranding } from "@/lib/branding";

export interface UserSettings {
  aiProvider: string;
  aiApiKey: string | null;
  aiModel: string;
  greetingMessage: string | null;
  autoReplyEnabled: boolean;
  autoReplyDelaySeconds: number;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
  followUpCustomInstructions: string | null;
  openaiTranscriptionKey: string | null;
  facebookPageId: string | null;
  facebookPageAccessToken: string | null;
  facebookAutoOutreach: boolean;
  // ElevenLabs voice reply
  elevenlabsVoiceId: string | null;
  voiceReplyEnabled: boolean;
  voiceReplyMonthlyLimit: number;
}

export type UserSettingsUpdateInput = Partial<UserSettings>;

export interface TenantCustomizationSettings extends TenantBranding {
  id: string;
  slug: string;
  status: string;
}

export interface TenantCustomizationResponse {
  tenant: TenantCustomizationSettings;
}

export type TenantCustomizationUpdateInput = Pick<
  TenantCustomizationSettings,
  | "name"
  | "logoUrl"
  | "colorPrimary"
  | "colorSecondary"
  | "customTexts"
  | "featureFlags"
>;

export type SettingsSection = "automation" | "facebook" | "design";
