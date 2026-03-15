export const WARM_LEAD_MIN_SCORE = 45;
export const HOT_LEAD_MIN_SCORE = 75;

export type LeadTemperature = "cold" | "warm" | "hot";
export type LeadInterestLevel = "low" | "medium" | "high";
export type LeadIntentLevel = "curious" | "considering" | "deciding";
export type LeadObjectionLevel = "none" | "some" | "strong";

export interface ExtractedLeadProfile {
  region?: string | null;
  propertyType?: string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  purpose?: string | null;
  timeline?: string | null;
  bedrooms?: number | string | null;
  interestLevel?: LeadInterestLevel | string | null;
  intentLevel?: LeadIntentLevel | string | null;
  objectionLevel?: LeadObjectionLevel | string | null;
  requestedVisit?: boolean | string | null;
  requestedProposal?: boolean | string | null;
  requestedFinancing?: boolean | string | null;
  notes?: string | null;
}

export interface NormalizedLeadProfile {
  region: string | null;
  propertyType: string | null;
  priceMin: number | null;
  priceMax: number | null;
  purpose: string | null;
  timeline: string | null;
  bedrooms: number | null;
  interestLevel: LeadInterestLevel | null;
  intentLevel: LeadIntentLevel | null;
  objectionLevel: LeadObjectionLevel | null;
  requestedVisit: boolean;
  requestedProposal: boolean;
  requestedFinancing: boolean;
  notes: string | null;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function canonicalizeText(value: unknown) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const digits = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "sim", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "nao", "não", "no"].includes(normalized)) {
      return false;
    }
  }

  return false;
}

function normalizeInterestLevel(value: unknown): LeadInterestLevel | null {
  const normalized = canonicalizeText(value);

  if (normalized === "low" || normalized === "baixo") {
    return "low";
  }

  if (
    normalized === "medium" ||
    normalized === "medio" ||
    normalized === "moderado"
  ) {
    return "medium";
  }

  if (normalized === "high" || normalized === "alto") {
    return "high";
  }

  return null;
}

function normalizeIntentLevel(value: unknown): LeadIntentLevel | null {
  const normalized = canonicalizeText(value);

  if (normalized === "curious" || normalized === "curioso") {
    return "curious";
  }

  if (
    normalized === "considering" ||
    normalized === "considerando" ||
    normalized === "avaliando"
  ) {
    return "considering";
  }

  if (normalized === "deciding" || normalized === "decidindo") {
    return "deciding";
  }

  return null;
}

function normalizeObjectionLevel(value: unknown): LeadObjectionLevel | null {
  const normalized = canonicalizeText(value);

  if (normalized === "none" || normalized === "nenhuma" || normalized === "nenhum") {
    return "none";
  }

  if (normalized === "some" || normalized === "alguma" || normalized === "algum") {
    return "some";
  }

  if (normalized === "strong" || normalized === "forte") {
    return "strong";
  }

  return null;
}

export function normalizeExtractedLeadProfile(
  profile: ExtractedLeadProfile | null | undefined,
): NormalizedLeadProfile {
  return {
    region: normalizeText(profile?.region),
    propertyType: normalizeText(profile?.propertyType),
    priceMin: normalizeNumber(profile?.priceMin),
    priceMax: normalizeNumber(profile?.priceMax),
    purpose: normalizeText(profile?.purpose),
    timeline: normalizeText(profile?.timeline)?.toLowerCase() ?? null,
    bedrooms: normalizeNumber(profile?.bedrooms),
    interestLevel: normalizeInterestLevel(profile?.interestLevel),
    intentLevel: normalizeIntentLevel(profile?.intentLevel),
    objectionLevel: normalizeObjectionLevel(profile?.objectionLevel),
    requestedVisit: normalizeBoolean(profile?.requestedVisit),
    requestedProposal: normalizeBoolean(profile?.requestedProposal),
    requestedFinancing: normalizeBoolean(profile?.requestedFinancing),
    notes: normalizeText(profile?.notes),
  };
}

function getTimelineScore(timeline: string | null) {
  switch (timeline) {
    case "imediato":
      return 18;
    case "30dias":
      return 16;
    case "60dias":
      return 12;
    case "90dias":
      return 9;
    case "semestre":
      return 5;
    case "ano":
      return 2;
    default:
      return 0;
  }
}

function getInterestScore(level: LeadInterestLevel | null) {
  switch (level) {
    case "high":
      return 15;
    case "medium":
      return 8;
    default:
      return 0;
  }
}

function getIntentScore(level: LeadIntentLevel | null) {
  switch (level) {
    case "deciding":
      return 18;
    case "considering":
      return 10;
    default:
      return 0;
  }
}

function getObjectionPenalty(level: LeadObjectionLevel | null) {
  switch (level) {
    case "strong":
      return 15;
    case "some":
      return 7;
    default:
      return 0;
  }
}

function getEngagementScore(inboundMessageCount: number) {
  if (inboundMessageCount >= 8) {
    return 10;
  }

  if (inboundMessageCount >= 5) {
    return 7;
  }

  if (inboundMessageCount >= 3) {
    return 4;
  }

  if (inboundMessageCount >= 2) {
    return 2;
  }

  return 0;
}

export function calculateLeadScore(
  profile: NormalizedLeadProfile,
  inboundMessageCount: number,
) {
  let score = 0;

  if (profile.region) score += 8;
  if (profile.propertyType) score += 8;
  if (profile.purpose) score += 8;
  if (profile.bedrooms) score += 4;

  if (profile.priceMin && profile.priceMax) {
    score += 12;
  } else if (profile.priceMin || profile.priceMax) {
    score += 6;
  }

  score += getTimelineScore(profile.timeline);
  score += getInterestScore(profile.interestLevel);
  score += getIntentScore(profile.intentLevel);
  score += getEngagementScore(inboundMessageCount);

  if (profile.requestedVisit) score += 12;
  if (profile.requestedProposal) score += 12;
  if (profile.requestedFinancing) score += 5;

  score -= getObjectionPenalty(profile.objectionLevel);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getLeadTemperature(score: number): LeadTemperature {
  if (score >= HOT_LEAD_MIN_SCORE) {
    return "hot";
  }

  if (score >= WARM_LEAD_MIN_SCORE) {
    return "warm";
  }

  return "cold";
}

export function getLeadTemperatureLabel(score: number) {
  const temperature = getLeadTemperature(score);

  if (temperature === "hot") {
    return "quente";
  }

  if (temperature === "warm") {
    return "morno";
  }

  return "frio";
}

export function getLeadStatusFromScore(score: number) {
  if (score >= HOT_LEAD_MIN_SCORE) {
    return "qualified";
  }

  if (score >= WARM_LEAD_MIN_SCORE) {
    return "qualifying";
  }

  return "contacted";
}
