import { appColors } from "../../tailwind.config";
import { HOT_LEAD_MIN_SCORE, WARM_LEAD_MIN_SCORE } from "./lead-scoring";

export type PipelineColorToken =
  | "blue"
  | "amber"
  | "purple"
  | "cyan"
  | "orange"
  | "pink"
  | "emerald"
  | "red";

const pipelineColorClasses: Record<
  PipelineColorToken,
  { dot: string; soft: string }
> = {
  blue: {
    dot: "bg-blue",
    soft: "bg-blue-pale text-blue-navy",
  },
  amber: {
    dot: "bg-orange-amber",
    soft: "bg-yellow-pale text-yellow-dark",
  },
  purple: {
    dot: "bg-purple",
    soft: "bg-purple-pale text-purple-grape",
  },
  cyan: {
    dot: "bg-teal-cyan",
    soft: "bg-teal-pale text-teal-deep",
  },
  orange: {
    dot: "bg-orange",
    soft: "bg-orange-pale text-orange-burn",
  },
  pink: {
    dot: "bg-pink",
    soft: "bg-pink-pale text-pink-magenta",
  },
  emerald: {
    dot: "bg-green-emerald",
    soft: "bg-green-pale text-green-forest",
  },
  red: {
    dot: "bg-danger",
    soft: "bg-red-pale text-red-dark",
  },
};

const legacyPipelineColors: Record<string, PipelineColorToken> = {
  [appColors.blue.DEFAULT]: "blue",
  [appColors.orange.amber]: "amber",
  [appColors.purple.amethyst]: "purple",
  [appColors.teal.cyan]: "cyan",
  [appColors.orange.DEFAULT]: "orange",
  [appColors.pink.DEFAULT]: "pink",
  [appColors.green.DEFAULT]: "emerald",
  [appColors.red.DEFAULT]: "red",
};

export const DEFAULT_PIPELINE_STAGE_COLORS: PipelineColorToken[] = [
  "blue",
  "amber",
  "purple",
  "cyan",
  "orange",
  "pink",
  "emerald",
  "red",
];

export function normalizePipelineColor(
  color?: string | null
): PipelineColorToken {
  const normalized = color?.toLowerCase();

  if (!normalized) {
    return "blue";
  }

  if (normalized in pipelineColorClasses) {
    return normalized as PipelineColorToken;
  }

  return legacyPipelineColors[normalized] ?? "blue";
}

export function getPipelineColorDotClass(color?: string | null) {
  return pipelineColorClasses[normalizePipelineColor(color)].dot;
}

export function getPipelineColorSoftClass(color?: string | null) {
  return pipelineColorClasses[normalizePipelineColor(color)].soft;
}

export function getScoreTextClass(score: number) {
  if (score >= HOT_LEAD_MIN_SCORE) {
    return "text-green-dark";
  }

  if (score >= WARM_LEAD_MIN_SCORE) {
    return "text-yellow-gold";
  }

  return "text-neutral-muted";
}

export function getScoreBadgeClass(score: number) {
  if (score >= HOT_LEAD_MIN_SCORE) {
    return "bg-green-pale text-green-forest";
  }

  if (score >= WARM_LEAD_MIN_SCORE) {
    return "bg-yellow-pale text-yellow-dark";
  }

  return "bg-neutral-surface text-neutral";
}
