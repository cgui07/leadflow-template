import type { TenantBranding } from "@/lib/branding";

export interface UserSettings {
  aiProvider: string;
  aiApiKey: string | null;
  aiModel: string;
  campaignOutreachMessage: string | null;
  campaignOutreachImageUrl: string | null;
  campaignSecondMessage: string | null;
  campaignSecondImageUrl: string | null;
  autoReplyEnabled: boolean;
  autoReplyDelaySeconds: number;
  followUpEnabled: boolean;
  followUpDelayHours: number;
  maxFollowUps: number;
  followUpCustomInstructions: string | null;
  openaiTranscriptionKey: string | null;
  facebookAutoOutreach: boolean;
  facebookConnected: boolean;
  canalProAutoOutreach: boolean;
  canalProConnected: boolean;
  canalProAccountType: "own" | "company";
  gmailConnected: boolean;
  elevenlabsVoiceId: string | null;
  voiceReplyEnabled: boolean;
  voiceReplyMonthlyLimit: number;
  audioTranscriptionNotifyEnabled: boolean;
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
  | "featureFlags"
>;

export type SettingsSection = "automation" | "conectores" | "design";
