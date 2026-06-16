export const PASSWORD_POLICY_MESSAGE = "A senha deve ter pelo menos 8 caracteres, com letra maiuscula, letra minuscula e numero.";

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
