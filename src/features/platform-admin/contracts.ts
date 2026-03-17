export type PlatformClientAccessState =
  | "pending"
  | "active"
  | "suspended"
  | "setup";

export interface PlatformClientRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  activatedAt: string | null;
  usersCount: number;
  ownerName: string | null;
  ownerEmail: string | null;
  activationEmail: string | null;
  activationLink: string | null;
  activationExpiresAt: string | null;
  accessState: PlatformClientAccessState;
}

export interface PlatformClientsResponse {
  clients: PlatformClientRow[];
}

export interface ActivationLinkSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  email: string;
  activationLink: string;
  expiresAt: string;
}

export interface CreatePlatformClientResponse {
  client: PlatformClientRow;
  activation: ActivationLinkSummary;
}

export interface RegenerateActivationLinkResponse {
  client: PlatformClientRow;
  activation: ActivationLinkSummary;
}
