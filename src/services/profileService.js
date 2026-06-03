import { PAGE_LABELS, ROLE_LABELS } from "./accountService.js";
import { ALL_PAGES, getAccessLabel, getRolePermissions } from "./permissionService.js";

export const PROFILE_FORM_FIELDS = [
  { name: "displayName", label: "Nome curto", required: true },
  { name: "fullName", label: "Nome completo", required: true },
  { name: "email", label: "Email", required: true },
  { name: "phone", label: "Telefone" },
  { name: "avatarInitials", label: "Iniciais", maxLength: 3 },
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
  return PROFILE_FORM_FIELDS.reduce((formData, field) => {
    formData[field.name] = profile?.[field.name] || "";
    return formData;
  }, {});
}

export function normalizeProfilePayload(formData, profile) {
  const displayName = formData.displayName || formData.fullName || profile?.displayName || "Usuario";

  /* --- SECAO: DADOS EDITAVEIS DO PERFIL ---
   * Cargo, status e historico ficam preservados para que o proprio usuario nao altere
   * permissoes pela tela de perfil. Essa regra pertence a Gestao de Contas.
   */
  return {
    ...profile,
    displayName,
    fullName: formData.fullName || displayName,
    email: formData.email || profile?.email || "",
    phone: formData.phone || "",
    avatarInitials: String(formData.avatarInitials || buildInitials(displayName)).slice(0, 3).toUpperCase(),
  };
}
