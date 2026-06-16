import { PAGE_LABELS, ROLE_LABELS } from "./accountService.js";
import { validatePasswordStrength } from "./passwordPolicyService.js";
import { ALL_PAGES, getAccessLabel, getRolePermissions } from "./permissionService.js";

export const PROFILE_FORM_FIELDS = [
  { name: "displayName", label: "Nome de exibicao", required: true, section: "editable" },
  { name: "fullName", label: "Nome completo", required: true, section: "editable" },
  { name: "phone", label: "Telefone", section: "editable" },
  { name: "profilePhotoUrl", label: "URL da foto", section: "photo" },
  { name: "profilePhotoDataUrl", label: "Upload de foto", type: "image", section: "photo" },
  { name: "avatarInitials", label: "Iniciais", maxLength: 3, section: "photo" },
  { name: "email", label: "E-mail", locked: true, section: "locked" },
  { name: "cpfDocument", label: "CPF ou RG", locked: true, section: "locked" },
  { name: "birthDate", label: "Data de nascimento", locked: true, section: "locked", type: "date" },
  { name: "securityNewPassword", label: "Nova senha", type: "password", section: "security" },
  { name: "securityConfirmPassword", label: "Confirmar senha", type: "password", section: "security" },
  { name: "twoFactorEnabled", label: "Ativar autenticacao em duas etapas (2FA)", type: "checkbox", section: "security" },
];

function buildInitials(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "US";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function countAccess(role, accessType) {
  const permissions = getRolePermissions(role);
  return ALL_PAGES.filter((pageId) => permissions[pageId] === accessType).length;
}

export function buildProfileMetrics(profile) {
  const role = profile?.role || "VEN";

  return [
    {
      id: "role",
      icon: "shield",
      label: "Perfil RBAC",
      value: role,
      detail: ROLE_LABELS[role] || role,
      tone: "blue",
    },
    {
      id: "full-access",
      icon: "checkSquare",
      label: "Acesso completo",
      value: countAccess(role, "AC"),
      detail: "modulos liberados",
      tone: "green",
    },
    {
      id: "partial-access",
      icon: "layoutGrid",
      label: "Uso parcial",
      value: countAccess(role, "UP"),
      detail: "modulos limitados",
      tone: "yellow",
    },
    {
      id: "last-login",
      icon: "history",
      label: "Ultimo login",
      value: profile?.status === "ativo" ? "Ativo" : "Inativo",
      detail: formatDateTime(profile?.lastLogin),
      tone: profile?.status === "ativo" ? "red" : "yellow",
    },
  ];
}

export function buildProfileAccessRows(profile) {
  const permissions = getRolePermissions(profile?.role || "VEN");

  return ALL_PAGES.map((pageId) => {
    const access = permissions[pageId] || "OC";

    return {
      access,
      accessLabel: getAccessLabel(access),
      id: pageId,
      name: PAGE_LABELS[pageId] || pageId,
    };
  });
}

export function buildProfileFormData(profile) {
  const formData = PROFILE_FORM_FIELDS.reduce((currentFormData, field) => {
    currentFormData[field.name] = profile?.[field.name] ?? (field.type === "checkbox" ? false : "");
    return currentFormData;
  }, {});

  formData.activeSessions = profile?.activeSessions || [];

  return formData;
}

export function normalizeProfilePayload(formData, profile) {
  const displayName = formData.displayName || formData.fullName || profile?.displayName || "Usuario";
  const newPassword = formData.securityNewPassword?.trim();

  /* --- SECAO: DADOS EDITAVEIS DO PERFIL ---
   * Cargo, status e historico ficam preservados para que o proprio usuario nao altere
   * permissoes pela tela de perfil. Essa regra pertence a Gestao de Contas.
   */
  const payload = {
    ...profile,
    displayName,
    fullName: formData.fullName || displayName,
    email: profile?.email || "",
    phone: formData.phone || "",
    avatarInitials: String(formData.avatarInitials || buildInitials(displayName)).slice(0, 3).toUpperCase(),
    activeSessions: Array.isArray(formData.activeSessions) ? formData.activeSessions : profile?.activeSessions || [],
    profilePhotoDataUrl: formData.profilePhotoDataUrl || "",
    profilePhotoUrl: formData.profilePhotoUrl || "",
    twoFactorEnabled: Boolean(formData.twoFactorEnabled),
  };

  if (newPassword) {
    payload.password = newPassword;
  }

  return payload;
}

export function validateProfilePayload(formData) {
  if (!formData.securityNewPassword) {
    return "";
  }

  if (formData.securityNewPassword !== formData.securityConfirmPassword) {
    return "As senhas nao conferem.";
  }

  return validatePasswordStrength(formData.securityNewPassword);
}
