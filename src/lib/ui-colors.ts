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
    dot: "bg-blue-500",
    soft: "bg-blue-50 text-blue-700",
  },
  amber: {
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700",
  },
  purple: {
    dot: "bg-purple-500",
    soft: "bg-purple-50 text-purple-700",
  },
  cyan: {
    dot: "bg-cyan-500",
    soft: "bg-cyan-50 text-cyan-700",
  },
  orange: {
    dot: "bg-orange-500",
    soft: "bg-orange-50 text-orange-700",
  },
  pink: {
    dot: "bg-pink-500",
    soft: "bg-pink-50 text-pink-700",
  },
  emerald: {
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
  },
  red: {
    dot: "bg-red-500",
    soft: "bg-red-50 text-red-700",
  },
};

const legacyPipelineColors: Record<string, PipelineColorToken> = {
  "#3b82f6": "blue",
  "#f59e0b": "amber",
  "#8b5cf6": "purple",
  "#06b6d4": "cyan",
  "#f97316": "orange",
  "#ec4899": "pink",
  "#22c55e": "emerald",
  "#ef4444": "red",
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
  if (score >= 70) {
    return "text-emerald-600";
  }

  if (score >= 40) {
    return "text-amber-600";
  }

  return "text-slate-400";
}

export function getScoreBadgeClass(score: number) {
  if (score >= 70) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (score >= 40) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-50 text-slate-500";
}
