export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordChecks {
  length: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

export interface PasswordStrengthResult {
  score: number;
  label: string;
  hint: string;
  barClassName: string;
  textClassName: string;
  checks: PasswordChecks;
}

function getHint(checks: PasswordChecks) {
  const missing: string[] = [];

  if (!checks.length) missing.push(`use pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
  if (!checks.upper) missing.push("adicione letra maiuscula");
  if (!checks.lower) missing.push("adicione letra minuscula");
  if (!checks.number) missing.push("adicione numero");
  if (!checks.symbol) missing.push("adicione simbolo");

  if (missing.length === 0) return "Senha bem equilibrada";
  if (missing.length === 1) return `Dica: ${missing[0]}`;
  if (missing.length === 2) return `Dica: ${missing[0]} e ${missing[1]}`;

  return "Misture letras, numeros e simbolos";
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks: PasswordChecks = {
    length: password.length >= MIN_PASSWORD_LENGTH,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const varietyCount = [checks.lower, checks.upper, checks.number, checks.symbol].filter(Boolean).length;

  let score = 0;

  if (checks.length) score += 1;
  if (password.length >= 12) score += 1;
  if (varietyCount >= 2) score += 1;
  if (varietyCount >= 3) score += 1;
  if (varietyCount >= 4) score += 1;

  if (password.length > 0 && score === 0) score = 1;
  if (!checks.length) score = Math.min(score, 2);

  if (password.length === 0) {
    return {
      score: 0,
      label: "Digite uma senha",
      hint: `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
      barClassName: "bg-neutral-border",
      textClassName: "text-neutral",
      checks,
    };
  }

  if (score <= 1) {
    return {
      score,
      label: "Muito fraca",
      hint: getHint(checks),
      barClassName: "bg-danger",
      textClassName: "text-red-crimson",
      checks,
    };
  }

  if (score === 2) {
    return {
      score,
      label: "Fraca",
      hint: getHint(checks),
      barClassName: "bg-orange",
      textClassName: "text-orange-dark",
      checks,
    };
  }

  if (score === 3) {
    return {
      score,
      label: "Media",
      hint: getHint(checks),
      barClassName: "bg-orange-amber",
      textClassName: "text-yellow-gold",
      checks,
    };
  }

  if (score === 4) {
    return {
      score,
      label: "Forte",
      hint: getHint(checks),
      barClassName: "bg-green-emerald",
      textClassName: "text-green-dark",
      checks,
    };
  }

  return {
    score,
    label: "Muito forte",
    hint: getHint(checks),
    barClassName: "bg-teal-dark",
    textClassName: "text-teal-dark",
    checks,
  };
}
