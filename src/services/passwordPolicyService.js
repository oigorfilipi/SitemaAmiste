export const PASSWORD_POLICY_MESSAGE = "A senha deve ter pelo menos 8 caracteres, com letra maiuscula, letra minuscula e numero.";

export function getPasswordStrength(password) {
  const value = String(password || "");
  const checks = {
    hasLowercase: /[a-z]/.test(value),
    hasMinLength: value.length >= 8,
    hasNumber: /\d/.test(value),
    hasSpecial: /[^a-zA-Z0-9]/.test(value),
    hasUppercase: /[A-Z]/.test(value),
  };
  const score = Object.values(checks).filter(Boolean).length;

  if (!value) {
    return {
      checks,
      label: "Digite uma senha",
      score: 0,
      tone: "neutral",
    };
  }

  if (score <= 2) {
    return {
      checks,
      label: "Senha fraca",
      score,
      tone: "weak",
    };
  }

  if (score <= 4) {
    return {
      checks,
      label: "Senha media",
      score,
      tone: "medium",
    };
  }

  return {
    checks,
    label: "Senha forte",
    score,
    tone: "strong",
  };
}

export function validatePasswordStrength(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return PASSWORD_POLICY_MESSAGE;
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return PASSWORD_POLICY_MESSAGE;
  }

  return "";
}
