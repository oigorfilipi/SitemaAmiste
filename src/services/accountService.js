import {
  ALL_PAGES,
  ROLE_PERMISSIONS,
  getAccessLabel,
} from "./permissionService.js";

export const ACCOUNT_TABS = [
  { id: "ativas", label: "Ativas" },
  { id: "desativadas", label: "Desativadas" },
  { id: "matriz", label: "Matriz RBAC" },
];

export const ROLE_LABELS = {
  ADM: "Administrativo",
  CEO: "Dono",
  DEV: "Desenvolvedor",
  FIN: "Financeiro",
  TEC: "Tecnico",
  VEN: "Vendedor",
};

export const ROLE_OPTIONS = [
  { label: "Desenvolvedor", value: "DEV" },
  { label: "Dono", value: "CEO" },
  { label: "Vendedor", value: "VEN" },
  { label: "Administrativo", value: "ADM" },
  { label: "Tecnico", value: "TEC" },
  { label: "Financeiro", value: "FIN" },
];

export const ACCOUNT_FORM_FIELDS = [
  { name: "displayName", label: "Nome curto", required: true },
  { name: "fullName", label: "Nome completo", required: true },
  { name: "email", label: "Email", required: true },
  { name: "phone", label: "Telefone" },
  { name: "role", label: "Cargo", type: "select", options: ROLE_OPTIONS, required: true },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ativo", value: "ativo" },
      { label: "Desativado", value: "desativado" },
    ],
    defaultValue: "ativo",
  },
  { name: "avatarInitials", label: "Iniciais", maxLength: 3 },
];

export const PAGE_LABELS = {
  accounts: "Gestao de Contas",
  acessorios: "Catalogo de Acessorios",
  checklists: "Checklists",
  clientes: "Clientes",
  configuracoes: "Configuracoes",
  estoque: "Contagem de Estoque",
  etiquetas: "Etiquetas",
  financeiro: "Financeiro",
  historico: "Historico Geral",
  home: "Home",
  insumos: "Catalogo de Insumos",
  machines: "Catalogo de Maquinas",
  opcoes: "Adicionar Opcoes",
  perfil: "Perfil",
  portfolios: "Portfolios",
  precos: "Precos",
  serviceOrders: "Consertos SLA",
  vendas: "Vendas",
};

function buildInitials(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "US";
}

function countAccess(role, accessType) {
  return ALL_PAGES.filter((pageId) => ROLE_PERMISSIONS[role]?.[pageId] === accessType).length;
}

export function buildAccountRows(accounts) {
  return accounts.map((account) => ({
    ...account,
    accessFullCount: countAccess(account.role, "AC"),
    accessHiddenCount: countAccess(account.role, "OC"),
    roleLabel: ROLE_LABELS[account.role] || account.role,
  })).sort((first, second) => {
    if (first.status !== second.status) {
      return first.status === "ativo" ? -1 : 1;
    }

    return String(first.displayName).localeCompare(String(second.displayName));
  });
}

export function buildAccountMetrics(rows) {
  const activeRows = rows.filter((account) => account.status === "ativo");
  const inactiveRows = rows.filter((account) => account.status !== "ativo");
  const devRows = activeRows.filter((account) => account.role === "DEV" || account.role === "CEO");
  const fullAccessGrants = activeRows.reduce((total, account) => total + account.accessFullCount, 0);

  return [
    {
      id: "active",
      icon: "users",
      label: "Contas ativas",
      value: activeRows.length,
      detail: `${inactiveRows.length} desativadas`,
      tone: "blue",
    },
    {
      id: "admins",
      icon: "shield",
      label: "Admins totais",
      value: devRows.length,
      detail: "DEV/CEO ativos",
      tone: devRows.length > 2 ? "yellow" : "green",
    },
    {
      id: "grants",
      icon: "checkSquare",
      label: "Acessos completos",
      value: fullAccessGrants,
      detail: "soma por perfil ativo",
      tone: "green",
    },
    {
      id: "roles",
      icon: "layoutGrid",
      label: "Perfis usados",
      value: new Set(activeRows.map((account) => account.role)).size,
      detail: "cargos em operacao",
      tone: "red",
    },
  ];
}

export function filterAccountRows(rows, tabId, searchTerm = "") {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const statusRows = tabId === "desativadas"
    ? rows.filter((account) => account.status !== "ativo")
    : rows.filter((account) => account.status === "ativo");

  if (!normalizedTerm) {
    return statusRows;
  }

  return statusRows.filter((account) =>
    [account.displayName, account.fullName, account.email, account.phone, account.role, account.roleLabel]
      .join(" ")
      .toLowerCase()
      .includes(normalizedTerm)
  );
}

export function buildRoleMatrix() {
  const roles = Object.keys(ROLE_PERMISSIONS);

  return ALL_PAGES.map((pageId) => ({
    pageId,
    pageLabel: PAGE_LABELS[pageId] || pageId,
    permissions: roles.map((role) => {
      const access = ROLE_PERMISSIONS[role]?.[pageId] || "OC";

      return {
        access,
        accessLabel: getAccessLabel(access),
        role,
        roleLabel: ROLE_LABELS[role] || role,
      };
    }),
  }));
}

export function buildRoleSummary(role) {
  const permissions = ROLE_PERMISSIONS[role] || {};

  return {
    accessFullCount: countAccess(role, "AC"),
    accessHiddenCount: countAccess(role, "OC"),
    accessPartialCount: countAccess(role, "UP"),
    accessViewCount: countAccess(role, "VIS"),
    label: ROLE_LABELS[role] || role,
    modules: ALL_PAGES.map((pageId) => ({
      access: permissions[pageId] || "OC",
      accessLabel: getAccessLabel(permissions[pageId] || "OC"),
      pageId,
      pageLabel: PAGE_LABELS[pageId] || pageId,
    })),
    role,
  };
}

export function normalizeAccountPayload(payload, editingRecord) {
  const now = new Date().toISOString();
  const displayName = payload.displayName || payload.fullName || "Usuario";

  return {
    ...payload,
    avatarInitials: payload.avatarInitials || buildInitials(displayName),
    createdAt: editingRecord?.createdAt || now,
    lastLogin: editingRecord?.lastLogin || "",
    status: payload.status || "ativo",
  };
}
